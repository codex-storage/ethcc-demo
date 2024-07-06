import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject, toRequestState, timestampsFor } from '@/utils/requests'
import { toSlotState } from '@/utils/slots'
import { RequestState } from '@/utils/requests'
import { StorageEvent } from '@/utils/events'
import serializer from './serializer'
import { useEventsStore } from './events'

class RequestNotFoundError extends Error {
  constructor(requestId, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestNotFoundError)
    }

    this.name = 'RequestNotFoundError'
    // Custom debugging information
    this.requestId = requestId
  }
}

export const useRequestsStore = defineStore(
  'requests',
  () => {
    const marketplace = inject('marketplace')
    const ethProvider = inject('ethProvider')
    const events = useEventsStore()
    let { StorageRequested } = marketplace.filters
    const requests = ref({}) // key: requestId, val: {request, state, slots: [{slotId, slotIdx, state}]}
    const blocks = ref({})
    const loading = ref({
      past: false,
      recent: false,
      states: false
    })
    const fetched = ref({
      past: false
    })
    // Request structure
    // {
    //   request: {
    //     client,
    //     ask: {
    //       slots,
    //       slotSize,
    //       duration,
    //       proofProbability,
    //       reward,
    //       collateral,
    //       maxSlotLoss
    //     },
    //     content: {
    //       cid,
    //       merkleRoot
    //     },
    //     expiry,
    //     nonce,
    //   },
    //   state,
    //   moderated: false,
    //   requestedAt: Number (timestamp in seconds),
    //   requestFinishedId: Number (setTimeout id for request completion update)
    //   slots: [{slotId, slotIdx, state}],
    //   loading: {
    //     request: false,
    //     slots: false,
    //     state: false
    //   },
    //   fetched: {
    //     request: false,
    //     slots: false
    //   }
    // }

    // fetch request details if not previously fetched
    const getRequest = async (requestId) => {
      try {
        let request = requests.value[requestId]
        if (exists(requestId) && request.fetched.request === true) {
          console.log('request', requestId, ' details already fetched')
          return request
        }
        requests.value[requestId] = {
          loading: {
            request: true,
            slots: false,
            state: false
          },
          fetched: {
            request: false,
            slots: false
          }
        }
        request = arrayToObject(await marketplace.getRequest(requestId))
        await getRequestState(requestId)
        requests.value[requestId] = {
          ...requests.value[requestId],
          request,
          moderated: 'pending'
          // requestedAt: will be set in addFromEvent, as we don't have a block
          // requestFinishedId: will be set in addFromEvent as we don't have
          //   requestedAt yet
          // state: state is set in getRequestState
        }
        requests.value[requestId].loading.request = false
        requests.value[requestId].fetched.request = true
        return requests.value[requestId]
      } catch (e) {
        delete requests.value[requestId]
        throw new Error(`failed to get request for ${requestId}: ${e.message}`)
      }
    }

    const getRequestState = async (requestId) => {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      try {
        requests.value[requestId].loading.state = true
        const stateIdx = await marketplace.requestState(requestId)
        const state = toRequestState(Number(stateIdx))
        requests.value[requestId].state = state
      } catch (e) {
        throw new Error(`failed to get request state for ${requestId}: ${e.message}`)
      } finally {
        requests.value[requestId].loading.state = false
      }
    }

    const getSlotState = async (slotId) => {
      let stateIdx = await marketplace.slotState(slotId)
      return toSlotState(Number(stateIdx))
    }

    const getSlots = async (requestId, numSlots) => {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      requests.value[requestId].loading.slots = true
      try {
        console.log(`fetching ${numSlots} slots`)
        let start = Date.now()
        let slots = []
        for (let slotIdx = 0; slotIdx < numSlots; slotIdx++) {
          try {
            let id = slotId(requestId, slotIdx)
            const startSlotState = Date.now()
            let state = await getSlotState(id)
            console.log(`fetched slot state in ${(Date.now() - startSlotState) / 1000}s`)
            const startGetHost = Date.now()
            let provider = await marketplace.getHost(id)
            console.log(`fetched slot provider in ${(Date.now() - startGetHost) / 1000}s`)
            slots.push({ slotId: id, slotIdx, state, provider })
          } catch (e) {
            console.error('error getting slot details', e)
            continue
          }
        }
        console.log(`fetched ${numSlots} slots in ${(Date.now() - start) / 1000}s`)
        requests.value[requestId].slots = slots
        return slots
      } catch (e) {
        throw new Error(`error fetching slots for ${requestId}: ${e.message}`)
      } finally {
        requests.value[requestId].loading.slots = false
        requests.value[requestId].fetched.slots = true
      }
    }

    const getBlock = async (blockHash) => {
      if (blockHash in blocks.value) {
        return blocks.value[blockHash]
      } else {
        let { number, timestamp } = await ethProvider.getBlock(blockHash)
        blocks.value[blockHash] = { number, timestamp }
        return { number, timestamp }
      }
    }

    const addFromEvent = async (requestId, ask, expiry, blockHash) => {
      let request = await getRequest(requestId)
      let { state } = request.request
      let { timestamp } = await getBlock(blockHash)
      let requestFinishedId = waitForRequestFinished(requestId, ask, expiry, state, timestamp)

      requests.value[requestId].requestedAt = timestamp
      requests.value[requestId].requestFinishedId = requestFinishedId

      return request
    }

    const exists = (requestId) => {
      return requestId in requests.value
    }

    // Returns an array of Promises, where each Promise represents the fetching
    // of one StorageRequested event
    async function fetchPastRequestsFrom(fromBlock = null) {
      console.log(`fetching past requests from ${fromBlock ? `block ${fromBlock}` : 'all time'}`)
      try {
        let events = await marketplace.queryFilter(StorageRequested, fromBlock)
        console.log('got ', events.length, ' StorageRequested events')
        if (events.length === 0) {
          return []
        }

        return events.map(async (event, i) => {
          let { requestId, ask, expiry } = event.args
          let { blockHash, blockNumber } = event
          await addFromEvent(requestId, ask, expiry, blockHash)
        })
      } catch (error) {
        console.error(`failed to load past contract events: ${error.message}`)
        return []
      }
    }

    async function refetchRequestStates() {
      async function refetchRequestState(requestId) {
        await getRequestState(requestId)
        let {
          request: { ask, expiry },
          state,
          requestedAt
        } = requests.value[requestId]
        // refetching of requests states happen on page load, so if we're
        // loading the page, we need to reset any timeouts for RequestFinished
        // events
        requests.value[requestId].requestFinishedId = waitForRequestFinished(
          requestId,
          ask,
          expiry,
          state,
          requestedAt
        )
      }
      // array of asynchronously-executed Promises, each requesting a request
      // state
      loading.value.states = true
      try {
        const fetches = Object.entries(requests.value).map(([requestId, request]) =>
          refetchRequestState(requestId)
        )
        await Promise.all(fetches)
      } catch (e) {
        console.error(`failure requesting latest request states:`, e)
      } finally {
        loading.value.states = false
      }
    }

    async function fetchPastRequests() {
      // query past events
      const blocksSorted = Object.values(blocks.value).sort(
        (blkA, blkB) => blkB.number - blkA.number
      )
      const lastBlockNumber = blocksSorted.length ? blocksSorted[0].number : null

      if (lastBlockNumber) {
        loading.value.recent = true
      } else {
        loading.value.past = true
      }

      await Promise.all(await fetchPastRequestsFrom(lastBlockNumber + 1))

      if (lastBlockNumber) {
        loading.value.recent = false
      } else {
        loading.value.past = false
        fetched.value.past = true
      }
    }

    async function fetchRequestDetails(requestId) {
      try {
        // fetch request details if not previously fetched
        const { request } = await getRequest(requestId)

        // always fetch state
        await getRequestState(requestId)

        // always fetch slots - fire async but don't wait
        console.log('fetching slots for request', requestId)
        getSlots(requestId, request.ask.slots)
      } catch (error) {
        if (
          !error.message.includes('Unknown request') &&
          !error.message.includes('invalid BytesLike value')
        ) {
          console.error(`failed to fetch details for request ${requestId}: ${error}`)
        }
        throw error
      }
    }

    function updateRequestState(requestId, newState) {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      requests.value[requestId].state = newState
    }

    function updateRequestFinishedId(requestId, newRequestFinishedId) {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      requests.value[requestId].state = newRequestFinishedId
    }

    function updateRequestSlotState(requestId, slotIdx, newState) {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      let { slots, ...rest } = requests.value[requestId]
      slots = slots.map((slot) => {
        if (slot.slotIdx == slotIdx) {
          slot.state = newState
        }
        return slot
      })
      requests.value[requestId] = { slots, ...rest }
    }

    function updateRequestSlotProvider(requestId, slotIdx, provider) {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      let { slots, ...rest } = requests.value[requestId]
      slots = slots.map((slot) => {
        if (slot.slotIdx == slotIdx) {
          slot.provider = provider
        }
        return slot
      })
      requests.value[requestId] = { slots, ...rest }
    }

    function waitForRequestFinished(requestId, ask, expiry, state, requestedAt) {
      if (!['Fulfilled', 'New'].includes(state)) {
        return null
      }
      // set request state to finished at the end of the request -- there's no
      // other way to know when a request finishes
      let { endsAt } = timestampsFor(ask, expiry, requestedAt)
      let msFromNow = endsAt * 1000 - Date.now() // time remaining until finish, in ms

      return setTimeout(async () => {
        try {
          // the state may actually have been cancelled, but RequestCancelled
          // may not have fired yet, so get the updated state
          await getRequestState(requestId)
          updateRequestFinishedId(requestId, null)
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          } else {
            throw error
          }
        }
        let blockNumber = await ethProvider.getBlockNumber()
        events.add({
          event: StorageEvent.RequestFinished,
          blockNumber,
          requestId,
          state: RequestState.Finished,
          timestamp: Date.now() / 1000,
          moderated: requests.value[requestId]?.moderated
        })
      }, msFromNow + 1000) // add additional second to ensure state has changed
    }

    function cancelWaitForRequestFinished(requestId) {
      if (!exists(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      let { requestFinishedId } = requests.value[requestId]
      if (requestFinishedId) {
        clearTimeout(requestFinishedId)
      }
    }

    return {
      requests,
      blocks,
      addFromEvent,
      exists,
      getBlock,
      fetchPastRequests,
      refetchRequestStates,
      fetchRequestDetails,
      updateRequestState,
      updateRequestSlotState,
      updateRequestSlotProvider,
      updateRequestFinishedId,
      cancelWaitForRequestFinished,
      loading,
      fetched,
      RequestNotFoundError
    }
  },
  {
    persist: {
      serializer,
      crossTabSync: true
      // paths: ['requests', 'blocks', 'fetched', 'loading']
    }
  }
)

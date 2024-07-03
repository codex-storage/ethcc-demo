import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject, toRequestState, timestampsFor } from '@/utils/requests'
import { toSlotState } from '@/utils/slots'
import { RequestState } from '@/utils/requests'
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
    const loading = ref(false)
    const loadingRecent = ref(false)
    const loadingRequestStates = ref(false)
    const fetched = ref(false) // indicates if past events were fetched
    const blocks = ref({})

    const getRequestState = async (requestId) => {
      let stateIdx = await marketplace.requestState(requestId)
      return toRequestState(Number(stateIdx))
    }

    const getSlotState = async (slotId) => {
      let stateIdx = await marketplace.slotState(slotId)
      return toSlotState(Number(stateIdx))
    }

    const getSlots = async (requestId, numSlots) => {
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
      return slots
    }

    const getBlock = async (blockHash) => {
      if (Object.keys(blocks.value).includes(blockHash)) {
        return blocks.value[blockHash]
      } else {
        let { number, timestamp } = await ethProvider.getBlock(blockHash)
        blocks.value[blockHash] = { number, timestamp }
        return { number, timestamp }
      }
    }

    async function add(requestId, ask, expiry, blockHash) {
      let state = await getRequestState(requestId)
      let { timestamp } = await getBlock(blockHash)
      let requestFinishedId = waitForRequestFinished(requestId, ask, expiry, state, timestamp)
      let reqExisting = requests.value[requestId] || {} // just in case it already exists

      let request = {
        ...reqExisting,
        state,
        requestedAt: timestamp,
        requestFinishedId,
        detailsFetched: false,
        moderated: 'pending'
      }
      requests.value[requestId] = request
      return request
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
          await add(requestId, ask, expiry, blockHash)
        })
      } catch (error) {
        console.error(`failed to load past contract events: ${error.message}`)
        return []
      }
    }

    async function refetchRequestStates() {
      async function refetchRequestState(requestId) {
        requests.value[requestId].state = await getRequestState(requestId)
        let { ask, expiry, state, requestedAt } = requests.value[requestId]
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
      loadingRequestStates.value = true
      try {
        const fetches = Object.entries(requests.value).map(([requestId, request]) =>
          refetchRequestState(requestId)
        )
        await Promise.all(fetches)
      } catch (e) {
        console.error(`failure requesting latest request states:`, e)
      } finally {
        loadingRequestStates.value = false
      }
    }

    async function fetchPastRequests() {
      // query past events
      const blocksSorted = Object.values(blocks.value).sort(
        (blkA, blkB) => blkB.number - blkA.number
      )
      const lastBlockNumber = blocksSorted.length ? blocksSorted[0].number : null

      if (lastBlockNumber) {
        loadingRecent.value = true
      } else {
        loading.value = true
      }

      await Promise.all(await fetchPastRequestsFrom(lastBlockNumber + 1))

      if (lastBlockNumber) {
        loadingRecent.value = false
      } else {
        loading.value = false
        fetched.value = true
      }
    }

    async function fetchRequestDetails(requestId) {
      try {
        let request = requests.value[requestId] || {}
        if (requestId in requests.value) {
          requests.value[requestId].detailsLoading = true
        }
        // fetch request details if not previously fetched
        if (request?.detailsFetched !== true) {
          console.log('request', requestId, ' details already fetched')
          request = arrayToObject(await marketplace.getRequest(requestId))
        }
        // always fetch state
        const state = await getRequestState(requestId)

        // always fetch slots
        console.log('fetching slots for request', requestId)
        getSlots(requestId, request.ask.slots).then((slots) => {
          requests.value[requestId].slots = slots
          requests.value[requestId].slotsLoading = false
          requests.value[requestId].slotsFetched = true
        })

        // update state
        requests.value[requestId] = {
          ...requests.value[requestId], // state, requestedAt, requestFinishedId (null)
          ...request,
          state,
          slotsLoading: true,
          detailsFetched: true,
          detailsLoading: false
        }
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
      if (!Object.keys(requests.value).includes(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      let { state, ...rest } = requests.value[requestId]
      state = newState
      requests.value[requestId] = { state, ...rest }
    }

    function updateRequestFinishedId(requestId, newRequestFinishedId) {
      if (!Object.keys(requests.value).includes(requestId)) {
        throw new RequestNotFoundError(requestId, `Request not found`)
      }
      let { requestFinishedId, ...rest } = requests.value[requestId]
      requestFinishedId = newRequestFinishedId
      requests.value[requestId] = { requestFinishedId, ...rest }
    }

    function updateRequestSlotState(requestId, slotIdx, newState) {
      if (!Object.keys(requests.value).includes(requestId)) {
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
      if (!Object.keys(requests.value).includes(requestId)) {
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
          const state = await getRequestState(requestId)
          updateRequestState(requestId, state)
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
          event: 'RequestFinished',
          blockNumber,
          requestId,
          state: RequestState.Finished,
          timestamp: Date.now() / 1000
        })
      }, msFromNow + 1000) // add additional second to ensure state has changed
    }

    function cancelWaitForRequestFinished(requestId) {
      if (!Object.keys(requests.value).includes(requestId)) {
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
      add,
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
      loadingRecent,
      loadingRequestStates,
      fetched,
      RequestNotFoundError
    }
  },
  {
    persist: {
      serializer,
      paths: ['requests', 'blocks', 'fetched', 'loading', 'loadingRecent']
    }
  }
)

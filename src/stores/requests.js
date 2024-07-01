import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject, requestState, timestampsFor } from '@/utils/requests'
import { slotState } from '@/utils/slots'
import serializer from './serializer'

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
    // let fetched = false
    const marketplace = inject('marketplace')
    const ethProvider = inject('ethProvider')
    let {
      StorageRequested,
      RequestFulfilled,
      RequestCancelled,
      RequestFailed,
      SlotFilled,
      SlotFreed
    } = marketplace.filters
    const requests = ref({}) // key: requestId, val: {request, state, slots: [{slotId, slotIdx, state}]}
    // const slots = ref(new Map()) // key: slotId, val: {requestId, slotIdx, state}
    // const blockNumbers = ref(new Set()) // includes blocks that had events
    // const storageRequestedEvents = ref([]) // {blockNumber, requestId}
    // const slotFilledEvents = ref([]) // {blockNumber, requestId, slotIdx, slotId}
    // const slotFreedEvents = ref([]) // {blockNumber, requestId, slotIdx, slotId}
    // const requestFulfilledEvents = ref([]) // {blockNumber, requestId}
    // const requestCancelledEvents = ref([]) // {blockNumber, requestId}
    // const requestFailedEvents = ref([]) // {blockNumber, requestId}
    // const requestFinishedEvents = ref([]) // {blockNumber, requestId}
    const loading = ref(false)
    const loadingRecent = ref(false)
    const loadingRequestStates = ref(false)
    const fetched = ref(false) // indicates if past events were fetched
    const blocks = ref({})
    // const request = computed(() => count.value * 2)

    // onStorageRequested => add request to requests ref, along with slots
    //                    => add to storageRequestedEvents {blockNumber, requestId}
    //                    => add blockNumber to blockNumbers
    // onRequestFulfilled => update requests[requestId].state with marketplace.getRequestState(requestId)
    //                  => add to requestStartedEvents {blockNumber, requestId}
    //                  => add blockNumber to blockNumbers
    // onRequestCancelled => update requests[requestId].state with marketplace.getRequestState(requestId)
    //                    => add to requestCancelledEvents {blockNumber, requestId}
    //                    => add blockNumber to blockNumbers
    // onRequestFailed => update requests[requestId].state with marketplace.getRequestState(requestId)
    //                 => add to requestFailedEvents {blockNumber, requestId}
    //                 => add blockNumber to blockNumbers
    // onRequestFinished => update requests[requestId].state with marketplace.getRequestState(requestId)
    //                   => add to requestFinishedEvents {blockNumber, requestId}
    //                   => add blockNumber to blockNumbers
    // onSlotFilled => update request.slots[slotId].state with getSlotState
    //              => add to slotFilledEvents {blockNumber, slotId, slotIdx}
    //              => add blockNumber to blockNumbers
    // onSlotFreed => update slots[slotId].state with getSlotState
    //             => add to slotFreedEvents {blockNumber, slotId, slotIdx}
    //             => add blockNumber to blockNumbers

    const getRequestState = async (requestId) => {
      let stateIdx = await marketplace.requestState(requestId)
      return requestState[stateIdx]
    }

    const getSlotState = async (slotId) => {
      let stateIdx = await marketplace.slotState(slotId)
      return slotState[stateIdx]
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

    async function addRequest(requestId, ask, expiry, blockHash) {
      let state = await getRequestState(requestId)
      let { timestamp } = await getBlock(blockHash)
      let reqExisting = requests.value[requestId] || {} // just in case it already exists

      let requestFinishedId = null
      if (['Fulfilled', 'New'].includes(state)) {
        try {
          // set request state to finished at the end of the request -- there's no
          // other way to know when a request finishes
          let { requestedAt, endsAt } = timestampsFor(ask, expiry, timestamp)
          let msFromNow = endsAt - Date.now() // time remaining until finish, in ms
          requestFinishedId = waitForRequestFinished(
            requestId,
            msFromNow,
            onRequestFinishedCallback
          )
        } catch (e) {
          console.error(
            `Failed to set timeout for RequestFinished event for request ${requestId}. There will be no alert for this event.`,
            e
          )
        }
      }

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

    async function handleStorageRequestEvent(event) {
      let { requestId, ask, expiry } = event.args
      let { blockHash, blockNumber } = event
      await addRequest(requestId, ask, expiry, blockHash)
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

        return events.map((event, i) => handleStorageRequestEvent(event)) //{
      } catch (error) {
        console.error(`failed to load past contract events: ${error.message}`)
        return []
      }
    }

    async function refetchRequestStates() {
      async function refetchRequestState(requestId) {
        requests.value[requestId].state = await getRequestState(requestId)
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

    function waitForRequestFinished(requestId, msFromNow, onRequestFinished) {
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
          }
        }
        if (onRequestFinished) {
          let blockNumber = await ethProvider.getBlockNumber()
          onRequestFinished(blockNumber, requestId)
        }
      }, msFromNow)
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

    let onRequestFinishedCallback
    async function listenForNewEvents(
      onStorageRequested,
      onRequestFulfilled,
      onRequestCancelled,
      onRequestFailed,
      onRequestFinished,
      onSlotFreed,
      onSlotFilled
    ) {
      onRequestFinishedCallback = onRequestFinished

      marketplace.on(StorageRequested, async (requestId, ask, expiry, event) => {
        let { blockNumber, blockHash } = event.log
        const request = addRequest(requestId, ask, expiry, blockHash)

        // callback
        if (onStorageRequested) {
          onStorageRequested(blockNumber, requestId, request.state)
        }
      })

      marketplace.on(RequestFulfilled, async (requestId, event) => {
        try {
          updateRequestState(requestId, 'Fulfilled')
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        if (onRequestFulfilled) {
          onRequestFulfilled(blockNumber, requestId)
        }
      })
      marketplace.on(RequestCancelled, async (requestId, event) => {
        try {
          updateRequestState(requestId, 'Cancelled')
          cancelWaitForRequestFinished(requestId)
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        if (onRequestCancelled) {
          onRequestCancelled(blockNumber, requestId)
        }
      })
      marketplace.on(RequestFailed, async (requestId, event) => {
        try {
          updateRequestState(requestId, 'Failed')
          cancelWaitForRequestFinished(requestId)
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        if (onRequestFailed) {
          onRequestFailed(blockNumber, requestId)
        }
      })
      marketplace.on(SlotFreed, async (requestId, slotIdx, event) => {
        try {
          updateRequestSlotState(requestId, slotIdx, 'Free')
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        if (onSlotFreed) {
          onSlotFreed(blockNumber, requestId, slotIdx)
        }
      })
      marketplace.on(SlotFilled, async (requestId, slotIdx, event) => {
        try {
          updateRequestSlotState(requestId, slotIdx, 'Filled')
        } catch (error) {
          if (error instanceof RequestNotFoundError) {
            await fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        if (onSlotFilled) {
          onSlotFilled(blockNumber, requestId, slotIdx)
        }
      })
    }

    return {
      requests,
      blocks,
      // slots,
      // blockNumbers,
      // storageRequestedEvents,
      // slotFilledEvents,
      // slotFreedEvents,
      // requestStartedEvents,
      // requestCancelledEvents,
      // requestFailedEvents,
      // requestFinishedEvents,
      fetchPastRequests,
      refetchRequestStates,
      fetchRequestDetails,
      listenForNewEvents,
      loading,
      loadingRecent,
      loadingRequestStates,
      fetched
    }
  },
  {
    persist: {
      serializer
    }
  }
)

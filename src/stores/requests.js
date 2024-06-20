import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject, requestState } from '@/utils/requests'
import { slotState } from '@/utils/slots'

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
        let id = slotId(requestId, slotIdx)
        const startSlotState = Date.now()
        let state = await getSlotState(id)
        console.log(`fetched slot state in ${(Date.now() - startSlotState) / 1000}s`)
        const startGetHost = Date.now()
        let provider = await marketplace.getHost(id)
        console.log(`fetched slot provider in ${(Date.now() - startGetHost) / 1000}s`)
        slots.push({ slotId: id, slotIdx, state, provider })
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

    async function addRequest(requestId, blockHash) {
      let state = await getRequestState(requestId)
      let { timestamp } = await getBlock(blockHash)
      let reqExisting = requests.value[requestId] || {} // just in case it already exists
      let request = {
        ...reqExisting,
        state,
        requestedAt: timestamp,
        requestFinishedId: null,
        detailsFetched: false,
        moderated: 'pending'
      }
      requests.value[requestId] = request
      return request
    }

    async function handleStorageRequestEvent(event) {
      let { requestId, ask, expiry } = event.args
      let { blockHash, blockNumber } = event
      await addRequest(requestId, blockHash)
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
        // const reqExisting = requests.value[requestId] || {}
        if (!requests.value[requestId]) {
          requests.value[requestId] = {}
        }
        requests.value[requestId].detailsLoading = true

        let request = requests.value[requestId]
        // fetch request details if not previously fetched
        if (request?.detailsFetched !== true) {
          console.log('request', requestId, ' details already fetched')
          request = arrayToObject(await marketplace.getRequest(requestId))
        }

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
          slotsLoading: true,
          detailsFetched: true,
          detailsLoading: false
        }
      } catch (error) {
        console.error(`failed to load slots for request ${requestId}: ${error}`)
        throw error
      } finally {
        requests.value[requestId].detailsLoading = false
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
      })
      requests.value[requestId] = { slots, ...rest }
    }

    function waitForRequestFinished(requestId, duration, onRequestFinished) {
      return setTimeout(async () => {
        try {
          updateRequestState(requestId, 'Finished')
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
      }, duration)
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

    async function listenForNewEvents(
      onStorageRequested,
      onRequestFulfilled,
      onRequestCancelled,
      onRequestFailed,
      onRequestFinished,
      onSlotFreed,
      onSlotFilled
    ) {
      marketplace.on(StorageRequested, async (requestId, ask, expiry, event) => {
        let { blockNumber, blockHash } = event.log
        const request = addRequest(requestId, blockHash)

        // callback
        if (onStorageRequested) {
          onStorageRequested(blockNumber, requestId, request.state)
        }
      })

      marketplace.on(RequestFulfilled, async (requestId, event) => {
        let requestOnChain = await marketplace.getRequest(requestId)
        let ask = requestOnChain[1]
        let duration = ask[1]
        // set request state to finished at the end of the request -- there's no
        // other way to know when a request finishes
        console.log('request ', requestOnChain)
        let requestFinishedId = waitForRequestFinished(requestId, duration, onRequestFinished)
        updateRequestState(requestId, 'Fulfilled')
        updateRequestFinishedId(requestId, requestFinishedId)

        let { blockNumber } = event.log
        if (onRequestFulfilled) {
          onRequestFulfilled(blockNumber, requestId)
        }
      })
      marketplace.on(RequestCancelled, async (requestId, event) => {
        try {
          updateRequestState(requestId, 'Cancelled')
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
          updateRequestSlotState(requestId, slotIdx, 'Freed')
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
      fetchRequestDetails,
      listenForNewEvents,
      loading,
      fetched
    }
  },
  {
    persist: {
      serializer: {
        serialize: (state) => {
          try {
            return JSON.stringify(state, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
          } catch (e) {
            console.error(`failure serializing state`, e)
          }
        },
        deserialize: (serialized) => {
          // TODO: deserialize bigints properly
          return JSON.parse(serialized)
        }
      }
    }
  }
)

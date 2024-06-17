import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject, requestState } from '@/utils/requests'
import { slotState } from '@/utils/slots'

export const useRequestsStore = defineStore('request', () => {
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
  const requests = ref(new Map()) // key: requestId, val: {request, state, slots: [{slotId, slotIdx, state}]}
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
  const blocks = ref(new Map())
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
    // blockNumbers.value.add(blockNumber)
  }

  const getBlock = async (blockHash) => {
    if (blocks.value.has(blockHash)) {
      return blocks.value.get(blockHash)
    } else {
      let block = await ethProvider.getBlock(blockHash)
      blocks.value.set(blockHash, block)
      return block
    }
  }

  async function addRequest(requestId, blockHash) {
    let state = await getRequestState(requestId)
    let block = await getBlock(blockHash)
    let reqExisting = requests.value.get(requestId) // just in case it already exists
    let request = {
      ...reqExisting,
      state,
      requestedAt: block.timestamp,
      requestFinishedId: null,
      detailsFetched: false
    }
    requests.value.set(requestId, request)
    return request
  }

  async function fetchPastRequests() {
    // query past events
    console.log('fetching past requests')
    loading.value = true
    try {
      let events = await marketplace.queryFilter(StorageRequested)
      console.log('got ', events.length, ' StorageRequested events')
      events.forEach(async (event, i) => {
        console.log('getting details for StorageRequested event ', i)
        let start = Date.now()
        let { requestId, ask, expiry } = event.args
        let { blockHash, blockNumber } = event
        await addRequest(requestId, blockHash)
        console.log(`got details for ${i} in ${(Date.now() - start) / 1000} seconds`)
        if (i === events.length - 1) {
          loading.value = false
        }
      })
      if (events.length === 0) {
        loading.value = false
      }
    } catch (error) {
      console.error(`failed to load past contract events: ${error.message}`)
    }
  }

  async function fetchRequest(requestId) {
    let start = Date.now()
    console.log('fetching request ', requestId)
    const preFetched = requests.value.get(requestId)
    if (preFetched?.detailsFetched) {
      return
    }
    loading.value = true
    try {
      let arrRequest = await marketplace.getRequest(requestId)
      let request = arrayToObject(arrRequest)
      let slots = await getSlots(requestId, request.ask.slots)
      const reqExisting = requests.value.get(requestId)
      requests.value.set(requestId, {
        ...reqExisting, // state, requestedAt, requestFinishedId (null)
        ...request,
        slots,
        detailsFetched: true
      })
    } catch (error) {
      console.error(`failed to load slots for request ${requestId}: ${error}`)
      throw error
    } finally {
      console.log(`fetched request in ${(Date.now() - start) / 1000}s`)
      loading.value = false
    }
  }

  function updateRequestState(requestId, newState) {
    let { state, ...rest } = requests.value.get(requestId)
    state = newState
    requests.value.set(requestId, { state, ...rest })
  }

  function updateRequestFinishedId(requestId, newRequestFinishedId) {
    let { requestFinishedId, ...rest } = requests.value.get(requestId)
    requestFinishedId = newRequestFinishedId
    requests.value.set(requestId, { requestFinishedId, ...rest })
  }

  function updateRequestSlotState(requestId, slotIdx, newState) {
    let { slots, ...rest } = requests.value.get(requestId)
    slots = slots.map((slot) => {
      if (slot.slotIdx == slotIdx) {
        slot.state = newState
      }
    })
    requests.value.set(requestId, { slots, ...rest })
  }

  function waitForRequestFinished(requestId, duration, onRequestFinished) {
    return setTimeout(async () => {
      updateRequestState(requestId, 'Finished')
      updateRequestFinishedId(requestId, null)
      if (onRequestFinished) {
        let blockNumber = await ethProvider.getBlockNumber()
        onRequestFinished(blockNumber, requestId)
      }
    }, duration)
  }

  function cancelWaitForRequestFinished(requestId) {
    let { requestFinishedId } = requests.value.get(requestId)
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
      updateRequestState(requestId, 'Cancelled')

      let { blockNumber } = event.log
      if (onRequestCancelled) {
        onRequestCancelled(blockNumber, requestId)
      }
    })
    marketplace.on(RequestFailed, async (requestId, event) => {
      updateRequestState(requestId, 'Failed')
      cancelWaitForRequestFinished(requestId)

      let { blockNumber } = event.log
      if (onRequestFailed) {
        onRequestFailed(blockNumber, requestId)
      }
    })
    marketplace.on(SlotFreed, async (requestId, slotIdx, event) => {
      updateRequestSlotState(requestId, slotIdx, 'Freed')

      let { blockNumber } = event.log
      if (onSlotFreed) {
        onSlotFreed(blockNumber, requestId, slotIdx)
      }
    })
    marketplace.on(SlotFilled, async (requestId, slotIdx, event) => {
      updateRequestSlotState(requestId, slotIdx, 'Filled')

      let { blockNumber } = event.log
      if (onSlotFilled) {
        onSlotFilled(blockNumber, requestId, slotIdx)
      }
    })
  }

  return {
    requests,
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
    fetchRequest,
    listenForNewEvents,
    loading
  }
})

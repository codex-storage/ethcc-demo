import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'
import { arrayToObject } from '@/utils/requests'

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
  const fetched = ref(false)
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
  const requestState = [
    'New', // [default] waiting to fill slots
    'Fulfilled', // all slots filled, accepting regular proofs
    'Cancelled', // not enough slots filled before expiry
    'Finished', // successfully completed
    'Failed' // too many nodes have failed to provide proofs, data lost
  ]

  const getRequestState = async (requestId) => {
    let stateIdx = await marketplace.requestState(requestId)
    return requestState[stateIdx]
  }

  const getSlots = async (requestId, numSlots) => {
    // storageRequestedEvents.value.push({ blockNumber, requestId })
    let slots = []
    for (let i = 0; i < numSlots; i++) {
      let id = slotId(requestId, i)
      let state = await marketplace.slotState(id)
      slots.push({ slotId: id, slotIdx: i, state })
    }
    return slots
    // blockNumbers.value.add(blockNumber)
  }

  async function fetch() {
    // if (fetched) {
    //   // allow multiple calls without re-fetching
    //   return
    // }
    // query past events
    loading.value = true
    try {
      let pastRequests = await marketplace.queryFilter(StorageRequested)
      pastRequests.forEach(async (event) => {
        let { requestId, ask, expiry } = event.args
        // let { blockNumber } = event
        let arrRequest = await marketplace.getRequest(requestId)
        let request = arrayToObject(arrRequest)
        let state = await getRequestState(requestId)
        let slots = await getSlots(requestId, request.ask.slots)
        requests.value.set(requestId, {
          ...request,
          state,
          slots,
          requestFinishedId: null
        })
      })
    } catch (error) {
      console.error(`failed to load past contract events: ${error.message}`)
    } finally {
      loading.value = false
      fetched.value = true
    }
  }

  function updateRequestState(requestId, newState) {
    let { request, state, slots, requestFinishedId } = requests.value.get(requestId)
    state = newState
    requests.value.set(requestId, { request, state, slots, requestFinishedId })
  }

  function updateRequestFinishedId(requestId, newRequestFinishedId) {
    let { request, state, slots, requestFinishedId } = requests.value.get(requestId)
    requestFinishedId = newRequestFinishedId
    requests.value.set(requestId, { request, state, slots, requestFinishedId })
  }

  function updateRequestSlotState(requestId, slotIdx, newState) {
    let { request, state, slots, requestFinishedId } = requests.value.get(requestId)
    slots = slots.map((slot) => {
      if (slot.slotIdx == slotIdx) {
        slot.state = newState
      }
    })
    requests.value.set(requestId, { request, state, slots, requestFinishedId })
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
      let { blockNumber } = event
      let request = await marketplace.getRequest(requestId)
      let state = await getRequestState(requestId)
      let slots = getSlots(requestId, request)

      requests.value.set(requestId, { request, state, slots, requestFinishedId: null })

      // callback
      if (onStorageRequested) {
        onStorageRequested(blockNumber, requestId, request, state)
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

      let { blockNumber } = event
      if (onRequestFulfilled) {
        onRequestFulfilled(blockNumber, requestId)
      }
    })
    marketplace.on(RequestCancelled, async (requestId, event) => {
      updateRequestState(requestId, 'Cancelled')

      let { blockNumber } = event
      if (onRequestCancelled) {
        onRequestCancelled(blockNumber, requestId)
      }
    })
    marketplace.on(RequestFailed, async (requestId, event) => {
      updateRequestState(requestId, 'Failed')
      cancelWaitForRequestFinished(requestId)

      let { blockNumber } = event
      if (onRequestFailed) {
        onRequestFailed(blockNumber, requestId)
      }
    })
    marketplace.on(SlotFreed, async (requestId, slotIdx, event) => {
      updateRequestSlotState(requestId, slotIdx, 'Freed')

      let { blockNumber } = event
      if (onSlotFreed) {
        onSlotFreed(blockNumber, requestId, slotIdx)
      }
    })
    marketplace.on(SlotFilled, async (requestId, slotIdx, event) => {
      updateRequestSlotState(requestId, slotIdx, 'Filled')

      let { blockNumber } = event
      if (onSlotFilled) {
        onSlotFilled(blockNumber, requestId, slotIdx)
      }
    })
  }

  // const eventsByBlock = computed(() =>)
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }
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
    fetch,
    listenForNewEvents,
    loading,
    fetched
  }
})

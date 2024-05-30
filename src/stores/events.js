import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '../utils/ids'


export const useEventsStore = defineStore('events', () => {
  const marketplace = inject('marketplace')
  let {StorageRequested, SlotFilled} = marketplace.filters
  const requests = ref(new Map()) // key: requestId, val: {request, state}
  const slots = ref(new Map()) // key: slotId, val: {requestId, slotIdx, state}
  const blockNumbers = ref(new Set()) // includes blocks that had events
  const storageRequestedEvents = ref([]) // {blockNumber, requestId}
  const slotFilledEvents = ref([]) // {blockNumber, requestId, slotIdx, slotId}
  const slotFreedEvents = ref([]) // {blockNumber, requestId, slotIdx, slotId}
  const requestStartedEvents = ref([]) // {blockNumber, requestId}
  const requestCancelledEvents = ref([]) // {blockNumber, requestId}
  const requestFailedEvents = ref([]) // {blockNumber, requestId}
  const requestFinishedEvents = ref([]) // {blockNumber, requestId}
  const loading = ref(false)

  // onStorageRequested => add request to requests ref
  //                    => add to storageRequestedEvents {blockNumber, requestId}
  //                    => add request slots to slots ref
  //                    => add blockNumber to blockNumbers
  // onRequestStarted => update requests[requestId].state with marketplace.getRequestState(requestId)
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
  // onSlotFilled => update slots[slotId].state with getSlotState
  //              => add to slotFilledEvents {blockNumber, slotId, slotIdx}
  //              => add blockNumber to blockNumbers
  // onSlotFreed => update slots[slotId].state with getSlotState
  //             => add to slotFreedEvents {blockNumber, slotId, slotIdx}
  //             => add blockNumber to blockNumbers
  const requestState = [
    "New", // [default] waiting to fill slots
    "Started", // all slots filled, accepting regular proofs
    "Cancelled", // not enough slots filled before expiry
    "Finished", // successfully completed
    "Failed" // too many nodes have failed to provide proofs, data lost
  ]

  const getRequestState = async (requestId) => {
    let stateIdx = await marketplace.requestState(requestId)
    return requestState[stateIdx]
  }

  const storageRequested = async (blockNumber, requestId, request, state) => {
    requests.value.set(requestId, {request, state})
    storageRequestedEvents.value.push({blockNumber, requestId})
    let ask = request[1]
    let numSlots = ask[0]
    for (let i=0; i<numSlots; i++){
      let id = slotId(requestId, i)
      let state = await marketplace.slotState(id)
      slots.value.set(id, {requestId, slotIdx: i, state})
    }
    blockNumbers.value.add(blockNumber)
  }

  async function fetchPastEvents() {
    // query past events
    loading.value = true
    try {
      let requests = (await marketplace.queryFilter(StorageRequested))
      requests.forEach(async (event) => {
        let {requestId, ask, expiry} = event.args
        let {blockNumber} = event
        let request = await marketplace.getRequest(requestId)
        let state = await getRequestState(requestId)
        storageRequested(blockNumber, requestId, request, state)
      })
    } catch (error) {
      console.error(`failed to load past contract events: ${error.message}`)
    } finally {
      loading.value = false
    }

    // let slotsFilled = (await marketplace.queryFilter(SlotFilled))
    // slotsFilled.forEach(async (event) => {
    //   let {requestId, slotIdx} = event.args
    //   let {blockNumber} = event
    //   let request = await marketplace.getRequest(requestId)
    //   let state = await getRequestState(requestId)
    //   storageRequested(blockNumber, requestId, request, state)
    // })
  }

  async function listenForNewEvents(onStorageRequested) {
    marketplace.on(StorageRequested, async (requestId, ask, expiry, event) => {
      let {blockNumber} = event
      let request = await marketplace.getRequest(requestId)
      let state = await getRequestState(requestId)
      storageRequested(blockNumber, requestId, request, state)
      if (onStorageRequested) { // callback
        onStorageRequested(blockNumber, requestId, request, state)
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
    slots,
    blockNumbers,
    storageRequestedEvents,
    slotFilledEvents,
    slotFreedEvents,
    requestStartedEvents,
    requestCancelledEvents,
    requestFailedEvents,
    requestFinishedEvents,
    fetchPastEvents,
    listenForNewEvents,
    loading
   }
})

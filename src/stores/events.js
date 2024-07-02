import { ref, inject } from 'vue'
import { defineStore } from 'pinia'
import { slotId } from '@/utils/ids'
import { RequestState } from '@/utils/requests'
import { SlotState } from '@/utils/slots'
import { StorageEvent } from '@/utils/events'
import { useRequestsStore } from './requests'
import serializer from './serializer'

export const useEventsStore = defineStore(
  'events',
  () => {
    // let fetched = false
    const marketplace = inject('marketplace')
    const requests = useRequestsStore()
    let {
      StorageRequested,
      RequestFulfilled,
      RequestCancelled,
      RequestFailed,
      SlotFilled,
      SlotFreed
    } = marketplace.filters
    const events = ref([]) // {event: 'SlotFreed',blockNumber,requestId,slotIdx,state: 'Free'}
    // const subscriptions = ref({})
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

    function add({ event, blockNumber, requestId, slotIdx, state }) {
      events.value.push({ event, blockNumber, requestId, slotIdx, state })
    }

    async function listenForNewEvents() {
      async function onStorageRequested(requestId, ask, expiry, event) {
        let { blockNumber, blockHash } = event.log
        const request = await requests.add(requestId, ask, expiry, blockHash)

        add({
          event: StorageEvent.StorageRequested,
          blockNumber,
          requestId,
          state: RequestState.New
        })
      }

      async function onRequestFulfilled(requestId, event) {
        let state = RequestState.Fulfilled
        try {
          requests.updateRequestState(requestId, state)
        } catch (error) {
          if (error instanceof requests.RequestNotFoundError) {
            await requests.fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        add({ event: StorageEvent.RequestFulfilled, blockNumber, requestId, state })
      }

      async function onRequestCancelled(requestId, event) {
        let state = RequestState.Cancelled
        try {
          requests.updateRequestState(requestId, state)
          requests.cancelWaitForRequestFinished(requestId)
        } catch (error) {
          if (error instanceof requests.RequestNotFoundError) {
            await requests.fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        add({ event: StorageEvent.RequestCancelled, blockNumber, requestId, state })
      }

      async function onRequestFailed(requestId, event) {
        let state = RequestState.Failed
        try {
          requests.updateRequestState(requestId, state)
          requests.cancelWaitForRequestFinished(requestId)
        } catch (error) {
          if (error instanceof requests.RequestNotFoundError) {
            await requests.fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        add({ event: StorageEvent.RequestFailed, blockNumber, requestId, state })
      }

      async function onSlotFreed(requestId, slotIdx, event) {
        let state = SlotState.Free
        try {
          requests.updateRequestSlotState(requestId, slotIdx, state)
          requests.updateRequestSlotProvider(requestId, slotIdx, null)
        } catch (error) {
          if (error instanceof requests.RequestNotFoundError) {
            await requests.fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        add({ event: StorageEvent.SlotFreed, blockNumber, requestId, slotIdx, state })
      }

      async function onSlotFilled(requestId, slotIdx, event) {
        let state = SlotState.Filled
        try {
          requests.updateRequestSlotState(requestId, slotIdx, state)
          let id = slotId(requestId, slotIdx)
          let provider = await marketplace.getHost(id)
          requests.updateRequestSlotProvider(requestId, slotIdx, provider)
        } catch (error) {
          if (error instanceof requests.RequestNotFoundError) {
            await requests.fetchRequestDetails(requestId)
          }
        }

        let { blockNumber } = event.log
        add({ event: StorageEvent.SlotFilled, blockNumber, requestId, slotIdx, state })
      }

      await marketplace.removeAllListeners(StorageRequested)
      await marketplace.on(StorageRequested, onStorageRequested)
      // subscriptions.value[StorageEvent.StorageRequested] = { subscribed: true }

      await marketplace.removeAllListeners(RequestFulfilled)
      await marketplace.on(RequestFulfilled, onRequestFulfilled)

      await marketplace.removeAllListeners(RequestCancelled)
      await marketplace.on(RequestCancelled, onRequestCancelled)

      await marketplace.removeAllListeners(RequestFailed)
      await marketplace.on(RequestFailed, onRequestFailed)

      await marketplace.removeAllListeners(SlotFreed)
      await marketplace.on(SlotFreed, onSlotFreed)

      await marketplace.removeAllListeners(SlotFilled)
      await marketplace.on(SlotFilled, onSlotFilled)
    }

    return {
      events,
      listenForNewEvents,
      add
    }
  },
  {
    persist: {
      serializer,
      paths: ['events']
    }
  }
)

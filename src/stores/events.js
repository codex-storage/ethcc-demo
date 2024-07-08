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
    const events = ref({}) // {event: 'SlotFreed',blockNumber,requestId,slotIdx,state: 'Free'}

    const id = (event, blockNumber, requestId, slotIdx) => {
      return `${event}_${blockNumber}_${requestId}_${slotIdx}`
    }

    function add({ event, blockNumber, requestId, slotIdx, state, timestamp, moderated }) {
      let eventId = id(event, blockNumber, requestId, slotIdx)
      events.value[eventId] = {
        event,
        blockNumber,
        requestId,
        slotIdx,
        state,
        timestamp,
        moderated
      }
    }

    function clearEvents() {
      events.value = {}
    }

    function clearEvent(eventId) {
      const filtered = Object.entries(events.value).filter(([evtId, event]) => {
        return evtId != eventId
      })
      events.value = Object.fromEntries(filtered)
    }

    function updateModerated(reqId, moderated) {
      Object.entries(events.value).forEach(([eventId, { requestId }]) => {
        if (reqId === requestId) {
          events.value[eventId].moderated = moderated
        }
      })
    }

    async function listenForNewEvents() {
      async function onStorageRequested(requestId, ask, expiry, event) {
        let { blockNumber, blockHash } = event.log
        const request = await requests.addFromEvent(requestId, ask, expiry, blockHash)

        add({
          event: StorageEvent.StorageRequested,
          blockNumber,
          requestId,
          state: RequestState.New,
          timestamp: request.requestedAt,
          moderated: request.moderated
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

        let { blockNumber, blockHash } = event.log
        const { timestamp } = await requests.getBlock(blockHash)
        const request = await requests.getRequest(requestId)
        add({
          event: StorageEvent.RequestFulfilled,
          blockNumber,
          requestId,
          state,
          timestamp,
          moderated: request.moderated
        })
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

        let { blockNumber, blockHash } = event.log
        const { timestamp } = await requests.getBlock(blockHash)
        const request = await requests.getRequest(requestId)
        add({
          event: StorageEvent.RequestCancelled,
          blockNumber,
          requestId,
          state,
          timestamp,
          moderated: request.moderated
        })
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

        let { blockNumber, blockHash } = event.log
        const { timestamp } = await requests.getBlock(blockHash)
        const request = await requests.getRequest(requestId)
        add({
          event: StorageEvent.RequestFailed,
          blockNumber,
          requestId,
          state,
          timestamp,
          moderated: request.moderated
        })
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

        let { blockNumber, blockHash } = event.log
        const { timestamp } = await requests.getBlock(blockHash)
        const request = await requests.getRequest(requestId)
        add({
          event: StorageEvent.SlotFreed,
          blockNumber,
          requestId,
          slotIdx,
          state,
          timestamp,
          moderated: request.moderated
        })
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

        let { blockNumber, blockHash } = event.log
        const { timestamp } = await requests.getBlock(blockHash)
        const request = await requests.getRequest(requestId)
        add({
          event: StorageEvent.SlotFilled,
          blockNumber,
          requestId,
          slotIdx,
          state,
          timestamp,
          moderated: request.moderated
        })
      }

      await marketplace.removeAllListeners(StorageRequested)
      await marketplace.on(StorageRequested, onStorageRequested)

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
      clearEvent,
      clearEvents,
      listenForNewEvents,
      add,
      updateModerated
    }
  },
  {
    persist: {
      serializer,
      crossTabSync: true
    }
  }
)

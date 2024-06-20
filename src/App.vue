<script setup>
import { onBeforeMount, onMounted, ref, onUnmounted } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import { RouterView } from 'vue-router'
import Balance from '@/components/Balance.vue'
import BlockNumber from '@/components/BlockNumber.vue'
import ToastNotification from '@/components/toasts/ToastNotification.vue'
import AppNav from '@/components/AppNav.vue'
import ContractEventAlerts from '@/components/ContractEventAlerts.vue'
import { initDrawers, initDismisses } from 'flowbite'
import NavBreadcrumb from './components/NavBreadcrumb.vue'
import { storeToRefs } from 'pinia'

const alerts = ref([])
const id = ref(0)
const requestsStore = useRequestsStore()
const { loadingRecent } = storeToRefs(requestsStore)

function addAlert(type, event, state) {
  alerts.value.push({
    id: event + '123456' + (1234567890 + ++id.value),
    type,
    event,
    blockNumber: 123456,
    requestId: '0x1a93c8ea68a45dadc599f38858b3fdcb3c442aea0f6180c20e3f08614c251041',
    state
  })
}

function addSlotAlert(type, event, state) {
  alerts.value.push({
    id: event + '123456' + (1234567890 + ++id.value),
    type,
    event,
    blockNumber: 123456,
    requestId: '0x0d08d8fa3df9d79f1c57a34ebc6a8050ae91fca2c0d6f7191470cbbf38a048bd',
    slotIdx: 1,
    state
  })
}

onBeforeMount(async () => {})

onMounted(async () => {
  await requestsStore.fetchPastRequests()
  initDrawers()
  initDismisses()

  function onStorageRequested(blockNumber, requestId, state) {
    alerts.value.push({
      type: 'info',
      event: 'StorageRequested',
      blockNumber,
      requestId,
      state
    })
  }
  function onRequestFulfilled(blockNumber, requestId) {
    alerts.value.push({
      type: 'success',
      event: 'RequestStarted',
      blockNumber,
      requestId,
      state: 'Fulfilled'
    })
  }
  function onRequestCancelled(blockNumber, requestId) {
    alerts.value.push({
      type: 'danger',
      event: 'RequestCancelled',
      blockNumber,
      requestId,
      state: 'Cancelled'
    })
  }
  function onRequestFailed(blockNumber, requestId) {
    alerts.value.push({
      type: 'danger',
      event: 'RequestFailed',
      blockNumber,
      requestId,
      state: 'Failed'
    })
  }
  function onRequestFinished(blockNumber, requestId) {
    alerts.value.push({
      type: 'info',
      event: 'RequestFinished',
      blockNumber,
      requestId,
      state: 'Finished'
    })
  }
  function onSlotFreed(blockNumber, requestId, slotIdx) {
    alerts.value.push({
      type: 'warning',
      event: 'SlotFreed',
      blockNumber,
      requestId,
      slotIdx,
      state: 'Freed'
    })
  }
  function onSlotFilled(blockNumber, requestId, slotIdx) {
    alerts.value.push({
      type: 'info',
      event: 'SlotFilled',
      blockNumber,
      requestId,
      slotIdx,
      state: 'Filled'
    })
  }
  await requestsStore.listenForNewEvents(
    onStorageRequested,
    onRequestFulfilled,
    onRequestCancelled,
    onRequestFailed,
    onRequestFinished,
    onSlotFreed,
    onSlotFilled
  )

  window.addEventListener('storage', handleStorageEvent)
})

function handleStorageEvent(event) {
  if (event.key === 'requests') {
    requestsStore.$hydrate()
  }
}

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageEvent)
})
</script>

<template>
  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    type="button"
    @click="addAlert('success', 'RequestFulfilled', 'Fulfilled')"
  >
    success alert
  </button>
  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    type="button"
    @click="addAlert('warning', 'SlotFreed', 'Freed')"
  >
    warning alert
  </button>
  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    type="button"
    @click="addAlert('danger', 'RequestFailed', 'Failed')"
  >
    danger alert
  </button>
  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    type="button"
    @click="addAlert('info', 'RequestFinished', 'Finished')"
  >
    info alert
  </button>
  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
    type="button"
    @click="addSlotAlert('info', 'SlotFreed', 'Freed')"
  >
    info alert - Slot
  </button>
  <div
    class="absolute top-0 bottom-0 left-0 right-0 flex flex-col h-full min-w-96 bg-white dark:bg-gray-900"
  >
    <header class="sticky top-0 z-10 w-full text-center border-b p-4 flex-none">
      <AppNav />
    </header>
    <main class="grow flex flex-col mx-auto max-w-screen-xl w-full p-4">
      <ContractEventAlerts v-model="alerts"></ContractEventAlerts>
      <NavBreadcrumb class="mb-4"></NavBreadcrumb>
      <RouterView />
    </main>
    <footer class="w-full sticky bottom-0 text-center border-t p-4 mt-4 flex-none">
      <Balance />
      <BlockNumber />
    </footer>
    <ToastNotification
      class="fixed bottom-5 right-5"
      v-if="loadingRecent"
      text="Loading recent storage requests..."
    ></ToastNotification>
  </div>
</template>

<style scoped>
header,
footer,
main {
  @apply min-w-96 bg-white dark:bg-gray-900;
}
header,
footer {
  @apply border-gray-200 dark:border-gray-600 dark:text-white;
}
</style>

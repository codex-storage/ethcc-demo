<script setup>
import { onMounted, ref, onUnmounted, inject } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import { RouterView } from 'vue-router'
import Balance from '@/components/Balance.vue'
import BlockNumber from '@/components/BlockNumber.vue'
import ToastNotification from '@/components/toasts/ToastNotification.vue'
import AppNav from '@/components/AppNav.vue'
import ContractEventAlerts from '@/components/ContractEventAlerts.vue'
import { initDrawers, initDismisses } from 'flowbite'
import NavBreadcrumb from '@/components/NavBreadcrumb.vue'
import { storeToRefs } from 'pinia'
import NetworkConnectionState from './components/NetworkConnectionState.vue'
import serializer from '@/stores/serializer'
import { generateUniqueId } from '@/utils/ids'
import { useEventsStore } from './stores/events'

const eventsStore = useEventsStore()
const requestsStore = useRequestsStore()
const { loading } = storeToRefs(requestsStore)
const { events } = storeToRefs(eventsStore)
const codexApi = inject('codexApi')
const ethProvider = inject('ethProvider')

window.name = generateUniqueId()

onMounted(() => {
  initDrawers()
  initDismisses()
  requestsStore.$hydrate()
  requestsStore.refetchRequestStates().then(() => {
    requestsStore.fetchPastRequests()
  })
  eventsStore.listenForNewEvents()

  window.addEventListener('storage', handleStorageEvent)
})

const getLocalStorageKey = inject('getLocalStorageKey')
const localStorageKey = getLocalStorageKey(requestsStore.$id)
const localStorageMetaKey = `${localStorageKey}_storeEventMeta`
function handleStorageEvent(event) {
  if (event.key === localStorageKey) {
    let serialized = window.localStorage.getItem(localStorageMetaKey)
    if (serialized) {
      let { source, timestamp } = serializer.deserialize(serialized)
      // prevent our own window local storage updates from hydrating (infinite
      // loop) and prevent stale updates from hydrating
      if (source !== window.name && timestamp > lastStoreTimestamp) {
        requestsStore.$hydrate()
      }
    }
  }
}
let lastStoreTimestamp = 0
requestsStore.$subscribe((_mutation, state) => {
  lastStoreTimestamp = Date.now()
  const storeEventMeta = {
    source: window.name,
    timestamp: Date.now()
  }
  window.localStorage.setItem(localStorageMetaKey, serializer.serialize(storeEventMeta))
})

async function detectRunningCodexNode() {
  try {
    let response = await codexApi.spr()
    return response.ok
  } catch (e) {
    return false
  }
}

async function detectRunningCodexDevnet() {
  try {
    await ethProvider.getNetwork.bind(ethProvider)()
    return true
  } catch (e) {
    return false
  }
}

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageEvent)
})
</script>

<template>
  <div class="flex flex-col h-full min-w-96 bg-white dark:bg-gray-900">
    <header class="sticky top-0 z-10 w-full text-center border-b p-4 flex-none">
      <AppNav />
    </header>
    <main class="grow flex flex-col mx-auto max-w-screen-xl w-full p-4">
      <ContractEventAlerts v-model="events"></ContractEventAlerts>
      <NavBreadcrumb class="mb-4"></NavBreadcrumb>
      <RouterView />
    </main>
    <footer class="w-full sticky bottom-0 border-t p-4 mt-4 flex-none flex justify-between">
      <div class="flex flex-col space-y-1">
        <Balance />
        <BlockNumber />
      </div>
      <div class="flex flex-col space-y-3">
        <NetworkConnectionState
          :connectionTest="detectRunningCodexNode"
          text="Codex node"
        ></NetworkConnectionState>
        <NetworkConnectionState
          :connectionTest="detectRunningCodexDevnet"
          text="Codex devnet"
        ></NetworkConnectionState>
      </div>
    </footer>
    <div id="toast-container" class="fixed bottom-5 right-5 flex flex-col space-y-2">
      <ToastNotification
        v-if="loading.recent"
        text="Loading recent storage requests..."
      ></ToastNotification>
      <ToastNotification
        v-if="loading.states"
        text="Loading latest request states..."
      ></ToastNotification>
    </div>
  </div>
</template>

<style>
body {
  @apply bg-white dark:bg-gray-900;
}
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

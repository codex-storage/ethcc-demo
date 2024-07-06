<script setup>
import { watch, computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CodexImage from './CodexImage.vue'
import RelativeTime from './RelativeTime.vue'
import ShortenValue from './ShortenValue.vue'

import { useRequestsStore } from '@/stores/requests'
import { storeToRefs } from 'pinia'

const requestsStore = useRequestsStore()
const { requests } = storeToRefs(requestsStore)
const route = useRoute()
const router = useRouter()

const events = defineModel()
const emit = defineEmits(['clearEvents', 'clearEvent'])
function request(requestId) {
  return requests.value[requestId]
}
const eventsFiltered = computed(() => {
  return Object.values(events.value).filter((event) => event !== null)
})
const showNotifCentre = ref(false)
function toggleNotifCentre() {
  showNotifCentre.value = !showNotifCentre.value
}
function hideNotifCentre() {
  if (showNotifCentre.value) {
    showNotifCentre.value = false
  }
}
onMounted(() => {
  document.documentElement.addEventListener('click', hideNotifCentre)
})
onUnmounted(() => {
  document.documentElement.removeEventListener('click', hideNotifCentre)
})
function dismissAndRedirect(requestId) {
  showNotifCentre.value = false
  router.push({ path: `/request/${requestId}`, query: route.query })
}
const buttonClass = computed(() => {
  return {
    hover: showNotifCentre.value
  }
})
</script>

<template>
  <div class="relative">
    <button @click.stop="toggleNotifCentre">
      <svg
        class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
        :class="buttonClass"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 22 21"
      >
        <path
          d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"
        />
        <path
          d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"
        />
      </svg>
    </button>
    <div
      v-if="showNotifCentre"
      class="absolute flex flex-col shadow top-12 right-0 min-w-96 max-h-128 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600"
      >
        <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Latest events</h5>
        <a
          href="#"
          @click.stop="emit('clearEvents')"
          class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500"
        >
          Clear all
        </a>
      </div>
      <div class="overflow-y-auto">
        <div v-if="events.length === 0" class="pt-6 pb-4 text-gray-900 dark:text-white">
          No events
        </div>
        <div class="flow-root">
          <ul role="list" class="text-left divide-y divide-gray-200 dark:divide-gray-700">
            <li
              v-for="(
                { event, blockNumber, requestId, slotIdx, state, timestamp, moderated }, idx
              ) in events"
              :key="idx"
              class="py-3 pr-2 pl-4 pb-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="dismissAndRedirect(requestId)"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <!-- <span class="w-8 h-8 rounded-full" alt="Neil image" /> -->
                  <CodexImage
                    :cid="request(requestId).request.content.cid"
                    :moderated="moderated"
                    class="w-8 h-8 rounded-full mt-1"
                    blurClass="blur"
                  />
                </div>
                <div class="flex-1 min-w-0 ms-4">
                  <p class="text-md font-semibold">
                    <ShortenValue :value="requestId"></ShortenValue>
                  </p>
                  <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {{ event }}
                  </p>
                  <div
                    v-if="slotIdx !== undefined"
                    class="text-sm text-gray-500 truncate dark:text-gray-400"
                  >
                    Slot {{ slotIdx }}
                  </div>
                </div>
                <div class="text-sm text-gray-500 truncate dark:text-gray-400">
                  <RelativeTime :timestamp="new Date(timestamp * 1000)"></RelativeTime>
                </div>
                <div class="pl-2 cursor-pointer" @click="emit('clearEvent', idx)">
                  <svg
                    class="w-5 h-5 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm7.707-3.707a1 1 0 0 0-1.414 1.414L10.586 12l-2.293 2.293a1 1 0 1 0 1.414 1.414L12 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L13.414 12l2.293-2.293a1 1 0 0 0-1.414-1.414L12 10.586 9.707 8.293Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.max-h-128 {
  max-height: 36rem;
}
svg.hover {
  @apply bg-gray-100 dark:bg-gray-700;
}
</style>

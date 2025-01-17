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
defineProps({
  hideThumbnails: Boolean,
  enableModeration: {
    type: Boolean,
    default: false
  }
})
function request(requestId) {
  return requests.value[requestId]
}
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
const eventsOrdered = computed(() => {
  return Object.entries(events.value).sort(([eventIdA, eventA], [eventIdB, eventB]) => {
    return eventB.timestamp - eventA.timestamp
  })
})
const count = computed(() => eventsOrdered.value.length)
</script>

<template>
  <div class="relative">
    <button
      @click.stop="toggleNotifCentre"
      class="focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 rounded-lg"
    >
      <svg
        class="inline-flex items-center p-2 w-11 h-11 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        :class="buttonClass"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 16"
      >
        <path
          d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z"
        />
        <path
          d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z"
        />
      </svg>

      <span class="sr-only">Notifications</span>
      <div
        v-if="count > 0"
        class="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-1 dark:border-gray-900"
      >
        {{ count }}
      </div>
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
        <div class="flow-root" v-if="eventsOrdered && Object.keys(eventsOrdered).length > 0">
          <ul role="list" class="text-left divide-y divide-gray-200 dark:divide-gray-700">
            <li
              v-for="(
                [eventId, { event, blockNumber, requestId, slotIdx, state, timestamp, moderated }],
                idx
              ) in eventsOrdered"
              :key="eventId"
              class="cursor-pointer py-3 pr-2 pl-4 pb-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="dismissAndRedirect(requestId)"
            >
              <div class="flex items-center">
                <div v-if="!hideThumbnails" class="flex-shrink-0">
                  <CodexImage
                    v-if="request(requestId)?.request"
                    :cid="request(requestId).request.content.cid"
                    :moderated="enableModeration ? 'approved' : moderated"
                    class="w-8 h-8 rounded-full mt-1"
                    blurClass="blur"
                  />
                </div>
                <div class="flex-1 min-w-0 ms-4">
                  <p class="text-md">
                    <ShortenValue :value="requestId"></ShortenValue>
                  </p>
                  <p class="text-sm text-gray-900 truncate dark:text-white">
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
                <div class="pl-2 cursor-pointer" @click.stop="emit('clearEvent', eventId)">
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
        <div class="pt-6 pb-4 text-gray-900 dark:text-white" v-else>No events</div>
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

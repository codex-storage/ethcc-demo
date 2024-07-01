<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { initTooltips } from 'flowbite'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import StateIndicator from '@/components/StateIndicator.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import ShortenValue from '@/components/ShortenValue.vue'
import { getStateColour, moderatedState } from '@/utils/requests'

const requestsStore = useRequestsStore()
const { requests } = storeToRefs(requestsStore)
const router = useRouter()
const requestsOrdered = computed(() => {
  const sorted = Object.entries(requests.value).sort(
    ([reqIdA, reqA], [reqIdB, reqB]) => reqB.requestedAt - reqA.requestedAt
  )
  return sorted
})

defineProps({
  enableModeration: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  initTooltips()
})
</script>

<template>
  <div class="flex flex-1 flex-col h-auto">
    <div
      class="flex flex-initial items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 px-6 bg-white dark:bg-gray-900"
    >
      <div>
        <button
          id="dropdownActionButton"
          data-dropdown-toggle="dropdownAction"
          class="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
          type="button"
        >
          <span class="sr-only">Action button</span>
          Action
          <svg
            class="w-2.5 h-2.5 ms-2.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </button>
        <!-- Dropdown menu -->
        <div
          id="dropdownAction"
          class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600"
        >
          <ul
            class="py-1 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownActionButton"
          >
            <li>
              <a
                href="#"
                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >Reward</a
              >
            </li>
            <li>
              <a
                href="#"
                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >Promote</a
              >
            </li>
            <li>
              <a
                href="#"
                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >Activate account</a
              >
            </li>
          </ul>
          <div class="py-1">
            <a
              href="#"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
              >Delete User</a
            >
          </div>
        </div>
      </div>
      <label for="table-search-users" class="sr-only">Search</label>
      <div class="relative">
        <div
          class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none"
        >
          <svg
            class="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="text"
          id="table-search-users"
          class="block pt-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search for users"
        />
      </div>
    </div>
    <div
    class="relative overflow-x-auto overflow-y-hidden max-h-screen shadow-md
    sm:rounded-lg border-t border-gray-50 h-full"
    >
      <table
        class="w-full relative text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 rounded-lg"
      >
        <thead
          class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
        >
          <tr>
            <th scope="col" class="px-6 py-3">RequestID</th>
            <th v-if="enableModeration" scope="col" class="px-6 py-3">Moderated</th>
            <th scope="col" class="px-6 py-3">State</th>
            <th scope="col" class="px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="([requestId, { requestedAt, moderated, state }], idx) in requestsOrdered"
            :key="{ requestId }"
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-800"
            @click="router.push({ path: `/request/${requestId}`, query: { enableModeration } })"
          >
            <th
              scope="row"
              class="flex items-center px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              <div class="ps-3">
                <div class="text-base font-semibold">
                  <ShortenValue :value="requestId"></ShortenValue>
                </div>
                <div class="font-normal text-gray-500">
                  <RelativeTime :timestamp="new Date(requestedAt * 1000)"></RelativeTime>
                </div>
              </div>
            </th>
            <td v-if="enableModeration" class="px-6 py-4">
              <div class="flex items-center">
                <StateIndicator
                  :color="moderatedState[moderated].color"
                  :text="moderatedState[moderated].text"
                ></StateIndicator>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center">
                <StateIndicator :text="state" :color="getStateColour(state)"></StateIndicator>
              </div>
            </td>
            <td class="px-6 py-4">
              <a
                v-if="enableModeration"
                :href="router.resolve({ path: `/request/${requestId}` }).href"
                target="_blank"
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                @click.stop
                >Preview</a
              >
              <a
                v-else
                href="#"
                type="button"
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >View details</a
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.max-h-128 {
  max-height: 36rem;
}
</style>

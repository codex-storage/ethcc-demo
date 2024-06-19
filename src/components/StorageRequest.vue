<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { initTooltips } from 'flowbite'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { getStateColour, moderatedState, price } from '@/utils/requests'
import { autoPluralize } from '@/utils/strings'

import CodexImage from '@/components/CodexImage.vue'
import StateIndicator from '@/components/StateIndicator.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import ShortenValue from '@/components/ShortenValue.vue'
import Slots from './Slots.vue'

const request = defineModel()
const props = defineProps({
  requestId: {
    type: String,
    required: true
  },
  enableModeration: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  initTooltips()
})

const totalPrice = computed(() => price(request.value))
const maxSlotLoss = computed(() => autoPluralize(request.value.ask.maxSlotLoss, 'slot'))
const slots = computed(() => autoPluralize(request.value.ask.slots, 'slot'))
const stateColour = computed(() => getStateColour(request.value.state))
</script>

<template>
  <div class="flex flex-wrap">
    <CodexImage
      class="flex-initial mx-auto my-4 min-w-sm max-w-md w-full rounded"
      :cid="request.content.cid"
      :local-only="!['New', 'Fulfilled'].includes(request.state)"
      :moderated="enableModeration ? 'approved' : request.moderated"
    ></CodexImage>
    <div class="py-4 px-4 ml-4 max-w-2xl flex-1">
      <div
        v-if="enableModeration === true"
        class="mb-4 p-5 w-full border border-gray-300 rounded-lg b-1 bg-gray-100"
      >
        <label for="moderation" class="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
          >Moderation station</label
        >
        <div class="flex items-center justify-between space-x-4">
          <div class="flex-1">
            <select
              id="moderation"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              v-model="request.moderated"
            >
              <option v-for="(value, key) in moderatedState" :value="key" :key="key">
                {{ value.text }}
              </option>
            </select>
          </div>
          <StateIndicator
            class="flex-none h-7 inline-block align-middle"
            :text="moderatedState[request.moderated].text"
            :color="moderatedState[request.moderated].color"
            size="lg"
          ></StateIndicator>
        </div>
      </div>
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-semibold leading-none text-gray-900 md:text-2xl dark:text-white">
          Request <ShortenValue :value="requestId" :chars="8"></ShortenValue>
        </h2>
        <StateIndicator :text="request.state" :color="stateColour" size="lg"></StateIndicator>
      </div>
      <p
        class="mb-4 text-xl font-extrabold leading-none text-gray-900 md:text-2xl dark:text-white flex justify-between"
      >
        {{ totalPrice }} CDX
      </p>
      <dl>
        <dd class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">
          <RelativeTime :timestamp="new Date(request.requestedAt * 1000)"></RelativeTime>
        </dd>
      </dl>
      <dl>
        <dt class="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Dataset CID</dt>
        <dd class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">
          {{ request.content.cid }}
        </dd>
      </dl>
      <dl>
        <dt class="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Client</dt>
        <dd class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">
          {{ request.client }}
        </dd>
      </dl>
      <dl>
        <dt class="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Merkle root</dt>
        <dd class="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">
          {{ request.content.merkleRoot }}
        </dd>
      </dl>
      <div class="relative overflow-x-auto overflow-y-auto max-h-screen mb-10">
        <table
          class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mx-auto"
        >
          <tbody>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Expiry
              </td>
              <td class="px-6 py-2 font-light">{{ request.expiry }} seconds</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Duration
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.duration }} seconds</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Slot size
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.slotSize }} bytes</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Proof probability
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.proofProbability }}</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Reward
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.reward }} CDX</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:tbg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Collateral
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.collateral }} CDX</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:tbg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Slots
              </td>
              <td class="px-6 py-2 font-light">{{ slots }}</td>
            </tr>
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Max slot loss
              </td>
              <td class="px-6 py-2 font-light">
                {{ maxSlotLoss }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Slots :slots="request.slots"></Slots>
    </div>
  </div>
</template>

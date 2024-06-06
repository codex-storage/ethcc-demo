<script setup>
import { computed } from 'vue'
import { getStateColour, price } from '@/utils/requests'

import CodexImage from '@/components/CodexImage.vue'
import StateIndicator from '@/components/StateIndicator.vue'
import { shortHex } from '@/utils/ids'
import Slots from './Slots.vue'

const props = defineProps({
  requestId: {
    type: String,
    required: true
  },
  request: {
    type: Object,
    required: true
  }
})

const totalPrice = computed(() => price(props.request))
</script>

<template>
  <div class="flex">
    <CodexImage class="flex-2" :cid="request.content.cid"></CodexImage>
    <div class="py-8 px-4 mx-auto max-w-2xl lg:py-16">
      <h2 class="mb-2 text-xl font-semibold leading-none text-gray-900 md:text-2xl dark:text-white">
        {{ shortHex(requestId, 12) }}
      </h2>
      <p class="mb-4 text-xl font-extrabold leading-none text-gray-900 md:text-2xl dark:text-white">
        {{ totalPrice }} CDX
      </p>
      <StateIndicator
        class="mb-4"
        :text="request.state"
        :color="getStateColour(request.state)"
      ></StateIndicator>
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
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Expiry
              </td>
              <td class="px-6 py-2 font-light">{{ request.expiry }} seconds</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Duration
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.duration }} seconds</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Slot size
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.slotSize }} bytes</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Proof probability
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.proofProbability }}</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Reward
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.reward }} CDX</td>
            </tr>
            <tr
              class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:tbg-gray-600 text-base"
            >
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Collateral
              </td>
              <td class="px-6 py-2 font-light">{{ request.ask.collateral }} CDX</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Max slot loss
              </td>
              <td class="px-6 py-2 font-light">
                {{ request.ask.maxSlotLoss }} {{ request.ask.maxSlotLoss == 1 ? 'slot' : 'slots' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Slots :slots="request.slots"></Slots>
    </div>
  </div>
</template>

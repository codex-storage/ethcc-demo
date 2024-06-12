<script setup>
import { computed } from 'vue'
import { getStateColour, price } from '@/utils/requests'
import { autoPluralize } from '@/utils/strings'

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
const maxSlotLoss = computed(() => autoPluralize(props.request.ask.maxSlotLoss, 'slot'))
const slots = computed(() => autoPluralize(props.request.ask.slots, 'slot'))
const stateColour = computed(() => getStateColour(props.request.state))
</script>

<template>
  <div class="flex flex-wrap">
    <CodexImage class="flex-initial mx-auto my-8 lg:my-16 min-w-sm max-w-md w-full
    rounded" :cid="request.content.cid" :local-only="!['New',
    'Fulfilled'].includes(request.state)"></CodexImage>
    <div class="py-8 px-4 ml-4 max-w-2xl lg:py-16 flex-1">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-semibold leading-none text-gray-900 md:text-2xl dark:text-white">
          Request {{ shortHex(requestId, 8) }}
        </h2>
        <StateIndicator
          :text="request.state"
          :color="stateColour"
          size="lg"
        ></StateIndicator>
      </div>
      <p class="mb-4 text-xl font-extrabold leading-none text-gray-900
      md:text-2xl dark:text-white flex justify-between">
        <div>{{ totalPrice }} CDX</div>

      </p>
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
            <tr
              class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:tbg-gray-600 text-base"
            >
              <td
                class="flex items-center pr-1 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r"
              >
                Slots
              </td>
              <td class="px-6 py-2 font-light">{{ slots }}</td>
            </tr>
            <tr class="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-600 text-base">
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

<script setup>
import { onMounted } from 'vue'
import { getStateColour } from '@/utils/slots'
import { shortHex } from '@/utils/ids'
import StateIndicator from '@/components/StateIndicator.vue'
defineProps({
  slots: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div
    class="relative overflow-x-auto overflow-y-auto max-h-screen shadow-md sm:rounded-lg border-t border-gray-50"
  >
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">SlotID</th>
          <th scope="col" class="px-6 py-3">Index</th>
          <th scope="col" class="px-6 py-3">Proofs Missed</th>
          <th scope="col" class="px-6 py-3">Provider</th>
          <th scope="col" class="px-6 py-3">State</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="({ slotId, slotIdx, state, proofsMissed, provider }, idx) in slots"
          :key="{ slotId }"
          class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <th
            scope="row"
            class="flex items-center px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
          >
            <div class="text-base font-semibold">{{ shortHex(slotId) }}</div>
          </th>
          <td class="px-6 py-4">{{ slotIdx }}</td>
          <td class="px-6 py-4">{{ proofsMissed }}</td>
          <td class="px-6 py-4">{{ shortHex(provider) }}</td>
          <td class="px-6 py-4">
            <div class="flex items-center">
              <StateIndicator :text="state" :color="getStateColour(state)"></StateIndicator>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

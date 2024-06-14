<script setup>
import { onMounted, ref } from 'vue'
import { initTooltips } from 'flowbite'
// defineProps({
//   id: {
//     type: String,
//     required: true
//   }
// })
onMounted(() => {
  initTooltips()
})
</script>

<template>
  <!-- <slot :id="$idRef('tooltip')" name="text"></slot> -->
  <p :data-tooltip-target="$id('tooltip')" class="cursor-help">
    <slot name="text"></slot>
  </p>
  <div
    :id="$id('tooltip')"
    role="tooltip"
    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
  >
    <slot name="tooltip-content"></slot>
    <div class="tooltip-arrow" data-popper-arrow></div>
  </div>
</template>

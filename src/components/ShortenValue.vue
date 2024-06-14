<script setup>
import Tooltip from '@/components/Tooltip.vue'
import { shorten } from '@/utils/ids'
defineProps({
  value: {
    type: String,
    required: true
  },
  ellipses: {
    type: String,
    default: '..'
  },
  chars: {
    type: Number,
    default: 4
  }
})
</script>
<template>
  <Tooltip>
    <template #text>{{ shorten(value, ellipses, chars) }}</template>
    <template #tooltip-content>{{ value }}</template>
  </Tooltip>
</template>

<script setup>
import { computed } from 'vue'
import { getRelativeTime } from '@feelinglovelynow/get-relative-time'
import Tooltip from '@/components/Tooltip.vue'

const props = defineProps({
  timestamp: {
    type: Date,
    required: true
  }
})
const relativeTime = computed(() => getRelativeTime(props.timestamp))
</script>
<template>
  <Tooltip>
    <template #text>{{ relativeTime }}</template>
    <template #tooltip-content>{{ props.timestamp.toString() }}</template>
  </Tooltip>
</template>

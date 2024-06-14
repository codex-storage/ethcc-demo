<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getRelativeTime } from '@feelinglovelynow/get-relative-time'
import Tooltip from '@/components/Tooltip.vue'

const props = defineProps({
  timestamp: {
    type: Date,
    required: true
  }
})
const date = ref(Date.now())
const relativeTime = ref(getRelativeTime(props.timestamp))
watch(date, () => (relativeTime.value = getRelativeTime(props.timestamp)))
let intervalId
// onMounted(() => {
//   intervalId = setInterval(() => (date.value = Date.now()), 10000)
// })
// onUnmounted(() => clearInterval(intervalId))
</script>
<template>
  <Tooltip>
    <template #text>{{ relativeTime }}</template>
    <template #tooltip-content>{{ props.timestamp.toString() }}</template>
  </Tooltip>
</template>

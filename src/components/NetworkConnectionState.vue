<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StateIndicator from './StateIndicator.vue'

const props = defineProps({
  connectionTest: {
    type: Function,
    required: true
  },
  text: {
    type: String,
    required: true
  }
})

const isAlive = ref(true)
const loading = ref(false)
const color = computed(() => {
  if (loading.value === true) return 'yellow'
  else if (isAlive.value === true) return 'green'
  else return 'red'
})
let checkIntervalId

async function checkConnection() {
  loading.value = true
  try {
    isAlive.value = await props.connectionTest()
  } catch (e) {
    isAlive.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkConnection()
  checkIntervalId = setInterval(() => {
    checkConnection()
  }, 5000)
})

onUnmounted(() => {
  clearInterval(checkIntervalId)
})
</script>

<template>
  <StateIndicator size="sm" :color="color" :text="text"></StateIndicator>
</template>

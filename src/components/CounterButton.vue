<script setup>
import { useCounterStore } from '@/stores/counter'
import { ref, onMounted } from 'vue'

useCounterStore()

const pElementRef = ref(null)

// var {count, doubleCount, increment} = useCounterStore()
</script>

<template>
  <button @click="_pStores.counter.increment">
    {{ _pStores.counter.count }}
  </button>
</template>

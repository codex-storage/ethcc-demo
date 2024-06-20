<script setup>
import { inject, ref, onMounted } from 'vue'

const ethProvider = inject('ethProvider')
const blockNumber = ref(0)

onMounted(async () => {
  blockNumber.value = await ethProvider.getBlockNumber()
  ethProvider.on('block', (newBlockNum) => {
    blockNumber.value = newBlockNum
  })
})
</script>

<template>
  <span>Current block: {{ blockNumber }}</span>
</template>

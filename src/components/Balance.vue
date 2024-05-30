<script setup>
import { inject, ref, onMounted } from 'vue'
import {formatEther} from 'ethers'

const token = inject('token')
const myAddress = inject('myAddress')
const balance = ref(1)

onMounted(async () => {
  balance.value = await token.balanceOf(myAddress)

  token.on(token.filters.Transfer, async (from, to, amount, event) => {
    balance.value = await token.balanceOf(myAddress)
  })
})
</script>

<template>
  <div>My balance: {{ formatEther(balance) }} TST</div>
</template>
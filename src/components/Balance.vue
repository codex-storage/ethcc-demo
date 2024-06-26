<script setup>
import { inject, ref, onMounted } from 'vue'
import { formatEther } from 'ethers'

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
  <div>
    <img
      src="../assets/logo.svg"
      class="h-4 mr-2 hidden dark:inline-block"
      alt="Codex
    Logo"
    />
    <img
      src="../assets/logo-black.svg"
      class="h-4 mr-2 inline-block align-middle dark:hidden"
      alt="Codex Logo"
    />
    <span class="inline-block align-middle">{{ formatEther(balance) }} TST</span>
  </div>
</template>

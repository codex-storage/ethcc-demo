<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="mx-auto max-w-screen-xl flex flex-wrap items-center justify-between">
    <RouterLink to="/" class="flex items-center relative rtl:space-x-reverse">
      <img src="../assets/logo.svg" class="h-8 hidden dark:inline" alt="Codex Logo" />
      <img src="../assets/logo-black.svg" class="h-8 inline dark:hidden" alt="Codex Logo" />
      <span class="self-center ml-3 text-2xl font-semibold whitespace-nowrap dark:text-white"
        >Codex</span
      >
    </RouterLink>
    <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
      <button
        type="button"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Instructions
      </button>
    </div>
  </nav>
</template>


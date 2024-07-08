<script setup>
import { RouterLink } from 'vue-router'
import NotificationCentre from './NotificationCentre.vue'
import { useEventsStore } from '@/stores/events'
import { storeToRefs } from 'pinia'
import MainMenu from './MainMenu.vue'
import { useAttrs } from 'vue'

const eventsStore = useEventsStore()
const { events } = storeToRefs(eventsStore)
const attrs = useAttrs()
</script>

<template>
  <nav class="mx-auto max-w-screen-xl flex flex-wrap items-center justify-between">
    <RouterLink to="/" class="logo flex items-center relative rtl:space-x-reverse">
      <img src="../assets/logo.svg" class="h-8 hidden dark:inline" alt="Codex Logo" />
      <img src="../assets/logo-black.svg" class="h-8 inline dark:hidden" alt="Codex Logo" />
      <span class="self-center ml-3 text-2xl font-semibold whitespace-nowrap dark:text-white"
        >Codex</span
      >
    </RouterLink>
    <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
      <div class="inline-flex items-center">
        <NotificationCentre
          class="mr-1"
          v-model="events"
          @clear-events="eventsStore.clearEvents"
          @clear-event="eventsStore.clearEvent"
          :hideThumbnails="attrs.hideThumbnails"
        ></NotificationCentre>
        <MainMenu
          :hideThumbnails="attrs.hideThumbnails"
          @toggle-hide-thumbnails="attrs.onToggleHideThumbnails"
        ></MainMenu>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav a.router-link-exact-active:not(.logo) {
  @apply dark:bg-gray-700;
}
</style>

<script setup>
import { storeToRefs } from 'pinia'
import { useEventsStore } from '@/stores/events'
import StorageRequests from '@/components/StorageRequests.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const eventsStore = useEventsStore()
const { loading } = storeToRefs(eventsStore)
</script>

<template>
  <div>
    <SkeletonLoading v-if="loading" type="image" />
    <StorageRequests v-else />
  </div>
</template>

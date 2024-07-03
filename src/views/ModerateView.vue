<script setup>
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import StorageRequests from '@/components/StorageRequests.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { loading } = storeToRefs(requestsStore)
</script>

<template>
  <div>
    <SkeletonLoading v-if="loading.past" type="text" />
    <StorageRequests :enable-moderation="true" v-else />
  </div>
</template>

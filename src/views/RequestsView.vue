<script setup>
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import StorageRequests from '@/components/StorageRequests.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { loading } = storeToRefs(requestsStore)
defineProps({
  hideThumbnails: Boolean
})
</script>

<template>
  <div>
    <SkeletonLoading v-if="loading.past" type="text" />
    <StorageRequests v-else :hideThumbnails="hideThumbnails" />
  </div>
</template>

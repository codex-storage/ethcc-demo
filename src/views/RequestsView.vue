<script setup>
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import StorageRequests from '@/components/StorageRequests.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'
import { computed } from 'vue'

const requestsStore = useRequestsStore()
const { loading, fetched, requests } = storeToRefs(requestsStore)
const isLoading = computed(
  () => loading.value || !fetched.value || !requests.value || requests.value?.size === 0
)
</script>

<template>
  <div>
    <SkeletonLoading v-if="isLoading" type="text" />
    <StorageRequests v-else />
  </div>
</template>

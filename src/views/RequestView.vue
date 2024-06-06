<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useRoute } from 'vue-router'
import StorageRequest from '@/components/StorageRequest.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { requests, loading, fetched } = storeToRefs(requestsStore)
const isLoading = computed(() =>
  !fetched.value ||
  loading.value ||
  !requests.value ||
  requests.value.size === 0 ||
  !requests.value.has(route.params.requestId)
)
const request = computed(() => requests?.value?.get(route.params.requestId) )
const route = useRoute()
</script>

<template>
  <div>
    <SkeletonLoading v-if="isLoading" type="image" />
    <StorageRequest v-else :requestId="route.params.requestId" :request="request" />
  </div>
</template>

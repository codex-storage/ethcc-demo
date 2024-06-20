<script setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useRoute, useRouter } from 'vue-router'
import StorageRequest from '@/components/StorageRequest.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { requests, loading, fetched } = storeToRefs(requestsStore)
const route = useRoute()
const router = useRouter()

async function fetchRequest(requestId) {
  console.log('request id route param changed, fetching...')
  try {
    await requestsStore.fetchRequestDetails(requestId)
  } catch (error) {
    if (
      error.message.includes('Unknown request') ||
      error.message.includes('invalid BytesLike value')
    ) {
      router.push({ path: '/404' })
    }
  }
}

const request = computed(() => requests.value[route.params.requestId])

function watchRequestId() {
  watch(() => route.params.requestId, fetchRequest, { immediate: true })
}

if (fetched.value) {
  watchRequestId()
} else {
  watch(() => fetched.value, watchRequestId, { once: true })
}
</script>

<template>
  <div>
    <SkeletonLoading v-if="loading" type="image" />
    <StorageRequest
      v-else
      :requestId="route.params.requestId"
      v-model="request"
      :enableModeration="route.query.enableModeration === 'true'"
    />
  </div>
</template>

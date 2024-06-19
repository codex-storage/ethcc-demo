<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useRoute, useRouter } from 'vue-router'
import StorageRequest from '@/components/StorageRequest.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { requests, loading } = storeToRefs(requestsStore)
const route = useRoute()
const router = useRouter()
const request = ref(undefined)

async function fetch(requestId) {
  try {
    await requestsStore.fetchRequest(requestId)
  } catch (error) {
    if (error.message.includes('Unknown request')) {
      router.push({ name: 'NotFound' })
    }
  }
  request.value = requests.value[requestId]
}

const hasRequest = computed(() => {
  return request.value !== undefined
})

watch(() => route.params.requestId, fetch)

if (loading.value) {
  watch(
    () => loading.value,
    (isLoading) => {
      if (!isLoading) {
        fetch(route.params.requestId)
      }
    },
    { once: true }
  )
} else {
  fetch(route.params.requestId)
}
</script>

<template>
  <div>
    <SkeletonLoading v-if="loading" type="image" />
    <StorageRequest
      v-else-if="hasRequest"
      :requestId="route.params.requestId"
      v-model="request"
      :enableModeration="route.query.enableModeration === 'true'"
    />
  </div>
</template>

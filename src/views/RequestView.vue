<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useRoute, useRouter } from 'vue-router'
import StorageRequest from '@/components/StorageRequest.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { requests, loading, fetched } = storeToRefs(requestsStore)
const route = useRoute()
const router = useRouter()
const request = ref(requests.value[route.params.requestId])

async function fetchRequestDetails(requestId) {
  console.log('request id route param changed, fetching...')
  try {
    await requestsStore.fetchRequest(requestId)
  } catch (error) {
    if (
      error.message.includes('Unknown request') ||
      error.message.includes('invalid BytesLike value')
    ) {
      router.push({ path: '/404' })
    }
  }
}

// TODO: I don't understand why the request ref isn't reactive and/or v-model
// can't be set to requests.value[route.params.requestId] directly. So instead,
// we need this watch
watch(
  () => requests.value[route.params.requestId],
  (req) => {
    request.value = req
  }
)

const hasRequest = computed(() => {
  return request.value !== undefined
})

function watchRequestId() {
  watch(() => route.params.requestId, fetchRequestDetails, { immediate: true })
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
      v-else-if="hasRequest"
      :requestId="route.params.requestId"
      v-model="request"
      :enableModeration="route.query.enableModeration === 'true'"
    />
  </div>
</template>

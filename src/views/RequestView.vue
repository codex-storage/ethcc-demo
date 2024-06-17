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
const isLoading = computed(() => loading.value)
const requestId = ref(route.params.requestId)
const request = ref(requests?.value?.get(requestId.value))
const requestNotFound = computed(
  () =>
    !isLoading.value && requests.value !== undefined && !requests.value.get(route.params.requestId)
)
function getRequestFromStore(_) {
  let req = requests?.value?.get(route.params.requestId)
  if (requestNotFound.value) {
    router.push({ name: 'NotFound' })
  } else {
    request.value = req
  }
}
watch(() => route.params.requestId, getRequestFromStore)
watch(() => isLoading.value, getRequestFromStore)
</script>

<template>
  <div>
    <SkeletonLoading v-if="isLoading" type="image" />
    <StorageRequest
      v-else-if="!requestNotFound"
      :requestId="route.params.requestId"
      :request="request"
    />
  </div>
</template>

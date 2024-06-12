<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import { useRoute } from 'vue-router'
import StorageRequest from '@/components/StorageRequest.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'

const requestsStore = useRequestsStore()
const { requests, loading, fetched } = storeToRefs(requestsStore)
const route = useRoute()
const isLoading = computed(
  () =>
    !fetched.value ||
    loading.value ||
    !requests.value ||
    requests.value.size === 0 ||
    !requests.value.has(route.params.requestId)
)
const requestId = ref(route.params.requestId)
const request = ref(requests?.value?.get(requestId.value))
function getRequestFromStore(_) {
  request.value = requests?.value?.get(route.params.requestId)
}
watch(() => route.params.requestId, getRequestFromStore)
watch(() => isLoading.value, getRequestFromStore)
</script>

<template>
  <div>
    <SkeletonLoading v-if="isLoading" type="image" />
    <StorageRequest v-else :requestId="route.params.requestId" :request="request" />
  </div>
</template>

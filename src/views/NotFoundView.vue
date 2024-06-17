<script setup>
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/requests'
import NotFound from '@/components/NotFound.vue'
import SkeletonLoading from '@/components/SkeletonLoading.vue'
import { computed } from 'vue'

const requestsStore = useRequestsStore()
const { loading, requests } = storeToRefs(requestsStore)
const isLoading = computed(() => loading.value || !requests.value)
</script>

<template>
  <div>
    <SkeletonLoading v-if="isLoading" type="text" />
    <NotFound v-else></NotFound>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import AlertWithContent from '@/components/alerts/AlertWithContent.vue'

const router = useRouter()
const route = useRoute()
const alerts = defineModel()
</script>

<template>
  <div
    v-for="{ event, blockNumber, requestId, slotIdx, state, type } in alerts"
    :key="event + blockNumber + requestId"
  >
    <AlertWithContent
      :id="event + blockNumber + requestId + slotIdx"
      :title="event"
      :type="type"
      :btn-more-url="router.resolve({ path: `/request/${requestId}`, query: route.query }).href"
      ><p>request {{ requestId }} at block {{ blockNumber }}</p>
      <p v-if="slotIdx">Slot index: {{ slotIdx }}</p>
      <p>State: {{ state }}</p></AlertWithContent
    >
  </div>
</template>

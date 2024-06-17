<script setup>
import { onMounted } from 'vue'
import AlertWithContent from '@/components/alerts/AlertWithContent.vue'

const alerts = defineModel()
</script>

<template>
  <div
    v-for="{ event, blockNumber, requestId, slotIdx, state, type } in alerts"
    :key="event + blockNumber + requestId"
  >
    <AlertWithContent
      :id="event + blockNumber + requestId"
      :title="event"
      :type="type"
      :btn-more-url="`/request/${requestId}`"
      ><p>request {{ requestId }} at block {{ blockNumber }}</p>
      <p v-if="slotIdx">Slot index: {{ slotIdx }}</p>
      <p>State: {{ state }}</p></AlertWithContent
    >
  </div>
</template>

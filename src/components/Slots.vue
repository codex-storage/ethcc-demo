<script setup>
import { onMounted } from 'vue'
import { initModals } from 'flowbite'
import { useEventsStore } from '../stores/events'
import { storeToRefs } from 'pinia'

const eventsStore = useEventsStore()

// const ethProvider = inject('ethProvider')
// const marketplace = inject('marketplace')
// const codexApi = inject('codexApi')
// const token = inject('token')
// const blockNumber = ref(0)
// const requests = ref([])

// const onStorageRequested = async ({requestId, ask, expiry, blockNumber}) => {
//   let request = await marketplace.getRequest(requestId)
//   let stateIdx = await marketplace.requestState(requestId)
//   let cid = request[2][0]
//   let state = requestState[stateIdx]
//   var imgSrc = ""
//   var error = ""
//   if (state == "New" || state == "Started"){
//     try {
//       let res = await codexApi.download(cid)
//       try{
//         const blob = await res.blob()
//         imgSrc = URL.createObjectURL(blob)
//       } catch (e) {
//         error = `not an image (error: ${error.message})`
//       }
//     } catch(error) {
//       error = `failed to download cid data: ${error}`
//     }
//   }
//   requests.value.push({
//     blockNumber,
//     cid,
//     requestId,
//     ask,
//     expiry,
//     state,
//     imgSrc,
//     error
//   })
// }
// onMounted(async () => {
//   await eventsStore.fetchPastEvents()
//   await eventsStore.listenForNewEvents()
// })
//   let storageRequestedFilter = marketplace.filters.StorageRequested
//   marketplace.on(storageRequestedFilter, async (requestId, ask, expiry, event) => {
//     let {blockNumber} = event
//     // onStorageRequested({
//     //   blockNumber,
//     //   requestId,
//     //   ask,
//     //   expiry,
//     // })
//     let request = await marketplace.getRequest(requestId)
//     let state = await getRequestState(requestId)
//     onStorageRequested(blockNumber, request, state)
//   })

//   // query past events
//   let requests = (await marketplace.queryFilter(storageRequestedFilter))
//   requests.forEach(async (event) => {
//     let {requestId, ask, expiry} = event.args
//     let {blockNumber} = event
//     // onStorageRequested({
//       //   blockNumber,
//       //   requestId,
//       //   ask,
//       //   expiry
//       // })
//     let request = await marketplace.getRequest(requestId)
//     let state = await getRequestState(requestId)
//     onStorageRequested(blockNumber, request, state)
//   })

//   let slotFreedFilter = marketplace.filters.SlotFreed
//   marketplace.on(slotFreedFilter, (requestId, ask, expiry, event) => {
//     let {blockNumber} = event
//     onSlotFreed({
//       blockNumber,
//       requestId,
//       ask,
//       expiry,
//     })
//   })

//   let slotsFreed = (await marketplace.queryFilter(slotFreedFilter))
//   slotsFreed.forEach(event => {
//     let {requestId, ask, expiry} = event.args
//     let {blockNumber} = event
//     onSlotFreed({
//       blockNumber,
//       requestId,
//       ask,
//       expiry
//     })
//   })

// })
// console.log(await ethProvider.getBlockNumber())
const { requests } = storeToRefs(eventsStore)
</script>

<template>
  <!-- <span>asdf{{ blockNumber.value }}</span> -->
  <!-- <span>Yo yo yo yo yo {{ blockNumber }}</span> -->
  <ul class="requests">
    <!-- <li v-for="(request, idx) in eventsStore.requests" :key="{requestId}"> WORKS! -->
    <li v-for="([requestId, { request, state }], idx) in requests" :key="{ requestId }">
      {{ idx }}.
      <div>CID: {{ request[2][0] }}</div>
      <div>RequestID: {{ requestId }}</div>
      <div>State: {{ state }}</div>
      <CodexImage v-if="state == 'New' || state == 'Started'" cid="cid" />
      <!-- <div v-if="error">{{error}}</div>
      <img v-else-if="imgSrc" :src="imgSrc" width="100%"/> -->
    </li>
  </ul>
</template>

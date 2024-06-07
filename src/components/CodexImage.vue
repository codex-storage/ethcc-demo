<script setup>
import { inject, ref, onMounted, computed } from 'vue'
import SpinnerLoading from '@/components/SpinnerLoading.vue'

const codexApi = inject('codexApi')
const loading = ref(false)
const imgSrc = ref('')
const error = ref('')

const props = defineProps({
  cid: {
    type: [String, undefined]
  },
  localOnly: {
    // only try downloading from the local node
    type: Boolean,
    default: false
  },
  alt: String
})
const hidden = computed(() => props.cid === undefined)

onMounted(async () => {
  if (hidden.value) {
    return
  }
  loading.value = true

  try {
    let res = await codexApi.downloadLocal(props.cid)
    if (res.status === 404 && !props.localOnly) {
      res = await codexApi.download(props.cid)
    }
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    try {
      const blob = await res.blob()
      imgSrc.value = URL.createObjectURL(blob)
    } catch (e) {
      error.value = `not an image (error: ${e.message})`
    }
  } catch (e) {
    error.value = `failed to download cid data: ${e.message}`
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="!hidden" class="text-center">
    <SpinnerLoading v-if="loading" />
    <div v-else-if="error" v-bind="$attrs" class="dark:bg-orange-700 dark:text-orange-200">
      <svg
        class="text-red-500 fill-red-100 dark:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"
        />
      </svg>
      <span class="sr-only">{{ error }}</span>
    </div>

    <img v-else-if="imgSrc" :src="imgSrc" class="rounded-full" :alt="props.alt" />
  </div>
</template>

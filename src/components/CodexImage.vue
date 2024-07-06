<script setup>
import { inject, ref, onMounted, computed, watch, onUnmounted } from 'vue'
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
  alt: String,
  moderated: {
    type: [String],
    default() {
      return 'pending'
    },
    validator(value, props) {
      // The value must match one of these strings
      return ['pending', 'approved', 'banned'].includes(value)
    }
  },
  timeout: {
    type: Number,
    default() {
      return 120000
    }
  },
  blurClass: {
    type: String,
    default() {
      return 'blur-xxl'
    },
    validator(value, props) {
      return ['blur', 'blur-xxl'].includes(value)
    }
  }
})
const hidden = computed(() => props.cid === undefined)
const blurred = computed(() => ['pending', 'banned'].includes(props.moderated))
const imageClassObj = computed(() => {
  let obj = {}
  obj[props.blurClass] = blurred.value
  return obj
})

const controller = new AbortController()

async function fetchImage(cid) {
  if (hidden.value) {
    return
  }
  loading.value = true

  const timeoutSignal = AbortSignal.timeout(props.timeout)

  try {
    let response
    let options = {
      // This will abort the fetch when either signal is aborted
      signal: AbortSignal.any([controller.signal, timeoutSignal]),
      // The browser looks for a matching request in its HTTP cache.
      // If there is a match, fresh or stale, it will be returned from the cache.
      // If there is no match, the browser will make a normal request, and will update the cache with the downloaded resource.
      cache: 'force-cache'
    }
    if (props.localOnly) {
      response = await codexApi.downloadLocal(cid, options)
    } else {
      response = await codexApi.download(cid, options)
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    try {
      const blob = await response.blob()
      imgSrc.value = URL.createObjectURL(blob)
    } catch (e) {
      error.value = `not an image (error: ${e.message})`
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log(`image fetch aborted for cid ${props.cid}`)
    } else if (e.name === 'TimeoutError') {
      // Notify the user of timeout
      error.value = `image fetch for cid ${props.cid} timed out after ${props.timeout}ms`
    } else {
      error.value = `failed to download cid data: ${e.message}`
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.cid, fetchImage, { immediate: true })

onUnmounted(() => {
  controller.abort() // abort image fetch
})
</script>

<template>
  <div v-if="!hidden" class="text-center">
    <SpinnerLoading v-if="loading" />
    <div
      v-else-if="error"
      v-bind="$attrs"
      class="dark:bg-orange-700 dark:text-orange-200"
      :title="error"
    >
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

    <img
      v-else-if="imgSrc"
      :src="imgSrc"
      class="rounded-lg"
      :alt="props.alt"
      :class="imageClassObj"
    />
  </div>
</template>
<style scoped>
.blur-xxl {
  --tw-blur: blur(76px);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale)
    var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
</style>

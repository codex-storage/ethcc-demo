<script setup>
import { onMounted, computed } from 'vue'
import { initDismisses, Dismiss } from 'flowbite'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default() {
      return 'info'
    },
    validator(value, props) {
      // The value must match one of these strings
      return ['success', 'warning', 'danger', 'info'].includes(value)
    }
  },
  title: {
    type: String,
    required: true
  },
  btnMoreText: {
    type: String,
    default: 'View more'
  },
  btnMoreUrl: {
    type: String,
    required: true
  }
})

const router = useRouter()

const theme = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        bubble: [
          'text-green-800',
          'border-green-300',
          'bg-green-50',
          'dark:text-green-400',
          'dark:border-green-800',
          'dark:bg-gray-800'
        ],
        btnMore: [
          'bg-green-800',
          'hover:bg-green-900',
          'focus:ring-green-300',
          'dark:bg-green-600',
          'dark:hover:bg-green-700',
          'dark:focus:ring-green-800'
        ],
        btnDismiss: [
          'text-green-800',
          'border-green-800',
          'hover:bg-green-900',
          'focus:ring-green-300',
          'dark:text-green-400',
          'dark:border-green-600',
          'dark:hover:bg-green-700',
          'dark:focus:ring-green-800'
        ]
      }

    case 'danger':
      return {
        bubble: [
          'text-red-800',
          'border-red-300',
          'bg-red-50',
          'dark:text-red-400',
          'dark:border-red-800',
          'dark:bg-gray-800'
        ],
        btnMore: [
          'bg-red-800',
          'hover:bg-red-900',
          'focus:ring-red-300',
          'dark:bg-red-600',
          'dark:hover:bg-red-700',
          'dark:focus:ring-red-800'
        ],
        btnDismiss: [
          'text-red-800',
          'border-red-800',
          'hover:bg-red-900',
          'focus:ring-red-300',
          'dark:text-red-400',
          'dark:border-red-600',
          'dark:hover:bg-red-700',
          'dark:focus:ring-red-800'
        ]
      }

    case 'warning':
      return {
        bubble: [
          'text-yellow-800',
          'border-yellow-300',
          'bg-yellow-50',
          'dark:text-yellow-400',
          'dark:border-yellow-800',
          'dark:bg-gray-800'
        ],
        btnMore: [
          'bg-yellow-800',
          'hover:bg-yellow-900',
          'focus:ring-yellow-300',
          'dark:bg-yellow-600',
          'dark:hover:bg-yellow-700',
          'dark:focus:ring-yellow-800'
        ],
        btnDismiss: [
          'text-yellow-800',
          'border-yellow-800',
          'hover:bg-yellow-900',
          'focus:ring-yellow-300',
          'dark:text-yellow-400',
          'dark:border-yellow-600',
          'dark:hover:bg-yellow-700',
          'dark:focus:ring-yellow-800'
        ]
      }

    default:
      return {
        bubble: [
          'text-blue-800',
          'border-blue-300',
          'bg-blue-50',
          'dark:text-blue-400',
          'dark:border-blue-800',
          'dark:bg-gray-800'
        ],
        btnMore: [
          'bg-blue-800',
          'hover:bg-blue-900',
          'focus:ring-blue-300',
          'dark:bg-blue-600',
          'dark:hover:bg-blue-700',
          'dark:focus:ring-blue-800'
        ],
        btnDismiss: [
          'text-blue-800',
          'border-blue-800',
          'hover:bg-blue-900',
          'focus:ring-blue-300',
          'dark:text-blue-400',
          'dark:border-blue-600',
          'dark:hover:bg-blue-700',
          'dark:focus:ring-blue-800'
        ]
      }
  }
})

onMounted(() => {
  initDismisses()
})

function dismissAndRedirect(targetElId, url) {
  let targetEl = document.getElementById(targetElId)
  let dismiss = new Dismiss(targetEl)
  dismiss.hide()
  router.push({ path: url })
}
</script>
<template>
  <div :id="id" class="p-4 mt-4 mb-4 border rounded-lg" :class="theme.bubble" role="alert">
    <div class="flex items-center">
      <svg
        class="flex-shrink-0 w-4 h-4 me-2"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
        />
      </svg>
      <span class="sr-only">Info</span>
      <h3 class="text-lg font-medium">{{ title }}</h3>
    </div>
    <div class="mt-2 mb-4 text-sm">
      <slot></slot>
    </div>
    <div class="flex">
      <button
        class="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5 me-2 text-center inline-flex items-center"
        :class="theme.btnMore"
        @click="dismissAndRedirect(id, btnMoreUrl)"
      >
        <svg
          class="me-2 h-3 w-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 14"
        >
          <path
            d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
          />
        </svg>
        {{ btnMoreText }}
      </button>
      <button
        type="button"
        class="bg-transparent border hover:text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5 text-center dark:hover:text-white"
        :class="theme.btnDismiss"
        :data-dismiss-target="'#' + id"
        aria-label="Close"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>

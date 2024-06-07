<script setup>
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    required: true,
    validator(value, props) {
      // The value must match one of these strings
      return ['green', 'blue', 'gray', 'yellow', 'red'].includes(value)
    }
  },
  text: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default() {
      return 'sm'
    },
    validator(value, props) {
      return ['sm', 'lg'].includes(value)
    }
  }
})

const theme = computed(() => {
  if (props.color == 'blue') {
    return {
      bg: 'bg-blue-100',
      bgDark: 'dark:bg-blue-900',
      bgDot: 'bg-blue-500',
      text: 'text-blue-800',
      textDark: 'dark:text-blue-300'
    }
  } else if (props.color === 'gray') {
    return {
      bg: 'bg-gray-100',
      bgDark: 'dark:bg-gray-900',
      bgDot: 'bg-gray-500',
      text: 'text-gray-800',
      textDark: 'dark:text-gray-300'
    }
  } else if (props.color === 'yellow') {
    return {
      bg: 'bg-yellow-100',
      bgDark: 'dark:bg-yellow-900',
      bgDot: 'bg-yellow-500',
      text: 'text-yellow-800',
      textDark: 'dark:text-yellow-300'
    }
  } else if (props.color === 'red') {
    return {
      bg: 'bg-red-100',
      bgDark: 'dark:bg-red-900',
      bgDot: 'bg-red-500',
      text: 'text-red-800',
      textDark: 'dark:text-red-300'
    }
  } else {
    return {
      bg: 'bg-green-100',
      bgDark: 'dark:bg-green-900',
      bgDot: 'bg-green-500',
      text: 'text-green-800',
      textDark: 'dark:text-green-300'
    }
  }
})

const size = computed(() => {
  if (props.size === 'sm') {
    return {
      fontSize: 'text-xs',
      bubbleWidth: 'w-2',
      bubbleHeight: 'h-2',
      bubbleMargin: 'me-1'
    }
  } else {
    return {
      fontSize: 'text-md',
      bubbleWidth: 'w-3',
      bubbleHeight: 'h-3',
      bubbleMargin: 'me-2'
    }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center font-medium px-2.5 py-0.5 rounded-full"
    :class="[theme.bg, theme.text, theme.bgDark, theme.textDark, size.fontSize]"
  >
    <span
      class="w-2 h-2 me-1 rounded-full"
      :class="[theme.bgDot, size.bubbleWidth, size.bubbleHeight, size.bubbleMargin]"
    ></span>
    {{ text }}
  </span>
</template>

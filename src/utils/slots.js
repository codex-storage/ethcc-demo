export const slotState = [
  'Free', // [default] not filled yet, or host has vacated the slot
  'Filled', // host has filled slot
  'Finished', // successfully completed
  'Failed', // the request has failed
  'Paid', // host has been paid
  'Cancelled' // when request was cancelled then slot is cancelled as well
]

export function getStateColour(state) {
  if (state === 'Free') {
    return 'yellow'
  } else if (state === 'Filled') {
    return 'green'
  } else if (state === 'Finished') {
    return 'blue'
  } else if (state === 'Paid') {
    return 'gray'
  } else {
    return 'red'
  }
}

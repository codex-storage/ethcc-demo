export const SlotState = {
  Free: 'Free', // [default] not filled yet, or host has vacated the slot
  Filled: 'Filled', // host has filled slot
  Finished: 'Finished', // successfully completed
  Failed: 'Failed', // the request has failed
  Paid: 'Paid', // host has been paid
  Cancelled: 'Cancelled' // when request was cancelled then slot is cancelled as well
}

export function toSlotState(idx) {
  return Object.values(SlotState).at(idx)
}

export function getStateColour(state) {
  if (state === SlotState.Free) {
    return 'yellow'
  } else if (state === SlotState.Filled) {
    return 'green'
  } else if (state === SlotState.Finished) {
    return 'blue'
  } else if (state === SlotState.Paid) {
    return 'gray'
  } else {
    return 'red'
  }
}

export const StorageEvent = {
  StorageRequested: 'Storage requested', // storage was requested
  RequestFulfilled: 'Request fulfilled (started)', // request has started (all slots filled)
  RequestCancelled: 'Request cancelled', // request was cancelled when not all slots were filled by the expiry
  RequestFailed: 'Request failed', // the request has failed (too many slots freed)
  SlotFilled: 'Slot filled', // slot was filled by provider (providing proof and collateral)
  SlotFreed: 'Slot freed', // slot freed after provider missed too many proofs
  RequestFinished: 'Request finished'
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

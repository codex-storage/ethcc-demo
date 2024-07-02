export const StorageEvent = {
  StorageRequested: 'StorageRequested', // storage was requested
  RequestFulfilled: 'RequestFulfilled', // request has started (all slots filled)
  RequestCancelled: 'RequestCancelled', // request was cancelled when not all slots were filled by the expiry
  RequestFailed: 'RequestFailed', // the request has failed (too many slots freed)
  SlotFilled: 'SlotFilled', // slot was filled by provider (providing proof and collateral)
  SlotFreed: 'SlotFreed' // slot freed after provider missed too many proofs
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

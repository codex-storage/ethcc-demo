export function arrayToObject(arrRequest) {
  let { client, ask, content, expiry, nonce } = arrRequest
  let { slots, slotSize, duration, proofProbability, reward, collateral, maxSlotLoss } = ask
  let { cid, merkleRoot } = content
  return {
    client,
    ask: {
      slots,
      slotSize,
      duration,
      proofProbability,
      reward,
      collateral,
      maxSlotLoss
    },
    content: {
      cid,
      merkleRoot
    },
    expiry,
    nonce
  }
}

export function price(request) {
  if (!request) {
    return 0
  }
  return request.ask.reward * request.ask.duration * request.ask.slots
}

export function getStateColour(state) {
  if (state === RequestState.New) {
    return 'yellow'
  } else if (state === RequestState.Fulfilled) {
    return 'green'
  } else if (state === RequestState.Finished) {
    return 'blue'
  } else {
    return 'red'
  }
}

export const moderatedState = {
  pending: { text: 'Pending 🤷‍♂️', color: 'gray' },
  approved: { text: 'Approved ✅', color: 'green' },
  banned: { text: 'NSFW! 🫣', color: 'red' }
}

export const RequestState = {
  New: 'New', // [default] waiting to fill slots
  Fulfilled: 'Fulfilled', // all slots filled, accepting regular proofs
  Cancelled: 'Cancelled', // not enough slots filled before expiry
  Finished: 'Finished', // successfully completed
  Failed: 'Failed' // too many nodes have failed to provide proofs, data lost
}

export function toRequestState(idx) {
  return Object.values(RequestState).at(idx)
}

// all parameters in seconds, return values also in seconds
export function timestampsFor(ask, expiryBigInt, requestedAt) {
  let durationBigInt = ask.duration || ask[2]
  let duration = Number(durationBigInt)
  let expiry = Number(expiryBigInt)
  let endsAt = requestedAt + duration // time storage was requested plus total duration, in ms
  let expiresAt = requestedAt + expiry // expiry plus total duration, in ms
  return { requestedAt, endsAt, expiresAt }
}

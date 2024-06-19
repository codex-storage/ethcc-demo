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
  if (state === 'New') {
    return 'yellow'
  } else if (state === 'Fulfilled') {
    return 'green'
  } else if (state === 'Finished') {
    return 'gray'
  } else {
    return 'red'
  }
}

export const moderatedState = {
  pending: { text: 'Pending 🤷‍♂️', color: 'gray' },
  approved: { text: 'Approved ✅', color: 'green' },
  banned: { text: 'NSFW! 🫣', color: 'red' }
}

export const requestState = [
  'New', // [default] waiting to fill slots
  'Fulfilled', // all slots filled, accepting regular proofs
  'Cancelled', // not enough slots filled before expiry
  'Finished', // successfully completed
  'Failed' // too many nodes have failed to provide proofs, data lost
]

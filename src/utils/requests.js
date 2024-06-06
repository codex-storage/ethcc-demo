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

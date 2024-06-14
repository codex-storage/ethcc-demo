import { keccak256 } from 'ethers/crypto'
import { AbiCoder } from 'ethers/abi'

function short(long, ellipses = '*', start = 3, stop = 6) {
  var short = long
  const minLen = start + ellipses.length + stop
  if (short.length > minLen) {
    let prefix = short.substring(0, start)
    let suffix = short.substring(long.length - stop)
    short = `${prefix}${ellipses}${suffix}`
  }
  return short
}

export function shorten(long, ellipses = '..', chars = 4) {
  let shortened = ''
  let rest = long
  if (long.substring(0, 2) === '0x') {
    shortened = '0x'
    rest = long.substring(2)
  }
  shortened += short(rest, ellipses, chars, chars)
  return shortened
}

export function slotId(requestId, slotIdx) {
  const types = 'tuple(bytes32, uint256)'
  const values = [requestId, slotIdx]
  const coder = AbiCoder.defaultAbiCoder()
  const encoding = coder.encode([types], [values])
  return keccak256(encoding)
}

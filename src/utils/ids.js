import { keccak256 } from 'ethers/crypto'
import { AbiCoder } from 'ethers/abi'

// func shortLog*(long: string, ellipses = "*", start = 3, stop = 6): string =
//   ## Returns compact string representation of ``long``.
//   var short = long
//   let minLen = start + ellipses.len + stop
//   if len(short) > minLen:
//     short.insert(ellipses, start)

//     when (NimMajor, NimMinor) > (1, 4):
//       short.delete(start + ellipses.len .. short.high - stop)
//     else:
//       short.delete(start + ellipses.len, short.high - stop)

//   short

// func shortHexLog*(long: string): string =
//   if long[0..1] == "0x": result &= "0x"
//   result &= long[2..long.high].shortLog("..", 4, 4)

// func short0xHexLog*[N: static[int], T: array[N, byte]](v: T): string =
//   v.to0xHex.shortHexLog

export function short(long, ellipses = '*', start = 3, stop = 6) {
  var short = long
  const minLen = start + ellipses.length + stop
  if (short.length > minLen) {
    let prefix = short.substring(0, start)
    let suffix = short.substring(long.length - stop)
    short = `${prefix}${ellipses}${suffix}`
  }
  return short
}

export function shortHex(long, chars = 4) {
  let shortened = ''
  let rest = long
  if (long.substring(0, 2) === '0x') {
    shortened = '0x'
    rest = long.substring(2)
  }
  shortened += short(rest, '..', chars, chars)
  return shortened
}

export function slotId(requestId, slotIdx) {
  const types = 'tuple(bytes32, uint256)'
  const values = [requestId, slotIdx]
  const coder = AbiCoder.defaultAbiCoder()
  const encoding = coder.encode([types], [values])
  return keccak256(encoding)
}

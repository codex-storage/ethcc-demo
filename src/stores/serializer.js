export default {
  serialize: (state) => {
    try {
      return JSON.stringify(state, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
    } catch (e) {
      console.error(`failure serializing state`, e)
    }
  },
  deserialize: (serialized) => {
    // TODO: deserialize bigints properly
    return JSON.parse(serialized)
  }
}
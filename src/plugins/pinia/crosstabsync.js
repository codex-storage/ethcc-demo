// MIT License

// Copyright (c) 2022 Sacha 'PraZ' Bouillez <https://github.com/prazdevs>

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// modified to include crosstab state sync

// src/normalize.ts
function isObject(v) {
  return typeof v === 'object' && v !== null
}
function normalizeOptions(options, factoryOptions) {
  options = isObject(options) ? options : /* @__PURE__ */ Object.create(null)
  return new Proxy(options, {
    get(target, key, receiver) {
      if (key === 'key') return Reflect.get(target, key, receiver)
      return Reflect.get(target, key, receiver) || Reflect.get(factoryOptions, key, receiver)
    }
  })
}

// src/pick.ts
function get(state, path) {
  return path.reduce((obj, p) => {
    return obj == null ? void 0 : obj[p]
  }, state)
}
function set(state, path, val) {
  return (
    (path.slice(0, -1).reduce((obj, p) => {
      if (/^(__proto__)$/.test(p)) return {}
      else return (obj[p] = obj[p] || {})
    }, state)[path[path.length - 1]] = val),
    state
  )
}
function pick(baseState, paths) {
  return paths.reduce((substate, path) => {
    const pathArray = path.split('.')
    return set(substate, pathArray, get(baseState, pathArray))
  }, {})
}

// src/plugin.ts
function parsePersistence(factoryOptions, store) {
  return (o) => {
    var _a
    try {
      const {
        storage = localStorage,
        beforeRestore = void 0,
        afterRestore = void 0,
        serializer = {
          serialize: JSON.stringify,
          deserialize: JSON.parse
        },
        key = store.$id,
        paths = null,
        debug = false,
        crossTabSync = false
      } = o
      return {
        storage,
        beforeRestore,
        afterRestore,
        serializer,
        key: ((_a = factoryOptions.key) != null ? _a : (k) => k)(
          typeof key == 'string' ? key : key(store.$id)
        ),
        paths,
        debug,
        crossTabSync
      }
    } catch (e) {
      if (o.debug) console.error('[pinia-plugin-persistedstate]', e)
      return null
    }
  }
}
function hydrateStore(store, { storage, serializer, key, debug }) {
  try {
    const fromStorage = storage == null ? void 0 : storage.getItem(key)
    if (fromStorage) store.$patch(serializer == null ? void 0 : serializer.deserialize(fromStorage))
  } catch (e) {
    if (debug) console.error('[pinia-plugin-persistedstate]', e)
  }
}
const localStorageMetaKey = (key) => `${key}_storeEventMeta`
let lastStoreTimestamp = 0
function persistState(state, { storage, serializer, key, paths, debug }) {
  try {
    // const localStorageMetaKey = `${key}_storeEventMeta`
    lastStoreTimestamp = Date.now()
    const storeEventMeta = {
      source: window.name,
      timestamp: lastStoreTimestamp
    }
    storage.setItem(localStorageMetaKey(key), serializer.serialize(storeEventMeta))
    const toStore = Array.isArray(paths) ? pick(state, paths) : state
    storage.setItem(key, serializer.serialize(toStore))
  } catch (e) {
    if (debug) console.error('[pinia-plugin-persistedstate]', e)
  }
}
function handleStorageEvent(event, store, key, serializer) {
  if (event.key === key) {
    let serialized = window.localStorage.getItem(localStorageMetaKey(key))
    if (serialized) {
      let { source, timestamp } = serializer.deserialize(serialized)
      // prevent our own window local storage updates from hydrating (infinite
      // loop) and prevent stale updates from hydrating
      if (source !== window.name && timestamp > lastStoreTimestamp) {
        store.$hydrate()
      }
    }
  }
}
function crossTabSync(factoryOptions = {}) {
  return (context) => {
    const { auto = false } = factoryOptions
    const {
      options: { persist = auto },
      store,
      pinia
    } = context
    if (!persist) return
    if (!(store.$id in pinia.state.value)) {
      const original_store = pinia._s.get(store.$id.replace('__hot:', ''))
      if (original_store) Promise.resolve().then(() => original_store.$persist())
      return
    }
    const persistences = (
      Array.isArray(persist)
        ? persist.map((p) => normalizeOptions(p, factoryOptions))
        : [normalizeOptions(persist, factoryOptions)]
    )
      .map(parsePersistence(factoryOptions, store))
      .filter(Boolean)
    store.$persist = () => {
      persistences.forEach((persistence) => {
        persistState(store.$state, persistence)
      })
    }
    store.$hydrate = ({ runHooks = true } = {}) => {
      persistences.forEach((persistence) => {
        const { beforeRestore, afterRestore } = persistence
        if (runHooks) beforeRestore == null ? void 0 : beforeRestore(context)
        hydrateStore(store, persistence)
        if (runHooks) afterRestore == null ? void 0 : afterRestore(context)
      })
    }
    persistences.forEach((persistence) => {
      const { beforeRestore, afterRestore } = persistence
      beforeRestore == null ? void 0 : beforeRestore(context)
      hydrateStore(store, persistence)
      afterRestore == null ? void 0 : afterRestore(context)
      store.$subscribe(
        (_mutation, state) => {
          persistState(state, persistence)
        },
        {
          detached: true
        }
      )
      let { crossTabSync, key, serializer } = persistence
      if (crossTabSync) {
        window.addEventListener('storage', (event) =>
          handleStorageEvent(event, store, key, serializer)
        )
        store.$dispose
      }
    })
  }
}

// src/index.ts
var src_default = crossTabSync()
export { crossTabSync, src_default as default }

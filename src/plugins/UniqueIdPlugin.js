// Copyright (c) 2019, Bertrand Guay-Paquet <bernie@step.polymtl.ca>
//
// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

const methods = {
  /**
   * Generate a component-scoped unique HTML identifier.
   *
   * Example: $id('my-id') => 'uid-42-my-id'
   *
   * @param {string} id id to scope
   */
  $idFactory(uidProperty) {
    return function $id(id = '') {
      return `${this[uidProperty]}-${id}`;
    };
  },

  /**
   * Generate a component-scoped unique HTML identifier reference. Prepends '#' to the id generated
   * by the call $id(id).
   *
   * Example: $idRef('my-id') => '#uid-42-my-id'
   *
   * @param {string} id id to scope
   */
  $idRef(id) {
    return `#${this.$id(id)}`;
  },
};

const DEFAULTS = {
  // {string} Property name of the component's unique identifier. Change this if 'vm.uid' conflicts
  // with another plugin or your own props.
  uidProperty: 'uid',

  // {string} Prefix to use when generating HTML ids. Change this to make your ids more unique on a
  // page that already uses or could use a similar naming scheme.
  uidPrefix: 'uid-',
};

function installVueGlobal(Vue, globalName, globalValue) {
  const globalPrototype = Vue.version.slice(0, 2) === '3.' ? Vue.config.globalProperties : Vue.prototype;

  // Don't use Object.assign() to match the Vue.js supported browsers (ECMAScript 5)
  globalPrototype[globalName] = globalValue;
}

export default function install(Vue, options = {}) {
  // Don't use object spread to merge the defaults because bublé transforms that to Object.assign
  const uidProperty = options.uidProperty || DEFAULTS.uidProperty;
  const uidPrefix = options.uidPrefix || DEFAULTS.uidPrefix;

  // Assign a unique id to each component
  let uidCounter = 0;
  Vue.mixin({
    beforeCreate() {
      uidCounter += 1;
      const uid = uidPrefix + uidCounter;
      Object.defineProperties(this, {
        [uidProperty]: { get() { return uid; } },
      });
    },
  });

  installVueGlobal(Vue, '$id', methods.$idFactory(uidProperty));
  installVueGlobal(Vue, '$idRef', methods.$idRef);
}
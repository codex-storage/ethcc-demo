export default {
  install: (app, { codexRestUrl, myAddress }) => {
    const codexApi = {
      info: () => fetch(`${codexRestUrl}/debug/info`),
      download: (cid, options) => fetch(`${codexRestUrl}/data/${cid}/network`, options),
      downloadLocal: (cid, options) => fetch(`${codexRestUrl}/data/${cid}`, options),
      spr: () => fetch(`${codexRestUrl}/spr`)
    }

    app.provide('myAddress', myAddress)
    app.provide('codexApi', codexApi)
  }
}

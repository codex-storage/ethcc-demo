export default {
  install: (app, { codexRestUrl, myAddress }) => {
    const codexApi = {
      info: () => fetch(`${codexRestUrl}/debug/info`),
      download: (cid) => fetch(`${codexRestUrl}/data/${cid}/network`),
      downloadLocal: (cid) => fetch(`${codexRestUrl}/data/${cid}`),
      spr: () => fetch(`${codexRestUrl}/spr`)
    }

    app.provide('myAddress', myAddress)
    app.provide('codexApi', codexApi)
  }
}

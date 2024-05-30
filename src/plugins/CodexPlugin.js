export default {
  install: (app, { codexRestUrl, myAddress }) => {
    // const baseUrl = new URL(codexRestUrl)
    const options = {
      mode: 'cors'
    }
    const codexApi = {
      info: () => {
        return fetch(`${codexRestUrl}/debug/info`, options)
      },
      download: (cid) => {
        return fetch(`${codexRestUrl}/data/${cid}/network`, options)
      },
      downloadLocal: (cid) => {
        return fetch(`${codexRestUrl}/data/${cid}`, options)
      }
    }

    app.provide('myAddress', myAddress)
    app.provide('codexApi', codexApi)
  }
}

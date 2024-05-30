import {ethers} from 'ethers'

export default {
  install: (app, options) => {
    let { rpcUrl } = app.config.globalProperties
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    app.provide('ethProvider', provider)
  }
}
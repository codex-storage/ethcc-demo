import {ethers} from 'ethers'

export default {
  install: (app, {address, abi}) => {
    let { rpcUrl } = app.config.globalProperties
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const marketplace = new ethers.Contract(address, abi, provider)

    app.provide('marketplace', marketplace)
  }
}
import {ethers} from 'ethers'

export default {
  install: (app, {abi, address}) => {
    let { rpcUrl } = app.config.globalProperties
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const token = new ethers.Contract(address, abi, provider)

    app.provide('token', token)
  }
}
const Web3 = require('web3')
const conf = require('../../conf')

const { BN, toBN } = Web3.utils

let web3Instance

async function getWeb3 (options) {
  if (!web3Instance) {
    const provider = conf.ETHEREUM_NODE
    web3Instance = new Web3(provider)
  }

  return web3Instance
}

module.exports = {
  getWeb3,
  toBN
}

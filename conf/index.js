require('dotenv').config()

// Load network conf
const network = process.env.NETWORK
  ? process.env.NETWORK.toLowerCase()
  : 'local'
const ethereumNode = process.env.ETHEREUM_NODE
  ? process.env.ETHEREUM_NODE
  : null

const networkConfig = {
  NETWORK: network,
  ETHEREUM_NODE: ethereumNode
}

const customConfig = {}

let config = {
  ...networkConfig,
  ...customConfig
}

module.exports = config

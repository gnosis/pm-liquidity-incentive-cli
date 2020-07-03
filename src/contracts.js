const truffle_contract = require('@truffle/contract')
const { getWeb3 } = require('./utils/web3')

let contracts

async function loadContracts (conf) {
  const web3 = await getWeb3(conf)

  const marketMakersArtifacts = [
    'FixedProductMarketMaker'
  ].map(name => require(`@gnosis.pm/conditional-tokens-market-makers/build/contracts/${name}.json`))

  const artifacts = marketMakersArtifacts

  contracts = {}

  for (artifact of artifacts) {
    contracts[artifact.contractName] = truffle_contract(artifact)
    // initialize provider
    contracts[artifact.contractName].setProvider(web3.currentProvider)
  }
}

async function getContracts (conf) {
  if (!contracts) {
    await loadContracts(conf)
  }
  return contracts
}

module.exports = { getContracts }

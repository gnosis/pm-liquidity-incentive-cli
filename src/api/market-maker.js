const { getWeb3 } = require('../utils/web3')
const { getContracts } = require('../contracts')

let web3
let contracts

const init = async () => {
  const [contractsResolved, web3Resolved] = await Promise.all([
    // Load truffle contract
    getContracts(),
    // Load web3 connection
    getWeb3()
  ])

  web3 = web3Resolved
  contracts = contractsResolved
}

const getAllFundingEvents = async ({ market, fromBlockNumber, toBlockNumber }) => {
  await init()

  // Get market contract
  const marketMakerInstance = await contracts.FixedProductMarketMaker.at(market)

  const eventNames = ['FPMMFundingAdded', 'FPMMFundingRemoved']
  // Get all funding events
  const [fundingEvents, fundingRemovedEvents] = await Promise.all(
    eventNames.map(eventName => {
      return marketMakerInstance.getPastEvents(eventName, {
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber
      })
    })
  )

  // Group add and remove funding events
  let pastEvents = fundingEvents.concat(fundingRemovedEvents)
  pastEvents = await Promise.all(pastEvents.map(async event => {
    event.timestamp = await web3.eth.getBlock(event.blockHash).then(block => block.timestamp)
    return event
  }))

  // Order events by timestamp
  const pastEventsOrderedByTimestamp = pastEvents.sort((a, b) => {
    return a.timestamp - b.timestamp
  })

  return pastEventsOrderedByTimestamp
}

module.exports = {
  getAllFundingEvents
}

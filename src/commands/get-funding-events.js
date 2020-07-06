const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const { getWeb3, toBN } = require('../utils/web3')
const { parseDateIso } = require('../utils/date')
const { getLastBlockBeforeDate } = require('../utils/block')
const { getContracts } = require('../contracts')

// Aproximately calculate first block to be 1 month ago
const DEFAULT_DAILY_BLOCK_AMOUNT = 6500
const DEFAULT_DAYS_FROM_NOW = 30

class GetFundingEventsCommand extends Command {
  static flags = {
    ...cli.table.flags()
  }

  async run () {
    const { flags } = this.parse(GetFundingEventsCommand)
    const market = flags.market
    const fromDateStr = flags.fromDate
    const toDateStr = flags.toDate
    this.log(`Get funding events for ${market}`)

    const [contracts, web3] = await Promise.all([
      // Load truffle contract
      getContracts(),
      // Load web3 connection
      getWeb3()
    ])
    
    // Get market contract
    const marketMakerInstance = await contracts.FixedProductMarketMaker.at(market)
   
    // Get last block number
    const lastBlockNumber = await web3.eth.getBlock('latest').then(block => {
      return block.number
    })
    let lastBlockBeforeDate = null
    if (fromDateStr) {
      // If a from date was specified
      const fromDate = parseDateIso(fromDateStr)
      lastBlockBeforeDate = await getLastBlockBeforeDate(fromDate)
    }
    const fromBlockNumber = lastBlockBeforeDate || lastBlockNumber - (DEFAULT_DAILY_BLOCK_AMOUNT * DEFAULT_DAYS_FROM_NOW)

    let toBlockAfterDate = null
    if (toDateStr) {
      // If a to date was specified
      const toDate = parseDateIso(toDateStr)
      toBlockAfterDate = await getLastBlockBeforeDate(toDate)
    }
    const toBlockNumber = toBlockAfterDate || 'latest'

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

    let pastEvents = fundingEvents.concat(fundingRemovedEvents)
    pastEvents = await Promise.all(pastEvents.map(async event => {
      event.timestamp = await web3.eth.getBlock(event.blockHash).then(block => block.timestamp)
      return event
    }))

    // Order events by timestamp
    const pastEventsOrderedByTimestamp = pastEvents.sort((a, b) => {
      return a.timestamp - b.timestamp
    })

    // Print all funding events on a table
    cli.table(pastEventsOrderedByTimestamp, {
      address: {
        get: row => row.returnValues && row.returnValues.funder
      },
      date: {
        get: row => row.timestamp && new Date(row.timestamp * 1000).toISOString()
      },
      event: {},
      operationShares: {
        header: 'Operation Shares',
        get: row => row.returnValues && (row.returnValues.sharesMinted || row.returnValues.sharesBurnt)
      }
    }, {
      printLine: this.log,
      ...flags, // parsed flags
    })

    // Group events by address
    const eventsByAddress = pastEvents.reduce((acc, event) => {
      if (!acc[event.returnValues.funder]) {
        acc[event.returnValues.funder] = []
      }

      acc[event.returnValues.funder].push(event)

      return acc
    }, {})

    const lastDate = new Date()
    // Funtion to calc funding over time
    /********************* TODO extract getFundingOverTime to an util  **********************/
    const getFundingOverTime = events => {
      const fundingData = events.reduce((acc, { event, timestamp, returnValues }, index) => {
        let liquidityPeriodInDays
        if (event === 'FPMMFundingAdded') {
          acc.ownedShares = acc.ownedShares.add(toBN(returnValues.sharesMinted))
        } else {
          acc.ownedShares = acc.ownedShares.sub(toBN(returnValues.sharesBurnt))
        }

        if (events[index + 1]) {
          liquidityPeriodInDays = (events[index + 1].timestamp - timestamp) / 86400
          acc.shareProportion = acc.ownedShares * liquidityPeriodInDays
        } else {
          liquidityPeriodInDays = ((lastDate.valueOf() / 1000) - timestamp) / 86400
          acc.shareProportion = acc.ownedShares * liquidityPeriodInDays
        }

        return acc
      }, {
        ownedShares: toBN(0),
        shareProportion: toBN(0)
      })

      return fundingData
    }

    // Total funding over time
    // TODO this should be reviewed again
    const totalFunding = getFundingOverTime(pastEvents)
    this.log('Total shares', totalFunding.ownedShares.toString())
    this.log('Total proportion', totalFunding.shareProportion)
    
    // Get mean funding over time by address
    // TODO this should be reviewed again
    const addressList = Object.keys(eventsByAddress)
    const fundingOverTimeByAddress = addressList.reduce((acc, address) => {
      const userFundingStats = getFundingOverTime(eventsByAddress[address])
      acc[address] = {
        ownedShares: userFundingStats.ownedShares,
        shareProportion: userFundingStats.shareProportion,
        // fundingPercentage: userFundingStats.shareProportion / totalFunding.shareProportion * 100
      }

      return acc
    }, {})

    // TODO this is not relly clear yet. Do all necessary checks
    const totalFundingProportion = addressList.reduce((acc, address) => {
      acc = acc + fundingOverTimeByAddress[address].shareProportion

      return acc
    }, 0)

    // Print table showing current shares and provision percentage by address
    cli.table(addressList, {
      address: {
        get: address => address
      },
      ownedShares: {
        header: 'Owned Shares',
        get: address => fundingOverTimeByAddress[address].ownedShares.toString()
      },
      fundingPercentage: {
        header: 'Funding Percentage (%)',
        get: address => (fundingOverTimeByAddress[address].shareProportion / totalFundingProportion * 100)
      }
    }, {
      printLine: this.log,
      ...flags, // parsed flags
    })

  }
}

GetFundingEventsCommand.description = `Get all funding events for a given market
...
Extra documentation goes here
`

GetFundingEventsCommand.flags = {
  fromDate: flags.string({ char: '', description: 'date to start searching for events' }),
  toDate: flags.string({ char: '', description: 'date to stop searching for events' }),
  market: flags.string({ char: 'm', description: 'market address to query for funding' })
}

module.exports = GetFundingEventsCommand

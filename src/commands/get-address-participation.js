const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const { getWeb3, toBN } = require('../utils/web3')
const { parseDateIso, substractPeriod, formatDateTime } = require('../utils/date')
const { getLastBlockBeforeDate } = require('../utils/block')
const { getAllFundingEvents } = require('../api/market-maker')

// If fromDate is not defined, aproximately calculate first block to be 1 month ago
const DEFAULT_DAILY_BLOCK_AMOUNT = 6500
const DEFAULT_DAYS_FROM_NOW = 30

class GetAddressParticipationCommand extends Command {
  static flags = {
    ...cli.table.flags()
  }

  async run () {
    const { flags } = this.parse(GetAddressParticipationCommand)
    const market = flags.market
    const fromDateStr = flags.fromDate
    const toDateStr = flags.toDate
    const reward = flags.reward || 0
    
    const fromDate = fromDateStr
    ? parseDateIso(fromDateStr)
    : substractPeriod(new Date(), DEFAULT_DAYS_FROM_NOW, 'days')

    const toDate = toDateStr
    ? parseDateIso(toDateStr)
    : new Date()
    
    this.log(`Get address participation for ${market} from ${formatDateTime(fromDate)} until ${formatDateTime(toDate)}`)
    
    const web3 = await getWeb3()
   
    // Get last block number
    const lastBlockNumber = await web3.eth.getBlock('latest').then(block => {
      return block.number
    })
    let lastBlockBeforeDate = null
    if (fromDateStr) {
      // If a from date was specified
      lastBlockBeforeDate = await getLastBlockBeforeDate(fromDate)
    }
    const fromBlockNumber = lastBlockBeforeDate || lastBlockNumber - (DEFAULT_DAILY_BLOCK_AMOUNT * DEFAULT_DAYS_FROM_NOW)

    let toBlockAfterDate = null
    if (toDateStr) {
      // If a to date was specified
      toBlockAfterDate = await getLastBlockBeforeDate(toDate)
    }
    const toBlockNumber = toBlockAfterDate || 'latest'

    const pastEventsOrderedByTimestamp = await getAllFundingEvents({ market, fromBlockNumber, toBlockNumber })

    // Group events by address
    const eventsByAddress = pastEventsOrderedByTimestamp.reduce((acc, event) => {
      if (!acc[event.returnValues.funder]) {
        acc[event.returnValues.funder] = []
      }

      acc[event.returnValues.funder].push(event)

      return acc
    }, {})

    // Funtion to calc funding over time
    /********************* TODO extract getFundingOverTime to an util  **********************/
    const getFundingOverTime = events => {
      const fundingData = events.reduce((acc, { event, timestamp, returnValues }, index) => {
        // Add or remove current user shares
        event === 'FPMMFundingAdded'
          ? acc.ownedShares = acc.ownedShares.add(toBN(returnValues.sharesMinted))
          : acc.ownedShares = acc.ownedShares.sub(toBN(returnValues.sharesBurnt))

        let liquidityPeriodInDays
        if (events[index + 1]) {
          // There are more funding events, we will consider this period until next event
          liquidityPeriodInDays = (events[index + 1].timestamp - timestamp) / 86400
        } else {
          // Last funding event, we will consider this period of liquidity until last day
          liquidityPeriodInDays = ((toDate.valueOf() / 1000) - timestamp) / 86400
        }
        // We multiply shares for the time period to get a participation proportion
        acc.shareProportion = acc.shareProportion + (acc.ownedShares * liquidityPeriodInDays)
        
        return acc
      }, {
        ownedShares: toBN(0),
        shareProportion: 0
      })

      return fundingData
    }

    // Total funding over time
    // TODO this should be reviewed again
    const totalFunding = getFundingOverTime(pastEventsOrderedByTimestamp)
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
      }

      return acc
    }, {})

    // TODO this is not relly clear yet. Do all necessary checks
    const totalFundingProportion = addressList.reduce((acc, address) => {
      acc = acc + fundingOverTimeByAddress[address].shareProportion

      return acc
    }, 0)

    // Print table showing current shares and provision percentage by address
    // Show token reward
    cli.table(addressList, {
      address: {
        get: address => address
      },
      ownedShares: {
        header: 'Current Owned Shares',
        get: address => fundingOverTimeByAddress[address].ownedShares.toString()
      },
      fundingPercentage: {
        header: 'Funding Percentage (%)',
        get: address => (fundingOverTimeByAddress[address].shareProportion / totalFundingProportion * 100)
      },
      reward: {
        header: 'Reward',
        get: address => (fundingOverTimeByAddress[address].shareProportion / totalFundingProportion * reward)
      }
    }, {
      printLine: this.log,
      ...flags, // parsed flags
    })

  }
}

GetAddressParticipationCommand.description = `Get address participation in market funding
...
Extra documentation goes here
`

GetAddressParticipationCommand.flags = {
  fromDate: flags.string({ char: '', description: 'date to start searching for events' }),
  toDate: flags.string({ char: '', description: 'date to stop searching for events' }),
  market: flags.string({ char: 'm', description: 'market address to query for funding' }),
  reward: flags.string({ char: 'r', description: 'Reward to split between participants providing liquidity to the market' })
}

module.exports = GetAddressParticipationCommand

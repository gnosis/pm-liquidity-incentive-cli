const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const { getWeb3, toBN } = require('../utils/web3')
const { parseDateIso } = require('../utils/date')
const { getLastBlockBeforeDate } = require('../utils/block')
const { getAllFundingEvents } = require('../api/market-maker')

// Aproximately calculate first block to be 1 month ago
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
    this.log(`Get address participation for ${market}`)

    const web3 = await getWeb3()
   
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

    const pastEventsOrderedByTimestamp = await getAllFundingEvents({ market, fromBlockNumber, toBlockNumber })

    // Group events by address
    const eventsByAddress = pastEventsOrderedByTimestamp.reduce((acc, event) => {
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

GetAddressParticipationCommand.description = `Get address participation in market funding
...
Extra documentation goes here
`

GetAddressParticipationCommand.flags = {
  fromDate: flags.string({ char: '', description: 'date to start searching for events' }),
  toDate: flags.string({ char: '', description: 'date to stop searching for events' }),
  market: flags.string({ char: 'm', description: 'market address to query for funding' })
}

module.exports = GetAddressParticipationCommand

const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const { getWeb3, toBN } = require('../utils/web3')
const { parseDateIso } = require('../utils/date')
const { getLastBlockBeforeDate } = require('../utils/block')
const { getAllFundingEvents } = require('../api/market-maker')

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
  }
}

GetFundingEventsCommand.description = `Get all funding events for a given market
Returns a list of all the events in the given time period. If no time period is selected it will assume fromDate
to be 1 month ago current date and toDate to be current date.
`

GetFundingEventsCommand.flags = {
  fromDate: flags.string({ char: '', description: 'date to start searching for events' }),
  toDate: flags.string({ char: '', description: 'date to stop searching for events' }),
  market: flags.string({ char: 'm', description: 'market address to query for funding' })
}

module.exports = GetFundingEventsCommand

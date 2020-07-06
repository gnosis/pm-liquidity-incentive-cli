const { getWeb3 } = require('./web3')
const { diff } = require('./date')

const SECONDS_PER_BLOCK = 15
const CLOSE_POINT_PERCENTAGE = 0.9
const FAR_POINT_PERCENTAGE = 1 - CLOSE_POINT_PERCENTAGE

async function getFirstBlockAfterDate (date) {
  // Find first block after selected date
  const web3 = await getWeb3()
  const latestBlock = await web3.eth.getBlock('latest')
  // We substract 5 blocks assuming 15secs by block that means 1 min and 15 secs delay
  // This way we try to avoid colliding with posible reorgs when checking data
  const latestBlockNumber = latestBlock.number - 5

  return this._getFirstBlockAfterDate({
    date,
    firstBlockRange: 0,
    referenceBlock: latestBlockNumber,
    lastBlockRange: latestBlockNumber,
    lookingForBlockAfterDate: true,
    bestGuess: null
  })
}

async function getLastBlockBeforeDate (date) {
  // Find last block before selected date
  const web3 = await getWeb3()
  const latestBlock = await web3.eth.getBlock('latest')
  // We substract 5 blocks assuming 15secs by block that means 1 min and 15 secs delay
  // This way we try to avoid colliding with posible reorgs when checking data
  const latestBlockNumber = latestBlock.number - 5

  return _getFirstBlockAfterDate({
    date,
    firstBlockRange: 0,
    referenceBlock: latestBlockNumber,
    lastBlockRange: latestBlockNumber,
    lookingForBlockAfterDate: false,
    bestGuess: null
  })
}

function toBlocksFromSecondsEst (seconds) {
  return seconds / SECONDS_PER_BLOCK
}

async function _getFirstBlockAfterDate ({
  date,
  firstBlockRange,
  referenceBlock,
  lastBlockRange,
  lookingForBlockAfterDate,
  bestGuess
}) {
  const web3 = await getWeb3()

  // Save current best guess and query for new block data
  let nextBestGuess = bestGuess
  const block = await web3.eth.getBlock(referenceBlock)

  // If block doesn't exist yet there was a possible reorg
  if (block === null) {
    throw new Error(`The reference block ${referenceBlock} was not found, posible reorg`)
  }

  // We check reference block date difference against our query date
  const blockDate = new Date(block.timestamp * 1000)
  const secondsDifference = diff(blockDate, date, 'seconds')
  const blocksDifference = toBlocksFromSecondsEst(secondsDifference)

  // We check if block is exact match, before date match or after date match
  let nextFirstBlockRange, nextReferenceBlock, nextLastBlockRange
  if (secondsDifference === 0) {
    // We found the block, the only one we've got
    return referenceBlock
  } else if (secondsDifference > 0) {
    // Between the reference and the last block

    // Improve best guess, if posible
    if (!lookingForBlockAfterDate) {
      // We look for a block before the date. Since the reference is before the date
      // It's our new best guess
      nextBestGuess = referenceBlock
    }

    // Calculate the new range
    nextFirstBlockRange = referenceBlock + (lookingForBlockAfterDate ? 1 : 0)
    nextReferenceBlock = Math.min(
      Math.ceil(referenceBlock + blocksDifference),
      lastBlockRange
    )
    nextLastBlockRange = lastBlockRange

    if (nextReferenceBlock >= lastBlockRange) {
      // Time estimation can be innacurate, especially when we are closing the range
      // In case we set as the new reference a block close to the last block
      nextReferenceBlock = Math.ceil(
        nextFirstBlockRange * FAR_POINT_PERCENTAGE +
        nextLastBlockRange * CLOSE_POINT_PERCENTAGE
      )
    }
  } else {
    // Between the first and the reference

    // Improve best guess, if posible
    if (lookingForBlockAfterDate) {
      // We look for a block after the date. Since the reference is after the date
      // It's our new best guess
      nextBestGuess = referenceBlock
    }

    // Calculate the new range
    nextFirstBlockRange = firstBlockRange
    nextReferenceBlock = Math.max(
      Math.floor(referenceBlock + blocksDifference),
      firstBlockRange
    )
    nextLastBlockRange = referenceBlock + (lookingForBlockAfterDate ? 0 : -1)

    if (nextReferenceBlock <= firstBlockRange) {
      // Time estimation can be innacurate, especially when we are closing the range
      // In case we set as the new reference a block close to the first block
      nextReferenceBlock = Math.floor(
        nextFirstBlockRange * CLOSE_POINT_PERCENTAGE +
        nextLastBlockRange * FAR_POINT_PERCENTAGE
      )
    }
  }

  const numRemainingBlocks = 1 + nextLastBlockRange - nextFirstBlockRange
  if (numRemainingBlocks < 1 || referenceBlock === nextReferenceBlock) {
    // There's no blocks left to check, so last guess is the more aproximated

    return nextBestGuess
  } else {
    // We must continue looking. Reference block was moved some positions and will check if next block fits better

    return _getFirstBlockAfterDate({
      date,
      firstBlockRange: nextFirstBlockRange,
      referenceBlock: nextReferenceBlock,
      lastBlockRange: nextLastBlockRange,
      lookingForBlockAfterDate,
      bestGuess: nextBestGuess
    })
  }
}

module.exports = {
  getFirstBlockAfterDate,
  getLastBlockBeforeDate
}

const moment = require('moment')

const DATE_FORMAT = 'Do MMM YYYY'
const TIME_FORMAT = 'H:mm'
const DATE_TIME_FORMAT = DATE_FORMAT + ' ' + TIME_FORMAT

function substractPeriod (date, amount, period) {
  return moment(date)
    .subtract(amount, period)
    .toDate()
}

function formatDateTime (date) {
  return date ? moment(date).format(DATE_TIME_FORMAT) : null
}

function parseDateIso (dateStr, errorMessage) {
  return _parseDate(dateStr, null, 'Use a valid ISO 8601 format. Examples: 2013-02-08, 2013-02-08T09:30, 2013-02-08 09:30:26')
}

function _parseDate (dateStr, format, errorMessage) {
  const date = format ? moment(dateStr, format) : moment(dateStr, moment.ISO_8601)

  if (!date.isValid()) {
    const error = new Error('Invalid date format' + errorMessage)
    error.data = {
      date: dateStr
    }
    error.type = 'DATE_FORMAT'
    error.status = 412

    throw error
  } else {
    return date.toDate()
  }
}

function diff (date1, date2, period) {
  return moment(date2)
    .diff(date1, period)
}

module.exports = {
  substractPeriod,
  formatDateTime,
  parseDateIso,
  diff
}

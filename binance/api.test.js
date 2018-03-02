const test = require('ava')
const moment = require('moment')
const config = require('../config.dev')
const api = require('./api')(config.binance)

test('bid price is less than market price', t => api
  .getPrice({ symbol: 'LTCUSDT', rate: 0.995 })
  .map(data => {
    // t.log('BUY', data)
    if (data.new_value < data.old_value) {
      t.pass()
    } else {
      t.fail()
    }
  })
)

test('ask price is more than market price', t => api
  .getPrice({ symbol: 'LTCUSDT', rate: 1.005 })
  .map(data => {
    // t.log('SELL', data)
    if (data.new_value > data.old_value) {
      t.pass()
    } else {
      t.fail()
    }
  })
)

test('make order', t => {
  const formData = {
    symbol: 'LTCBTC',
    side: 'BUY',
    quantity: 1,
    price: 100,
    timestamp: moment().format('x'),
    type: 'LIMIT',
    timeInForce: 'GTC',
    recvWindow: 5000
  }

  return api
    .placeOrder(formData, true)
    .map(() => t.pass())
})

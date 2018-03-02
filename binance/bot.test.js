const test = require('ava')
const config = require('../config.dev')
const Bot = require('./bot')
const bot = Bot(config.binance)

// BEWARE this test will cancel existing open order depending on market price
test('buy', t => {
  return bot.buy('LTCUSDT', true)
    .map(res => {
      t.log(res)
      t.pass()
    })
})

test('sell', t => {
  return bot.sell('LTCUSDT', true)
    .map(res => {
      t.log(res)
      t.pass()
    })
})

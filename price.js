const config = require('./config.dev')
const api = require('./binance/api')(config.binance)
const { argv } = require('yargs')

api.getPrice({ symbol: argv.symbol, rate: argv.rate })
  .subscribe(console.info)

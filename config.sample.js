module.exports = {
  binance: {
    api_key: '',
    secret: '',
    symbols: {
      'BTCUSDT': {
        alert: {
          buy: 300000,
          sell: -300000
        },
        bid: {
          rate: 0.99,
          quantity: 1
        },
        ask: {
          rate: 1.01,
          quantity: 1
        }
      }
    }
  },
  telegram: {
    token: '',
    channel: ''
  },
  watcher: {
    buy: 500000000,
    sell: -500000000
  }
}

module.exports = {
  gdax: {
    product_id: {
      'LTC-USD': {
        filter_total_price: 10000,
        filter_remaining_size: 100,
        alert_buy_volume: 10000,
        alert_sell_volume: -100000
      }
    }
  },
  binance: {
    api_key: '',
    secret: '',
    symbols: {
      'LTCUSDT': {
        bid: {
          rate: 0.993,
          quantity: 1
        },
        ask: {
          rate: 1.01,
          quantity: 1
        }
      }
    }
  }
}

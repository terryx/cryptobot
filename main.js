const { Observable } = require('rxjs')
const { argv } = require('yargs')
const Binance = require('./binance/bot')
const Telegram = require('./telegram/message')
const gdax = require('./gdax/volume')
const config = require(`./config.${argv.env}`)

const watch = () => {
  const productId = argv.product_id
  const data = {
    productId: productId,
    filterSize: config.gdax.product_id[productId].filter_remaining_size,
    filterTotalPrice: config.gdax.product_id[productId].filter_total_price
  }

  let volume = 0

  const binance = Binance(config.binance)
  const telegram = Telegram(config.telegram)

  return gdax
    .stream(data)
    .mergeMap(result => {
      volume = result

      if (volume >= config.gdax.product_id[productId].alert_buy_volume && !argv.test) {
        volume = 0
        return binance.buy(argv.symbol).mergeMap(res => telegram.send(res).mapTo(res))
      }

      if (volume <= config.gdax.product_id[productId].alert_sell_volume && !argv.test) {
        volume = 0
        const data = { order: 1 }
        return binance.sell(argv.symbol).mergeMap(res => telegram.send(data).mapTo(res))
      }

      return Observable.of(result)
    })
    .subscribe(
      (result) => console.info(result),
      (error) => console.error(error.message),
      () => watch()
    )
}

watch()

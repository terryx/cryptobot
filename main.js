const { Observable } = require('rxjs')
const { argv } = require('yargs')
const numeral = require('numeral')
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

  const volume = numeral(0)
  const binance = Binance(config.binance)
  const telegram = Telegram(config.telegram)

  return gdax
    .stream(data)
    .map(feed => {
      const total = gdax.getTotal(feed.remaining_size, feed.price)
      const side = feed.side.toUpperCase()
      if (side === 'BUY') {
        volume.add(total)
      }

      if (side === 'SELL') {
        volume.subtract(total)
      }

      return volume.value()
    })
    .bufferTime(5000)
    .mergeMap(buffers => {
      if (volume.value() >= config.gdax.product_id[productId].alert_buy_volume) {
        volume.set(0)
        return binance.buy({ symbol: argv.symbol }, argv.test).mergeMap(res => telegram.send(res).mapTo(res))
      }

      if (volume.value() <= config.gdax.product_id[productId].alert_sell_volume) {
        volume.set(0)
        return binance.sell({ symbol: argv.symbol }, argv.test).mergeMap(res => telegram.send(res).mapTo(res))
      }

      return Observable.of(volume.value())
    })
    .subscribe(
      (result) => console.info(result),
      (error) => console.error(error.message),
      () => watch()
    )
}

watch()

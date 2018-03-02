const moment = require('moment')
const numeral = require('numeral')
const { Observable } = require('rxjs')
const Binance = require('./api')

const constructor = (config) => {
  const binance = Binance(config)

  // const getOrderSetting$ = (symbol) => Observable
  //   .from(config.symbols[symbol].orders)

  // const getRecords$ = (symbol) => getOrderSetting$(symbol)
  //   .mergeMap(order => Observable
  //     .bindNodeCallback(fs.readFile)(`./records/${order.trade_marker}.json`, 'utf8')
  //     .map(record => JSON.parse(record))
  //     .catch(() => Observable
  //       .bindNodeCallback(fs.writeFile)(`./records/${order.trade_marker}.json`, '{}')
  //       .mapTo(record => {})
  //     )
  //   )

  /*
  Step 1. Get market price AND get all open buy orders
  Step 2. Compare market price with current open orders
  Step 3. Cancel open orders IF market price is lower
  Step 4. Place new order regardless of existing open order
  */
  const buy = (symbol, isTest = false) => Observable
    .zip(
      binance.getPrice({ symbol, rate: config.symbols[symbol].bid.rate }),
      binance.getOrders({ symbol, side: 'BUY' })
    )
    .mergeMap(([ price, orders ]) =>
      Observable
        .from(orders)
        .filter(order => numeral(order.price).value() > numeral(price.new_value).value())
        .mergeMap(order => binance.cancelOrder({
          symbol: order.symbol,
          orderId: order.orderId,
          timestamp: moment().format('x')
        }))
        .defaultIfEmpty(null)
        .mapTo(price)
    )
    .mergeMap(price => binance
      .placeOrder({
        symbol: symbol,
        side: 'BUY',
        quantity: config.symbols[symbol].bid.quantity,
        price: price.new_value,
        timestamp: moment().format('x'),
        type: 'LIMIT',
        timeInForce: 'GTC',
        recvWindow: 5000
      }, isTest)
    )
    .catch(err => Observable.of(err.message))

  /*
  Step 1. Get market price AND get all open sell orders
  Step 2. Compare market price with current open orders
  Step 3. Cancel open orders IF market price is higher
  Step 4. Place new order regardless of existing open order
  */
  const sell = (symbol, isTest = false) => Observable
    .zip(
      binance.getPrice({ symbol, rate: config.symbols[symbol].ask.rate }),
      binance.getOrders({ symbol, side: 'SELL' })
    )
    .mergeMap(([ price, orders ]) =>
      Observable
        .from(orders)
        .filter(order => numeral(order.price).value() < numeral(price.new_value).value())
        .mergeMap(order => binance.cancelOrder({
          symbol: order.symbol,
          orderId: order.orderId,
          timestamp: moment().format('x')
        }))
        .defaultIfEmpty(null)
        .mapTo(price)
    )
    .mergeMap(price => binance
      .placeOrder({
        symbol: symbol,
        side: 'SELL',
        quantity: config.symbols[symbol].ask.quantity,
        price: price.new_value,
        timestamp: moment().format('x'),
        type: 'LIMIT',
        timeInForce: 'GTC',
        recvWindow: 5000
      }, isTest)
    )
    .catch(err => Observable.of(err.message))

  return { buy, sell }
}

module.exports = constructor

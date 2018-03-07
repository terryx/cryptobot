const moment = require('moment')
const numeral = require('numeral')
const { Observable } = require('rxjs')
const Binance = require('./api')

const constructor = (config) => {
  const binance = Binance(config)

  /*
  Step 1. Get market price AND get all open buy orders
  Step 2. Compare market price with current open orders
  Step 3. Cancel open orders
  Step 4. Check for account balance
  Step 4. Place new order regardless of existing open order
  */
  const buy = ({ symbol, format = '0.00' }, isTest = false) => {
    const { rate, quantity } = config.symbols[symbol].bid
    const side = 'BUY'

    return Observable
      .zip(
        binance.getPrice({ symbol, rate }).map(res => res.new_value),
        binance.getOrders({ symbol, side })
      )
      .mergeMap(([ price, orders ]) =>
        Observable
          .from(orders)
          .mergeMap(order => binance.cancelOrder({
            symbol: order.symbol,
            orderId: order.orderId,
            timestamp: moment().format('x')
          }))
          .defaultIfEmpty(null)
          .toArray()
          .mergeMap(() => binance
            .getAccountBalance({ symbol, side })
            .filter(balance => numeral(balance.free).value() >= quantity)
            .mapTo(price)
          )
      )
      .mergeMap(price => binance
        .placeOrder({
          symbol,
          side,
          quantity,
          price,
          timestamp: moment().format('x'),
          type: 'LIMIT',
          timeInForce: 'GTC',
          recvWindow: 5000
        }, isTest)
      )
      .catch(err => Observable.of(err.message))
  }

  /*
  Step 1. Get market price AND last buy trade price
  Step 2. Compare both prices and take (best) highest price for sell multiply with defined rate
  Step 3. Get open sell orders
  Step 4. Cancel open orders IF best price is higher
  Step 5. Check for account balance
  Step 6. Place new order IF price is higher than last trade
  */
  const sell = ({ symbol, format = '0.00' }, isTest = false) => {
    const { rate, quantity } = config.symbols[symbol].ask
    const side = 'SELL'

    return Observable
      .zip(
        binance
          .getPrice({ symbol, rate, format })
          .map(res => res.old_value),
        binance
          .getLastTradePrice({ symbol, side: 'BUY' })
          .map(value => numeral(value).multiply(rate).format(format))
      )
      .map(([ marketPrice, lastTradePrice ]) =>
        numeral(marketPrice).value() > numeral(lastTradePrice).value() ? marketPrice : lastTradePrice
      )
      .mergeMap(price =>
        binance
          .getOrders({ symbol, side })
          .mergeMap(orders => Observable
            .from(orders)
            .filter(order => numeral(order.price).value() < numeral(price).value())
            .mergeMap(order => binance.cancelOrder({
              symbol: order.symbol,
              orderId: order.orderId,
              timestamp: moment().format('x')
            }))
            .defaultIfEmpty(null)
          )
          .mergeMap(() => binance
            .getAccountBalance({ symbol, side })
            .filter(balance => numeral(balance.free).value() >= quantity)
            .mapTo(price)
          )
      )
      .mergeMap(price => binance
        .placeOrder({
          symbol: symbol,
          side: 'SELL',
          quantity: quantity,
          price: price,
          timestamp: moment().format('x'),
          type: 'LIMIT',
          timeInForce: 'GTC',
          recvWindow: 5000
        }, isTest)
      )
      .catch(err => Observable.of(err.message))
  }

  return { buy, sell }
}

module.exports = constructor

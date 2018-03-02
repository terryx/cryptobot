const { Observable } = require('rxjs')
const numeral = require('numeral')
const Gdax = require('gdax')

const getTotal = (size, price) => {
  return numeral(size).multiply(numeral(price).value()).value()
}

const stream = ({ productId, filterSize, filterTotalPrice }) => {
  const websocket = new Gdax.WebsocketClient([ productId ])
  const volume = numeral(0)

  return Observable
    .fromEvent(websocket, 'message')
    .takeUntil(Observable.fromEvent(websocket, 'close'))
    .filter(feed => feed.reason !== 'canceled')
    .filter(feed => feed.type === 'open')
    .filter(feed => numeral(feed.remaining_size).value() >= filterSize)
    .filter(feed => getTotal(feed.remaining_size, feed.price) >= filterTotalPrice)
    .distinct(res => res.order_id)
    .map(feed => {
      const total = getTotal(feed.remaining_size, feed.price)
      const side = feed.side.toUpperCase()
      if (side === 'BUY') {
        volume.add(total)
      }

      if (side === 'SELL') {
        volume.subtract(total)
      }

      return volume.value()
    })
}

module.exports = { stream }

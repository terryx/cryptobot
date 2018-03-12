const { Observable } = require('rxjs')
const { argv } = require('yargs')
const numeral = require('numeral')
const Bot = require('./binance/bot')
const Telegram = require('./telegram/message')
const config = require(`./config.${argv.env}`)
const helper = require('./utils/helper')
const w3cwebsocket = require('websocket').w3cwebsocket
const symbol = argv.symbol

const executeOrder = (side) => {
  const bot = Bot(config.binance)
  const telegram = Telegram(config.telegram)

  return bot[side]({ symbol: argv.symbol.toUpperCase() }, argv.test)
    .mergeMap(res => telegram.send(res).mapTo(res))
}

const stream = () => {
  const websocket = Observable.webSocket({
    url: `wss://stream.binance.com:9443/stream?streams=${symbol.toLowerCase()}@aggTrade`,
    WebSocketCtor: w3cwebsocket
  })

  const alert = config.binance.symbols[symbol.toUpperCase()].alert

  return websocket
    .map(res => res.data)
    .scan((acc, cur) => {
      const total = helper.getTotal(cur.q, cur.p)
      const sum = numeral(acc)
      acc = cur.m === true ? sum.add(total) : sum.subtract(total)

      return acc.value()
    }, 0)
    .do(total => {
      if (argv.test) {
        console.log(total)
      }
    })
    .filter(res => res > alert.buy || res < alert.sell)
    .take(1)
    .mergeMap(total => {
      if (total > 0) {
        return executeOrder('buy')
      }

      if (total < 0) {
        return executeOrder('sell')
      }
    })
    .subscribe(
      (result) => console.info('reached', result),
      (error) => console.error(error.message),
      () => stream()
    )
}

stream()

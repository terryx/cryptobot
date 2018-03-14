const { Observable } = require('rxjs')
const { argv } = require('yargs')
const numeral = require('numeral')
const bitfinex = require('./streams/bitfinex')
const gdax = require('./streams/gdax')
const gemini = require('./streams/gemini')
const Telegram = require('./telegram/message')
const { symbol, productId, env } = argv
const config = require(`./config.${env}`)

const main = () => {
  const telegram = Telegram(config.telegram)

  return Observable
    .merge(
      bitfinex.stream(symbol),
      gdax.stream(productId),
      gemini.stream(symbol)
    )
    .scan((acc, cur) => {
      acc = acc.add(cur)

      return acc
    }, numeral(0))
    .map(total => total.value())
    .do(console.log)
    .find(value => value >= config.watcher.buy || value <= config.watcher.sell)
    .mergeMap(value => telegram.send(`${symbol} ${value}`).mapTo(value))
    .subscribe(result => console.info('Target', result), console.error, main)
}

main()

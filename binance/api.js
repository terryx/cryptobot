const request = require('request-promise')
const numeral = require('numeral')
const crypto = require('crypto')
const queryString = require('query-string')
const moment = require('moment')
const { Observable } = require('rxjs')

const constructor = (config) => {
  const req = request.defaults({
    headers: {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': config.api_key
    },
    baseUrl: 'https://api.binance.com/api/v3',
    json: true
  })

  const encrypt = (data, url) => {
    const stringified = queryString.stringify(data)
    const hmac = crypto
      .createHmac('sha256', config.secret)
      .update(stringified)
      .digest('hex')

    const fullUrl = `${url}?${stringified}&signature=${hmac}`

    return fullUrl
  }

  const api = {}

  api.getPrice = ({ symbol, rate, format }) => Observable
    .fromPromise(req.get('/ticker/price', { qs: { symbol } }))
    .map(data => {
      const result = {
        old_value: numeral(data.price).format(format),
        new_value: numeral(data.price).multiply(rate).format(format)
      }

      return result
    })

  api.placeOrder = (data, isTest = false) => {
    let url = '/order'
    if (isTest) {
      url = '/order/test'
    }

    return Observable.fromPromise(req.post(encrypt(data, url)))
  }

  api.cancelOrder = (data) => {
    const url = '/order'

    return Observable.fromPromise(req.delete(encrypt(data, url)))
  }

  // get ongoing buy order
  api.getOrders = ({ symbol, side }) => {
    const url = `/openOrders`
    const data = {
      symbol,
      timestamp: moment().format('x')
    }

    return Observable
      .fromPromise(req.get(encrypt(data, url)))
      .mergeMap(res => Observable.from(res))
      .filter(res => res.status === 'NEW' && res.side === side)
      .toArray()
  }

  api.getLastTradePrice = ({ symbol, side }) => {
    const url = `/myTrades`
    const data = {
      symbol,
      timestamp: moment().format('x')
    }

    const isBuyer = side === 'BUY'

    return Observable
      .fromPromise(req.get(encrypt(data, url)))
      .mergeMap(res => Observable.from(res))
      .filter(res => res.isBuyer === isBuyer && res.isMaker === true)
      .takeLast(1)
      .map(res => res.price)
      .defaultIfEmpty(0)
  }

  api.getAccountBalance = ({ symbol, side }) => {
    const url = '/account'
    const data = { timestamp: moment().format('x') }
    const baseCurrency = symbol.substr(0, 3)
    const counterCurrency = symbol.substr(3, symbol.length)
    const filterCurrency = side === 'BUY' ? counterCurrency : baseCurrency

    return Observable
      .fromPromise(req.get(encrypt(data, url)))
      .mergeMap(res => Observable.from(res.balances))
      .filter(balance => balance.asset === filterCurrency)
  }

  return api
}

module.exports = constructor

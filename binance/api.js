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
    baseUrl: 'https://api.binance.com/api',
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

  api.getPrice = ({ symbol, rate, format = '0.00' }) => Observable
    .fromPromise(req.get('/v3/ticker/price', { qs: { symbol } }))
    .map(data => {
      const result = {
        old_value: numeral(data.price).format(format),
        new_value: numeral(data.price).multiply(rate).format(format)
      }

      return result
    })

  api.placeOrder = (data, isTest = false) => {
    let url = '/v3/order'
    if (isTest) {
      url = '/v3/order/test'
    }

    return Observable.fromPromise(req.post(encrypt(data, url)))
  }

  api.cancelOrder = (data) => {
    const url = '/v3/order'

    return Observable.fromPromise(req.delete(encrypt(data, url)))
  }

  // get ongoing buy order
  api.getOrders = ({ symbol, side }) => {
    const url = `/v3/openOrders`
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

  return api
}

module.exports = constructor

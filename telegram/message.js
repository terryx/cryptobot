const Telegram = require('telegraf/telegram')
const { Observable } = require('rxjs')

const constructor = ({ token, channel }) => {
  const api = {}

  api.send = (message) => {
    const bot = new Telegram(token)

    return Observable.fromPromise(bot.sendMessage(channel, message, { parse_mode: 'HTML' }))
  }

  return api
}

module.exports = constructor

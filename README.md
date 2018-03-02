## Cryptobot

## Prerequisite
- NodeJS version >= 8
- A Binance account
- A Telegram bot and channel 

## Getting Started
```
cp config.sample.js config.dev.js
# Insert binance api key and secret into config file before running main.js

npm install
node main.js --env=dev --product_id=LTC-USD --symbol=LTCUSDT
```

### Testing
Please make sure you have created a config file
```
# Run unit test
npm test -- -w -v

# Run end to end test
node main.js --env=dev --product_id=LTC-USD --symbol=LTCUSDT --test=true
```

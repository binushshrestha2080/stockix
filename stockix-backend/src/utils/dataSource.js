const finnhub      = require("./finnhub");
const alphaVantage = require("./alphaVantage");
const cache        = require("./cache");

// Use Finnhub for real-time data (unlimited on free plan)
const getQuote     = (symbol)                    => finnhub.getQuote(symbol);
const getNews      = (symbol, from, to)          => finnhub.getNews(symbol, from, to);
const searchSymbol = (query)                     => finnhub.searchSymbol(query);
const getProfile   = (symbol)                    => finnhub.getProfile(symbol);

// Use Alpha Vantage for historical candles (cached aggressively)
const getCandles   = (symbol, resolution, from, to) => alphaVantage.getCandles(symbol, resolution, from, to);

module.exports = { getQuote, getCandles, getNews, searchSymbol, getProfile };
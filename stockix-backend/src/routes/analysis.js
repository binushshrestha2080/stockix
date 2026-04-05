const express    = require("express");
const router     = express.Router();
// const { getCandles } = require("../utils/finnhub");
const { getCandles } = require("../utils/dataSource");
const { linearRegression, sma, ema, rsi, macd, runFullAnalysis } = require("../algorithms/indicators");

async function fetchClosingPrices(symbol, resolution = "D", days = 200) {
  const to   = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;
  const data = await getCandles(symbol.toUpperCase(), resolution, from, to);
  if (!data || data.s === "no_data" || !data.c || !data.c.length) {
    throw new Error("No price data available for " + symbol);
  }
  return data.c;
}

// ── GET /api/analysis/:symbol  — full analysis (all 5 algorithms)
router.get("/:symbol", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol, req.query.resolution || "D");
    const result = runFullAnalysis(prices);
    res.json({ symbol: req.params.symbol.toUpperCase(), pricesUsed: prices.length, generatedAt: new Date().toISOString(), ...result });
  } catch (err) { next(err); }
});

// ── GET /api/analysis/:symbol/linear-regression
router.get("/:symbol/linear-regression", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol);
    const result = linearRegression(prices, Number(req.query.days) || 7);
    res.json({ symbol: req.params.symbol.toUpperCase(), algorithm: "Linear Regression", ...result });
  } catch (err) { next(err); }
});

// ── GET /api/analysis/:symbol/sma?period=14
router.get("/:symbol/sma", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol);
    const period = Number(req.query.period) || 14;
    const result = sma(prices, period);
    res.json({ symbol: req.params.symbol.toUpperCase(), algorithm: "SMA", ...result });
  } catch (err) { next(err); }
});

// ── GET /api/analysis/:symbol/ema?period=12
router.get("/:symbol/ema", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol);
    const period = Number(req.query.period) || 12;
    const result = ema(prices, period);
    res.json({ symbol: req.params.symbol.toUpperCase(), algorithm: "EMA", ...result });
  } catch (err) { next(err); }
});

// ── GET /api/analysis/:symbol/rsi?period=14
router.get("/:symbol/rsi", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol);
    const period = Number(req.query.period) || 14;
    const result = rsi(prices, period);
    res.json({ symbol: req.params.symbol.toUpperCase(), algorithm: "RSI", ...result });
  } catch (err) { next(err); }
});

// ── GET /api/analysis/:symbol/macd
router.get("/:symbol/macd", async (req, res, next) => {
  try {
    const prices = await fetchClosingPrices(req.params.symbol);
    const result = macd(prices, Number(req.query.fast) || 12, Number(req.query.slow) || 26, Number(req.query.signal) || 9);
    res.json({ symbol: req.params.symbol.toUpperCase(), algorithm: "MACD", ...result });
  } catch (err) { next(err); }
});

module.exports = router;

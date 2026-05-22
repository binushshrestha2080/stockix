const express = require("express");
const router  = express.Router();
const nepse   = require("../utils/nepse");

// GET /api/nepse/quote/:symbol
router.get("/quote/:symbol", async (req, res, next) => {
  try {
    const data = await nepse.getQuote(req.params.symbol.toUpperCase());
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/nepse/history/:symbol?days=100
router.get("/history/:symbol", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 100;
    const data = await nepse.getHistory(req.params.symbol.toUpperCase(), days);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/nepse/gainers
router.get("/gainers", async (req, res, next) => {
  try { res.json(await nepse.getTopGainers()); }
  catch (err) { next(err); }
});

// GET /api/nepse/losers
router.get("/losers", async (req, res, next) => {
  try { res.json(await nepse.getTopLosers()); }
  catch (err) { next(err); }
});

// GET /api/nepse/index
router.get("/index", async (req, res, next) => {
  try { res.json(await nepse.getIndex()); }
  catch (err) { next(err); }
});

// GET /api/nepse/sectors
router.get("/sectors", async (req, res, next) => {
  try { res.json(await nepse.getSectors()); }
  catch (err) { next(err); }
});

// GET /api/nepse/fundamentals/:symbol
router.get("/fundamentals/:symbol", async (req, res, next) => {
  try {
    const data = await nepse.getFundamentals(req.params.symbol.toUpperCase());
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/nepse/search?q=nabil
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query required" });
    res.json(await nepse.searchStocks(q));
  } catch (err) { next(err); }
});

// GET /api/nepse/analysis/:symbol — full technical analysis on NEPSE stock
router.get("/analysis/:symbol", async (req, res, next) => {
  try {
    const symbol  = req.params.symbol.toUpperCase();
    const history = await nepse.getHistory(symbol, 100);
    const prices  = history.data.map(d => d.close);

    if (prices.length < 26) return res.status(400).json({ error: "Not enough data" });

    const { linearRegression, sma, ema, rsi, macd, runFullAnalysis } = require("../algorithms/indicators");
    const analysis = runFullAnalysis(prices);

    res.json({ symbol, pricesUsed: prices.length, ...analysis });
  } catch (err) { next(err); }
});

module.exports = router;
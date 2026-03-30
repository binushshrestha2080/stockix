const express = require("express");
const router  = express.Router();
// const { getQuote, getCandles, getNews, searchSymbol, getProfile } = require("../utils/finnhub");
const { getQuote, getCandles, getNews, searchSymbol, getProfile } = require("../utils/alphaVantage");
// GET /api/stocks/quote/:symbol
router.get("/quote/:symbol", async (req, res, next) => {
  try {
    const data = await getQuote(req.params.symbol.toUpperCase());
    if (!data || data.c === 0) return res.status(404).json({ error: "Symbol not found" });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/stocks/candles/:symbol?resolution=D&from=&to=
router.get("/candles/:symbol", async (req, res, next) => {
  try {
    const { resolution, from, to } = req.query;
    const data = await getCandles(req.params.symbol.toUpperCase(), resolution, from, to);
    if (data.s === "no_data") return res.status(404).json({ error: "No candle data available" });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/stocks/news/:symbol
router.get("/news/:symbol", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await getNews(req.params.symbol.toUpperCase(), from, to);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/stocks/search?q=apple
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query param 'q' is required" });
    const data = await searchSymbol(q);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/stocks/profile/:symbol
router.get("/profile/:symbol", async (req, res, next) => {
  try {
    const data = await getProfile(req.params.symbol.toUpperCase());
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
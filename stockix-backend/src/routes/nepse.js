const express = require("express");
const router  = express.Router();
const nepse   = require("../utils/nepse");
const { runFullAnalysis, linearRegression } = require("../algorithms/indicators");

// GET /api/nepse/quote/:symbol
router.get("/quote/:symbol", async (req, res, next) => {
  try { res.json(await nepse.getQuote(req.params.symbol.toUpperCase())); }
  catch (err) { next(err); }
});

// GET /api/nepse/history/:symbol?days=100
router.get("/history/:symbol", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 100;
    res.json(await nepse.getHistory(req.params.symbol.toUpperCase(), days));
  } catch (err) { next(err); }
});

// GET /api/nepse/overview
router.get("/overview", async (req, res, next) => {
  try { res.json(await nepse.getMarketOverview()); }
  catch (err) { next(err); }
});

// GET /api/nepse/sectors
router.get("/sectors", async (req, res, next) => {
  try { res.json(await nepse.getSectorSummary()); }
  catch (err) { next(err); }
});

// GET /api/nepse/stocks
router.get("/stocks", async (req, res, next) => {
  try { res.json(nepse.getStockList()); }
  catch (err) { next(err); }
});

// GET /api/nepse/search?q=nabil
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query required" });
    res.json(nepse.searchStocks(q));
  } catch (err) { next(err); }
});

// GET /api/nepse/analysis/:symbol
router.get("/analysis/:symbol", async (req, res, next) => {
  try {
    const symbol  = req.params.symbol.toUpperCase();
    const history = await nepse.getHistory(symbol, 100);
    const prices  = history.data.map(d => d.close);
    if (prices.length < 26)
      return res.status(400).json({ error: "Not enough data for analysis" });
    const analysis = runFullAnalysis(prices);
    const lrResult = linearRegression(prices, 7);
    res.json({
      symbol, name: history.name, sector: history.sector,
      pricesUsed: prices.length,
      currentPrice: prices[prices.length - 1],
      ...analysis,
      linearRegression: lrResult,
    });
  } catch (err) { next(err); }
});

// GET /api/nepse/multi?symbols=NABIL,NIBL,EBL
router.get("/multi", async (req, res, next) => {
  try {
    const symbols = (req.query.symbols || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symbols.length) return res.status(400).json({ error: "symbols required" });
    res.json(await nepse.getMultipleQuotes(symbols));
  } catch (err) { next(err); }
});

module.exports = router;
const express = require("express");
const router  = express.Router();
const { getCandles } = require("../utils/dataSource");

const ML_SERVICE_URL = "http://localhost:5001";

// ── GET /api/prediction/:symbol ──────────────────────────────────────────────
// Fetches historical prices, sends to Python LSTM service, returns predictions
router.get("/:symbol", async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // Step 1: Get historical candle data from Finnhub
    console.log(`[Prediction] Fetching historical data for ${symbol}...`);
    const candles = await getCandles(symbol);

    if (!candles || !candles.c || candles.c.length < 70) {
      return res.status(400).json({
        error: `Not enough historical data for ${symbol}. Need at least 70 days.`
      });
    }

    const prices = candles.c; // closing prices array
    console.log(`[Prediction] Got ${prices.length} days of data. Sending to LSTM service...`);

    // Step 2: Call Python LSTM microservice
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ symbol, prices }),
    });

    if (!mlResponse.ok) {
      const err = await mlResponse.json();
      return res.status(500).json({ error: "ML service error: " + err.error });
    }

    const prediction = await mlResponse.json();
    console.log(`[Prediction] ${symbol} prediction complete. Trend: ${prediction.trend}`);

    // Step 3: Return enriched response to frontend
    res.json({
      symbol,
      currentPrice:    prediction.currentPrice,
      predictions:     prediction.predictions,
      predictedDay7:   prediction.predictedDay7,
      priceChangePct:  prediction.priceChangePct,
      trend:           prediction.trend,
      confidence:      prediction.confidence,
      daysTrainedOn:   prediction.daysTrainedOn,
      modelInfo:       prediction.modelInfo,
      generatedAt:     new Date().toISOString(),
    });

  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "ML service is not running. Start it with: python ml_service.py"
      });
    }
    next(err);
  }
});

module.exports = router;
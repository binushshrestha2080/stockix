// ─────────────────────────────────────────────────────────────────────────────
// STOCKIX — Trading Algorithms
// 1. Linear Regression  (price prediction)
// 2. SMA  — Simple Moving Average
// 3. EMA  — Exponential Moving Average
// 4. RSI  — Relative Strength Index
// 5. MACD — Moving Average Convergence Divergence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. LINEAR REGRESSION
 * Fits y = mx + b over the closing prices and predicts the next N days.
 * @param {number[]} prices  — array of closing prices
 * @param {number}   days    — how many future days to predict
 * @returns {{ slope, intercept, predictions, r2 }}
 */
function linearRegression(prices, days = 7) {
  const n = prices.length;
  if (n < 2) throw new Error("Need at least 2 data points");

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX  += i;
    sumY  += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const mean   = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssTot += (prices[i] - mean) ** 2;
    ssRes += (prices[i] - predicted) ** 2;
  }
  const r2 = 1 - ssRes / ssTot;

  // Future predictions
  const predictions = [];
  for (let i = 1; i <= days; i++) {
    predictions.push(parseFloat((slope * (n - 1 + i) + intercept).toFixed(2)));
  }

  return { slope: parseFloat(slope.toFixed(6)), intercept: parseFloat(intercept.toFixed(4)), r2: parseFloat(r2.toFixed(4)), predictions };
}

/**
 * 2. SIMPLE MOVING AVERAGE (SMA)
 * Returns the SMA series and the latest value.
 * @param {number[]} prices
 * @param {number}   period  — default 14
 */
function sma(prices, period = 14) {
  if (prices.length < period) throw new Error(`Need at least ${period} prices for SMA-${period}`);

  const result = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const avg   = slice.reduce((a, b) => a + b, 0) / period;
    result.push(parseFloat(avg.toFixed(4)));
  }

  const latest = result[result.length - 1];
  const signal = prices[prices.length - 1] > latest ? "bullish" : "bearish";

  return { period, series: result, latest, signal };
}

/**
 * 3. EXPONENTIAL MOVING AVERAGE (EMA)
 * Uses a smoothing multiplier to weight recent prices more heavily.
 * @param {number[]} prices
 * @param {number}   period  — default 14
 */
function ema(prices, period = 14) {
  if (prices.length < period) throw new Error(`Need at least ${period} prices for EMA-${period}`);

  const k      = 2 / (period + 1);
  const result = [];

  // Seed with SMA of first `period` values
  let prev = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(parseFloat(prev.toFixed(4)));

  for (let i = period; i < prices.length; i++) {
    const current = prices[i] * k + prev * (1 - k);
    result.push(parseFloat(current.toFixed(4)));
    prev = current;
  }

  const latest = result[result.length - 1];
  const signal = prices[prices.length - 1] > latest ? "bullish" : "bearish";

  return { period, multiplier: parseFloat(k.toFixed(4)), series: result, latest, signal };
}

/**
 * 4. RELATIVE STRENGTH INDEX (RSI)
 * Values > 70 → overbought, < 30 → oversold.
 * @param {number[]} prices
 * @param {number}   period  — default 14
 */
function rsi(prices, period = 14) {
  if (prices.length < period + 1) throw new Error(`Need at least ${period + 1} prices for RSI-${period}`);

  // Calculate gains and losses
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Initial average gain/loss (SMA)
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else                avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const rsiSeries = [];

  const calcRsi = (g, l) => (l === 0 ? 100 : parseFloat((100 - 100 / (1 + g / l)).toFixed(2)));
  rsiSeries.push(calcRsi(avgGain, avgLoss));

  // Wilder's smoothing for the rest
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsiSeries.push(calcRsi(avgGain, avgLoss));
  }

  const latest = rsiSeries[rsiSeries.length - 1];
  let signal = "neutral";
  if (latest > 70) signal = "overbought";
  else if (latest < 30) signal = "oversold";

  return { period, series: rsiSeries, latest, signal };
}

/**
 * 5. MACD — Moving Average Convergence Divergence
 * MACD Line  = EMA(12) − EMA(26)
 * Signal Line = EMA(9) of MACD Line
 * Histogram  = MACD Line − Signal Line
 * @param {number[]} prices
 * @param {number}   fastPeriod   — default 12
 * @param {number}   slowPeriod   — default 26
 * @param {number}   signalPeriod — default 9
 */
function macd(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (prices.length < slowPeriod + signalPeriod)
    throw new Error(`Need at least ${slowPeriod + signalPeriod} prices for MACD`);

  // Helper: raw EMA series aligned to full price array
  const emaFull = (data, period) => {
    const k = 2 / (period + 1);
    let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const out = new Array(period - 1).fill(null);
    out.push(parseFloat(prev.toFixed(4)));
    for (let i = period; i < data.length; i++) {
      prev = data[i] * k + prev * (1 - k);
      out.push(parseFloat(prev.toFixed(4)));
    }
    return out;
  };

  const ema12 = emaFull(prices, fastPeriod);
  const ema26 = emaFull(prices, slowPeriod);

  // MACD line (only where both EMAs exist)
  const macdLine = ema12.map((v, i) =>
    v !== null && ema26[i] !== null ? parseFloat((v - ema26[i]).toFixed(4)) : null
  );

  // Signal line = EMA(9) of MACD line values (non-null only)
  const validMacd   = macdLine.filter((v) => v !== null);
  const k9          = 2 / (signalPeriod + 1);
  let prevSig       = validMacd.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  const signalRaw   = [parseFloat(prevSig.toFixed(4))];
  for (let i = signalPeriod; i < validMacd.length; i++) {
    prevSig = validMacd[i] * k9 + prevSig * (1 - k9);
    signalRaw.push(parseFloat(prevSig.toFixed(4)));
  }

  // Align signal back to full array length
  const signalLine  = new Array(prices.length - signalRaw.length).fill(null).concat(signalRaw);
  const histogram   = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? parseFloat((v - signalLine[i]).toFixed(4)) : null
  );

  const latestMacd      = macdLine[macdLine.length - 1];
  const latestSignal    = signalLine[signalLine.length - 1];
  const latestHistogram = histogram[histogram.length - 1];
  const prevHistogram   = histogram[histogram.length - 2];

  let signal = "neutral";
  if (latestMacd > latestSignal && prevHistogram < 0 && latestHistogram > 0) signal = "bullish_crossover";
  else if (latestMacd < latestSignal && prevHistogram > 0 && latestHistogram < 0) signal = "bearish_crossover";
  else if (latestMacd > latestSignal) signal = "bullish";
  else if (latestMacd < latestSignal) signal = "bearish";

  return {
    fastPeriod, slowPeriod, signalPeriod,
    macdLine, signalLine, histogram,
    latest: { macd: latestMacd, signal: latestSignal, histogram: latestHistogram },
    signal,
  };
}

/**
 * Run all algorithms at once and return a combined analysis object.
 * @param {number[]} prices
 */
function runFullAnalysis(prices) {
  const result = {};
  try { result.linearRegression = linearRegression(prices, 7); } catch (e) { result.linearRegression = { error: e.message }; }
  try { result.sma14  = sma(prices, 14);  } catch (e) { result.sma14  = { error: e.message }; }
  try { result.sma50  = sma(prices, 50);  } catch (e) { result.sma50  = { error: e.message }; }
  try { result.ema12  = ema(prices, 12);  } catch (e) { result.ema12  = { error: e.message }; }
  try { result.ema26  = ema(prices, 26);  } catch (e) { result.ema26  = { error: e.message }; }
  try { result.rsi14  = rsi(prices, 14);  } catch (e) { result.rsi14  = { error: e.message }; }
  try { result.macd   = macd(prices);     } catch (e) { result.macd   = { error: e.message }; }

  // Overall sentiment
  const signals = [
    result.sma14?.signal,
    result.ema12?.signal,
    result.rsi14?.signal === "oversold"   ? "bullish" :
    result.rsi14?.signal === "overbought" ? "bearish" : "neutral",
    result.macd?.signal?.includes("bullish") ? "bullish" :
    result.macd?.signal?.includes("bearish") ? "bearish" : "neutral",
  ].filter(Boolean);

  const bullCount = signals.filter((s) => s === "bullish").length;
  const bearCount = signals.filter((s) => s === "bearish").length;
  result.overallSentiment = bullCount > bearCount ? "bullish" : bearCount > bullCount ? "bearish" : "neutral";
  result.sentimentScore   = parseFloat(((bullCount - bearCount) / signals.length).toFixed(2));

  return result;
}

module.exports = { linearRegression, sma, ema, rsi, macd, runFullAnalysis };
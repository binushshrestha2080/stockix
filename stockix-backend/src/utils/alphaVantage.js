const axios = require("axios");

const BASE = "https://www.alphavantage.co/query";

const av = axios.create({ timeout: 15000 });

const get = (params) =>
  av.get(BASE, { params: { ...params, apikey: process.env.ALPHA_VANTAGE_API_KEY } });

// ── Real-time quote ────────────────────────────────────────────────────────────
const getQuote = async (symbol) => {
  const { data } = await get({ function: "GLOBAL_QUOTE", symbol });
  const q = data["Global Quote"];
  if (!q || !q["05. price"]) throw new Error(`No quote data for ${symbol}`);
  return {
    c:  parseFloat(q["05. price"]),
    o:  parseFloat(q["02. open"]),
    h:  parseFloat(q["03. high"]),
    l:  parseFloat(q["04. low"]),
    pc: parseFloat(q["08. previous close"]),
    d:  parseFloat(q["09. change"]),
    dp: parseFloat(q["10. change percent"].replace("%", "")),
  };
};

// ── Daily OHLCV candles ────────────────────────────────────────────────────────
const getCandles = async (symbol, resolution = "D", from, to) => {
  const fnMap = {
    "1": "TIME_SERIES_INTRADAY", "5": "TIME_SERIES_INTRADAY",
    "15": "TIME_SERIES_INTRADAY", "30": "TIME_SERIES_INTRADAY",
    "60": "TIME_SERIES_INTRADAY",
    "D": "TIME_SERIES_DAILY", "W": "TIME_SERIES_WEEKLY", "M": "TIME_SERIES_MONTHLY",
  };

  const fn     = fnMap[resolution] || "TIME_SERIES_DAILY";
 const params = { function: fn, symbol, outputsize: "compact" };
  if (fn === "TIME_SERIES_INTRADAY") params.interval = `${resolution}min`;

  const { data } = await get(params);

  // ── DEBUG: print what Alpha Vantage actually returned ──
  console.log("Alpha Vantage keys:", Object.keys(data));
  if (data["Note"])             console.log("Rate limit note:", data["Note"]);
  if (data["Information"])      console.log("Info message:", data["Information"]);
  if (data["Error Message"])    console.log("Error message:", data["Error Message"]);

  const tsKey = Object.keys(data).find((k) => k.startsWith("Time Series"));
  if (!tsKey) {
    console.log("Full response:", JSON.stringify(data));
    throw new Error(`No candle data for ${symbol}`);
  }

  const series = data[tsKey];
  let entries  = Object.entries(series).map(([date, vals]) => ({
    t: Math.floor(new Date(date).getTime() / 1000),
    o: parseFloat(vals["1. open"]),
    h: parseFloat(vals["2. high"]),
    l: parseFloat(vals["3. low"]),
    c: parseFloat(vals["4. close"]),
    v: parseFloat(vals["5. volume"]),
  }));

  entries.sort((a, b) => a.t - b.t);
  if (from) entries = entries.filter((e) => e.t >= Number(from));
  if (to)   entries = entries.filter((e) => e.t <= Number(to));
  if (!entries.length) return { s: "no_data" };

  return {
    s: "ok",
    t: entries.map((e) => e.t),
    o: entries.map((e) => e.o),
    h: entries.map((e) => e.h),
    l: entries.map((e) => e.l),
    c: entries.map((e) => e.c),
    v: entries.map((e) => e.v),
  };
};

// ── News ───────────────────────────────────────────────────────────────────────
const getNews = async (symbol, from, to) => {
  const params = { function: "NEWS_SENTIMENT", tickers: symbol, limit: 10 };
  if (from) params.time_from = from.replace(/-/g, "") + "T0000";
  if (to)   params.time_to   = to.replace(/-/g, "")   + "T2359";
  const { data } = await get(params);
  const feed = data.feed || [];
  return feed.slice(0, 10).map((item) => ({
    headline: item.title,
    summary:  item.summary,
    source:   item.source,
    url:      item.url,
    datetime: Math.floor(new Date(
      item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6")
    ).getTime() / 1000),
    sentiment: item.overall_sentiment_label,
  }));
};

// ── Search ─────────────────────────────────────────────────────────────────────
const searchSymbol = async (query) => {
  const { data } = await get({ function: "SYMBOL_SEARCH", keywords: query });
  return (data.bestMatches || []).slice(0, 8).map((m) => ({
    symbol:      m["1. symbol"],
    description: m["2. name"],
    type:        m["3. type"],
    region:      m["4. region"],
    currency:    m["8. currency"],
  }));
};

// ── Profile ────────────────────────────────────────────────────────────────────
const getProfile = async (symbol) => {
  const { data } = await get({ function: "OVERVIEW", symbol });
  if (!data.Symbol) throw new Error(`No profile data for ${symbol}`);
  return {
    symbol:      data.Symbol,
    name:        data.Name,
    exchange:    data.Exchange,
    industry:    data.Industry,
    sector:      data.Sector,
    description: data.Description,
    marketCap:   parseInt(data.MarketCapitalization)  || 0,
    pe:          parseFloat(data.PERatio)              || null,
    eps:         parseFloat(data.EPS)                  || null,
    week52High:  parseFloat(data["52WeekHigh"])        || null,
    week52Low:   parseFloat(data["52WeekLow"])         || null,
    website:     data.OfficialSite                     || "",
  };
};

module.exports = { getQuote, getCandles, getNews, searchSymbol, getProfile };
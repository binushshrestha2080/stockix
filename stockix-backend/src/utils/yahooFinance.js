const yahooFinance = require("yahoo-finance2").default;
yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

// Get live quote
const getQuote = async (symbol) => {
  const q = await yahooFinance.quote(symbol);
  return {
    c:  q.regularMarketPrice,
    o:  q.regularMarketOpen,
    h:  q.regularMarketDayHigh,
    l:  q.regularMarketDayLow,
    pc: q.regularMarketPreviousClose,
    d:  q.regularMarketChange,
    dp: q.regularMarketChangePercent,
  };
};

// Get historical candles
const getCandles = async (symbol, resolution = "D", from, to) => {
  const period1 = from ? new Date(Number(from) * 1000) : new Date(Date.now() - 120 * 86400 * 1000);
  const period2 = to   ? new Date(Number(to)   * 1000) : new Date();

  const result = await yahooFinance.historical(symbol, {
    period1,
    period2,
    interval: "1d",
  });

  if (!result || result.length === 0) return { s: "no_data" };

  const sorted = result.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    s: "ok",
    t: sorted.map(d => Math.floor(new Date(d.date).getTime() / 1000)),
    o: sorted.map(d => d.open),
    h: sorted.map(d => d.high),
    l: sorted.map(d => d.low),
    c: sorted.map(d => d.close),
    v: sorted.map(d => d.volume),
  };
};

// Get news
const getNews = async (symbol) => {
  const result = await yahooFinance.search(symbol, { newsCount: 10 });
  return (result.news || []).map(n => ({
    headline: n.title,
    summary:  n.title,
    source:   n.publisher,
    url:      n.link,
    datetime: Math.floor(new Date(n.providerPublishTime * 1000).getTime() / 1000),
  }));
};

// Search symbols
const searchSymbol = async (query) => {
  const result = await yahooFinance.search(query);
  return (result.quotes || []).slice(0, 8).map(q => ({
    symbol:      q.symbol,
    description: q.longname || q.shortname || q.symbol,
    type:        q.quoteType,
    region:      q.exchange,
    currency:    q.currency || "USD",
  }));
};

// Get company profile
const getProfile = async (symbol) => {
  const q = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile", "summaryDetail"] });
  const p = q.assetProfile || {};
  const s = q.summaryDetail || {};
  return {
    symbol,
    name:        p.longBusinessSummary?.split(".")[0] || symbol,
    exchange:    p.exchange || "",
    industry:    p.industry || "",
    sector:      p.sector || "",
    description: p.longBusinessSummary || "",
    marketCap:   s.marketCap || 0,
    pe:          s.trailingPE || null,
    eps:         null,
    week52High:  s.fiftyTwoWeekHigh || null,
    week52Low:   s.fiftyTwoWeekLow  || null,
    website:     p.website || "",
  };
};

module.exports = { getQuote, getCandles, getNews, searchSymbol, getProfile };
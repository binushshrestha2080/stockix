// const axios = require("axios");
// const cache = require("./cache");

// const SHAREBAZAAR = "https://nepsetty.kokomo.workers.dev/api";
// const NEPSEAPI    = "https://nepseapi.surajrimal.dev/api/v1";

// // ── Live quote ─────────────────────────────────────────────────────────────────
// const getQuote = async (symbol) => {
//   const key    = `nepse:quote:${symbol}`;
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${SHAREBAZAAR}?symbol=${symbol}`, { timeout: 10000 });
//     const result = {
//       symbol:      data.symbol,
//       name:        data.company_name,
//       ltp:         data.ltp,
//       change:      data.change || 0,
//       changePct:   data.change_percent || 0,
//       high:        data.high || data.ltp,
//       low:         data.low  || data.ltp,
//       open:        data.open || data.ltp,
//       volume:      data.volume || 0,
//       turnover:    data.turnover || 0,
//       lastUpdated: data.last_updated,
//     };
//     cache.set(key, result, 60); // 1 min cache
//     return result;
//   } catch (err) {
//     throw new Error(`No data for ${symbol}: ${err.message}`);
//   }
// };

// // ── Historical prices ──────────────────────────────────────────────────────────
// const getHistory = async (symbol, days = 100) => {
//   const key    = `nepse:history:${symbol}:${days}`;
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/stock/history`, {
//       params: { symbol, days },
//       timeout: 15000,
//     });

//     if (!data || !data.data || data.data.length === 0)
//       throw new Error(`No history for ${symbol}`);

//     const sorted = data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
//     const result = {
//       symbol,
//       data: sorted.map(d => ({
//         date:   d.date,
//         open:   parseFloat(d.open)   || 0,
//         high:   parseFloat(d.high)   || 0,
//         low:    parseFloat(d.low)    || 0,
//         close:  parseFloat(d.close)  || 0,
//         volume: parseFloat(d.volume) || 0,
//       })),
//     };
//     cache.set(key, result, 3600); // 1hr cache
//     return result;
//   } catch (err) {
//     throw new Error(`History fetch failed for ${symbol}: ${err.message}`);
//   }
// };

// // ── Top gainers ────────────────────────────────────────────────────────────────
// const getTopGainers = async () => {
//   const key    = "nepse:gainers";
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/market/top-gainers`, { timeout: 10000 });
//     const result   = (data.data || data || []).slice(0, 10).map(s => ({
//       symbol:    s.symbol,
//       name:      s.companyName || s.name || s.symbol,
//       ltp:       s.ltp || s.lastTradedPrice,
//       change:    s.pointChange || s.change || 0,
//       changePct: s.percentChange || s.changePercent || 0,
//     }));
//     cache.set(key, result, 300);
//     return result;
//   } catch (err) {
//     throw new Error("Failed to fetch top gainers");
//   }
// };

// // ── Top losers ─────────────────────────────────────────────────────────────────
// const getTopLosers = async () => {
//   const key    = "nepse:losers";
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/market/top-losers`, { timeout: 10000 });
//     const result   = (data.data || data || []).slice(0, 10).map(s => ({
//       symbol:    s.symbol,
//       name:      s.companyName || s.name || s.symbol,
//       ltp:       s.ltp || s.lastTradedPrice,
//       change:    s.pointChange || s.change || 0,
//       changePct: s.percentChange || s.changePercent || 0,
//     }));
//     cache.set(key, result, 300);
//     return result;
//   } catch (err) {
//     throw new Error("Failed to fetch top losers");
//   }
// };

// // ── NEPSE Index ────────────────────────────────────────────────────────────────
// const getIndex = async () => {
//   const key    = "nepse:index";
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/market/summary`, { timeout: 10000 });
//     const result = {
//       nepse:      data.nepse      || data.index      || 0,
//       change:     data.change     || 0,
//       changePct:  data.changePct  || data.changePercent || 0,
//       turnover:   data.turnover   || 0,
//       totalTrades:data.totalTrades|| 0,
//       advancers:  data.advancers  || 0,
//       decliners:  data.decliners  || 0,
//       unchanged:  data.unchanged  || 0,
//     };
//     cache.set(key, result, 60);
//     return result;
//   } catch (err) {
//     throw new Error("Failed to fetch NEPSE index");
//   }
// };

// // ── Sector summary ─────────────────────────────────────────────────────────────
// const getSectors = async () => {
//   const key    = "nepse:sectors";
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/market/sector-summary`, { timeout: 10000 });
//     const result   = (data.data || data || []).map(s => ({
//       sector:    s.sectorName || s.sector,
//       index:     s.sectorIndex || s.index || 0,
//       change:    s.pointChange || s.change || 0,
//       changePct: s.percentChange || s.changePercent || 0,
//       turnover:  s.turnover || 0,
//     }));
//     cache.set(key, result, 300);
//     return result;
//   } catch (err) {
//     throw new Error("Failed to fetch sectors");
//   }
// };

// // ── Company fundamentals ───────────────────────────────────────────────────────
// const getFundamentals = async (symbol) => {
//   const key    = `nepse:fundamentals:${symbol}`;
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/stock/fundamentals`, {
//       params: { symbol },
//       timeout: 10000,
//     });
//     const d      = data.data || data;
//     const result = {
//       symbol,
//       eps:        d.eps        || d.earningsPerShare || 0,
//       pe:         d.pe         || d.priceToEarnings  || 0,
//       bookValue:  d.bookValue  || d.bvps             || 0,
//       pbRatio:    d.pbRatio    || d.priceToBook       || 0,
//       marketCap:  d.marketCap  || 0,
//       sharesOut:  d.sharesOutstanding || 0,
//       dividend:   d.dividend   || 0,
//       high52w:    d.fiftyTwoWeekHigh  || 0,
//       low52w:     d.fiftyTwoWeekLow   || 0,
//       sector:     d.sector     || "",
//     };
//     cache.set(key, result, 3600);
//     return result;
//   } catch (err) {
//     throw new Error(`Fundamentals fetch failed for ${symbol}`);
//   }
// };

// // ── Search NEPSE stocks ────────────────────────────────────────────────────────
// const searchStocks = async (query) => {
//   const key    = `nepse:search:${query}`;
//   const cached = cache.get(key);
//   if (cached) return cached;

//   try {
//     const { data } = await axios.get(`${NEPSEAPI}/stock/search`, {
//       params: { q: query },
//       timeout: 10000,
//     });
//     const result = (data.data || data || []).slice(0, 10).map(s => ({
//       symbol: s.symbol,
//       name:   s.companyName || s.name || s.symbol,
//       sector: s.sector || "",
//     }));
//     cache.set(key, result, 3600);
//     return result;
//   } catch (err) {
//     return [];
//   }
// };

// module.exports = { getQuote, getHistory, getTopGainers, getTopLosers, getIndex, getSectors, getFundamentals, searchStocks };



const axios = require("axios");
const cache = require("./cache");

const SHAREBAZAAR = "https://nepsetty.kokomo.workers.dev/api";
const NEPSEAPI    = "https://nepseapi.surajrimal.dev";

const api = axios.create({ timeout: 15000 });

// ── Live quote ─────────────────────────────────────────────────────────────────
const getQuote = async (symbol) => {
  const key    = `nepse:quote:${symbol}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${SHAREBAZAAR}?symbol=${symbol}`);
  const result = {
    symbol:    data.symbol,
    name:      data.company_name,
    ltp:       data.ltp,
    change:    data.change       || 0,
    changePct: data.change_percent || 0,
    high:      data.high         || data.ltp,
    low:       data.low          || data.ltp,
    open:      data.open         || data.ltp,
    volume:    data.volume       || 0,
    turnover:  data.turnover     || 0,
    lastUpdated: data.last_updated,
  };
  cache.set(key, result, 60);
  return result;
};

// ── Historical prices ──────────────────────────────────────────────────────────
const getHistory = async (symbol, days = 100) => {
  const key    = `nepse:history:${symbol}:${days}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/CompanyPriceHistory/${symbol}`);
  const raw = Array.isArray(data) ? data : (data.data || data.companyDailyPriceList || []);

  if (!raw || raw.length === 0) throw new Error(`No history for ${symbol}`);

  const sorted = raw
    .sort((a, b) => new Date(a.businessDate || a.date) - new Date(b.businessDate || b.date))
    .slice(-days);

  const result = {
    symbol,
    data: sorted.map(d => ({
      date:   d.businessDate || d.date,
      open:   parseFloat(d.openPrice  || d.open)   || 0,
      high:   parseFloat(d.highPrice  || d.high)   || 0,
      low:    parseFloat(d.lowPrice   || d.low)    || 0,
      close:  parseFloat(d.closePrice || d.close || d.ltp) || 0,
      volume: parseFloat(d.totalTradedQuantity || d.volume) || 0,
    })),
  };
  cache.set(key, result, 3600);
  return result;
};

// ── Market summary / index ─────────────────────────────────────────────────────
const getIndex = async () => {
  const key    = "nepse:index";
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/Summary`);
  const result = {
    nepse:       data["Current Nepse Index"]      || data.nepseIndex || 0,
    change:      data["Change In Nepse Index"]    || 0,
    changePct:   data["Nepse Index Change Percentage"] || 0,
    turnover:    data["Total Turnover Rs:"]       || 0,
    totalTrades: data["Total Transactions"]       || 0,
    tradedShares:data["Total Traded Shares"]      || 0,
    totalScrips: data["Total Scrips Traded"]      || 0,
  };
  cache.set(key, result, 60);
  return result;
};

// ── Top gainers ────────────────────────────────────────────────────────────────
const getTopGainers = async () => {
  const key    = "nepse:gainers";
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/TopGainers`);
  const raw    = Array.isArray(data) ? data : (data.data || []);
  const result = raw.slice(0, 10).map(s => ({
    symbol:    s.symbol,
    name:      s.securityName || s.companyName || s.symbol,
    ltp:       s.lastTradedPrice || s.ltp || 0,
    change:    s.pointChange || s.change || 0,
    changePct: s.percentageChange || s.changePct || 0,
  }));
  cache.set(key, result, 300);
  return result;
};

// ── Top losers ─────────────────────────────────────────────────────────────────
const getTopLosers = async () => {
  const key    = "nepse:losers";
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/TopLosers`);
  const raw    = Array.isArray(data) ? data : (data.data || []);
  const result = raw.slice(0, 10).map(s => ({
    symbol:    s.symbol,
    name:      s.securityName || s.companyName || s.symbol,
    ltp:       s.lastTradedPrice || s.ltp || 0,
    change:    s.pointChange || s.change || 0,
    changePct: s.percentageChange || s.changePct || 0,
  }));
  cache.set(key, result, 300);
  return result;
};

// ── Sector summary ─────────────────────────────────────────────────────────────
const getSectors = async () => {
  const key    = "nepse:sectors";
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/NepseIndex`);
  const raw    = Array.isArray(data) ? data : (data.data || []);
  const result = raw.map(s => ({
    sector:    s.index || s.sectorName || s.indexName,
    value:     s.currentValue || s.value || 0,
    change:    s.change || 0,
    changePct: s.perChange || s.changePct || 0,
  }));
  cache.set(key, result, 300);
  return result;
};

// ── Company fundamentals ───────────────────────────────────────────────────────
const getFundamentals = async (symbol) => {
  const key    = `nepse:fundamentals:${symbol}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { data } = await api.get(`${NEPSEAPI}/CompanyDetails/${symbol}`);
  const d      = data.companyDetails || data.data || data;
  const result = {
    symbol,
    name:       d.companyName       || symbol,
    sector:     d.sectorName        || "",
    eps:        d.eps               || 0,
    pe:         d.peRatio           || 0,
    bookValue:  d.bookValue         || 0,
    pbRatio:    d.pbRatio           || 0,
    marketCap:  d.marketCapitalization || 0,
    high52w:    d.fiftyTwoWeekHigh  || 0,
    low52w:     d.fiftyTwoWeekLow   || 0,
    totalShares:d.totalListedShares || 0,
  };
  cache.set(key, result, 3600);
  return result;
};

// ── Search stocks ──────────────────────────────────────────────────────────────
const searchStocks = async (query) => {
  const key    = `nepse:search:${query}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const { data } = await api.get(`${NEPSEAPI}/SecurityList`);
    const all    = Array.isArray(data) ? data : (data.data || []);
    const q      = query.toUpperCase();
    const result = all
      .filter(s => s.symbol?.toUpperCase().includes(q) || s.securityName?.toUpperCase().includes(q))
      .slice(0, 10)
      .map(s => ({ symbol: s.symbol, name: s.securityName || s.symbol, sector: s.sectorName || "" }));
    cache.set(key, result, 3600);
    return result;
  } catch {
    return [];
  }
};

module.exports = { getQuote, getHistory, getTopGainers, getTopLosers, getIndex, getSectors, getFundamentals, searchStocks };
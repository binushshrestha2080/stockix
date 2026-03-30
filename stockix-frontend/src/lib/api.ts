const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Stocks ────────────────────────────────────────────────────────────────────
export const getQuote      = (symbol: string)                        => request(`/stocks/quote/${symbol}`);
export const getCandles    = (symbol: string, resolution = "D")      => request(`/stocks/candles/${symbol}?resolution=${resolution}`);
export const getNews       = (symbol: string)                        => request(`/stocks/news/${symbol}`);
export const searchStocks  = (q: string)                             => request(`/stocks/search?q=${q}`);
export const getProfile    = (symbol: string)                        => request(`/stocks/profile/${symbol}`);

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const getPortfolio    = ()                                    => request("/portfolio");
export const addPosition     = (body: object)                        => request("/portfolio", { method: "POST", body: JSON.stringify(body) });
export const updatePosition  = (symbol: string, body: object)        => request(`/portfolio/${symbol}`, { method: "PUT", body: JSON.stringify(body) });
export const deletePosition  = (symbol: string)                      => request(`/portfolio/${symbol}`, { method: "DELETE" });

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlist    = ()                                    => request("/watchlist");
export const addToWatchlist  = (body: object)                        => request("/watchlist", { method: "POST", body: JSON.stringify(body) });
export const updateWatchlist = (symbol: string, body: object)        => request(`/watchlist/${symbol}`, { method: "PUT", body: JSON.stringify(body) });
export const removeFromWatchlist = (symbol: string)                  => request(`/watchlist/${symbol}`, { method: "DELETE" });

// ── Analysis ──────────────────────────────────────────────────────────────────
export const getFullAnalysis = (symbol: string)                      => request(`/analysis/${symbol}`);
export const getLinearReg    = (symbol: string, days = 7)            => request(`/analysis/${symbol}/linear-regression?days=${days}`);
export const getSMA          = (symbol: string, period = 14)         => request(`/analysis/${symbol}/sma?period=${period}`);
export const getEMA          = (symbol: string, period = 12)         => request(`/analysis/${symbol}/ema?period=${period}`);
export const getRSI          = (symbol: string, period = 14)         => request(`/analysis/${symbol}/rsi?period=${period}`);
export const getMACD         = (symbol: string)                      => request(`/analysis/${symbol}/macd`);
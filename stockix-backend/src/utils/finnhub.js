const axios = require("axios");

const BASE = "https://finnhub.io/api/v1";

const finnhub = axios.create({
  baseURL: BASE,
  params: { token: process.env.FINNHUB_API_KEY },
  timeout: 8000,
});

// GET /quote  — real-time price
const getQuote = async (symbol) => {
  const { data } = await finnhub.get("/quote", { params: { symbol } });
  return data;
};

// GET /stock/candle  — OHLCV historical data
const getCandles = async (symbol, resolution = "D", from, to) => {
  const now   = to   || Math.floor(Date.now() / 1000);
  const start = from || now - 365 * 24 * 60 * 60; // 1 year default
  const { data } = await finnhub.get("/stock/candle", {
    params: { symbol, resolution, from: start, to: now },
  });
  return data;
};

// GET /company-news
const getNews = async (symbol, from, to) => {
  const today    = to   || new Date().toISOString().slice(0, 10);
  const weekAgo  = from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data } = await finnhub.get("/company-news", {
    params: { symbol, from: weekAgo, to: today },
  });
  return data.slice(0, 10);
};

// GET /search
const searchSymbol = async (query) => {
  const { data } = await finnhub.get("/search", { params: { q: query } });
  return data.result?.slice(0, 8) || [];
};

// GET /stock/profile2
const getProfile = async (symbol) => {
  const { data } = await finnhub.get("/stock/profile2", { params: { symbol } });
  return data;
};

module.exports = { getQuote, getCandles, getNews, searchSymbol, getProfile };
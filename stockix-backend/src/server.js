require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./utils/db");

const stockRoutes     = require("./routes/stocks");
const portfolioRoutes = require("./routes/portfolio");
const watchlistRoutes = require("./routes/watchlist");
const analysisRoutes  = require("./routes/analysis");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

// ── Database ────────────────────────────────────────────────────────────────────
connectDB();

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use("/api/stocks",    stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/analysis",  analysisRoutes);

// ── Health check ────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`STOCKIX backend running on port ${PORT}`));
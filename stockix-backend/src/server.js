require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const connectDB = require("./utils/db");
const { requireAuth, requireAdmin } = require("./middleware/auth");

const authRoutes      = require("./routes/auth");
const stockRoutes     = require("./routes/stocks");
const portfolioRoutes = require("./routes/portfolio");
const watchlistRoutes = require("./routes/watchlist");
const analysisRoutes  = require("./routes/analysis");
const adminRoutes     = require("./routes/admin");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

connectDB();

app.use("/api/auth",      authRoutes);
app.use("/api/stocks",    stockRoutes);
app.use("/api/portfolio", requireAuth, portfolioRoutes);
app.use("/api/watchlist", requireAuth, watchlistRoutes);
app.use("/api/analysis",  requireAuth, analysisRoutes);
app.use("/api/admin",     requireAuth, requireAdmin, adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`STOCKIX backend running on port ${PORT}`));
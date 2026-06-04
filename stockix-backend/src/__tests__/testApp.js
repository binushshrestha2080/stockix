// Test app — sets up Express without starting the server
// Used by supertest to make fake HTTP requests
require("dotenv").config();
process.env.JWT_SECRET = "test_secret_key_for_jest_testing_only";

const express  = require("express");
const cors     = require("cors");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const authRoutes   = require("../routes/auth");
const alertRoutes  = require("../routes/alerts");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth",   authRoutes);
app.use("/api/alerts", requireAuth, alertRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
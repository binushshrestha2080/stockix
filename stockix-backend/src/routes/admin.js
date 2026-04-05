const express   = require("express");
const router    = express.Router();
const User      = require("../models/User");
const Portfolio = require("../models/Portfolio");
const Watchlist = require("../models/Watchlist");

// GET /api/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const totalUsers      = await User.countDocuments({ role: "user" });
    const totalPortfolios = await Portfolio.countDocuments();
    const totalWatchlists = await Watchlist.countDocuments();
    const portfolios      = await Portfolio.find({});
    const watchlists      = await Watchlist.find({});
    const totalPositions  = portfolios.reduce((s, p) => s + p.positions.length, 0);
    const totalWatching   = watchlists.reduce((s, w) => s + w.items.length, 0);
    res.json({ totalUsers, totalPortfolios, totalWatchlists, totalPositions, totalWatching });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    // Enrich with portfolio and watchlist counts
    const enriched = await Promise.all(users.map(async (u) => {
      const portfolio = await Portfolio.findOne({ userId: u._id.toString() });
      const watchlist = await Watchlist.findOne({ userId: u._id.toString() });
      return {
        ...u.toObject(),
        positionCount: portfolio?.positions?.length || 0,
        watchlistCount: watchlist?.items?.length || 0,
      };
    }));
    res.json(enriched);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(403).json({ error: "Cannot delete admin" });
    await User.findByIdAndDelete(req.params.id);
    await Portfolio.deleteOne({ userId: req.params.id });
    await Watchlist.deleteOne({ userId: req.params.id });
    res.json({ message: "User and their data deleted" });
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:id — toggle active
router.put("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// GET /api/admin/portfolios — all portfolios with user info
router.get("/portfolios", async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({});
    const enriched   = await Promise.all(portfolios.map(async (p) => {
      const user = await User.findById(p.userId).select("name email");
      return { ...p.toObject(), user: user || { name: "Unknown", email: "Unknown" } };
    }));
    res.json(enriched);
  } catch (err) { next(err); }
});

// GET /api/admin/watchlists — all watchlists with user info
router.get("/watchlists", async (req, res, next) => {
  try {
    const watchlists = await Watchlist.find({});
    const enriched   = await Promise.all(watchlists.map(async (w) => {
      const user = await User.findById(w.userId).select("name email");
      return { ...w.toObject(), user: user || { name: "Unknown", email: "Unknown" } };
    }));
    res.json(enriched);
  } catch (err) { next(err); }
});

module.exports = router;
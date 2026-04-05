const express   = require("express");
const router    = express.Router();
const Portfolio = require("../models/Portfolio");

const { getQuote } = require("../utils/dataSource");



// ── GET /api/portfolio  — fetch all positions with live prices
router.get("/", async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) return res.json({ positions: [], totalValue: 0, totalCost: 0, totalPnl: 0 });

    // Enrich with live quotes
    const enriched = await Promise.all(
      portfolio.positions.map(async (pos) => {
        try {
          const q         = await getQuote(pos.symbol);
          const livePrice = q.c;
          const value     = livePrice * pos.quantity;
          const cost      = pos.avgCost * pos.quantity;
          const pnl       = value - cost;
          const pnlPct    = cost > 0 ? ((pnl / cost) * 100).toFixed(2) : "0.00";
          return { ...pos.toObject(), livePrice, value, cost, pnl: parseFloat(pnl.toFixed(2)), pnlPct: parseFloat(pnlPct), dayChange: q.d, dayChangePct: q.dp };
        } catch {
          return { ...pos.toObject(), livePrice: null, value: null, cost: pos.avgCost * pos.quantity, pnl: null };
        }
      })
    );

    const totalValue = enriched.reduce((s, p) => s + (p.value || 0), 0);
    const totalCost  = enriched.reduce((s, p) => s + p.cost, 0);
    const totalPnl   = totalValue - totalCost;

    res.json({
      positions: enriched,
      totalValue:  parseFloat(totalValue.toFixed(2)),
      totalCost:   parseFloat(totalCost.toFixed(2)),
      totalPnl:    parseFloat(totalPnl.toFixed(2)),
      totalPnlPct: totalCost > 0 ? parseFloat(((totalPnl / totalCost) * 100).toFixed(2)) : 0,
    });
  } catch (err) { next(err); }
});

// ── POST /api/portfolio  — add a new position
router.post("/", async (req, res, next) => {
  try {
    const { symbol, quantity, avgCost, name, sector } = req.body;
    if (!symbol || !quantity || !avgCost)
      return res.status(400).json({ error: "symbol, quantity and avgCost are required" });

    let portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) portfolio = new Portfolio({ userId: req.user.id, positions: [] });

    // If symbol already exists, update it instead
    const existing = portfolio.positions.find((p) => p.symbol === symbol.toUpperCase());
    if (existing) {
      const totalQty  = existing.quantity + Number(quantity);
      const totalCost = existing.avgCost * existing.quantity + Number(avgCost) * Number(quantity);
      existing.avgCost   = parseFloat((totalCost / totalQty).toFixed(4));
      existing.quantity  = totalQty;
      existing.updatedAt = new Date();
    } else {
      portfolio.positions.push({ symbol: symbol.toUpperCase(), quantity: Number(quantity), avgCost: Number(avgCost), name: name || "", sector: sector || "Other" });
    }

    await portfolio.save();
    res.status(201).json({ message: "Position saved", portfolio });
  } catch (err) { next(err); }
});

// ── PUT /api/portfolio/:symbol  — update quantity or avgCost
router.put("/:symbol", async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    const pos = portfolio.positions.find((p) => p.symbol === req.params.symbol.toUpperCase());
    if (!pos) return res.status(404).json({ error: "Position not found" });

    const { quantity, avgCost, name, sector } = req.body;
    if (quantity !== undefined) pos.quantity  = Number(quantity);
    if (avgCost  !== undefined) pos.avgCost   = Number(avgCost);
    if (name     !== undefined) pos.name      = name;
    if (sector   !== undefined) pos.sector    = sector;
    pos.updatedAt = new Date();

    await portfolio.save();
    res.json({ message: "Position updated", position: pos });
  } catch (err) { next(err); }
});

// ── DELETE /api/portfolio/:symbol  — remove a position
router.delete("/:symbol", async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    const before = portfolio.positions.length;
    portfolio.positions = portfolio.positions.filter((p) => p.symbol !== req.params.symbol.toUpperCase());

    if (portfolio.positions.length === before)
      return res.status(404).json({ error: "Position not found" });

    await portfolio.save();
    res.json({ message: `${req.params.symbol.toUpperCase()} removed from portfolio` });
  } catch (err) { next(err); }
});

module.exports = router;

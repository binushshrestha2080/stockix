const express   = require("express");
const router    = express.Router();
const Watchlist = require("../models/Watchlist");
const { getQuote } = require("../utils/finnhub");

const USER_ID = "default";

// ── GET /api/watchlist  — get all items with live prices
router.get("/", async (req, res, next) => {
  try {
    let wl = await Watchlist.findOne({ userId: USER_ID });
    if (!wl) return res.json([]);

    const enriched = await Promise.all(
      wl.items.map(async (item) => {
        try {
          const q = await getQuote(item.symbol);
          return { ...item.toObject(), price: q.c, change: q.d, changePct: q.dp, high: q.h, low: q.l, open: q.o };
        } catch {
          return { ...item.toObject(), price: null };
        }
      })
    );
    res.json(enriched);
  } catch (err) { next(err); }
});

// ── POST /api/watchlist  — add symbol
router.post("/", async (req, res, next) => {
  try {
    const { symbol, name, notes } = req.body;
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    let wl = await Watchlist.findOne({ userId: USER_ID });
    if (!wl) wl = new Watchlist({ userId: USER_ID, items: [] });

    const exists = wl.items.find((i) => i.symbol === symbol.toUpperCase());
    if (exists) return res.status(409).json({ error: "Symbol already in watchlist" });

    wl.items.push({ symbol: symbol.toUpperCase(), name: name || "", notes: notes || "" });
    await wl.save();
    res.status(201).json({ message: "Added to watchlist" });
  } catch (err) { next(err); }
});

// ── PUT /api/watchlist/:symbol  — update notes
router.put("/:symbol", async (req, res, next) => {
  try {
    const wl = await Watchlist.findOne({ userId: USER_ID });
    if (!wl) return res.status(404).json({ error: "Watchlist not found" });

    const item = wl.items.find((i) => i.symbol === req.params.symbol.toUpperCase());
    if (!item) return res.status(404).json({ error: "Symbol not found" });

    if (req.body.notes !== undefined) item.notes = req.body.notes;
    if (req.body.name  !== undefined) item.name  = req.body.name;
    await wl.save();
    res.json({ message: "Updated", item });
  } catch (err) { next(err); }
});

// ── DELETE /api/watchlist/:symbol  — remove symbol
router.delete("/:symbol", async (req, res, next) => {
  try {
    const wl = await Watchlist.findOne({ userId: USER_ID });
    if (!wl) return res.status(404).json({ error: "Watchlist not found" });

    wl.items = wl.items.filter((i) => i.symbol !== req.params.symbol.toUpperCase());
    await wl.save();
    res.json({ message: `${req.params.symbol.toUpperCase()} removed from watchlist` });
  } catch (err) { next(err); }
});

module.exports = router;
// Watchlist Model — Unit Tests
const mongoose  = require("mongoose");
const Watchlist = require("../models/Watchlist");

beforeAll(async () => { await mongoose.connect("mongodb://127.0.0.1/test_watchlist"); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
afterEach(async () => { await Watchlist.deleteMany({}); });

describe("Watchlist Model — valid data", () => {

  test("should save a watchlist with one item", async () => {
    const wl = new Watchlist({
      userId: "user123",
      items:  [{ symbol: "AAPL", name: "Apple Inc." }],
    });
    const saved = await wl.save();
    expect(saved.items.length).toBe(1);
    expect(saved.items[0].symbol).toBe("AAPL");
  });

  test("should save multiple watchlist items", async () => {
    const wl = new Watchlist({
      userId: "user123",
      items: [{ symbol: "AAPL" }, { symbol: "TSLA" }, { symbol: "NVDA" }],
    });
    const saved = await wl.save();
    expect(saved.items.length).toBe(3);
  });

  test("should uppercase symbol automatically", async () => {
    const wl = new Watchlist({
      userId: "user123",
      items: [{ symbol: "aapl" }],
    });
    const saved = await wl.save();
    expect(saved.items[0].symbol).toBe("AAPL");
  });

  test("should save optional note on item", async () => {
    const wl = new Watchlist({
      userId: "user123",
      items: [{ symbol: "AAPL", notes: "watching for breakout" }],
    });
    const saved = await wl.save();
    expect(saved.items[0].notes).toBe("watching for breakout");
  });

  test("should allow adding item to existing watchlist", async () => {
    const wl = await Watchlist.create({
      userId: "user123",
      items: [{ symbol: "AAPL" }],
    });
    wl.items.push({ symbol: "TSLA" });
    await wl.save();
    const updated = await Watchlist.findById(wl._id);
    expect(updated.items.length).toBe(2);
  });

  test("should allow removing item from watchlist", async () => {
    const wl = await Watchlist.create({
      userId: "user123",
      items: [{ symbol: "AAPL" }, { symbol: "TSLA" }],
    });
    wl.items = wl.items.filter(i => i.symbol !== "AAPL");
    await wl.save();
    const updated = await Watchlist.findById(wl._id);
    expect(updated.items.length).toBe(1);
    expect(updated.items[0].symbol).toBe("TSLA");
  });

});

describe("Watchlist Model — invalid data", () => {

  test("should reject item with no symbol", async () => {
    const wl = new Watchlist({
      userId: "user123",
      items: [{ name: "Apple" }],  // missing symbol
    });
    await expect(wl.save()).rejects.toThrow();
  });

});
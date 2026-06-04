// Portfolio Model — Unit Tests
const mongoose  = require("mongoose");
const Portfolio = require("../models/Portfolio");

beforeAll(async () => { await mongoose.connect("mongodb://127.0.0.1/test_portfolio"); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
afterEach(async () => { await Portfolio.deleteMany({}); });

describe("Portfolio Model — valid data", () => {

  test("should save a portfolio with one position", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [{ symbol: "AAPL", quantity: 10, avgCost: 150 }],
    });
    const saved = await portfolio.save();
    expect(saved.positions.length).toBe(1);
    expect(saved.positions[0].symbol).toBe("AAPL");
    expect(saved.positions[0].quantity).toBe(10);
    expect(saved.positions[0].avgCost).toBe(150);
  });

  test("should save a portfolio with multiple positions", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [
        { symbol: "AAPL", quantity: 10, avgCost: 150 },
        { symbol: "TSLA", quantity: 5,  avgCost: 200 },
        { symbol: "NVDA", quantity: 2,  avgCost: 500 },
      ],
    });
    const saved = await portfolio.save();
    expect(saved.positions.length).toBe(3);
  });

  test("should uppercase the symbol automatically", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [{ symbol: "aapl", quantity: 10, avgCost: 150 }],
    });
    const saved = await portfolio.save();
    expect(saved.positions[0].symbol).toBe("AAPL");
  });

  test("should default sector to Other", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [{ symbol: "AAPL", quantity: 10, avgCost: 150 }],
    });
    const saved = await portfolio.save();
    expect(saved.positions[0].sector).toBe("Other");
  });

  test("should allow adding a position later", async () => {
    const portfolio = await Portfolio.create({
      userId: "user123",
      positions: [{ symbol: "AAPL", quantity: 10, avgCost: 150 }],
    });
    portfolio.positions.push({ symbol: "TSLA", quantity: 5, avgCost: 200 });
    await portfolio.save();
    const updated = await Portfolio.findById(portfolio._id);
    expect(updated.positions.length).toBe(2);
  });

  test("should allow removing a position", async () => {
    const portfolio = await Portfolio.create({
      userId: "user123",
      positions: [
        { symbol: "AAPL", quantity: 10, avgCost: 150 },
        { symbol: "TSLA", quantity: 5,  avgCost: 200 },
      ],
    });
    portfolio.positions = portfolio.positions.filter(p => p.symbol !== "AAPL");
    await portfolio.save();
    const updated = await Portfolio.findById(portfolio._id);
    expect(updated.positions.length).toBe(1);
    expect(updated.positions[0].symbol).toBe("TSLA");
  });

});

describe("Portfolio Model — invalid data", () => {

  test("should reject position with no symbol", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [{ quantity: 10, avgCost: 150 }],  // missing symbol
    });
    await expect(portfolio.save()).rejects.toThrow();
  });

  test("should reject position with no quantity", async () => {
    const portfolio = new Portfolio({
      userId: "user123",
      positions: [{ symbol: "AAPL", avgCost: 150 }],  // missing quantity
    });
    await expect(portfolio.save()).rejects.toThrow();
  });

});
// Alert Model — Unit Tests
// These tests check that the Alert schema accepts good data and rejects bad data
// No real database needed — mongoose validates in memory

const mongoose = require("mongoose");

// Import the Alert model we built
const Alert = require("../models/Alert");

// ── Setup: connect to in-memory database before all tests ──────────────────
beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1/test_alerts", {
    serverSelectionTimeoutMS: 5000,
  });
});

// ── Teardown: disconnect after all tests finish ──────────────────────────
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── Clear alerts between each test so they don t interfere ─────────────────
afterEach(async () => {
  await Alert.deleteMany({});
});

// ============================================================
// TEST GROUP 1: Creating a valid alert
// ============================================================
describe("Alert Model — valid data", () => {

  test("should save a valid alert successfully", async () => {
    // Arrange: create a valid alert object
    const validAlert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "AAPL",
      targetPrice: 150,
      condition:   "below",
    });

    // Act: save it to the database
    const saved = await validAlert.save();

    // Assert: check it was saved with correct values
    expect(saved._id).toBeDefined();           // MongoDB gave it an ID
    expect(saved.symbol).toBe("AAPL");         // symbol is correct
    expect(saved.targetPrice).toBe(150);       // price is correct
    expect(saved.condition).toBe("below");     // condition is correct
    expect(saved.isTriggered).toBe(false);     // default: not triggered
    expect(saved.isActive).toBe(true);         // default: active
    expect(saved.triggeredAt).toBeNull();      // default: not triggered yet
  });

  test("should auto-uppercase the symbol", async () => {
    // Arrange: symbol in lowercase
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "aapl",   // lowercase
      targetPrice: 150,
      condition:   "below",
    });

    // Act
    const saved = await alert.save();

    // Assert: should be uppercased automatically
    expect(saved.symbol).toBe("AAPL");
  });

  test("should save optional note if provided", async () => {
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "TSLA",
      targetPrice: 200,
      condition:   "above",
      note:        "buy signal",
    });
    const saved = await alert.save();
    expect(saved.note).toBe("buy signal");
  });

});

// ============================================================
// TEST GROUP 2: Rejecting invalid data
// ============================================================
describe("Alert Model — invalid data", () => {

  test("should reject alert with no symbol", async () => {
    // Arrange: missing symbol
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      targetPrice: 150,
      condition:   "below",
    });

    // Act + Assert: saving should throw a validation error
    await expect(alert.save()).rejects.toThrow();
  });

  test("should reject alert with negative price", async () => {
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "AAPL",
      targetPrice: -50,    // negative price — invalid
      condition:   "below",
    });
    await expect(alert.save()).rejects.toThrow();
  });

  test("should reject condition that is not above or below", async () => {
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "AAPL",
      targetPrice: 150,
      condition:   "sideways",   // not a valid condition
    });
    await expect(alert.save()).rejects.toThrow();
  });

  test("should reject alert with no userId", async () => {
    const alert = new Alert({
      symbol:      "AAPL",
      targetPrice: 150,
      condition:   "below",
      // no userId
    });
    await expect(alert.save()).rejects.toThrow();
  });

  test("should reject note longer than 200 characters", async () => {
    const alert = new Alert({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "AAPL",
      targetPrice: 150,
      condition:   "below",
      note:        "x".repeat(201),   // 201 chars — too long
    });
    await expect(alert.save()).rejects.toThrow();
  });

});

// ============================================================
// TEST GROUP 3: Business logic
// ============================================================
describe("Alert Model — business logic", () => {

  test("should be able to mark an alert as triggered", async () => {
    // Arrange: create and save a valid alert
    const alert = await Alert.create({
      userId:      new mongoose.Types.ObjectId(),
      symbol:      "AAPL",
      targetPrice: 150,
      condition:   "below",
    });

    // Act: simulate what alertChecker does when price is hit
    alert.isTriggered    = true;
    alert.isActive       = false;
    alert.triggeredPrice = 148.50;
    alert.triggeredAt    = new Date();
    await alert.save();

    // Assert: fetch from DB and verify
    const updated = await Alert.findById(alert._id);
    expect(updated.isTriggered).toBe(true);
    expect(updated.isActive).toBe(false);       // no longer active
    expect(updated.triggeredPrice).toBe(148.50);
    expect(updated.triggeredAt).toBeDefined();
  });

  test("should be able to find all active alerts", async () => {
    // Arrange: create 3 alerts — 2 active, 1 triggered
    const uid = new mongoose.Types.ObjectId();
    await Alert.create([
      { userId: uid, symbol: "AAPL", targetPrice: 150, condition: "below", isActive: true  },
      { userId: uid, symbol: "TSLA", targetPrice: 200, condition: "above", isActive: true  },
      { userId: uid, symbol: "NVDA", targetPrice: 500, condition: "below", isActive: false },
    ]);

    // Act: query for active alerts (what alertChecker does)
    const activeAlerts = await Alert.find({ isActive: true });

    // Assert
    expect(activeAlerts.length).toBe(2);
    expect(activeAlerts.map(a => a.symbol)).toContain("AAPL");
    expect(activeAlerts.map(a => a.symbol)).toContain("TSLA");
    expect(activeAlerts.map(a => a.symbol)).not.toContain("NVDA");
  });

});
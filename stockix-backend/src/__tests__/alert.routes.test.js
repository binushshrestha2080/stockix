// Alert Routes — Integration Tests
// Tests the full HTTP request/response cycle for /api/alerts
const request  = require("supertest");
const mongoose = require("mongoose");
const app      = require("./testApp");
const User     = require("../models/User");
const Alert    = require("../models/Alert");

let token;

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1/test_alert_routes");
  // Register a user and get token for all tests
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ram", email: "ram@test.com", password: "password123" });
  token = res.body.token;
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => { await Alert.deleteMany({}); });

// ============================================================
// TEST GROUP 1: POST /api/alerts
// ============================================================
describe("POST /api/alerts", () => {

  test("should create alert with valid data", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });

    expect(res.status).toBe(201);
    expect(res.body.alert.symbol).toBe("AAPL");
    expect(res.body.alert.targetPrice).toBe(150);
    expect(res.body.alert.isActive).toBe(true);
    expect(res.body.alert.isTriggered).toBe(false);
  });

  test("should create alert with optional note", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "TSLA", targetPrice: 200, condition: "above", note: "buy signal" });

    expect(res.status).toBe(201);
    expect(res.body.alert.note).toBe("buy signal");
  });

  test("should reject alert with missing symbol", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ targetPrice: 150, condition: "below" });

    expect(res.status).toBe(400);
  });

  test("should reject alert with invalid condition", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "sideways" });

    expect(res.status).toBe(400);
  });

  test("should reject duplicate active alert for same symbol and condition", async () => {
    await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });

    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 140, condition: "below" });

    expect(res.status).toBe(409);
  });

  test("should return 401 when no token provided", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });

    expect(res.status).toBe(401);
  });

});

// ============================================================
// TEST GROUP 2: GET /api/alerts
// ============================================================
describe("GET /api/alerts", () => {

  test("should return empty list when no alerts", async () => {
    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.alerts).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test("should return all alerts for logged in user", async () => {
    await request(app).post("/api/alerts").set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });
    await request(app).post("/api/alerts").set("Authorization", "Bearer " + token)
      .send({ symbol: "TSLA", targetPrice: 200, condition: "above" });

    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.active).toBe(2);
  });

  test("should filter by status=active", async () => {
    const res = await request(app)
      .get("/api/alerts?status=active")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.alerts.every(a => a.isActive)).toBe(true);
  });

});

// ============================================================
// TEST GROUP 3: DELETE /api/alerts/:id
// ============================================================
describe("DELETE /api/alerts/:id", () => {

  test("should delete an existing alert", async () => {
    const create = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });
    const id = create.body.alert._id;

    const res = await request(app)
      .delete("/api/alerts/" + id)
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test("should return 404 for non-existent alert", async () => {
    const fakeId = new (require("mongoose").Types.ObjectId)();
    const res = await request(app)
      .delete("/api/alerts/" + fakeId)
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(404);
  });

});

// ============================================================
// TEST GROUP 4: PATCH /api/alerts/:id/deactivate
// ============================================================
describe("PATCH /api/alerts/:id/deactivate", () => {

  test("should deactivate an active alert", async () => {
    const create = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });
    const id = create.body.alert._id;

    const res = await request(app)
      .patch("/api/alerts/" + id + "/deactivate")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.alert.isActive).toBe(false);
  });

  test("should return 400 when alert is already inactive", async () => {
    const create = await request(app)
      .post("/api/alerts")
      .set("Authorization", "Bearer " + token)
      .send({ symbol: "AAPL", targetPrice: 150, condition: "below" });
    const id = create.body.alert._id;

    await request(app)
      .patch("/api/alerts/" + id + "/deactivate")
      .set("Authorization", "Bearer " + token);

    const res = await request(app)
      .patch("/api/alerts/" + id + "/deactivate")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(400);
  });

});
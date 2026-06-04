// Auth Routes — Integration Tests
// Tests the full HTTP request/response cycle for /api/auth
const request  = require("supertest");
const mongoose = require("mongoose");
const app      = require("./testApp");
const User     = require("../models/User");

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1/test_auth_routes");
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
afterEach(async () => { await User.deleteMany({}); });

// ============================================================
// TEST GROUP 1: POST /api/auth/register
// ============================================================
describe("POST /api/auth/register", () => {

  test("should register a new user and return token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram Sharma", email: "ram@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("ram@test.com");
    expect(res.body.user.password).toBeUndefined(); // password never returned
  });

  test("should reject registration with missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram", password: "password123" });

    expect(res.status).toBe(400);
  });

  test("should reject registration with weak password (under 8 chars)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram", email: "ram@test.com", password: "123" });

    expect(res.status).toBe(400);
  });

  test("should reject duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram", email: "ram@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram2", email: "ram@test.com", password: "password456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already/i);
  });

});

// ============================================================
// TEST GROUP 2: POST /api/auth/login
// ============================================================
describe("POST /api/auth/login", () => {

  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram", email: "ram@test.com", password: "password123" });
  });

  test("should login with correct credentials and return token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ram@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("ram@test.com");
  });

  test("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ram@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test("should reject login with non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  test("should reject login with non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@test.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

});

// ============================================================
// TEST GROUP 3: GET /api/auth/me
// ============================================================
describe("GET /api/auth/me", () => {

  test("should return current user when token is valid", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ram", email: "ram@test.com", password: "password123" });
    const token = reg.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer " + token);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ram@test.com");
    expect(res.body.user.password).toBeUndefined();
  });

  test("should return 401 when no token provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("should return 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.status).toBe(401);
  });

});
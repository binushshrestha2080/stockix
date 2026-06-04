// User Model — Unit Tests
const mongoose = require("mongoose");
const User     = require("../models/User");

beforeAll(async () => { await mongoose.connect("mongodb://127.0.0.1/test_users"); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
afterEach(async () => { await User.deleteMany({}); });

describe("User Model — valid data", () => {

  test("should save a valid user", async () => {
    const user = new User({ name: "Ram Sharma", email: "ram@test.com", password: "password123" });
    const saved = await user.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe("Ram Sharma");
    expect(saved.email).toBe("ram@test.com");
    expect(saved.role).toBe("user");
    expect(saved.isActive).toBe(true);
  });

  test("should hash the password before saving", async () => {
    const user = new User({ name: "Ram", email: "ram2@test.com", password: "password123" });
    await user.save();
    expect(user.password).not.toBe("password123");
    expect(user.password.startsWith("$2")).toBe(true);
  });

  test("comparePassword should return true for correct password", async () => {
    const user = new User({ name: "Ram", email: "ram3@test.com", password: "password123" });
    await user.save();
    const match = await user.comparePassword("password123");
    expect(match).toBe(true);
  });

  test("comparePassword should return false for wrong password", async () => {
    const user = new User({ name: "Ram", email: "ram4@test.com", password: "password123" });
    await user.save();
    const match = await user.comparePassword("wrongpassword");
    expect(match).toBe(false);
  });

  test("toJSON should not include password", async () => {
    const user = new User({ name: "Ram", email: "ram5@test.com", password: "password123" });
    await user.save();
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.name).toBe("Ram");
  });

  test("should store email in lowercase", async () => {
    const user = new User({ name: "Ram", email: "RAM@TEST.COM", password: "password123" });
    await user.save();
    expect(user.email).toBe("ram@test.com");
  });

  test("should default role to user", async () => {
    const user = new User({ name: "Ram", email: "ram7@test.com", password: "password123" });
    await user.save();
    expect(user.role).toBe("user");
  });

  test("should allow role to be set to admin", async () => {
    const user = new User({ name: "Admin", email: "admin@test.com", password: "password123", role: "admin" });
    await user.save();
    expect(user.role).toBe("admin");
  });

});

describe("User Model — invalid data", () => {

  test("should reject user with no name", async () => {
    const user = new User({ email: "test@test.com", password: "password123" });
    await expect(user.save()).rejects.toThrow();
  });

  test("should reject user with no email", async () => {
    const user = new User({ name: "Ram", password: "password123" });
    await expect(user.save()).rejects.toThrow();
  });

  test("should reject duplicate email", async () => {
    await User.create({ name: "Ram", email: "duplicate@test.com", password: "password123" });
    const user2 = new User({ name: "Shyam", email: "duplicate@test.com", password: "password456" });
    await expect(user2.save()).rejects.toThrow();
  });

  test("should reject role that is not user or admin", async () => {
    const user = new User({ name: "Ram", email: "ram8@test.com", password: "password123", role: "superuser" });
    await expect(user.save()).rejects.toThrow();
  });

});
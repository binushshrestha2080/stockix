const mongoose = require("mongoose");
const User     = require("../models/User");
require("dotenv").config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: "admin@stockix.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  await User.create({
    name:     "Admin",
    email:    "admin@stockix.com",
    password: "admin123",
    role:     "admin",
  });

  console.log("✅ Admin created: admin@stockix.com / admin123");
  process.exit(0);
}

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
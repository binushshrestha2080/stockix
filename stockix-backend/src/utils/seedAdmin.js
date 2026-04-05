const mongoose = require("mongoose");
const User     = require("../models/User");
require("dotenv").config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  await User.deleteOne({ email: "admin@stockix.com" });

  await User.create({
    name:     "Admin",
    email:    "admin@stockix.com",
    password: "admin1234",
    role:     "admin",
  });

  console.log("✅ Admin created: admin@stockix.com / admin1234");
  process.exit(0);
}

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
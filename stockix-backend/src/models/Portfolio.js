const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema({
  symbol:    { type: String, required: true, uppercase: true, trim: true },
  name:      { type: String, default: "" },
  quantity:  { type: Number, required: true, min: 0 },
  avgCost:   { type: Number, required: true, min: 0 },
  sector:    { type: String, default: "Other" },
  addedAt:   { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const portfolioSchema = new mongoose.Schema({
  userId: { type: String, default: "default" },
  positions: [positionSchema],
}, { timestamps: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);
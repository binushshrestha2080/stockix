const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema({
  symbol:    { type: String, required: true, uppercase: true, trim: true },
  name:      { type: String, default: "" },
  addedAt:   { type: Date, default: Date.now },
  notes:     { type: String, default: "" },
});

const watchlistSchema = new mongoose.Schema({
  userId: { type: String, default: "default" },
  items:  [watchlistItemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
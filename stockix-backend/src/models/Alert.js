const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: ["above", "below"],
      required: true,
    },
    isTriggered: { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true  },
    triggeredPrice: { type: Number, default: null },
    triggeredAt:    { type: Date,   default: null },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { timestamps: true }
);

alertSchema.index({ isActive: 1 });
alertSchema.index({ userId: 1 });
alertSchema.index({ symbol: 1, isActive: 1 });

module.exports = mongoose.model("Alert", alertSchema);
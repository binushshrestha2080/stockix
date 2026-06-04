const fs = require("fs");
const path = require("path");

// ── validate middleware ──────────────────────────────────────────────────────
const validateMiddleware = [
  'const { validationResult } = require("express-validator");',
  '',
  'function validate(req, res, next) {',
  '  const errors = validationResult(req);',
  '  if (!errors.isEmpty()) {',
  '    return res.status(400).json({',
  '      errors: errors.array().map(function(e) {',
  '        return { field: e.path, message: e.msg };',
  '      })',
  '    });',
  '  }',
  '  next();',
  '}',
  '',
  'module.exports = validate;',
].join('\n');

// ── Alert model ──────────────────────────────────────────────────────────────
const alertModel = [
  'const mongoose = require("mongoose");',
  '',
  'const alertSchema = new mongoose.Schema(',
  '  {',
  '    userId: {',
  '      type: mongoose.Schema.Types.ObjectId,',
  '      ref: "User",',
  '      required: true,',
  '    },',
  '    symbol: {',
  '      type: String,',
  '      required: true,',
  '      trim: true,',
  '      uppercase: true,',
  '      maxlength: 20,',
  '    },',
  '    targetPrice: {',
  '      type: Number,',
  '      required: true,',
  '      min: 0,',
  '    },',
  '    condition: {',
  '      type: String,',
  '      enum: ["above", "below"],',
  '      required: true,',
  '    },',
  '    isTriggered: { type: Boolean, default: false },',
  '    isActive:    { type: Boolean, default: true  },',
  '    triggeredPrice: { type: Number, default: null },',
  '    triggeredAt:    { type: Date,   default: null },',
  '    note: {',
  '      type: String,',
  '      trim: true,',
  '      maxlength: 200,',
  '      default: "",',
  '    },',
  '  },',
  '  { timestamps: true }',
  ');',
  '',
  'alertSchema.index({ isActive: 1 });',
  'alertSchema.index({ userId: 1 });',
  'alertSchema.index({ symbol: 1, isActive: 1 });',
  '',
  'module.exports = mongoose.model("Alert", alertSchema);',
].join('\n');

// ── alerts route ─────────────────────────────────────────────────────────────
const alertsRoute = [
  'const express = require("express");',
  'const { body, param } = require("express-validator");',
  'const router = express.Router();',
  'const Alert = require("../models/Alert");',
  'const validate = require("../middleware/validate");',
  '',
  'const SYMBOL_RE = /^[A-Z0-9.]{1,20}$/;',
  '',
  'router.post("/", [',
  '  body("symbol").trim().toUpperCase().notEmpty().withMessage("Symbol is required").matches(SYMBOL_RE).withMessage("Invalid symbol"),',
  '  body("targetPrice").isFloat({ gt: 0 }).withMessage("Target price must be a positive number"),',
  '  body("condition").isIn(["above", "below"]).withMessage("Condition must be above or below"),',
  '  body("note").optional().trim().isLength({ max: 200 }).withMessage("Note too long"),',
  '], validate, async (req, res, next) => {',
  '  try {',
  '    const { symbol, targetPrice, condition, note } = req.body;',
  '    const duplicate = await Alert.findOne({ userId: req.user.id, symbol, condition, isActive: true });',
  '    if (duplicate) {',
  '      return res.status(409).json({ error: "You already have an active " + condition + " alert for " + symbol });',
  '    }',
  '    const alert = await Alert.create({ userId: req.user.id, symbol, targetPrice: Number(targetPrice), condition, note: note || "" });',
  '    res.status(201).json({ message: "Alert created", alert });',
  '  } catch (err) { next(err); }',
  '});',
  '',
  'router.get("/", async (req, res, next) => {',
  '  try {',
  '    const { status = "all" } = req.query;',
  '    const filter = { userId: req.user.id };',
  '    if (status === "active")    filter.isActive    = true;',
  '    if (status === "triggered") filter.isTriggered = true;',
  '    const alerts = await Alert.find(filter).sort({ createdAt: -1 });',
  '    const active    = alerts.filter(function(a) { return a.isActive; });',
  '    const triggered = alerts.filter(function(a) { return a.isTriggered; });',
  '    res.json({ total: alerts.length, active: active.length, triggered: triggered.length, alerts: alerts });',
  '  } catch (err) { next(err); }',
  '});',
  '',
  'router.get("/:id", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {',
  '  try {',
  '    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });',
  '    if (!alert) return res.status(404).json({ error: "Alert not found" });',
  '    res.json({ alert: alert });',
  '  } catch (err) { next(err); }',
  '});',
  '',
  'router.patch("/:id/deactivate", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {',
  '  try {',
  '    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });',
  '    if (!alert) return res.status(404).json({ error: "Alert not found" });',
  '    if (!alert.isActive) return res.status(400).json({ error: "Alert is already inactive" });',
  '    alert.isActive = false;',
  '    await alert.save();',
  '    res.json({ message: "Alert deactivated", alert: alert });',
  '  } catch (err) { next(err); }',
  '});',
  '',
  'router.delete("/:id", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {',
  '  try {',
  '    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });',
  '    if (!alert) return res.status(404).json({ error: "Alert not found" });',
  '    res.json({ message: "Alert deleted" });',
  '  } catch (err) { next(err); }',
  '});',
  '',
  'module.exports = router;',
].join('\n');

// ── Write all files ──────────────────────────────────────────────────────────
fs.writeFileSync(path.join("src", "middleware", "validate.js"), validateMiddleware);
console.log("Created: src/middleware/validate.js");

fs.writeFileSync(path.join("src", "models", "Alert.js"), alertModel);
console.log("Created: src/models/Alert.js");

fs.writeFileSync(path.join("src", "routes", "alerts.js"), alertsRoute);
console.log("Created: src/routes/alerts.js");

// ── Patch server.js ──────────────────────────────────────────────────────────
var serverPath = path.join("src", "server.js");
var server = fs.readFileSync(serverPath, "utf8");

if (server.includes("alertRoutes")) {
  console.log("server.js already patched -- skipping");
} else {
  server = server.replace(
    'const adminRoutes     = require("./routes/admin");',
    'const adminRoutes     = require("./routes/admin");\nconst alertRoutes     = require("./routes/alerts");'
  );
  server = server.replace(
    'app.use("/api/admin",     requireAuth, requireAdmin, adminRoutes);',
    'app.use("/api/admin",     requireAuth, requireAdmin, adminRoutes);\napp.use("/api/alerts",   requireAuth, alertRoutes);'
  );
  fs.writeFileSync(serverPath, server);
  console.log("Patched: src/server.js");
}

console.log("");
console.log("All done! Run: node --check src/server.js");

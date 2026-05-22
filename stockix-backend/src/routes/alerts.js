const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const Alert = require("../models/Alert");
const validate = require("../middleware/validate");

const SYMBOL_RE = /^[A-Z0-9.]{1,20}$/;

router.post("/", [
  body("symbol").trim().toUpperCase().notEmpty().withMessage("Symbol is required").matches(SYMBOL_RE).withMessage("Invalid symbol"),
  body("targetPrice").isFloat({ gt: 0 }).withMessage("Target price must be a positive number"),
  body("condition").isIn(["above", "below"]).withMessage("Condition must be above or below"),
  body("note").optional().trim().isLength({ max: 200 }).withMessage("Note too long"),
], validate, async (req, res, next) => {
  try {
    const { symbol, targetPrice, condition, note } = req.body;
    const duplicate = await Alert.findOne({ userId: req.user.id, symbol, condition, isActive: true });
    if (duplicate) {
      return res.status(409).json({ error: "You already have an active " + condition + " alert for " + symbol });
    }
    const alert = await Alert.create({ userId: req.user.id, symbol, targetPrice: Number(targetPrice), condition, note: note || "" });
    res.status(201).json({ message: "Alert created", alert });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { status = "all" } = req.query;
    const filter = { userId: req.user.id };
    if (status === "active")    filter.isActive    = true;
    if (status === "triggered") filter.isTriggered = true;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    const active    = alerts.filter(function(a) { return a.isActive; });
    const triggered = alerts.filter(function(a) { return a.isTriggered; });
    res.json({ total: alerts.length, active: active.length, triggered: triggered.length, alerts: alerts });
  } catch (err) { next(err); }
});

router.get("/:id", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ alert: alert });
  } catch (err) { next(err); }
});

router.patch("/:id/deactivate", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    if (!alert.isActive) return res.status(400).json({ error: "Alert is already inactive" });
    alert.isActive = false;
    await alert.save();
    res.json({ message: "Alert deactivated", alert: alert });
  } catch (err) { next(err); }
});

router.delete("/:id", [param("id").isMongoId().withMessage("Invalid alert ID")], validate, async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ message: "Alert deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
const cron  = require("node-cron");
const Alert = require("../models/Alert");
const { getQuote } = require("./dataSource");

// Runs every 5 minutes while the server is on
// "*/5 * * * *" means: every 5 minutes, every hour, every day
function startAlertChecker() {
  cron.schedule("*/5 * * * *", async function() {
    try {
      // Step 1: get all alerts that are still active
      var activeAlerts = await Alert.find({ isActive: true });

      if (activeAlerts.length === 0) return;

      console.log("[AlertChecker] Checking " + activeAlerts.length + " active alert(s)...");

      // Step 2: check each alert one by one
      for (var i = 0; i < activeAlerts.length; i++) {
        var alert = activeAlerts[i];

        try {
          // Step 3: get the live price for this stock
          var quote = await getQuote(alert.symbol);
          var livePrice = quote.c;

          if (!livePrice) continue;

          // Step 4: check if the condition is met
          var triggered = false;
          if (alert.condition === "below" && livePrice < alert.targetPrice) {
            triggered = true;
          }
          if (alert.condition === "above" && livePrice > alert.targetPrice) {
            triggered = true;
          }

          // Step 5: if triggered, update the alert in MongoDB
          if (triggered) {
            alert.isTriggered   = true;
            alert.isActive      = false;
            alert.triggeredPrice = livePrice;
            alert.triggeredAt   = new Date();
            await alert.save();

            console.log("[AlertChecker] TRIGGERED: " + alert.symbol + " is " + livePrice + " (condition: " + alert.condition + " " + alert.targetPrice + ")");
          } else {
            console.log("[AlertChecker] " + alert.symbol + " is " + livePrice + " -- not triggered yet (condition: " + alert.condition + " " + alert.targetPrice + ")");
          }

        } catch (err) {
          console.error("[AlertChecker] Failed to check " + alert.symbol + ":", err.message);
        }
      }

    } catch (err) {
      console.error("[AlertChecker] Job failed:", err.message);
    }
  });

  console.log("[AlertChecker] Started -- checking every 5 minutes");
}

module.exports = startAlertChecker;
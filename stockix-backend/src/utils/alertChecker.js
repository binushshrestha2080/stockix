const cron  = require("node-cron");
const Alert = require("../models/Alert");
const User  = require("../models/User");
const { getQuote } = require("./dataSource");
const { sendAlertEmail } = require("./mailer");

function startAlertChecker() {
  cron.schedule("*/5 * * * *", async function() {
    try {
      var activeAlerts = await Alert.find({ isActive: true });
      if (activeAlerts.length === 0) return;

      console.log("[AlertChecker] Checking " + activeAlerts.length + " active alert(s)...");

      for (var i = 0; i < activeAlerts.length; i++) {
        var alert = activeAlerts[i];
        try {
          var quote = await getQuote(alert.symbol);
          var livePrice = quote.c;
          if (!livePrice) continue;

          var triggered = false;
          if (alert.condition === "below" && livePrice < alert.targetPrice) triggered = true;
          if (alert.condition === "above" && livePrice > alert.targetPrice) triggered = true;

          if (triggered) {
            alert.isTriggered    = true;
            alert.isActive       = false;
            alert.triggeredPrice = livePrice;
            alert.triggeredAt    = new Date();
            await alert.save();

            console.log("[AlertChecker] TRIGGERED: " + alert.symbol + " is " + livePrice);

            // Send email to the user
            try {
              var user = await User.findById(alert.userId).select("email");
              if (user && user.email) {
                await sendAlertEmail(user.email, {
                  symbol:         alert.symbol,
                  condition:      alert.condition,
                  targetPrice:    alert.targetPrice,
                  triggeredPrice: livePrice,
                });
              }
            } catch (emailErr) {
              console.error("[AlertChecker] Email failed:", emailErr.message);
            }

          } else {
            console.log("[AlertChecker] " + alert.symbol + " is " + livePrice + " -- not triggered yet");
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
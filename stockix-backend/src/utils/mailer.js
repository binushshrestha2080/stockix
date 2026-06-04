const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendAlertEmail(toEmail, alertData) {
  const { symbol, condition, targetPrice, triggeredPrice } = alertData;

  const subject = "STOCKIX Alert: " + symbol + " has " + (condition === "below" ? "dropped below" : "risen above") + " $" + targetPrice;

  const html = [
    "<div style='font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;color:#fff;border-radius:12px;overflow:hidden'>",
    "  <div style='background:#111;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08)'>",
    "    <span style='font-size:18px;font-weight:700;letter-spacing:2px'>STOCKIX</span>",
    "  </div>",
    "  <div style='padding:28px'>",
    "    <h2 style='margin:0 0 8px;font-size:20px'>Price Alert Triggered</h2>",
    "    <p style='color:rgba(255,255,255,0.5);margin:0 0 24px;font-size:14px'>Your alert condition has been met</p>",
    "    <div style='background:rgba(255,255,255,0.05);border-radius:10px;padding:20px;margin-bottom:20px'>",
    "      <div style='font-size:28px;font-weight:800;margin-bottom:4px'>" + symbol + "</div>",
    "      <div style='font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:16px'>Stock Symbol</div>",
    "      <div style='display:flex;gap:16px'>",
    "        <div>",
    "          <div style='font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px'>CONDITION</div>",
    "          <div style='font-size:15px;font-weight:600;color:" + (condition === "below" ? "#f87171" : "#4ade80") + "'>" + (condition === "below" ? "Below" : "Above") + " $" + targetPrice + "</div>",
    "        </div>",
    "        <div>",
    "          <div style='font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px'>TRIGGERED AT</div>",
    "          <div style='font-size:15px;font-weight:600;color:#fff'>$" + Number(triggeredPrice).toFixed(2) + "</div>",
    "        </div>",
    "        <div>",
    "          <div style='font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px'>TIME</div>",
    "          <div style='font-size:15px;font-weight:600;color:#fff'>" + new Date().toLocaleString() + "</div>",
    "        </div>",
    "      </div>",
    "    </div>",
    "    <a href='http://localhost:3000/dashboard' style='display:inline-block;background:#4ade80;color:#0d0d0d;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px'>View Dashboard</a>",
    "  </div>",
    "  <div style='padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.3)'>",
    "    This alert has been automatically deactivated. Log in to set a new one.",
    "  </div>",
    "</div>",
  ].join("");

  await transporter.sendMail({
    from: "STOCKIX <" + process.env.EMAIL_USER + ">",
    to: toEmail,
    subject,
    html,
  });

  console.log("[Mailer] Email sent to " + toEmail + " for " + symbol);
}

module.exports = { sendAlertEmail };
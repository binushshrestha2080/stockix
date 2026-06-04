const fs   = require("fs");
const path = require("path");

const filePath = path.join("src", "app", "dashboard", "page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// ── 1. Add prediction to NAV ──────────────────────────────────────────────────
if (!content.includes('"prediction"')) {
  content = content.replace(
    '  { id: "alerts",    icon: "\u25ce", label: "Alerts"     },',
    '  { id: "alerts",    icon: "\u25ce", label: "Alerts"     },\n  { id: "prediction", icon: "\u25b3", label: "Prediction" },'
  );
  console.log("1. Added Prediction to NAV");
} else {
  console.log("1. NAV already has prediction");
}

// ── 2. Add prediction to TITLES ───────────────────────────────────────────────
if (!content.includes('"prediction"')) {
  content = content.replace(
    'alerts: "Price Alerts", settings: "Settings"',
    'alerts: "Price Alerts", prediction: "LSTM Prediction", settings: "Settings"'
  );
}
content = content.replace(
  'alerts: "Price Alerts", settings: "Settings"',
  'alerts: "Price Alerts", prediction: "LSTM Prediction", settings: "Settings"'
);
console.log("2. Added Prediction to TITLES");

// ── 3. Add tab render ─────────────────────────────────────────────────────────
if (!content.includes('<PredictionView')) {
  content = content.replace(
    '{tab === "alerts"    && <AlertsView />}',
    '{tab === "alerts"    && <AlertsView />}\n        {tab === "prediction" && <PredictionView />}'
  );
  console.log("3. Wired PredictionView into render");
}

// ── 4. Find the correct insertion point ──────────────────────────────────────
// Insert BEFORE the AlertsView function (which is before SettingsView)
const insertMarker = '// \u2500\u2500\u2500 Alerts View';

if (content.includes('function PredictionView')) {
  console.log("4. PredictionView already exists");
} else if (content.includes(insertMarker)) {
  const lines = [];
  lines.push('// \u2500\u2500\u2500 Prediction View \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  lines.push('function PredictionView() {');
  lines.push('  const API = "http://localhost:5000/api";');
  lines.push('  const [sym, setSym]         = useState("AAPL");');
  lines.push('  const [input, setInput]     = useState("AAPL");');
  lines.push('  const [result, setResult]   = useState<any>(null);');
  lines.push('  const [loading, setLoading] = useState(false);');
  lines.push('  const [error, setError]     = useState("");');
  lines.push('');
  lines.push('  function ah() {');
  lines.push('    const t = localStorage.getItem("stockix_token");');
  lines.push('    return { Authorization: "Bearer " + t };');
  lines.push('  }');
  lines.push('');
  lines.push('  async function predict() {');
  lines.push('    setLoading(true); setError(""); setResult(null);');
  lines.push('    try {');
  lines.push('      const r = await fetch(API + "/prediction/" + sym.toUpperCase(), { headers: ah() });');
  lines.push('      const d = await r.json();');
  lines.push('      if (!r.ok) { setError(d.error || "Prediction failed"); setLoading(false); return; }');
  lines.push('      setResult(d);');
  lines.push('    } catch (e) {');
  lines.push('      setError("Could not connect to ML service. Make sure python ml_service.py is running.");');
  lines.push('    }');
  lines.push('    setLoading(false);');
  lines.push('  }');
  lines.push('');
  lines.push('  const trendColor = result?.trend === "bullish" ? "#4ade80" : result?.trend === "bearish" ? "#f87171" : "#fb923c";');
  lines.push('  const trendBg    = result?.trend === "bullish" ? "rgba(74,222,128,0.1)" : result?.trend === "bearish" ? "rgba(248,113,113,0.1)" : "rgba(251,146,60,0.1)";');
  lines.push('');
  lines.push('  return (');
  lines.push('    <div style={{ maxWidth: 860 }}>');
  lines.push('      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>');
  lines.push('        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>');
  lines.push('          Uses a trained LSTM neural network to predict the next 7 days of stock prices.');
  lines.push('          The model trains on the last 100 days of real market data each time you run it.');
  lines.push('        </p>');
  lines.push('      </div>');
  lines.push('      <Card style={{ marginBottom: 24 }}>');
  lines.push('        <CardTitle>Run LSTM Prediction</CardTitle>');
  lines.push('        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>');
  lines.push('          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>Predict next 7 days for</span>');
  lines.push('          <input value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === "Enter") { setSym(input); setTimeout(predict, 100); } }} placeholder="AAPL" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 15, fontWeight: 700, outline: "none", width: 100, textAlign: "center", letterSpacing: 1 }} />');
  lines.push('          <button onClick={() => { setSym(input); setTimeout(predict, 100); }} disabled={loading} style={{ background: loading ? "rgba(74,222,128,0.4)" : "#4ade80", color: "#0d0d0d", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>');
  lines.push('            {loading ? "Training LSTM\u2026 (~30s)" : "Run Prediction"}');
  lines.push('          </button>');
  lines.push('        </div>');
  lines.push('        {loading && <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>The LSTM model is training on historical data. This takes 20\u201360 seconds\u2026</div>}');
  lines.push('        {error && <div style={{ marginTop: 12, fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "0.5px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px" }}>\u26a0 {error}</div>}');
  lines.push('      </Card>');
  lines.push('      {result && (');
  lines.push('        <>');
  lines.push('          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>');
  lines.push('            {[');
  lines.push('              { label: "Current Price",    value: "$" + result.currentPrice, color: "#fff" },');
  lines.push('              { label: "Day 7 Prediction", value: "$" + result.predictedDay7, color: trendColor },');
  lines.push('              { label: "Expected Change",  value: (result.priceChangePct > 0 ? "+" : "") + result.priceChangePct + "%", color: trendColor },');
  lines.push('              { label: "Confidence",       value: (result.confidence * 100).toFixed(0) + "%", color: "#60a5fa" },');
  lines.push('            ].map(s => (');
  lines.push('              <Card key={s.label}>');
  lines.push('                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>');
  lines.push('                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>');
  lines.push('              </Card>');
  lines.push('            ))}');
  lines.push('          </div>');
  lines.push('          <Card style={{ marginBottom: 20 }}>');
  lines.push('            <CardTitle>7-Day Forecast \u2014 {result.symbol}</CardTitle>');
  lines.push('            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>');
  lines.push('              <div style={{ background: trendBg, border: "0.5px solid " + trendColor + "60", color: trendColor, borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 700 }}>');
  lines.push('                {result.trend === "bullish" ? "\ud83d\udcc8 BULLISH" : result.trend === "bearish" ? "\ud83d\udcc9 BEARISH" : "\u27a1 NEUTRAL"}');
  lines.push('              </div>');
  lines.push('              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Trained on {result.daysTrainedOn} days of data</div>');
  lines.push('            </div>');
  lines.push('            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>');
  lines.push('              {result.predictions.map((price: number, i: number) => {');
  lines.push('                const isUp = price >= result.currentPrice;');
  lines.push('                return (');
  lines.push('                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>');
  lines.push('                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Day {i + 1}</div>');
  lines.push('                    <div style={{ fontSize: 15, fontWeight: 700, color: isUp ? "#4ade80" : "#f87171" }}>${price}</div>');
  lines.push('                    <div style={{ fontSize: 10, color: isUp ? "#4ade80" : "#f87171", marginTop: 4 }}>{isUp ? "\u25b2" : "\u25bc"} {Math.abs(((price - result.currentPrice) / result.currentPrice) * 100).toFixed(1)}%</div>');
  lines.push('                  </div>');
  lines.push('                );');
  lines.push('              })}');
  lines.push('            </div>');
  lines.push('          </Card>');
  lines.push('          <Card>');
  lines.push('            <CardTitle>Model Information</CardTitle>');
  lines.push('            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>');
  lines.push('              {[');
  lines.push('                { label: "Model Type",      value: result.modelInfo.type },');
  lines.push('                { label: "Optimizer",       value: result.modelInfo.optimizer },');
  lines.push('                { label: "Loss Function",   value: result.modelInfo.lossFunction },');
  lines.push('                { label: "Epochs Trained",  value: result.modelInfo.epochs },');
  lines.push('                { label: "Final Loss",      value: result.modelInfo.finalLoss },');
  lines.push('                { label: "Sequence Length", value: result.modelInfo.sequenceLength + " days" },');
  lines.push('              ].map(m => (');
  lines.push('                <div key={m.label} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>');
  lines.push('                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>');
  lines.push('                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{String(m.value)}</div>');
  lines.push('                </div>');
  lines.push('              ))}');
  lines.push('            </div>');
  lines.push('            <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Architecture: {result.modelInfo.layers}</div>');
  lines.push('          </Card>');
  lines.push('        </>');
  lines.push('      )}');
  lines.push('      {!result && !loading && (');
  lines.push('        <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>');
  lines.push('          <div style={{ fontSize: 40, marginBottom: 12 }}>\ud83e\udde0</div>');
  lines.push('          <div style={{ fontSize: 15, marginBottom: 6 }}>LSTM Neural Network ready</div>');
  lines.push('          <div style={{ fontSize: 13 }}>Enter a stock symbol above and click Run Prediction</div>');
  lines.push('        </div>');
  lines.push('      )}');
  lines.push('    </div>');
  lines.push('  );');
  lines.push('}');
  lines.push('');

  const component = lines.join("\n");
  content = content.replace(insertMarker, component + "\n" + insertMarker);
  console.log("4. Added PredictionView component before AlertsView");
} else {
  console.log("ERROR: Could not find insertion point. Looking for: " + insertMarker);
}

fs.writeFileSync(filePath, content);
console.log("\nDone! Refresh localhost:3000/dashboard and click Prediction.");
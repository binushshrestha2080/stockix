const fs = require("fs");
const path = require("path");

const dashPath = path.join("src", "app", "dashboard", "page.tsx");
let dash = fs.readFileSync(dashPath, "utf8");

// ── 1. Add alerts to NAV array ───────────────────────────────────────────────
if (dash.includes('id: "alerts"')) {
  console.log("NAV already has alerts -- skipping");
} else {
  dash = dash.replace(
    '  { id: "settings",  icon: "\u2699", label: "Settings"   },\n];',
    '  { id: "settings",  icon: "\u2699", label: "Settings"   },\n  { id: "alerts",    icon: "\u25ce", label: "Alerts"     },\n];'
  );
  console.log("Added alerts to NAV");
}

// ── 2. Add React import if missing ──────────────────────────────────────────
if (!dash.includes("import React")) {
  dash = dash.replace('"use client";', '"use client";\nimport React from "react";');
  console.log("Added React import");
}

// ── 3. Build AlertsView as array of lines (avoids template literal issues) ──
const lines = [
  "",
  "// ─── Alerts View ────────────────────────────────────────────────────────────",
  "function AlertsView() {",
  '  const API = process.env.NEXT_PUBLIC_API_URL;',
  "  const [alerts, setAlerts]       = React.useState<any[]>([]);",
  "  const [loading, setLoading]     = React.useState(true);",
  '  const [symbol, setSymbol]       = React.useState("");',
  '  const [price, setPrice]         = React.useState("");',
  '  const [condition, setCondition] = React.useState("below");',
  '  const [note, setNote]           = React.useState("");',
  '  const [error, setError]         = React.useState("");',
  '  const [success, setSuccess]     = React.useState("");',
  "",
  "  function authHeaders() {",
  '    const token = localStorage.getItem("stockix_token");',
  '    return { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) };',
  "  }",
  "",
  "  async function fetchAlerts() {",
  "    try {",
  '      const res  = await fetch(API + "/api/alerts", { headers: authHeaders() });',
  "      const data = await res.json();",
  "      setAlerts(data.alerts || []);",
  "    } catch (e) {",
  '      setError("Failed to load alerts");',
  "    } finally {",
  "      setLoading(false);",
  "    }",
  "  }",
  "",
  "  React.useEffect(() => { fetchAlerts(); }, []);",
  "",
  "  async function createAlert() {",
  '    setError(""); setSuccess("");',
  '    if (!symbol || !price) { setError("Symbol and price are required"); return; }',
  "    try {",
  '      const res  = await fetch(API + "/api/alerts", {',
  '        method: "POST",',
  "        headers: authHeaders(),",
  "        body: JSON.stringify({ symbol: symbol.toUpperCase(), targetPrice: Number(price), condition, note }),",
  "      });",
  "      const data = await res.json();",
  '      if (!res.ok) { setError(data.error || "Failed to create alert"); return; }',
  '      setSuccess("Alert created for " + symbol.toUpperCase());',
  '      setSymbol(""); setPrice(""); setNote("");',
  "      fetchAlerts();",
  "    } catch (e) {",
  '      setError("Failed to create alert");',
  "    }",
  "  }",
  "",
  "  async function deleteAlert(id: string) {",
  "    try {",
  '      await fetch(API + "/api/alerts/" + id, { method: "DELETE", headers: authHeaders() });',
  "      fetchAlerts();",
  "    } catch (e) {}",
  "  }",
  "",
  "  async function deactivateAlert(id: string) {",
  "    try {",
  '      await fetch(API + "/api/alerts/" + id + "/deactivate", { method: "PATCH", headers: authHeaders() });',
  "      fetchAlerts();",
  "    } catch (e) {}",
  "  }",
  "",
  "  const active    = alerts.filter(a => a.isActive);",
  "  const triggered = alerts.filter(a => a.isTriggered);",
  "",
  "  const inputStyle: React.CSSProperties = {",
  '    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",',
  '    borderRadius: 6, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", width: "100%",',
  "  };",
  "",
  "  return (",
  "    <div style={{ maxWidth: 900, margin: '0 auto' }}>",
  "      <div style={{ marginBottom: 24 }}>",
  "        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Price Alerts</h2>",
  "        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Get notified when a stock hits your target price</p>",
  "      </div>",
  "",
  "      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>",
  "        {[",
  "          { label: 'Total Alerts', value: alerts.length,    color: '#fff'    },",
  "          { label: 'Active',       value: active.length,    color: '#4ade80' },",
  "          { label: 'Triggered',    value: triggered.length, color: '#fb923c' },",
  "        ].map(s => (",
  "          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>",
  "            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>",
  "            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>",
  "          </div>",
  "        ))}",
  "      </div>",
  "",
  "      <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>",
  "        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Create New Alert</div>",
  "        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10, marginBottom: 10 }}>",
  "          <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder='Symbol e.g. AAPL' style={inputStyle} />",
  "          <input value={price}  onChange={e => setPrice(e.target.value)}  placeholder='Target price' style={inputStyle} type='number' />",
  "          <select value={condition} onChange={e => setCondition(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>",
  "            <option value='below'>Below (drops under)</option>",
  "            <option value='above'>Above (rises over)</option>",
  "          </select>",
  "          <input value={note} onChange={e => setNote(e.target.value)} placeholder='Note (optional)' style={inputStyle} />",
  "        </div>",
  "        {error   && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</div>}",
  "        {success && <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 8 }}>{success}</div>}",
  "        <button onClick={createAlert} style={{ background: '#4ade80', color: '#0d0d0d', border: 'none', padding: '9px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>",
  "          Create Alert",
  "        </button>",
  "      </div>",
  "",
  "      {active.length > 0 && (",
  "        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>",
  "          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Active Alerts</div>",
  "          {active.map(a => (",
  "            <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>",
  "              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>",
  "                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{a.symbol}</span>",
  "                <span style={{ background: a.condition === 'below' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)', color: a.condition === 'below' ? '#f87171' : '#4ade80', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>",
  "                  {a.condition === 'below' ? 'Below' : 'Above'} {'$'}{a.targetPrice}",
  "                </span>",
  "                {a.note && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{a.note}</span>}",
  "              </div>",
  "              <div style={{ display: 'flex', gap: 8 }}>",
  "                <button onClick={() => deactivateAlert(a._id)} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Deactivate</button>",
  "                <button onClick={() => deleteAlert(a._id)}     style={{ background: 'rgba(248,113,113,0.1)',   color: '#f87171',               border: '0.5px solid rgba(248,113,113,0.2)', padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Delete</button>",
  "              </div>",
  "            </div>",
  "          ))}",
  "        </div>",
  "      )}",
  "",
  "      {triggered.length > 0 && (",
  "        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>",
  "          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Triggered Alerts</div>",
  "          {triggered.map(a => (",
  "            <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>",
  "              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>",
  "                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{a.symbol}</span>",
  "                <span style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>Triggered at {'$'}{a.triggeredPrice != null ? a.triggeredPrice.toFixed(2) : 'N/A'}</span>",
  "                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{new Date(a.triggeredAt).toLocaleDateString()}</span>",
  "              </div>",
  "              <button onClick={() => deleteAlert(a._id)} style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Delete</button>",
  "            </div>",
  "          ))}",
  "        </div>",
  "      )}",
  "",
  "      {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>Loading alerts...</div>}",
  "      {!loading && alerts.length === 0 && (",
  "        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>",
  "          <div style={{ fontSize: 32, marginBottom: 12 }}>&#9678;</div>",
  "          <div style={{ fontSize: 14 }}>No alerts yet. Create one above.</div>",
  "        </div>",
  "      )}",
  "    </div>",
  "  );",
  "}",
  "",
];

const alertsComponent = lines.join("\n");

// ── 4. Insert AlertsView before the main export ──────────────────────────────
if (dash.includes("function AlertsView")) {
  console.log("AlertsView already exists -- skipping");
} else {
  dash = dash.replace("export default function", alertsComponent + "export default function");
  console.log("Added AlertsView component");
}

// ── 5. Wire into render ──────────────────────────────────────────────────────
if (dash.includes("<AlertsView />")) {
  console.log("AlertsView already wired -- skipping");
} else {
  // Find where settings view is rendered and add alerts before it
  dash = dash.replace(
    '{active === "settings"',
    '{active === "alerts"    && <AlertsView />}\n        {active === "settings"'
  );
  console.log("Wired AlertsView into render");
}

// ── 6. Save ──────────────────────────────────────────────────────────────────
fs.writeFileSync(dashPath, dash);
console.log("Saved: src/app/dashboard/page.tsx");
console.log("");
console.log("Done! Refresh localhost:3000/dashboard and click Alerts in the sidebar.");

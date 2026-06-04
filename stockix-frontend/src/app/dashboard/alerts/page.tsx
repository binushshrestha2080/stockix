"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("stockix_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) };
}

function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="7" fill="#1a1a1a" />
      <rect x="5"  y="22" width="4" height="7"  rx="1" fill="white" opacity="0.9" />
      <rect x="11" y="17" width="4" height="12" rx="1" fill="white" opacity="0.9" />
      <rect x="17" y="12" width="4" height="17" rx="1" fill="white" opacity="0.9" />
      <rect x="23" y="7"  width="4" height="22" rx="1" fill="white" opacity="0.9" />
      <path d="M7 20 L13 15 L19 10 L25 5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="5" r="1.5" fill="#4ade80" />
    </svg>
  );
}

const NAV = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "alerts",    label: "Alerts",    href: "/dashboard/alerts" },
];

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [symbol, setSymbol]         = useState("");
  const [price, setPrice]           = useState("");
  const [condition, setCondition]   = useState("below");
  const [note, setNote]             = useState("");
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [creating, setCreating]     = useState(false);

  async function fetchAlerts() {
    try {
      const res  = await fetch(API + "/alerts", { headers: authHeaders() });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAlerts(); }, []);

  async function createAlert() {
    setError(""); setSuccess(""); setCreating(true);
    if (!symbol || !price) { setError("Symbol and price are required"); setCreating(false); return; }
    try {
      const res  = await fetch(API + "/alerts", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ symbol: symbol.toUpperCase(), targetPrice: Number(price), condition, note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setCreating(false); return; }
      setSuccess("Alert created for " + symbol.toUpperCase());
      setSymbol(""); setPrice(""); setNote("");
      fetchAlerts();
    } catch (e) { setError("Failed to create alert"); }
    finally { setCreating(false); }
  }

  async function deleteAlert(id: string) {
    await fetch(API + "/alerts/" + id, { method: "DELETE", headers: authHeaders() });
    fetchAlerts();
  }

  async function deactivateAlert(id: string) {
    await fetch(API + "/alerts/" + id + "/deactivate", { method: "PATCH", headers: authHeaders() });
    fetchAlerts();
  }

  const active    = alerts.filter(a => a.isActive);
  const triggered = alerts.filter(a => a.isTriggered);

  const inp: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 6, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#111", borderRight: "0.5px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", minHeight: "100vh", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "22px 20px 24px" }}>
          <LogoIcon />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>STOCKIX</span>
        </div>
        <nav style={{ flex: 1 }}>
          <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 20px", background: "transparent", border: "none", borderLeft: "2px solid transparent", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer" }}>
            Dashboard
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 20px", background: "rgba(255,255,255,0.05)", border: "none", borderLeft: "2px solid #4ade80", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Alerts
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <div style={{ maxWidth: 860 }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Price Alerts</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Get notified automatically when a stock hits your target price</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Alerts", value: alerts.length,    color: "#fff"    },
              { label: "Active",       value: active.length,    color: "#4ade80" },
              { label: "Triggered",    value: triggered.length, color: "#fb923c" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Create form */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Create New Alert</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 10, marginBottom: 12 }}>
              <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol e.g. AAPL" style={inp} />
              <input value={price}  onChange={e => setPrice(e.target.value)}  placeholder="Target price" type="number" style={inp} />
              <select value={condition} onChange={e => setCondition(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                <option value="below">Below (drops under)</option>
                <option value="above">Above (rises over)</option>
              </select>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" style={inp} />
            </div>
            {error   && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{error}</div>}
            {success && <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 10 }}>{success}</div>}
            <button onClick={createAlert} disabled={creating} style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 22px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: creating ? 0.6 : 1 }}>
              {creating ? "Creating..." : "Create Alert"}
            </button>
          </div>

          {/* Active alerts */}
          {active.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
                Active Alerts <span style={{ color: "#4ade80", fontWeight: 400, fontSize: 12 }}>({active.length})</span>
              </div>
              {active.map((a, i) => (
                <div key={a._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < active.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 15, minWidth: 60 }}>{a.symbol}</span>
                    <span style={{ background: a.condition === "below" ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)", color: a.condition === "below" ? "#f87171" : "#4ade80", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4 }}>
                      {a.condition === "below" ? "Below" : "Above"} ${a.targetPrice}
                    </span>
                    {a.note && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{a.note}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => deactivateAlert(a._id)} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "0.5px solid rgba(255,255,255,0.1)", padding: "5px 12px", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                      Deactivate
                    </button>
                    <button onClick={() => deleteAlert(a._id)} style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "0.5px solid rgba(248,113,113,0.2)", padding: "5px 12px", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Triggered alerts */}
          {triggered.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
                Triggered Alerts <span style={{ color: "#fb923c", fontWeight: 400, fontSize: 12 }}>({triggered.length})</span>
              </div>
              {triggered.map((a, i) => (
                <div key={a._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < triggered.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 15, minWidth: 60 }}>{a.symbol}</span>
                    <span style={{ background: "rgba(251,146,60,0.12)", color: "#fb923c", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4 }}>
                      Triggered at ${a.triggeredPrice != null ? Number(a.triggeredPrice).toFixed(2) : "N/A"}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{new Date(a.triggeredAt).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteAlert(a._id)} style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "0.5px solid rgba(248,113,113,0.2)", padding: "5px 12px", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: 60 }}>Loading alerts...</div>
          )}
          {!loading && alerts.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>&#9670;</div>
              <div style={{ fontSize: 15, marginBottom: 6 }}>No alerts yet</div>
              <div style={{ fontSize: 13 }}>Create an alert above to get started</div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
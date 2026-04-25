"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getPortfolio, getWatchlist, getNews, getFullAnalysis,
  addPosition, deletePosition, addToWatchlist, removeFromWatchlist,
} from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Position  { symbol: string; name: string; quantity: number; avgCost: number; livePrice: number; value: number; pnl: number; pnlPct: number; dayChangePct: number; sector: string; }
interface WatchItem { symbol: string; name: string; price: number; change: number; changePct: number; }
interface NewsItem  { headline: string; source: string; datetime: number; url: string; summary: string; }
interface Analysis  { overallSentiment: string; sentimentScore: number; rsi14?: { latest: number; signal: string }; macd?: { latest: { macd: number; signal: number; histogram: number }; signal: string }; sma14?: { latest: number; signal: string }; ema12?: { latest: number }; linearRegression?: { predictions: number[]; r2: number }; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const API = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  const token = localStorage.getItem("stockix_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function calcSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
}

function calcEMA(data: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = Array(data.length).fill(null);
  let ema = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result[i] = null; continue; }
    if (i === period - 1) ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    else ema = data[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const w = 64, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={up ? "#4ade80" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    bullish:           { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
    bearish:           { bg: "rgba(248,113,113,0.12)", text: "#f87171" },
    neutral:           { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
    overbought:        { bg: "rgba(248,113,113,0.12)", text: "#f87171" },
    oversold:          { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
    bullish_crossover: { bg: "rgba(74,222,128,0.15)",  text: "#4ade80" },
    bearish_crossover: { bg: "rgba(248,113,113,0.15)", text: "#f87171" },
  };
  const c = map[color] || map.neutral;
  return <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>{label}</span>;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "portfolio", icon: "◎", label: "Portfolio" },
  { id: "watchlist", icon: "◈", label: "Watchlist" },
  { id: "analysis",  icon: "◉", label: "Analysis"  },
  { id: "chart",     icon: "▲", label: "Chart"      },
  { id: "news",      icon: "≡", label: "News"       },
  { id: "settings",  icon: "⚙", label: "Settings"   },
];

function Sidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <aside style={{ width: 220, background: "#111", borderRight: "0.5px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", minHeight: "100vh", position: "sticky", top: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "22px 20px 24px" }}>
        <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
          <rect width="34" height="34" rx="7" fill="#1a1a1a" />
          <rect x="5"  y="22" width="4" height="7"  rx="1" fill="white" opacity="0.9" />
          <rect x="11" y="17" width="4" height="12" rx="1" fill="white" opacity="0.9" />
          <rect x="17" y="12" width="4" height="17" rx="1" fill="white" opacity="0.9" />
          <rect x="23" y="7"  width="4" height="22" rx="1" fill="white" opacity="0.9" />
          <path d="M7 20 L13 15 L19 10 L25 5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="25" cy="5" r="1.5" fill="#4ade80" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>STOCKIX</span>
      </div>
      <nav style={{ flex: 1 }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => onChange(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "11px 20px",
            background: active === n.id ? "rgba(255,255,255,0.05)" : "transparent",
            borderTop: "none", borderRight: "none", borderBottom: "none",
            borderLeft: `2px solid ${active === n.id ? "#4ade80" : "transparent"}`,
            color: active === n.id ? "#fff" : "rgba(255,255,255,0.45)",
            fontSize: 13, fontWeight: active === n.id ? 600 : 400,
            cursor: "pointer", transition: "all 0.15s", textAlign: "left",
          }}>
            <span style={{ fontSize: 14, width: 18 }}>{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>
      {/* <div style={{ padding: "16px 20px", borderTop: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0d0d0d" }}>JD</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>John Doe</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Pro plan</div>
        </div>
      </div> */}
    </aside>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>{children}</div>;
}

// ─── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView({ portfolio, watchlist, news }: { portfolio: any; watchlist: WatchItem[]; news: NewsItem[] }) {
  const metrics = [
    { label: "Portfolio Value", value: `$${fmt(portfolio?.totalValue || 0)}`,       sub: portfolio?.totalPnl >= 0 ? `▲ +$${fmt(portfolio?.totalPnl)}` : `▼ -$${fmt(Math.abs(portfolio?.totalPnl))}`, up: portfolio?.totalPnl >= 0 },
    { label: "Total Return",    value: `${portfolio?.totalPnlPct >= 0 ? "+" : ""}${portfolio?.totalPnlPct?.toFixed(2) || "0.00"}%`, sub: "since inception", up: portfolio?.totalPnlPct >= 0 },
    { label: "Positions",       value: portfolio?.positions?.length || 0,            sub: `${portfolio?.positions?.filter((p: any) => p.pnl >= 0).length || 0} up · ${portfolio?.positions?.filter((p: any) => p.pnl < 0).length || 0} down`, up: true },
    { label: "Day's P&L",       value: `$${fmt(portfolio?.positions?.reduce((s: number, p: any) => s + (p.dayChangePct / 100) * p.value, 0) || 0)}`, sub: "today", up: true },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {metrics.map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: m.up ? "#4ade80" : "#f87171" }}>{m.sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <Card>
          <CardTitle>Watchlist</CardTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Symbol","Price","Change","7D"].map(h => <th key={h} style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, textAlign: "left", paddingBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {watchlist.slice(0, 5).map((s) => (
                <tr key={s.symbol}>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", fontWeight: 600, color: "#fff" }}>{s.symbol}</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}>${fmt(s.price)}</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: s.changePct >= 0 ? "#4ade80" : "#f87171" }}>{s.changePct >= 0 ? "+" : ""}{s.changePct?.toFixed(2)}%</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}><Sparkline data={[s.price*0.97, s.price*0.98, s.price*0.975, s.price*0.99, s.price*0.995, s.price, s.price]} up={s.changePct >= 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardTitle>Latest news</CardTitle>
          {news.slice(0, 4).map((n, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? "0.5px solid rgba(255,255,255,0.06)" : "none" }}>
              <a href={n.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.4, display: "block", marginBottom: 4, textDecoration: "none" }}>{n.headline}</a>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Portfolio View ────────────────────────────────────────────────────────────
function PortfolioView({ portfolio, onRefresh }: { portfolio: any; onRefresh: () => void }) {
  const [sym, setSym] = useState(""); const [qty, setQty] = useState(""); const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const handleAdd = async () => {
    if (!sym || !qty || !cost) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try { await addPosition({ symbol: sym.toUpperCase(), quantity: parseFloat(qty), avgCost: parseFloat(cost) }); setSym(""); setQty(""); setCost(""); onRefresh(); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Add position</CardTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[{ val: sym, set: setSym, ph: "Symbol (AAPL)" }, { val: qty, set: setQty, ph: "Quantity" }, { val: cost, set: setCost, ph: "Avg cost ($)" }].map((f) => (
            <input key={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 160, outline: "none" }} />
          ))}
          <button onClick={handleAdd} disabled={loading} style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{loading ? "Adding…" : "+ Add"}</button>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
      </Card>
      <Card>
        <CardTitle><span>Positions</span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Total: ${fmt(portfolio?.totalValue || 0)}</span></CardTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Symbol","Qty","Avg Cost","Live Price","Value","P&L","Day %",""].map(h => <th key={h} style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, textAlign: "left", paddingBottom: 10, letterSpacing: 0.5 }}>{h}</th>)}</tr></thead>
          <tbody>
            {(portfolio?.positions || []).map((p: Position) => (
              <tr key={p.symbol}>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", fontWeight: 700, color: "#fff" }}>{p.symbol}</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>{p.quantity}</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>${fmt(p.avgCost)}</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "#fff" }}>${fmt(p.livePrice)}</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "#fff" }}>${fmt(p.value)}</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: p.pnl >= 0 ? "#4ade80" : "#f87171" }}>{p.pnl >= 0 ? "+" : ""}${fmt(p.pnl)} ({p.pnlPct >= 0 ? "+" : ""}{p.pnlPct?.toFixed(2)}%)</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: p.dayChangePct >= 0 ? "#4ade80" : "#f87171" }}>{p.dayChangePct >= 0 ? "+" : ""}{p.dayChangePct?.toFixed(2)}%</td>
                <td style={{ padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => deletePosition(p.symbol).then(onRefresh)} style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Watchlist View ────────────────────────────────────────────────────────────
function WatchlistView({ watchlist, onRefresh }: { watchlist: WatchItem[]; onRefresh: () => void }) {
  const [sym, setSym]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSugg, setShowSugg]   = useState(false);
  const suggTimer                 = useRef<any>(null);

  const handleSearch = (val: string) => {
    setSym(val);
    clearTimeout(suggTimer.current);
    if (val.length < 1) { setSuggestions([]); setShowSugg(false); return; }
    suggTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/stocks/search?q=${val}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("stockix_token")}` },
        });
        const data = await res.json();
        setSuggestions(data.slice(0, 6));
        setShowSugg(true);
      } catch {}
    }, 300);
  };

  const handleSelect = (symbol: string) => {
    setSym(symbol);
    setSuggestions([]);
    setShowSugg(false);
  };

  const handleAdd = async () => {
    if (!sym) return;
    setLoading(true);
    try {
      await addToWatchlist({ symbol: sym.toUpperCase() });
      setSym(""); setSuggestions([]); setShowSugg(false);
      onRefresh();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Add to watchlist</CardTitle>
        <div style={{ display: "flex", gap: 10, position: "relative" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              value={sym}
              onChange={e => handleSearch(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              placeholder="Search symbol or company name…"
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
            {showSugg && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, marginTop: 4, zIndex: 100, overflow: "hidden" }}>
                {suggestions.map((s: any) => (
                  <div key={s.symbol} onMouseDown={() => handleSelect(s.symbol)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.symbol}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{s.description}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.region}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleAdd} disabled={loading} style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {loading ? "Adding…" : "+ Watch"}
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Watching {watchlist.length} stocks</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {watchlist.map((w) => (
            <div key={w.symbol} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{w.symbol}</span>
                <button onClick={() => removeFromWatchlist(w.symbol).then(onRefresh)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>${fmt(w.price)}</div>
              <div style={{ fontSize: 13, color: w.changePct >= 0 ? "#4ade80" : "#f87171" }}>{w.changePct >= 0 ? "▲" : "▼"} {Math.abs(w.changePct)?.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


// ─── Analysis View ─────────────────────────────────────────────────────────────
function AnalysisView({ initialSym = "AAPL" }: { initialSym?: string }) {
  const [sym, setSym]           = useState(initialSym);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Chart refs
  const priceRef  = useRef<HTMLCanvasElement>(null);
  const lrRef     = useRef<HTMLCanvasElement>(null);
  const rsiRef    = useRef<HTMLCanvasElement>(null);
  const macdRef   = useRef<HTMLCanvasElement>(null);
  const chartRefs = useRef<any[]>([]);

  const run = async () => {
    if (!sym) return;
    setLoading(true); setError(""); setAnalysis(null);
    chartRefs.current.forEach(c => c?.destroy());
    chartRefs.current = [];
    try {
      const data = await getFullAnalysis(sym.toUpperCase()) as Analysis;
      setAnalysis(data);
      setTimeout(() => renderCharts(data), 100);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const renderCharts = async (data: Analysis) => {
    const Chart = (await import("chart.js/auto")).default;
    chartRefs.current.forEach(c => c?.destroy());
    chartRefs.current = [];

    const gridColor   = "rgba(255,255,255,0.05)";
    const tickColor   = "rgba(255,255,255,0.35)";
    const tooltipOpts = {
      backgroundColor: "#1a1a1a",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      titleColor: "#fff",
      bodyColor: "rgba(255,255,255,0.7)",
    };

    // ── Price chart: SMA + EMA + Linear Regression prediction ──
    if (priceRef.current && data.sma14 && data.ema12) {
      const smaData  = data.sma14.series || [];
      const emaData  = data.ema12.series || [];
      const labels   = smaData.map((_: any, i: number) => i + 1);
      const predDays = data.linearRegression?.predictions || [];
      const predLabels = predDays.map((_: any, i: number) => `P${i + 1}`);
      const allLabels  = [...labels, ...predLabels];
      const smaPad     = [...smaData, ...Array(predDays.length).fill(null)];
      const emaPad     = [...emaData, ...Array(predDays.length).fill(null)];
      const predPad    = [...Array(smaData.length).fill(null), ...predDays];

      const ctx   = priceRef.current.getContext("2d")!;
      const chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: allLabels,
          datasets: [
            {
              label: "SMA 14",
              data: smaPad,
              borderColor: "#f5c542",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
            },
            {
              label: "EMA 12",
              data: emaPad,
              borderColor: "#60a5fa",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
            },
            {
              label: "Prediction (7d)",
              data: predPad,
              borderColor: "#4ade80",
              borderWidth: 2,
              borderDash: [6, 3],
              pointRadius: 4,
              pointBackgroundColor: "#4ade80",
              tension: 0.3,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: tickColor, boxWidth: 12, font: { size: 11 } } },
            tooltip: tooltipOpts,
          },
          scales: {
            x: { ticks: { color: tickColor, maxTicksLimit: 12, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      });
      chartRefs.current.push(chart);
    }
// ── Linear Regression chart ──
    if (lrRef.current && data.linearRegression?.fittedSeries) {
      const fitted    = data.linearRegression.fittedSeries;
      const preds     = data.linearRegression.predictions || [];
      const allLabels = [...fitted.map((_: any, i: number) => i + 1), ...preds.map((_: any, i: number) => `+${i + 1}d`)];
      const fittedPad = [...fitted, ...Array(preds.length).fill(null)];
      const predPad   = [...Array(fitted.length - 1).fill(null), fitted[fitted.length - 1], ...preds];
      const ctx       = lrRef.current.getContext("2d")!;
      const chart     = new Chart(ctx, {
        type: "line",
        data: {
          labels: allLabels,
          datasets: [
            { label: "Regression Line", data: fittedPad, borderColor: "#f5c542", borderWidth: 2, pointRadius: 0, tension: 0, fill: false },
            { label: "7-Day Prediction", data: predPad, borderColor: "#4ade80", borderWidth: 2, borderDash: [6, 3], pointRadius: 4, pointBackgroundColor: "#4ade80", tension: 0, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: tickColor, boxWidth: 12, font: { size: 11 } } },
            tooltip: tooltipOpts,
          },
          scales: {
            x: { ticks: { color: tickColor, maxTicksLimit: 14, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      });
      chartRefs.current.push(chart);
    }

    // ── RSI chart ──
    if (rsiRef.current && data.rsi14?.series) {
      const rsiSeries = data.rsi14.series;
      const labels    = rsiSeries.map((_: any, i: number) => i + 1);
      const ctx       = rsiRef.current.getContext("2d")!;
      const chart     = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "RSI (14)",
              data: rsiSeries,
              borderColor: "#a78bfa",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              fill: {
                target: { value: 70 },
                above: "rgba(248,113,113,0.1)",
                below: "rgba(74,222,128,0.05)",
              },
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: tickColor, boxWidth: 12, font: { size: 11 } } },
            tooltip: tooltipOpts,
            annotation: {
              annotations: {
                ob: { type: "line", yMin: 70, yMax: 70, borderColor: "rgba(248,113,113,0.5)", borderWidth: 1, borderDash: [4, 4] },
                os: { type: "line", yMin: 30, yMax: 30, borderColor: "rgba(74,222,128,0.5)",  borderWidth: 1, borderDash: [4, 4] },
              },
            },
          },
          scales: {
            x: { ticks: { color: tickColor, maxTicksLimit: 12, font: { size: 10 } }, grid: { color: gridColor } },
            y: {
              min: 0, max: 100,
              ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => `${v}` },
              grid: { color: gridColor },
            },
          },
        },
      });
      chartRefs.current.push(chart);
    }

    // ── MACD chart ──
    if (macdRef.current && data.macd?.macdLine) {
      const macdLine   = data.macd.macdLine.filter((v: any) => v !== null);
      const signalLine = data.macd.signalLine.filter((v: any) => v !== null);
      const histogram  = data.macd.histogram.filter((v: any) => v !== null);
      const labels     = macdLine.map((_: any, i: number) => i + 1);
      const ctx        = macdRef.current.getContext("2d")!;
      const chart      = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Histogram",
              data: histogram,
              backgroundColor: histogram.map((v: number) =>
                v >= 0 ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)"
              ),
              borderRadius: 2,
              order: 2,
            },
            {
              label: "MACD",
              data: macdLine,
              type: "line" as any,
              borderColor: "#f5c542",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
              order: 1,
            },
            {
              label: "Signal",
              data: signalLine,
              type: "line" as any,
              borderColor: "#f87171",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
              order: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: tickColor, boxWidth: 12, font: { size: 11 } } },
            tooltip: tooltipOpts,
          },
          scales: {
            x: { ticks: { color: tickColor, maxTicksLimit: 12, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      });
      chartRefs.current.push(chart);
    }
  };

  useEffect(() => {
    setSym(initialSym);
  }, [initialSym]);

  useEffect(() => {
    return () => { chartRefs.current.forEach(c => c?.destroy()); chartRefs.current = []; };
  }, []);

  const algos = analysis ? [
    { name: "Linear Regression", signal: (analysis.linearRegression?.r2 ?? 0) >= 0.6 ? "bullish" : "neutral", detail: `R² = ${analysis.linearRegression?.r2} | Next 7d: $${analysis.linearRegression?.predictions?.[6]?.toFixed(2)}` },
    { name: "SMA (14)",  signal: analysis.sma14?.signal ?? "neutral", detail: `Latest: $${analysis.sma14?.latest?.toFixed(2)}` },
    { name: "EMA (12)",  signal: analysis.sma14?.signal ?? "neutral", detail: `Latest: $${analysis.ema12?.latest?.toFixed(2)}` },
    { name: "RSI (14)",  signal: analysis.rsi14?.signal ?? "neutral", detail: `RSI = ${analysis.rsi14?.latest?.toFixed(2)}` },
    { name: "MACD",      signal: analysis.macd?.signal  ?? "neutral", detail: `MACD: ${analysis.macd?.latest?.macd?.toFixed(3)} | Hist: ${analysis.macd?.latest?.histogram?.toFixed(3)}` },
  ] : [];

  return (
    <div>
      {/* Input */}
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Run analysis</CardTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={sym} onChange={e => setSym(e.target.value)} placeholder="Symbol"
            onKeyDown={e => e.key === "Enter" && run()}
            style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 160, outline: "none" }} />
          <button onClick={run} disabled={loading}
            style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Analysing…" : "Analyse"}
          </button>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
      </Card>

      {analysis && (
        <>
          {/* Overall sentiment */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Overall sentiment — {sym.toUpperCase()}</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Badge label={analysis.overallSentiment.toUpperCase()} color={analysis.overallSentiment} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Score: {analysis.sentimentScore > 0 ? "+" : ""}{analysis.sentimentScore}</span>
            </div>
          </Card>

          {/* Signal cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {algos.map(a => (
              <Card key={a.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{a.name}</span>
                  <Badge label={(a.signal || "neutral").replace(/_/g, " ").toUpperCase()} color={a.signal || "neutral"} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{a.detail}</div>
              </Card>
            ))}
          </div>

            {/* Linear Regression chart */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>
              <span>Linear Regression — Fitted Line <span style={{ color: "#f5c542" }}>●</span> 7-Day Prediction <span style={{ color: "#4ade80" }}>●</span></span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>R² = {analysis?.linearRegression?.r2}</span>
            </CardTitle>
            <div style={{ height: 240 }}><canvas ref={lrRef} /></div>
          </Card>

          {/* Price chart: SMA + EMA + Prediction */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>
              <span>Price Trend — SMA 14 <span style={{ color: "#f5c542" }}>●</span> EMA 12 <span style={{ color: "#60a5fa" }}>●</span> Prediction <span style={{ color: "#4ade80" }}>●</span></span>
            </CardTitle>
            <div style={{ height: 280 }}>
              <canvas ref={priceRef} />
            </div>
          </Card>

          {/* RSI chart */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>
              <span>RSI (14) <span style={{ color: "#a78bfa" }}>●</span></span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>Overbought &gt;70 · Oversold &lt;30</span>
            </CardTitle>
            <div style={{ height: 180 }}>
              <canvas ref={rsiRef} />
            </div>
          </Card>

          {/* MACD chart */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>
              <span>MACD — Line <span style={{ color: "#f5c542" }}>●</span> Signal <span style={{ color: "#f87171" }}>●</span> Histogram</span>
            </CardTitle>
            <div style={{ height: 200 }}>
              <canvas ref={macdRef} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
// function AnalysisView({ initialSym = "AAPL" }: { initialSym?: string }) {
//   const [sym, setSym] = useState(initialSym); const [analysis, setAnalysis] = useState<Analysis | null>(null);
//   const [loading, setLoading] = useState(false); const [error, setError] = useState("");
//   const run = async () => {
//     if (!sym) return; setLoading(true); setError(""); setAnalysis(null);
//     try { setAnalysis(await getFullAnalysis(sym.toUpperCase()) as Analysis); } catch (e: any) { setError(e.message); }
//     setLoading(false);
//   };
//   const algos = analysis ? [
//     { name: "Linear Regression", signal: (analysis.linearRegression?.r2 ?? 0) >= 0.6 ? "bullish" : "neutral", detail: `R² = ${analysis.linearRegression?.r2} | Next 7d: $${analysis.linearRegression?.predictions?.[6]}` },
//     { name: "SMA (14)",          signal: analysis.sma14?.signal ?? "neutral",  detail: `Latest SMA-14: $${analysis.sma14?.latest}` },
//     { name: "EMA (12)",          signal: analysis.sma14?.signal ?? "neutral",  detail: `Latest EMA-12: $${analysis.ema12?.latest}` },
//     { name: "RSI (14)",          signal: analysis.rsi14?.signal ?? "neutral",  detail: `RSI = ${analysis.rsi14?.latest}` },
//     { name: "MACD",              signal: analysis.macd?.signal  ?? "neutral",  detail: `MACD: ${analysis.macd?.latest?.macd?.toFixed(3)} | Signal: ${analysis.macd?.latest?.signal?.toFixed(3)} | Hist: ${analysis.macd?.latest?.histogram?.toFixed(3)}` },
//   ] : [];
//   return (
//     <div>
//       <Card style={{ marginBottom: 16 }}>
//         <CardTitle>Run analysis</CardTitle>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input value={sym} onChange={(e) => setSym(e.target.value)} placeholder="Symbol" onKeyDown={(e) => e.key === "Enter" && run()} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 160, outline: "none" }} />
//           <button onClick={run} disabled={loading} style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{loading ? "Analysing…" : "Analyse"}</button>
//         </div>
//         {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
//       </Card>
//       {analysis && (
//         <>
//           <Card style={{ marginBottom: 16 }}>
//             <CardTitle>Overall sentiment — {sym.toUpperCase()}</CardTitle>
//             <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//               <Badge label={analysis.overallSentiment.toUpperCase()} color={analysis.overallSentiment} />
//               <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Score: {analysis.sentimentScore > 0 ? "+" : ""}{analysis.sentimentScore}</span>
//             </div>
//           </Card>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
//             {algos.map((a) => (
//               <Card key={a.name}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{a.name}</span>
//                   <Badge label={(a.signal || "neutral").replace(/_/g, " ").toUpperCase()} color={a.signal || "neutral"} />
//                 </div>
//                 <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{a.detail}</div>
//               </Card>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// ─── Chart View ────────────────────────────────────────────────────────────────
function ChartView() {
  const [sym, setSym]         = useState("AAPL");
  const [input, setInput]     = useState("AAPL");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const candleRef             = useRef<HTMLCanvasElement>(null);
  const volumeRef             = useRef<HTMLCanvasElement>(null);
  const chartRefs             = useRef<any[]>([]);

  const fetchData = async (symbol: string) => {
    setLoading(true); setError(""); setChartData(null);
    try {
      const res  = await fetch(`http://localhost:5000/api/stocks/candles/${symbol}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data || data.s === "no_data" || !data.c || data.c.length === 0) {
        setError("No chart data available"); setLoading(false); return;
      }
      const raw = data.t.map((t: number, i: number) => ({
        date: new Date(t * 1000), open: data.o[i], high: data.h[i],
        low: data.l[i], close: data.c[i], volume: data.v[i],
      }));
      setChartData({ candles: raw.slice(-60), symbol });
    } catch { setError("Failed to load chart data"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(sym); }, [sym]);

  useEffect(() => {
    if (!chartData || !candleRef.current || !volumeRef.current) return;

    chartRefs.current.forEach(c => { try { c?.destroy(); } catch {} });
    chartRefs.current = [];

    const { candles } = chartData;
    const labels  = candles.map((c: any) => c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    const closes  = candles.map((c: any) => c.close);
    const volumes = candles.map((c: any) => c.volume);
    const sma14   = calcSMA(closes, 14);
    const ema26   = calcEMA(closes, 26);

    import("chart.js/auto").then(({ default: Chart }) => {
      if (!candleRef.current || !volumeRef.current) return;

      const priceChart = new Chart(candleRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Price",
              data: closes,
              backgroundColor: candles.map((c: any) => c.close >= c.open ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)"),
              borderColor:     candles.map((c: any) => c.close >= c.open ? "#4ade80" : "#f87171"),
              borderWidth: 1, borderRadius: 2,
            },
            { label: "SMA 14", data: sma14, type: "line" as any, borderColor: "#f5c542", borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false },
            { label: "EMA 26", data: ema26, type: "line" as any, borderColor: "#60a5fa", borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: "rgba(255,255,255,0.6)", boxWidth: 12, font: { size: 11 } } },
            tooltip: { backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, titleColor: "#fff", bodyColor: "rgba(255,255,255,0.7)" },
          },
          scales: {
            x: { ticks: { color: "rgba(255,255,255,0.4)", maxTicksLimit: 10, font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "rgba(255,255,255,0.4)", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
      chartRefs.current.push(priceChart);

      const volChart = new Chart(volumeRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Volume", data: volumes,
            backgroundColor: candles.map((c: any) => c.close >= c.open ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"),
            borderRadius: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "rgba(255,255,255,0.6)", boxWidth: 12, font: { size: 11 } } },
            tooltip: { backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, titleColor: "#fff", bodyColor: "rgba(255,255,255,0.7)", callbacks: { label: (ctx) => `Volume: ${Number(ctx.raw).toLocaleString()}` } },
          },
          scales: {
            x: { ticks: { color: "rgba(255,255,255,0.4)", maxTicksLimit: 10, font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "rgba(255,255,255,0.4)", font: { size: 10 }, callback: (v: any) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v }, grid: { color: "rgba(255,255,255,0.05)" } },
          },
        },
      });
      chartRefs.current.push(volChart);
    });
  }, [chartData]);

  useEffect(() => {
    return () => { chartRefs.current.forEach(c => { try { c?.destroy(); } catch {} }); };
  }, []);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Stock Chart</CardTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && setSym(input)}
            placeholder="Symbol e.g. AAPL"
            style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 180, outline: "none" }} />
          <button onClick={() => setSym(input)}
            style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Load Chart
          </button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>or press Enter</span>
        </div>
      </Card>

      {loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "rgba(255,255,255,0.4)" }}>Loading chart…</div>}
      {error   && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#f87171" }}>{error}</div>}

      {/* Always render canvases but hide when no data */}
      <div style={{ display: chartData ? "flex" : "none", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
            {sym} — Price &nbsp;
            <span style={{ color: "#f5c542" }}>● SMA 14</span> &nbsp;
            <span style={{ color: "#60a5fa" }}>● EMA 26</span>
          </div>
          <div style={{ position: "relative", height: 320 }}>
            <canvas ref={candleRef} />
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Volume</div>
          <div style={{ position: "relative", height: 140 }}>
            <canvas ref={volumeRef} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── News View ─────────────────────────────────────────────────────────────────
function NewsView({ news }: { news: NewsItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
      {news.map((n, i) => (
        <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <Card style={{ height: "100%", cursor: "pointer" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.5, marginBottom: 8 }}>{n.headline}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.summary}</div>
          </Card>
        </a>
      ))}
    </div>
  );
}
// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [name, setName]         = useState(user?.name || "");
  const [email, setEmail]       = useState(user?.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg]           = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { setError("All fields required"); return; }
    if (newPw.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); setError(""); setMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("stockix_token")}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update password"); }
      else { setMsg("Password updated successfully!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Profile Info */}
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Profile</CardTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#0d0d0d" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{user?.email}</div>
            <div style={{ fontSize: 11, marginTop: 4, background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>{user?.role}</div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Change Password</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Current Password", val: currentPw, set: setCurrentPw, ph: "Enter current password" },
            { label: "New Password",     val: newPw,     set: setNewPw,     ph: "Min. 8 characters"      },
            { label: "Confirm Password", val: confirmPw, set: setConfirmPw, ph: "Repeat new password"    },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>{f.label}</label>
              <input
                value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph} type="password"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}

          {error && <div style={{ color: "#f87171", fontSize: 13, padding: "8px 12px", background: "rgba(248,113,113,0.08)", borderRadius: 8 }}>{error}</div>}
          {msg   && <div style={{ color: "#4ade80", fontSize: 13, padding: "8px 12px", background: "rgba(74,222,128,0.08)",  borderRadius: 8 }}>{msg}</div>}

          <button onClick={handleUpdatePassword} disabled={loading} style={{ background: "#fff", color: "#0d0d0d", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            {loading ? "Updating…" : "Update Password"}
          </button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardTitle>Account</CardTitle>
        <button onClick={handleLogout} style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Sign Out
        </button>
      </Card>
    </div>
  );
}
// ─── Search Bar ───────────────────────────────────────────────────────────────
const POPULAR = ["AAPL", "TSLA", "MSFT", "AMZN", "GOOGL", "NVDA", "META", "NFLX"];

function SearchBar({ onSelect }: { onSelect: (sym: string) => void }) {
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<any[]>([]);
  const [showPopular, setShowPopular] = useState(false);
  const [loading, setLoading]         = useState(false);
  const searchTimer                   = useRef<any>(null);

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length < 1) { setResults([]); setShowPopular(true); return; }
    setLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/stocks/search?q=${val}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("stockix_token")}` },
        });
        const data = await res.json();
        setResults(data.slice(0, 6));
        setShowPopular(false);
      } catch {}
      setLoading(false);
    }, 300);
  };

  const handleSelect = (sym: string) => {
    setQuery(""); setResults([]); setShowPopular(false);
    onSelect(sym);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => handleSearch(e.target.value.toUpperCase())}
        onFocus={() => { if (!query) setShowPopular(true); }}
        onBlur={() => setTimeout(() => { setShowPopular(false); setResults([]); }, 150)}
        placeholder="Search stocks…"
        style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#fff", width: 200, outline: "none" }}
      />
      {showPopular && !query && (
        <div style={{ position: "absolute", top: "100%", right: 0, width: 240, background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, marginTop: 4, zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textTransform: "uppercase" }}>Popular Stocks</div>
          {POPULAR.map(sym => (
            <div key={sym} onMouseDown={() => handleSelect(sym)} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderTop: "0.5px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{sym}</span>
            </div>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", right: 0, width: 300, background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, marginTop: 4, zIndex: 200, overflow: "hidden" }}>
          {loading && <div style={{ padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Searching…</div>}
          {results.map((s: any) => (
            <div key={s.symbol} onMouseDown={() => handleSelect(s.symbol)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.symbol}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{s.description?.slice(0, 25)}</span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.region}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
 const [tab, setTab]           = useState("dashboard");
const [searchSym, setSearchSym] = useState("AAPL");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [news, setNews]           = useState<NewsItem[]>([]);

  const loadPortfolio = useCallback(async () => { try { setPortfolio(await getPortfolio()); } catch {} }, []);
  const loadWatchlist = useCallback(async () => { try { setWatchlist((await getWatchlist()) as WatchItem[]); } catch {} }, []);
  const loadNews      = useCallback(async () => { try { setNews((await getNews("AAPL")) as NewsItem[]); } catch {} }, []);

  useEffect(() => {
    loadPortfolio(); loadWatchlist(); loadNews();
    const interval = setInterval(() => { loadPortfolio(); loadWatchlist(); }, 30000);
    return () => clearInterval(interval);
  }, [loadPortfolio, loadWatchlist, loadNews]);

  const TITLES: Record<string, string> = { dashboard: "Dashboard", portfolio: "Portfolio", watchlist: "Watchlist", analysis: "Analysis", chart: "Chart", news: "Market News", settings: "Settings" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d0d", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar active={tab} onChange={setTab} />
      <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{TITLES[tab]}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SearchBar onSelect={(sym) => { setSearchSym(sym); setTab("analysis"); }} />
            <span style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>● Live</span>
          </div>
        </div>
        {tab === "dashboard" && <DashboardView portfolio={portfolio} watchlist={watchlist} news={news} />}
        {tab === "portfolio" && <PortfolioView portfolio={portfolio} onRefresh={loadPortfolio} />}
        {tab === "watchlist" && <WatchlistView watchlist={watchlist} onRefresh={loadWatchlist} />}
        {tab === "analysis"  && <AnalysisView initialSym={searchSym} />}
        {tab === "chart"     && <ChartView />}
        {tab === "news"      && <NewsView news={news} />}
        {tab === "settings"  && <SettingsView />}
      </main>
    </div>
  );
}
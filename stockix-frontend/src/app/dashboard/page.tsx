"use client";

import { useState, useEffect, useCallback } from "react";
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
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>
      {label}
    </span>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "portfolio", icon: "◎", label: "Portfolio" },
  { id: "watchlist", icon: "◈", label: "Watchlist" },
  { id: "analysis",  icon: "◉", label: "Analysis"  },
  { id: "news",      icon: "≡", label: "News"       },
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

      <div style={{ padding: "16px 20px", borderTop: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0d0d0d" }}>JD</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>John Doe</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Pro plan</div>
        </div>
      </div>
    </aside>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {children}
    </div>
  );
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardTitle>Watchlist</CardTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["Symbol","Price","Change","7D"].map(h => (
                <th key={h} style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, textAlign: "left", paddingBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {watchlist.slice(0, 5).map((s) => (
                <tr key={s.symbol}>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", fontWeight: 600, color: "#fff" }}>{s.symbol}</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}>${fmt(s.price)}</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)", color: s.changePct >= 0 ? "#4ade80" : "#f87171" }}>{s.changePct >= 0 ? "+" : ""}{s.changePct?.toFixed(2)}%</td>
                  <td style={{ padding: "9px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    <Sparkline data={[s.price*0.97, s.price*0.98, s.price*0.975, s.price*0.99, s.price*0.995, s.price, s.price]} up={s.changePct >= 0} />
                  </td>
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
  const [sym, setSym]   = useState("");
  const [qty, setQty]   = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleAdd = async () => {
    if (!sym || !qty || !cost) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try {
      await addPosition({ symbol: sym.toUpperCase(), quantity: parseFloat(qty), avgCost: parseFloat(cost) });
      setSym(""); setQty(""); setCost("");
      onRefresh();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Add position</CardTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { val: sym,  set: setSym,  ph: "Symbol (AAPL)" },
            { val: qty,  set: setQty,  ph: "Quantity"       },
            { val: cost, set: setCost, ph: "Avg cost ($)"   },
          ].map((f) => (
            <input key={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
              style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 160, outline: "none" }} />
          ))}
          <button onClick={handleAdd} disabled={loading}
            style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Adding…" : "+ Add"}
          </button>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>}
      </Card>

      <Card>
        <CardTitle>
          <span>Positions</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Total: ${fmt(portfolio?.totalValue || 0)}</span>
        </CardTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>{["Symbol","Qty","Avg Cost","Live Price","Value","P&L","Day %",""].map(h => (
              <th key={h} style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, textAlign: "left", paddingBottom: 10, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
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
                  <button onClick={() => deletePosition(p.symbol).then(onRefresh)}
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
                    Remove
                  </button>
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
  const [sym, setSym]         = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!sym) return;
    setLoading(true);
    try { await addToWatchlist({ symbol: sym.toUpperCase() }); setSym(""); onRefresh(); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Add to watchlist</CardTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={sym} onChange={(e) => setSym(e.target.value)} placeholder="Symbol (e.g. TSLA)"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, width: 200, outline: "none" }} />
          <button onClick={handleAdd} disabled={loading}
            style={{ background: "#4ade80", color: "#0d0d0d", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
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
                <button onClick={() => removeFromWatchlist(w.symbol).then(onRefresh)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
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
function AnalysisView() {
  const [sym, setSym]           = useState("AAPL");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const run = async () => {
    if (!sym) return;
    setLoading(true); setError(""); setAnalysis(null);
    try { setAnalysis(await getFullAnalysis(sym.toUpperCase()) as Analysis); }
    catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const algos = analysis ? [
    { name: "Linear Regression", signal: (analysis.linearRegression?.r2 ?? 0) >= 0.6 ? "bullish" : "neutral", detail: `R² = ${analysis.linearRegression?.r2} | Next 7d: $${analysis.linearRegression?.predictions?.[6]}` },
    { name: "SMA (14)",          signal: analysis.sma14?.signal ?? "neutral",  detail: `Latest SMA-14: $${analysis.sma14?.latest}` },
    { name: "EMA (12)",          signal: analysis.sma14?.signal ?? "neutral",  detail: `Latest EMA-12: $${analysis.ema12?.latest}` },
    { name: "RSI (14)",          signal: analysis.rsi14?.signal ?? "neutral",  detail: `RSI = ${analysis.rsi14?.latest}` },
    { name: "MACD",              signal: analysis.macd?.signal  ?? "neutral",  detail: `MACD: ${analysis.macd?.latest?.macd?.toFixed(3)} | Signal: ${analysis.macd?.latest?.signal?.toFixed(3)} | Hist: ${analysis.macd?.latest?.histogram?.toFixed(3)}` },
  ] : [];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Run analysis</CardTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={sym} onChange={(e) => setSym(e.target.value)} placeholder="Symbol"
            onKeyDown={(e) => e.key === "Enter" && run()}
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
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Overall sentiment — {sym.toUpperCase()}</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Badge label={analysis.overallSentiment.toUpperCase()} color={analysis.overallSentiment} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Score: {analysis.sentimentScore > 0 ? "+" : ""}{analysis.sentimentScore}</span>
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {algos.map((a) => (
              <Card key={a.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{a.name}</span>
                  <Badge label={(a.signal || "neutral").replace(/_/g, " ").toUpperCase()} color={a.signal || "neutral"} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{a.detail}</div>
              </Card>
            ))}
          </div>
        </>
      )}
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab]             = useState("dashboard");
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

  const TITLES: Record<string, string> = { dashboard: "Dashboard", portfolio: "Portfolio", watchlist: "Watchlist", analysis: "Analysis", news: "Market News" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0d0d", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar active={tab} onChange={setTab} />
      <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{TITLES[tab]}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input placeholder="Search stocks…" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "rgba(255,255,255,0.6)", width: 180, outline: "none" }} />
            <span style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>● Live</span>
          </div>
        </div>
        {tab === "dashboard" && <DashboardView portfolio={portfolio} watchlist={watchlist} news={news} />}
        {tab === "portfolio" && <PortfolioView portfolio={portfolio} onRefresh={loadPortfolio} />}
        {tab === "watchlist" && <WatchlistView watchlist={watchlist} onRefresh={loadWatchlist} />}
        {tab === "analysis"  && <AnalysisView />}
        {tab === "news"      && <NewsView news={news} />}
      </main>
    </div>
  );
}
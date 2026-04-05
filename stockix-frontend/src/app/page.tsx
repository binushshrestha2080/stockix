"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TickerItem { sym: string; price: string; change: string; up: boolean; }

const STOCKS: TickerItem[] = [
  { sym: "AAPL",  price: "213.18", change: "+1.24%", up: true  },
  { sym: "TSLA",  price: "172.55", change: "-0.87%", up: false },
  { sym: "GOOGL", price: "165.30", change: "+0.52%", up: true  },
  { sym: "MSFT",  price: "415.40", change: "+0.93%", up: true  },
  { sym: "AMZN",  price: "196.80", change: "-1.10%", up: false },
  { sym: "NVDA",  price: "876.50", change: "+2.31%", up: true  },
  { sym: "META",  price: "502.10", change: "+0.67%", up: true  },
  { sym: "NFLX",  price: "634.20", change: "-0.44%", up: false },
  { sym: "BRK.B", price: "399.75", change: "+0.18%", up: true  },
  { sym: "JPM",   price: "210.55", change: "+0.35%", up: true  },
];

const FEATURES = [
  { icon: "📈", bg: "rgba(74,222,128,0.12)",  title: "Real-time Prices",   desc: "Live stock prices with millisecond updates. Never miss a market move."                        },
  { icon: "💼", bg: "rgba(96,165,250,0.12)",  title: "Portfolio Tracking", desc: "Monitor your holdings, P&L, and performance across all positions in one view."               },
  { icon: "📊", bg: "rgba(251,191,36,0.12)",  title: "Advanced Charts",    desc: "Interactive candlestick charts with technical indicators and custom time ranges."             },
  { icon: "🗞️", bg: "rgba(248,113,113,0.12)", title: "Market News",        desc: "Curated financial news and alerts for every stock in your watchlist, updated live."          },
];

const NAV_LINKS = [
  { label: "Features",  href: "#features"  },
  { label: "Markets",   href: "#markets"   },
  { label: "Portfolio", href: "#portfolio" },
  { label: "News",      href: "#news"      },
];

function LogoIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
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

export default function LandingPage() {
  const router  = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const doubled = [...STOCKS, ...STOCKS];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { background:#0d0d0d; color:#f0f0f0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex; gap: 40px;
          width: max-content;
          animation: ticker 28s linear infinite;
        }
        .nav-link:hover     { color: #fff !important; }
        .feature-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.16) !important; }

        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title    { font-size: 38px !important; }
          .nav-links     { display: none !important; }
          .stats-row     { gap: 24px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>

        {/* NAV */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 48px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          position: "sticky", top: 0, zIndex: 100,
          background: scrolled ? "rgba(13,13,13,0.96)" : "#0d0d0d",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          transition: "background 0.3s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>STOCKIX</span>
          </div>

          <ul className="nav-links" style={{ display: "flex", gap: 28, listStyle: "none" }}>
            {NAV_LINKS.map(l => (
              <li key={l.label}>
                <a href={l.href} className="nav-link" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <button onClick={() => router.push("/auth")} style={{
            background: "#fff", color: "#0d0d0d", border: "none",
            padding: "9px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: "pointer", letterSpacing: 0.5, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Get Started</button>
        </nav>

        {/* TICKER */}
        <div style={{ overflow: "hidden", borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "8px 0" }}>
          <div className="ticker-track">
            {doubled.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "#fff" }}>{s.sym}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>${s.price}</span>
                <span style={{ color: s.up ? "#4ade80" : "#f87171" }}>{s.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HERO */}
        <section style={{ textAlign: "center", padding: "90px 24px 80px", maxWidth: 780, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)", fontSize: 12, padding: "5px 14px",
            borderRadius: 20, marginBottom: 28, letterSpacing: 0.5,
          }}>Real-time market intelligence</div>

          <h1 className="hero-title" style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, color: "#fff", marginBottom: 22 }}>
            Track every stock,<br />
            <span style={{
              background: "linear-gradient(90deg,#a3e635,#4ade80)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>stay ahead always</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
            STOCKIX gives you real-time prices, smart portfolio tracking, and algorithm-based insights — all in one clean dashboard.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/register")} style={{
              background: "#fff", color: "#0d0d0d", padding: "13px 28px",
              borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer",
              border: "none", letterSpacing: 0.3, transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Get Started Free</button>

            <button onClick={() => router.push("/auth/login")} style={{
              background: "transparent", color: "rgba(255,255,255,0.8)",
              padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 500,
              cursor: "pointer", border: "0.5px solid rgba(255,255,255,0.25)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
            >Sign In</button>
          </div>
        </section>

        {/* STATS */}
        <div className="stats-row" style={{
          display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap",
          padding: "40px 24px",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          {[
            { num: "50K+",      label: "Stocks tracked" },
            { num: "Real-time", label: "Market data"     },
            { num: "5",         label: "Algorithms"      },
            { num: "100%",      label: "Free to start"   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section id="features" style={{ padding: "80px 48px", maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
            Everything you need
          </p>
          <h2 style={{ textAlign: "center", fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 52, letterSpacing: -0.5 }}>
            Built for serious investors
          </h2>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{
                background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "28px 24px", transition: "all 0.2s", cursor: "default",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 18, background: f.bg }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{
          textAlign: "center", padding: "80px 24px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
        }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 14, letterSpacing: -0.5 }}>Start tracking smarter</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            Join thousands of investors using STOCKIX to make better decisions.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/register")} style={{
              background: "#fff", color: "#0d0d0d", padding: "15px 36px",
              borderRadius: 8, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Create Free Account</button>

            <button onClick={() => router.push("/auth/login")} style={{
              background: "transparent", color: "rgba(255,255,255,0.8)", padding: "15px 36px",
              borderRadius: 8, fontSize: 16, fontWeight: 500, cursor: "pointer",
              border: "0.5px solid rgba(255,255,255,0.25)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
            >Sign In</button>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ textAlign: "center", padding: 24, borderTop: "0.5px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © 2026 STOCKIX. Built with Next.js &amp; TypeScript.
        </footer>

      </div>
    </>
  );
}
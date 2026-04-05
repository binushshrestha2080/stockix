"use client";
import { useRouter } from "next/navigation";

export default function AuthSelect() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <svg width="40" height="40" viewBox="0 0 34 34" fill="none" style={{ marginBottom: 12 }}>
            <rect width="34" height="34" rx="7" fill="#1a1a1a" />
            <rect x="5"  y="22" width="4" height="7"  rx="1" fill="white" opacity="0.9" />
            <rect x="11" y="17" width="4" height="12" rx="1" fill="white" opacity="0.9" />
            <rect x="17" y="12" width="4" height="17" rx="1" fill="white" opacity="0.9" />
            <rect x="23" y="7"  width="4" height="22" rx="1" fill="white" opacity="0.9" />
            <path d="M7 20 L13 15 L19 10 L25 5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="25" cy="5" r="1.5" fill="#4ade80" />
          </svg>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STOCKIX</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Choose how you want to continue</div>
        </div>

        {/* Role Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => router.push("/auth/login")} style={{
            background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "20px 24px", cursor: "pointer", textAlign: "left",
            transition: "all 0.2s", width: "100%",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          >
            <div style={{ fontSize: 18, marginBottom: 6 }}>👤</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Continue as User</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Access your portfolio, watchlist and analysis</div>
          </button>

          <button onClick={() => router.push("/auth/admin")} style={{
            background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "20px 24px", cursor: "pointer", textAlign: "left",
            transition: "all 0.2s", width: "100%",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          >
            <div style={{ fontSize: 18, marginBottom: 6 }}>🔐</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Continue as Admin</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Manage users, stocks and platform data</div>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}>
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
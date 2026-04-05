"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("All fields required"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      if (data.user.role !== "admin") { setError("Access denied. Admin only."); setLoading(false); return; }
      login(data.token, data.user);
      router.push("/admin");
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <svg width="40" height="40" viewBox="0 0 34 34" fill="none" style={{ marginBottom: 12 }}>
            <rect width="34" height="34" rx="7" fill="#1a1a1a" />
            <rect x="5"  y="22" width="4" height="7"  rx="1" fill="white" opacity="0.9" />
            <rect x="11" y="17" width="4" height="12" rx="1" fill="white" opacity="0.9" />
            <rect x="17" y="12" width="4" height="17" rx="1" fill="white" opacity="0.9" />
            <rect x="23" y="7"  width="4" height="22" rx="1" fill="white" opacity="0.9" />
            <path d="M7 20 L13 15 L19 10 L25 5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="25" cy="5" r="1.5" fill="#4ade80" />
          </svg>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STOCKIX</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Admin access only</div>
          <div style={{ marginTop: 12, background: "rgba(251,191,36,0.08)", border: "0.5px solid rgba(251,191,36,0.2)", borderRadius: 8, padding: "8px 16px", display: "inline-block" }}>
            <span style={{ fontSize: 12, color: "#fbbf24" }}>🔐 Restricted area</span>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>Admin Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@stockix.com" type="email"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" type="password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(248,113,113,0.08)", borderRadius: 8 }}>{error}</div>}

          <button onClick={handleLogin} disabled={loading} style={{
            background: "#fbbf24", color: "#0d0d0d", border: "none", borderRadius: 8,
            padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4,
          }}>
            {loading ? "Verifying…" : "Admin Sign In"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => router.push("/auth")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
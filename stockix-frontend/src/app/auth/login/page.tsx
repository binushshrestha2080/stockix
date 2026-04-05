"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
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
      login(data.token, data.user);
      router.push("/dashboard");
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Top bar */}
      <div style={{ padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/")}>
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="7" fill="#1a1a1a" />
            <rect x="5"  y="22" width="4" height="7"  rx="1" fill="white" opacity="0.9" />
            <rect x="11" y="17" width="4" height="12" rx="1" fill="white" opacity="0.9" />
            <rect x="17" y="12" width="4" height="17" rx="1" fill="white" opacity="0.9" />
            <rect x="23" y="7"  width="4" height="22" rx="1" fill="white" opacity="0.9" />
            <path d="M7 20 L13 15 L19 10 L25 5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="25" cy="5" r="1.5" fill="#4ade80" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>STOCKIX</span>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 32, letterSpacing: -0.5 }}>
            Welcome back
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 8, display: "block" }}>Email</label>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email" type="email"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", background: "#161616",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "14px 16px", color: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 8, display: "block" }}>Password</label>
              <input
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" type="password"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", background: "#161616",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "14px 16px", color: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {error && (
              <div style={{ color: "#f87171", fontSize: 13, padding: "10px 14px", background: "rgba(248,113,113,0.08)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)" }}>
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} style={{
              background: "#f5c542", color: "#0a0a0a", border: "none", borderRadius: 8,
              padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              marginTop: 4, transition: "opacity 0.2s", letterSpacing: 0.3,
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Don't have an account?{" "}
            <button onClick={() => router.push("/auth/register")} style={{ background: "none", border: "none", color: "#f5c542", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Create an account
            </button>
          </p>

          <p style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => router.push("/auth")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 13 }}>
              ← Back to role selection
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
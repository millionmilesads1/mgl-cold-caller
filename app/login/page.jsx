"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (res.ok) window.location.href = "/";
      else setErr("Wrong password");
    } catch { setErr("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, system-ui, sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 32, width: 340, textAlign: "center" }}>
        <h1 style={{ color: "#e0e0e0", fontSize: 20, fontWeight: 800, marginBottom: 4 }}><span style={{ color: "#3b82f6" }}>MGL</span> Cold Caller</h1>
        <p style={{ color: "#555", fontSize: 12, marginBottom: 24 }}>Enter password to access</p>
        <form onSubmit={submit}>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus style={{ width: "100%", background: "#0d0d0d", border: "1px solid #222", borderRadius: 6, padding: "12px 14px", color: "#e0e0e0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }} />
          {err && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{err}</p>}
          <button type="submit" disabled={loading || !pw} style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.6 : 1 }}>{loading ? "Checking..." : "Enter"}</button>
        </form>
      </div>
    </div>
  );
}

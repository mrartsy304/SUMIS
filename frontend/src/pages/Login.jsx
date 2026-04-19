// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  student:           "/dashboard/student",
  faculty:           "/dashboard/faculty",
  admin:             "/dashboard/admin",
  staff:             "/dashboard",
  event_coordinator: "/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ email: email.trim().toLowerCase(), password });
      const dest  = ROLE_HOME[user?.role] || "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.logo}>🎓</span>
          <div>
            <h1 style={s.title}>SUMIS</h1>
            <p style={s.sub}>Smart University Service & Information Management System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sumis.edu"
              required
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={s.input}
            />
          </div>

          {error && (
            <div style={s.errBanner}>⚠️ {error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.btn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:     { minHeight: "100vh", background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card:     { background: "#fff", borderRadius: "20px", padding: "40px 36px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  brand:    { display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", paddingBottom: "24px", borderBottom: "1.5px solid #f3f4f6" },
  logo:     { fontSize: "40px" },
  title:    { margin: 0, fontSize: "26px", fontWeight: "800", color: "#111827" },
  sub:      { margin: "4px 0 0", fontSize: "11px", color: "#6b7280", lineHeight: "1.4" },
  form:     { display: "flex", flexDirection: "column", gap: "18px" },
  field:    { display: "flex", flexDirection: "column", gap: "6px" },
  label:    { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input:    { padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #d1d5db", fontSize: "14px", outline: "none", fontFamily: "inherit", color: "#111827" },
  errBanner:{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontWeight: "500" },
  btn:      { padding: "13px", borderRadius: "10px", border: "none", background: "#1d4ed8", color: "#fff", fontSize: "15px", fontWeight: "700", fontFamily: "inherit" },
};
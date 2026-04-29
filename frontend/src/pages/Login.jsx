import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setLocalError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form);
      // Route based on role
      const routes = {
        student: "/dashboard/student",
        faculty: "/dashboard/faculty",
        admin: "/dashboard/admin",
        staff: "/dashboard",
        event_coordinator: "/dashboard",
      };
      navigate(routes[user.role] || "/dashboard");
    } catch (err) {
      setLocalError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.grid} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◈</span>
          </div>
          <h1 style={styles.title}>SUMIS</h1>
          <p style={styles.subtitle}>Student University Management & Information System</p>
          <div style={styles.divider} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@sumis.edu"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          {displayError && <div style={styles.error}>{displayError}</div>}

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.btn, ...styles.btnDisabled } : styles.btn}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        {/* Mock hint */}
        <div style={styles.hint}>
          <p style={styles.hintTitle}>Dev Mode — Quick Login</p>
          <p style={styles.hintText}>Include role in email: <code style={styles.code}>student@x.com</code>, <code style={styles.code}>faculty@x.com</code>, <code style={styles.code}>admin@x.com</code></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Georgia', serif",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    background: "rgba(15,15,25,0.95)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 2,
    padding: "48px 40px",
    boxShadow: "0 0 80px rgba(99,102,241,0.08), 0 25px 50px rgba(0,0,0,0.5)",
  },
  header: { textAlign: "center", marginBottom: 32 },
  logo: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    border: "1px solid rgba(99,102,241,0.4)",
    borderRadius: 2,
    marginBottom: 16,
  },
  logoIcon: { fontSize: 22, color: "#818cf8" },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: "normal",
    color: "#e2e8f0",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 11,
    color: "#64748b",
    letterSpacing: "0.05em",
    lineHeight: 1.6,
  },
  divider: {
    width: 40,
    height: 1,
    background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
    margin: "20px auto 0",
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" },
  input: {
    background: "rgba(99,102,241,0.04)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 2,
    padding: "11px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  inputFocus: {
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.5)",
    borderRadius: 2,
    padding: "11px 14px",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  error: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 2,
    padding: "10px 14px",
    color: "#fca5a5",
    fontSize: 13,
  },
  btn: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    borderRadius: 2,
    padding: "13px",
    color: "#fff",
    fontSize: 14,
    letterSpacing: "0.05em",
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.2s",
    fontFamily: "inherit",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  hint: {
    marginTop: 28,
    padding: "14px 16px",
    background: "rgba(99,102,241,0.04)",
    border: "1px solid rgba(99,102,241,0.1)",
    borderRadius: 2,
  },
  hintTitle: { margin: "0 0 4px", fontSize: 11, color: "#818cf8", fontFamily: "monospace", letterSpacing: "0.05em" },
  hintText: { margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.7 },
  code: { color: "#a5b4fc", background: "rgba(99,102,241,0.15)", padding: "1px 5px", borderRadius: 2 },
};

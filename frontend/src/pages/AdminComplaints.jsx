/**
 * FR-10–13 | AdminComplaints.jsx
 * Route: /admin/complaints  (admin only)
 *
 * FIXES APPLIED:
 *  1. Replaced raw fetch() with complaintsAPI (axios) — ensures session cookie,
 *     correct baseURL from .env, and Authorization header are all sent consistently.
 *  2. Error message now surfaces the actual server message (not just "Failed to fetch").
 *  3. Removed hardcoded "http://localhost:5000/api" — caused failures on any
 *     non-localhost environment.
 */

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { complaintsAPI } from "../services/api";  // FIX: use axios wrapper, not raw fetch

const PRIORITY_COLORS = {
  Low:      { bg: "#dcfce7", text: "#166534" },
  Medium:   { bg: "#fef9c3", text: "#854d0e" },
  High:     { bg: "#fee2e2", text: "#991b1b" },
  Critical: { bg: "#ede9fe", text: "#5b21b6" },
};

const STATUS_COLORS = {
  Pending:   { bg: "#e0f2fe", text: "#0369a1" },
  Completed: { bg: "#dcfce7", text: "#166534" },
};

const ROLE_BADGE = {
  student: { bg: "#ede9fe", text: "#5b21b6" },
  faculty: { bg: "#e0f2fe", text: "#0369a1" },
  staff:   { bg: "#d1fae5", text: "#065f46" },
};

export default function AdminComplaints() {
  const [complaints,     setComplaints]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [updating,       setUpdating]       = useState(null);

  // ── Fetch all complaints on mount ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    // FIX: use complaintsAPI.getAll() — handles baseURL, credentials, and auth header
    complaintsAPI.getAll()
      .then((res) => {
        if (res.data?.success) {
          setComplaints(res.data.data || []);
        } else {
          setError(res.data?.message || "Failed to load complaints.");
        }
      })
      .catch((err) => {
        // FIX: surface real server error message, not just "Failed to fetch"
        const msg =
          err.response?.data?.message ||
          (err.response?.status ? `HTTP ${err.response.status} — ${err.response.statusText}` : null) ||
          err.message ||
          "Network error — could not reach the server. Is the Flask backend running on the correct port?";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Mark complaint as Completed ───────────────────────────────────────────
  const handleMarkCompleted = (id) => {
    setUpdating(id);

    complaintsAPI.updateStatus(id, { status: "Completed" })
      .then((res) => {
        if (res.data?.success) {
          setComplaints((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: "Completed" } : c))
          );
        } else {
          alert(res.data?.message || "Failed to update status.");
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "Network error. Could not update status.";
        alert(msg);
      })
      .finally(() => setUpdating(null));
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const categories = ["All", ...new Set(complaints.map((c) => c.category))];

  const filtered = complaints.filter((c) => {
    const statusMatch   = filterStatus   === "All" || c.status   === filterStatus;
    const categoryMatch = filterCategory === "All" || c.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  const pendingCount   = complaints.filter((c) => c.status === "Pending").length;
  const completedCount = complaints.filter((c) => c.status === "Completed").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <Navbar />

      <div style={s.page}>

        {loading && (
          <div style={s.center}>⏳ Loading complaints…</div>
        )}

        {/* FIX: error box now shows real server message + debug hint */}
        {!loading && error && (
          <div style={s.errorBox}>
            <strong>⚠️ Error:</strong> {error}
            <br />
            <small style={{ color: "#6b7280", marginTop: 6, display: "block" }}>
              Check: (1) Flask backend is running on the correct port, (2) .env
              REACT_APP_API_URL matches, (3) you are logged in as admin,
              (4) DevTools → Network tab for the raw HTTP response.
            </small>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Header */}
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.title}>All Complaints</h2>
                <p style={s.subtitle}>
                  {complaints.length} total &nbsp;·&nbsp;
                  <span style={{ color: "#0369a1" }}>{pendingCount} pending</span>
                  &nbsp;·&nbsp;
                  <span style={{ color: "#166534" }}>{completedCount} completed</span>
                </p>
              </div>
            </div>

            {/* Filters */}
            <div style={s.filters}>
              <div style={s.filterGroup}>
                <label style={s.filterLabel}>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={s.select}
                >
                  {["All", "Pending", "Completed"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div style={s.filterGroup}>
                <label style={s.filterLabel}>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={s.select}
                >
                  {categories.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <span style={s.filterCount}>
                Showing {filtered.length} of {complaints.length}
              </span>
            </div>

            {filtered.length === 0 && (
              <div style={s.empty}>No complaints match the current filters.</div>
            )}

            <div style={s.list}>
              {filtered.map((c) => {
                const pri  = PRIORITY_COLORS[c.priority] || { bg: "#f3f4f6", text: "#374151" };
                const sta  = STATUS_COLORS[c.status]     || { bg: "#f3f4f6", text: "#374151" };
                const role = ROLE_BADGE[c.user?.role]    || { bg: "#f3f4f6", text: "#374151" };

                return (
                  <div key={c.id} style={s.card}>
                    <div style={s.cardTop}>
                      <span style={s.cardId}>#{c.id}</span>
                      <div style={s.badges}>
                        <span style={{ ...s.badge, background: sta.bg, color: sta.text }}>
                          {c.status}
                        </span>
                        <span style={{ ...s.badge, background: pri.bg, color: pri.text }}>
                          {c.priority}
                        </span>
                        <span style={s.categoryPill}>{c.category}</span>
                      </div>
                    </div>

                    <h3 style={s.cardTitle}>{c.title}</h3>
                    <p style={s.cardDesc}>{c.description}</p>

                    {c.user && (
                      <div style={s.submitter}>
                        <span style={{ ...s.badge, background: role.bg, color: role.text, fontSize: "11px" }}>
                          {c.user.role}
                        </span>
                        <span style={s.submitterName}>{c.user.name || "Unknown"}</span>
                        {c.user.email && (
                          <span style={s.submitterEmail}>{c.user.email}</span>
                        )}
                      </div>
                    )}

                    <div style={s.cardFooter}>
                      <span style={s.cardDate}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : ""}
                      </span>

                      {c.status === "Pending" && (
                        <button
                          style={{
                            ...s.resolveBtn,
                            opacity: updating === c.id ? 0.6 : 1,
                            cursor:  updating === c.id ? "not-allowed" : "pointer",
                          }}
                          disabled={updating === c.id}
                          onClick={() => handleMarkCompleted(c.id)}
                        >
                          {updating === c.id ? "Updating…" : "✓ Mark Resolved"}
                        </button>
                      )}

                      {c.status === "Completed" && (
                        <span style={s.resolvedTag}>✅ Resolved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const s = {
  root:          { minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" },
  page:          { padding: "28px 32px", maxWidth: 1100, margin: "0 auto" },
  pageHeader:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title:         { margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" },
  subtitle:      { margin: "4px 0 0", fontSize: "13px", color: "#6b7280" },
  center:        { display: "flex", justifyContent: "center", alignItems: "center", height: "200px", fontSize: "15px", color: "#6b7280" },
  errorBox:      { background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "16px 20px", color: "#991b1b", fontSize: 14, marginBottom: 20 },
  empty:         { textAlign: "center", padding: "48px", color: "#9ca3af", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" },
  filters:       { display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  filterGroup:   { display: "flex", alignItems: "center", gap: "8px" },
  filterLabel:   { fontSize: "13px", fontWeight: "600", color: "#374151" },
  select:        { padding: "7px 12px", borderRadius: "8px", border: "1.5px solid #d1d5db", fontSize: "13px", background: "#fff", color: "#111827", cursor: "pointer" },
  filterCount:   { fontSize: "12px", color: "#9ca3af", marginLeft: "auto" },
  list:          { display: "flex", flexDirection: "column", gap: "14px" },
  card:          { background: "#fff", borderRadius: "12px", padding: "20px 24px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardTop:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  cardId:        { fontFamily: "monospace", fontWeight: "700", color: "#1d4ed8", fontSize: "13px" },
  badges:        { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  badge:         { display: "inline-block", padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" },
  categoryPill:  { fontSize: "11px", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "9999px" },
  cardTitle:     { margin: "0 0 6px", fontSize: "16px", fontWeight: "600", color: "#111827" },
  cardDesc:      { margin: "0 0 12px", fontSize: "13px", color: "#6b7280", lineHeight: "1.5" },
  submitter:     { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" },
  submitterName: { fontSize: "13px", fontWeight: "600", color: "#1e293b" },
  submitterEmail:{ fontSize: "12px", color: "#64748b" },
  cardFooter:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" },
  cardDate:      { fontSize: "11px", color: "#9ca3af" },
  resolveBtn:    { padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: "600", fontFamily: "inherit" },
  resolvedTag:   { fontSize: "12px", color: "#166534", fontWeight: "600" },
};
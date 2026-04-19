/**
 * FR-10 / FR-13 | MyComplaints.jsx — Student / Faculty / Staff view
 *
 * Shows the logged-in user's own complaints with current status.
 * Users cannot change status (read-only for them).
 * Route: /complaints/my
 *
 * BUG FIXED:
 *   - Navbar was missing — users had no navigation bar on this page.
 *   - complaintsAPI.getAll() is correct: the backend returns only the
 *     logged-in user's own complaints when the role is student/faculty/staff.
 */

import { useEffect, useState } from "react";
import { Link }                from "react-router-dom";
import { complaintsAPI }       from "../services/api";
import Navbar                  from "../components/Navbar";

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

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const fetchMine = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await complaintsAPI.getAll();
        if (res.data.success) {
          setComplaints(res.data.data);
        } else {
          setError(res.data.message || "Failed to load your complaints.");
        }
      } catch {
        setError("Network error. Could not reach the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchMine();
  }, []);

  return (
    <div style={s.root}>
      <Navbar />

      <div style={s.page}>

        {loading && <div style={s.center}>Loading your complaints…</div>}
        {error   && <div style={{ ...s.center, color: "#dc2626" }}>⚠️ {error}</div>}

        {!loading && !error && (
          <>
            <div style={s.header}>
              <div>
                <h2 style={s.title}>My Complaints</h2>
                <p style={s.subtitle}>
                  {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} submitted
                </p>
              </div>
              <Link to="/complaints/submit" style={s.submitLink}>
                + New Complaint
              </Link>
            </div>

            {complaints.length === 0 ? (
              <div style={s.empty}>
                <p>You have not submitted any complaints yet.</p>
                <Link to="/complaints/submit" style={s.submitLink}>
                  Submit your first complaint →
                </Link>
              </div>
            ) : (
              <div style={s.list}>
                {complaints.map((c) => {
                  const pri = PRIORITY_COLORS[c.priority] || { bg: "#f3f4f6", text: "#374151" };
                  const sta = STATUS_COLORS[c.status]     || { bg: "#f3f4f6", text: "#374151" };
                  return (
                    <div key={c.id} style={s.card}>
                      <div style={s.cardTop}>
                        <span style={s.cardId}>#{c.id}</span>
                        <span style={{ ...s.badge, background: sta.bg, color: sta.text }}>
                          {c.status}
                        </span>
                      </div>

                      <h3 style={s.cardTitle}>{c.title}</h3>
                      <p style={s.cardDesc}>{c.description}</p>

                      <div style={s.cardMeta}>
                        <span style={{ ...s.badge, background: pri.bg, color: pri.text, fontSize: "11px" }}>
                          {c.priority}
                        </span>
                        <span style={s.cardCategory}>{c.category}</span>
                        <span style={s.cardDate}>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>

                      {c.status === "Pending" && (
                        <div style={s.pendingNote}>
                          🕐 Your complaint is under review by the administration.
                        </div>
                      )}
                      {c.status === "Completed" && (
                        <div style={s.completedNote}>
                          ✅ This complaint has been resolved.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

const s = {
  root:          { minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" },
  page:          { padding: "28px 32px" },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title:         { margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" },
  subtitle:      { margin: "4px 0 0", fontSize: "13px", color: "#6b7280" },
  center:        { display: "flex", justifyContent: "center", alignItems: "center", height: "200px", fontSize: "15px", color: "#6b7280" },
  empty:         { textAlign: "center", padding: "64px", color: "#9ca3af" },
  submitLink:    { padding: "10px 20px", background: "#1d4ed8", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" },
  list:          { display: "flex", flexDirection: "column", gap: "16px" },
  card:          { background: "#fff", borderRadius: "12px", padding: "20px 24px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardTop:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  cardId:        { fontFamily: "monospace", fontWeight: "700", color: "#1d4ed8", fontSize: "13px" },
  cardTitle:     { margin: "0 0 6px", fontSize: "16px", fontWeight: "600", color: "#111827" },
  cardDesc:      { margin: "0 0 12px", fontSize: "13px", color: "#6b7280", lineHeight: "1.5" },
  cardMeta:      { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  cardCategory:  { fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "9999px" },
  cardDate:      { fontSize: "11px", color: "#9ca3af", marginLeft: "auto" },
  badge:         { display: "inline-block", padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" },
  pendingNote:   { marginTop: "12px", fontSize: "12px", color: "#0369a1", background: "#e0f2fe", padding: "8px 12px", borderRadius: "6px" },
  completedNote: { marginTop: "12px", fontSize: "12px", color: "#166534", background: "#dcfce7", padding: "8px 12px", borderRadius: "6px" },
};
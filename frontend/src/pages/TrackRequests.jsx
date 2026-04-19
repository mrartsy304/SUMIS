import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import RequestStatusCard from "../components/RequestStatusCard";
import { statusTrackingAPI } from "../services/api";

/**
 * FR-07 — Ali
 * TrackRequests Page
 *
 * Allows a student to:
 *  1. View all their submitted service requests
 *  2. See each request's current status and full history timeline
 *  3. Filter by status
 *  4. Click a request to expand its full details
 */
export default function TrackRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Fetch all requests for the logged-in student ──────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await statusTrackingAPI.getByStudent(user.id);
      setRequests(res.data || []);
    } catch (err) {
      setError("Failed to load your requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      !searchTerm ||
      r.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.id).includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        {/* ── Page header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.title}>Track Requests</h1>
            <p style={styles.subtitle}>
              Monitor the progress of all your submitted service requests.
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={fetchRequests}>
            ↻ Refresh
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div style={styles.summaryRow}>
          {SUMMARY_ITEMS.map(({ key, label, color, icon }) => (
            <div
              key={key}
              style={{
                ...styles.summaryCard,
                borderColor: key === filter ? color : "rgba(99,102,241,0.12)",
                cursor: "pointer",
              }}
              onClick={() => setFilter(key)}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <p style={{ ...styles.summaryCount, color }}>
                  {key === "all" ? requests.length : (statusCounts[key] || 0)}
                </p>
                <p style={styles.summaryLabel}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filter bar ── */}
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by type, description or ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={styles.filterPills}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.pill,
                  ...(filter === opt.value ? styles.pillActive : {}),
                }}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content area ── */}
        {loading && (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading your requests…</p>
          </div>
        )}

        {error && !loading && (
          <div style={styles.errorBox}>
            <span>⚠️</span> {error}
            <button style={styles.retryBtn} onClick={fetchRequests}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p style={styles.emptyTitle}>No requests found</p>
            <p style={styles.emptySubtitle}>
              {filter !== "all"
                ? `You have no ${filter.replace("_", " ")} requests.`
                : "You haven't submitted any service requests yet."}
            </p>
            <button
              style={styles.submitBtn}
              onClick={() => navigate("/submit-request")}
            >
              Submit a Request
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={styles.requestList}>
            {filtered.map((req) => (
              <div key={req.id}>
                {/* Collapsed header — click to expand */}
                <div
                  style={styles.collapsedHeader}
                  onClick={() => toggleExpand(req.id)}
                >
                  <div style={styles.collapsedLeft}>
                    <span style={styles.collapseArrow}>
                      {expandedId === req.id ? "▾" : "▸"}
                    </span>
                    <span style={styles.colRequestId}>#{req.id}</span>
                    <span style={styles.colRequestType}>{req.request_type}</span>
                  </div>
                  <div style={styles.collapsedRight}>
                    <span style={styles.colDept}>
                      {req.department_name || "Unassigned"}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                </div>

                {/* Expanded full card */}
                {expandedId === req.id && (
                  <RequestStatusCard
                    request={req}
                    style={{ borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Inline StatusBadge (small variant for collapsed row) ── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  return (
    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending:     { label: "Pending",     icon: "⏳", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  in_progress: { label: "In Progress", icon: "🔄", bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  resolved:    { label: "Resolved",    icon: "✅", bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  rejected:    { label: "Rejected",    icon: "❌", bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
  routed:      { label: "Routed",      icon: "📨", bg: "rgba(14,165,233,0.12)", color: "#38bdf8" },
  default:     { label: "Unknown",     icon: "❓", bg: "rgba(100,116,139,0.1)", color: "#94a3b8" },
};

const SUMMARY_ITEMS = [
  { key: "all",        label: "Total",       color: "#818cf8", icon: "📋" },
  { key: "pending",    label: "Pending",     color: "#f59e0b", icon: "⏳" },
  { key: "in_progress",label: "In Progress", color: "#38bdf8", icon: "🔄" },
  { key: "resolved",   label: "Resolved",    color: "#10b981", icon: "✅" },
  { key: "rejected",   label: "Rejected",    color: "#f87171", icon: "❌" },
];

const FILTER_OPTIONS = [
  { value: "all",         label: "All" },
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "routed",      label: "Routed" },
  { value: "resolved",    label: "Resolved" },
  { value: "rejected",    label: "Rejected" },
];

/* ── Styles ─────────────────────────────────────────────────────────────────── */

const styles = {
  page: { minHeight: "100vh", background: "#080c14", fontFamily: "'Inter', sans-serif" },
  main: { maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px 0" },
  subtitle: { fontSize: 13, color: "#64748b", margin: 0 },
  refreshBtn: { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, padding: "8px 16px", fontSize: 12, color: "#818cf8", cursor: "pointer", fontFamily: "monospace" },

  summaryRow: { display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" },
  summaryCard: { display: "flex", alignItems: "center", gap: 12, background: "rgba(15,23,42,0.6)", border: "1px solid", borderRadius: 8, padding: "14px 20px", minWidth: 120, flex: "1 1 120px" },
  summaryCount: { fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1 },
  summaryLabel: { fontSize: 11, color: "#475569", margin: "4px 0 0 0", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },

  toolbar: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  searchInput: { flex: "1 1 200px", background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6, padding: "9px 14px", fontSize: 13, color: "#e2e8f0", outline: "none" },
  filterPills: { display: "flex", gap: 6, flexWrap: "wrap" },
  pill: { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "monospace" },
  pillActive: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8" },

  centered: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 },
  spinner: { width: 32, height: 32, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { color: "#475569", fontSize: 13, fontFamily: "monospace" },

  errorBox: { display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "16px 20px", color: "#f87171", fontSize: 13 },
  retryBtn: { marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "5px 12px", fontSize: 12, color: "#f87171", cursor: "pointer" },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, color: "#e2e8f0", fontWeight: 600, margin: 0 },
  emptySubtitle: { fontSize: 13, color: "#475569", margin: 0 },
  submitBtn: { marginTop: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "10px 22px", fontSize: 13, color: "#818cf8", cursor: "pointer" },

  requestList: { display: "flex", flexDirection: "column", gap: 0 },
  collapsedHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 8, padding: "14px 18px", cursor: "pointer",
    marginBottom: 2, transition: "background 0.15s",
  },
  collapsedLeft: { display: "flex", alignItems: "center", gap: 10 },
  collapsedRight: { display: "flex", alignItems: "center", gap: 14 },
  collapseArrow: { color: "#475569", fontSize: 12, width: 12 },
  colRequestId: { fontSize: 11, color: "#475569", fontFamily: "monospace", background: "rgba(99,102,241,0.08)", padding: "2px 7px", borderRadius: 4 },
  colRequestType: { fontSize: 14, fontWeight: 500, color: "#cbd5e1" },
  colDept: { fontSize: 12, color: "#475569", fontFamily: "monospace" },
  badge: { fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.04em", fontFamily: "monospace" },
};

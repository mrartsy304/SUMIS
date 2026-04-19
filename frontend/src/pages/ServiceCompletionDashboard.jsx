import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import CompletionButton from "../components/CompletionButton";
import CompletionInfoCard from "../components/CompletionInfoCard";
import RequestStatusBadge from "../components/RequestStatusBadge";
import { useAuth } from "../context/AuthContext";
import { completionAPI } from "../services/api";

/**
 * FR-09 — Usman
 * ServiceCompletionDashboard
 *
 * Staff / admin page that:
 *  1. Lists all approved requests ready to be completed
 *  2. Shows each request's details and a "Mark as Completed" button
 *  3. Displays completed requests in a separate tab for audit trail
 */
export default function ServiceCompletionDashboard() {
  const { user } = useAuth();

  const [tab, setTab]               = useState("approved");   // "approved" | "completed"
  const [approved, setApproved]     = useState([]);
  const [completed, setCompleted]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // ── Fetch both lists ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [approvedRes, completedRes] = await Promise.all([
        completionAPI.getApproved(),
        completionAPI.getCompleted(),
      ]);
      setApproved(approvedRes.data  || []);
      setCompleted(completedRes.data || []);
    } catch {
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── When a request is completed, move it from approved → completed ─────────
  const handleCompleted = (updatedRequest) => {
    setApproved((prev) => prev.filter((r) => r.id !== updatedRequest.id));
    setCompleted((prev) => [updatedRequest, ...prev]);
  };

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const activeList = tab === "approved" ? approved : completed;

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        {/* ── Page header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.title}>Service Completion</h1>
            <p style={styles.subtitle}>
              Review approved requests and record their completion.
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={fetchData}>↻ Refresh</button>
        </div>

        {/* ── Summary badges ── */}
        <div style={styles.summaryRow}>
          <SummaryBadge
            label="Awaiting Completion"
            count={approved.length}
            color="#10b981"
            active={tab === "approved"}
            onClick={() => setTab("approved")}
          />
          <SummaryBadge
            label="Completed"
            count={completed.length}
            color="#a5b4fc"
            active={tab === "completed"}
            onClick={() => setTab("completed")}
          />
        </div>

        {/* ── Tab bar ── */}
        <div style={styles.tabBar}>
          <TabButton label="Approved (Pending Completion)" active={tab === "approved"} onClick={() => setTab("approved")} />
          <TabButton label="Completed History"             active={tab === "completed"} onClick={() => setTab("completed")} />
        </div>

        {/* ── Content ── */}
        {loading && (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading requests…</p>
          </div>
        )}

        {error && !loading && (
          <div style={styles.errorBox}>
            ⚠️ {error}
            <button style={styles.retryBtn} onClick={fetchData}>Retry</button>
          </div>
        )}

        {!loading && !error && activeList.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>{tab === "approved" ? "📭" : "📋"}</span>
            <p style={styles.emptyTitle}>
              {tab === "approved" ? "No approved requests pending completion" : "No completed requests yet"}
            </p>
            <p style={styles.emptySubtitle}>
              {tab === "approved"
                ? "Once requests are approved in the Staff Review dashboard, they will appear here."
                : "Completed requests will be listed here for your records."}
            </p>
          </div>
        )}

        {!loading && !error && activeList.length > 0 && (
          <div style={styles.list}>
            {activeList.map((req) => (
              <div key={req.id} style={styles.listItem}>
                {/* ── Collapsed row ── */}
                <div
                  style={styles.collapsedRow}
                  onClick={() => toggleExpand(req.id)}
                >
                  <div style={styles.rowLeft}>
                    <span style={styles.arrow}>{expandedId === req.id ? "▾" : "▸"}</span>
                    <span style={styles.reqId}>#{req.id}</span>
                    <span style={styles.reqType}>{req.request_type}</span>
                    <span style={styles.deptTag}>{req.department_name || "Unassigned"}</span>
                  </div>
                  <div style={styles.rowRight}>
                    <span style={styles.dateSmall}>{fmt(req.created_at)}</span>
                    <RequestStatusBadge status={req.status} size="sm" />
                    {/* Stop expand-toggle when clicking the button */}
                    {tab === "approved" && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <CompletionButton
                          requestId={req.id}
                          completedBy={user?.id}
                          onComplete={handleCompleted}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {expandedId === req.id && (
                  <div style={styles.expanded}>
                    <CompletionInfoCard request={req} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Small sub-components ── */

function SummaryBadge({ label, count, color, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.summaryBadge,
        borderColor: active ? color : "rgba(99,102,241,0.12)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{count}</span>
      <span style={styles.summaryLabel}>{label}</span>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
    >
      {label}
    </button>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Styles ── */

const styles = {
  page:    { minHeight: "100vh", background: "#080c14", fontFamily: "'Inter', sans-serif" },
  main:    { maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  title:      { fontSize: 26, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px 0" },
  subtitle:   { fontSize: 13, color: "#64748b", margin: 0 },
  refreshBtn: { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, padding: "8px 16px", fontSize: 12, color: "#818cf8", cursor: "pointer", fontFamily: "monospace" },

  summaryRow:   { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  summaryBadge: { display: "flex", alignItems: "center", gap: 14, background: "rgba(15,23,42,0.6)", border: "1px solid", borderRadius: 8, padding: "14px 22px", flex: "1 1 180px" },
  summaryLabel: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },

  tabBar:    { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(99,102,241,0.1)", paddingBottom: 0 },
  tab:       { background: "transparent", border: "none", borderBottom: "2px solid transparent", padding: "10px 18px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", marginBottom: -1 },
  tabActive: { color: "#818cf8", borderBottomColor: "#6366f1" },

  centered:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 },
  spinner:     { width: 32, height: 32, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { color: "#475569", fontSize: 13, fontFamily: "monospace" },
  errorBox:    { display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "16px 20px", color: "#f87171", fontSize: 13 },
  retryBtn:    { marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "5px 12px", fontSize: 12, color: "#f87171", cursor: "pointer" },

  emptyState:   { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10 },
  emptyIcon:    { fontSize: 44 },
  emptyTitle:   { fontSize: 15, color: "#e2e8f0", fontWeight: 600, margin: 0 },
  emptySubtitle:{ fontSize: 13, color: "#475569", margin: 0, textAlign: "center", maxWidth: 420 },

  list:     { display: "flex", flexDirection: "column", gap: 2 },
  listItem: { borderRadius: 8, overflow: "hidden" },

  collapsedRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.13)",
    padding: "13px 18px", cursor: "pointer", gap: 12, flexWrap: "wrap",
  },
  rowLeft:  { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  rowRight: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  arrow:    { color: "#475569", fontSize: 12, width: 12, flexShrink: 0 },
  reqId:    { fontFamily: "monospace", fontSize: 11, color: "#475569", background: "rgba(99,102,241,0.08)", padding: "2px 7px", borderRadius: 4 },
  reqType:  { fontSize: 13, fontWeight: 500, color: "#cbd5e1" },
  deptTag:  { fontSize: 11, color: "#475569", fontFamily: "monospace", background: "rgba(15,23,42,0.5)", border: "1px solid rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 4 },
  dateSmall:{ fontSize: 11, color: "#334155", fontFamily: "monospace" },

  expanded: { borderLeft: "1px solid rgba(99,102,241,0.13)", borderRight: "1px solid rgba(99,102,241,0.13)", borderBottom: "1px solid rgba(99,102,241,0.13)", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
};

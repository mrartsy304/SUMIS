import React from "react";
import RequestStatusBadge from "./RequestStatusBadge";

/**
 * FR-09 — Usman
 * CompletionInfoCard
 *
 * Displays the completion summary for a finished request:
 * completion timestamp, who completed it, and the full status
 * history timeline. Used in the approved requests view and in
 * the student's Track Requests page after completion.
 *
 * Props:
 *  - request : object — full request object with status_history
 */
export default function CompletionInfoCard({ request }) {
  if (!request) return null;

  const {
    id,
    request_type,
    department_name,
    status,
    created_at,
    completed_at,
    status_history = [],
  } = request;

  const completionEntry = [...status_history]
    .reverse()
    .find((h) => h.status === "completed");

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.reqId}>#{id}</span>
          <span style={styles.reqType}>{request_type}</span>
        </div>
        <RequestStatusBadge status={status} />
      </div>

      {/* Meta grid */}
      <div style={styles.grid}>
        <MetaCell label="Department"  value={department_name || "—"} />
        <MetaCell label="Submitted"   value={fmt(created_at)} />
        <MetaCell label="Completed"   value={fmt(completed_at)} highlight />
        {completionEntry?.remarks && (
          <MetaCell label="Completion Note" value={completionEntry.remarks} span />
        )}
      </div>

      {/* Timeline */}
      {status_history.length > 0 && (
        <div style={styles.timelineWrap}>
          <p style={styles.timelineTitle}>Lifecycle Timeline</p>
          {status_history.map((h, i) => (
            <div key={h.id} style={styles.step}>
              <div style={styles.stepLine}>
                <div style={{
                  ...styles.dot,
                  background: h.status === "completed" ? "#a5b4fc" : "#334155",
                  border: h.status === "completed" ? "2px solid #6366f1" : "2px solid #1e293b",
                }} />
                {i < status_history.length - 1 && <div style={styles.connector} />}
              </div>
              <div style={styles.stepContent}>
                <div style={styles.stepHeader}>
                  <RequestStatusBadge status={h.status} size="sm" />
                  <span style={styles.stepDate}>{fmt(h.updated_at)}</span>
                </div>
                {h.remarks && <p style={styles.stepRemarks}>{h.remarks}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, highlight = false, span = false }) {
  return (
    <div style={{ ...(span ? { gridColumn: "1 / -1" } : {}) }}>
      <p style={styles.metaLabel}>{label}</p>
      <p style={{ ...styles.metaValue, color: highlight ? "#a5b4fc" : "#cbd5e1" }}>{value}</p>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const styles = {
  card: { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  reqId: { fontFamily: "monospace", fontSize: 11, color: "#475569", background: "rgba(99,102,241,0.08)", padding: "2px 8px", borderRadius: 4 },
  reqType: { fontSize: 15, fontWeight: 600, color: "#e2e8f0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px 20px" },
  metaLabel: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 2px 0" },
  metaValue: { fontSize: 13, margin: 0 },
  timelineWrap: { borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: 14 },
  timelineTitle: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 12px 0" },
  step: { display: "flex", gap: 12 },
  stepLine: { display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 3 },
  connector: { width: 2, flex: 1, background: "rgba(99,102,241,0.1)", margin: "4px 0" },
  stepContent: { paddingBottom: 14, flex: 1 },
  stepHeader: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  stepDate: { fontSize: 11, color: "#475569", fontFamily: "monospace" },
  stepRemarks: { margin: "4px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 },
};

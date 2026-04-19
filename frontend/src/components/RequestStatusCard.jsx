import React from "react";

/**
 * FR-07 — Ali
 * RequestStatusCard
 *
 * Displays a single service request with:
 *  - Request ID, type, description
 *  - Current status badge
 *  - Assigned department
 *  - Full timeline of status updates
 *
 * Props:
 *  - request: object from GET /api/requests/user/<id> or /api/requests/<id>/status
 *  - style (optional): additional wrapper styles
 */
export default function RequestStatusCard({ request, style = {} }) {
  if (!request) return null;

  const {
    id,
    request_type,
    description,
    status,
    department_name,
    created_at,
    completed_at,
    status_history = [],
  } = request;

  return (
    <div style={{ ...styles.card, ...style }}>
      {/* ── Header row ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.requestId}>#{id}</span>
          <span style={styles.requestType}>{request_type}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ── Description ── */}
      {description && (
        <p style={styles.description}>{description}</p>
      )}

      {/* ── Meta row ── */}
      <div style={styles.meta}>
        <MetaItem label="Department" value={department_name || "Unassigned"} />
        <MetaItem label="Submitted"  value={formatDate(created_at)} />
        {completed_at && (
          <MetaItem label="Completed" value={formatDate(completed_at)} />
        )}
      </div>

      {/* ── Timeline ── */}
      {status_history.length > 0 && (
        <div style={styles.timelineSection}>
          <p style={styles.timelineLabel}>Status Timeline</p>
          <div style={styles.timeline}>
            {status_history.map((entry, idx) => (
              <TimelineStep
                key={entry.id}
                entry={entry}
                isLast={idx === status_history.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  return (
    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
      {cfg.icon} {cfg.label || status}
    </span>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function TimelineStep({ entry, isLast }) {
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.default;
  return (
    <div style={styles.timelineStep}>
      {/* Dot + connector */}
      <div style={styles.timelineLine}>
        <div style={{ ...styles.timelineDot, background: cfg.color }} />
        {!isLast && <div style={styles.timelineConnector} />}
      </div>

      {/* Content */}
      <div style={styles.timelineContent}>
        <div style={styles.timelineHeader}>
          <span style={{ ...styles.timelineStatus, color: cfg.color }}>
            {cfg.label || entry.status}
          </span>
          <span style={styles.timelineDate}>{formatDate(entry.updated_at)}</span>
        </div>
        {entry.remarks && (
          <p style={styles.timelineRemarks}>{entry.remarks}</p>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG = {
  pending:     { label: "Pending",     icon: "⏳", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  in_progress: { label: "In Progress", icon: "🔄", bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  resolved:    { label: "Resolved",    icon: "✅", bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  rejected:    { label: "Rejected",    icon: "❌", bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
  routed:      { label: "Routed",      icon: "📨", bg: "rgba(14,165,233,0.12)", color: "#38bdf8" },
  default:     { label: "Unknown",     icon: "❓", bg: "rgba(100,116,139,0.1)", color: "#94a3b8" },
};

/* ── Styles ── */

const styles = {
  card: {
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 8,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  requestId: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#475569",
    background: "rgba(99,102,241,0.08)",
    padding: "2px 8px",
    borderRadius: 4,
  },
  requestType: {
    fontSize: 15,
    fontWeight: 600,
    color: "#e2e8f0",
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: "0.04em",
    textTransform: "capitalize",
    fontFamily: "monospace",
  },
  description: {
    fontSize: 13,
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.6,
  },
  meta: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
  },
  metaItem: { display: "flex", flexDirection: "column", gap: 2 },
  metaLabel: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  metaValue: { fontSize: 13, color: "#cbd5e1" },

  timelineSection: { borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: 14 },
  timelineLabel: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 12px 0" },
  timeline: { display: "flex", flexDirection: "column" },
  timelineStep: { display: "flex", gap: 12 },
  timelineLine: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 3 },
  timelineConnector: { width: 2, flex: 1, background: "rgba(99,102,241,0.15)", margin: "4px 0" },
  timelineContent: { paddingBottom: 16, flex: 1 },
  timelineHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  timelineStatus: { fontSize: 13, fontWeight: 600 },
  timelineDate: { fontSize: 11, color: "#475569", fontFamily: "monospace" },
  timelineRemarks: { margin: "4px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 },
};

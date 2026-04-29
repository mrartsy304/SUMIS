import React, { useState } from "react";

/**
 * FR-14 Part 2 — Ali
 * AppointmentCard
 *
 * Displays a single appointment with status badge, party names,
 * scheduled time, purpose, and faculty remarks.
 *
 * Props:
 *  - appointment : object  — from /api/appointments
 *  - viewAs      : "student" | "faculty"
 *  - onRespond   : fn(id, response, remarks) — faculty action callback
 *  - onCancel    : fn(id) — student cancel callback
 */
export default function AppointmentCard({ appointment, viewAs = "student", onRespond, onCancel }) {
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  if (!appointment) return null;

  const {
    id, student_name, faculty_name,
    appointment_time, purpose, status,
    remarks, responded_at, created_at,
  } = appointment;

  const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  const otherParty = viewAs === "student" ? faculty_name : student_name;
  const otherLabel = viewAs === "student" ? "Faculty"    : "Student";
  const isPending  = status === "requested";

  const handleApprove = () => {
    setRejectOpen(false);
    onRespond && onRespond(id, "approved", "");
  };

  const handleRejectConfirm = () => {
    if (!rejectRemarks.trim()) return;
    onRespond && onRespond(id, "rejected", rejectRemarks);
    setRejectOpen(false);
    setRejectRemarks("");
  };

  return (
    <div style={styles.card}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.aptId}>#{id}</span>
          <span style={styles.otherParty}>{otherParty}</span>
        </div>
        <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* ── Meta grid ── */}
      <div style={styles.meta}>
        <MetaItem label={otherLabel}   value={otherParty} />
        <MetaItem label="Date & Time"  value={fmt(appointment_time)} highlight />
        <MetaItem label="Requested On" value={fmt(created_at)} />
        {responded_at && <MetaItem label="Responded" value={fmt(responded_at)} />}
      </div>

      {/* ── Purpose ── */}
      <div style={styles.purposeBlock}>
        <p style={styles.sectionLabel}>Purpose</p>
        <p style={styles.purposeText}>{purpose || "—"}</p>
      </div>

      {/* ── Remarks (post-response) ── */}
      {remarks && (
        <div style={styles.remarksBlock}>
          <p style={{ ...styles.sectionLabel, color: "#f87171" }}>
            {status === "rejected" ? "Rejection Reason" : "Remarks"}
          </p>
          <p style={styles.remarksText}>{remarks}</p>
        </div>
      )}

      {/* ── Faculty action buttons ── */}
      {isPending && viewAs === "faculty" && onRespond && (
        <div style={styles.actionsWrap}>
          {!rejectOpen ? (
            <div style={styles.actionRow}>
              <button style={styles.approveBtn} onClick={handleApprove}>✓ Approve</button>
              <button style={styles.rejectToggleBtn} onClick={() => setRejectOpen(true)}>✕ Reject</button>
            </div>
          ) : (
            <div style={styles.rejectPanel}>
              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Reason for rejection (required)…"
                rows={3}
                style={styles.remarksInput}
              />
              <div style={styles.actionRow}>
                <button
                  style={{ ...styles.rejectBtn, opacity: rejectRemarks.trim() ? 1 : 0.45 }}
                  disabled={!rejectRemarks.trim()}
                  onClick={handleRejectConfirm}
                >
                  Confirm Rejection
                </button>
                <button style={styles.backBtn} onClick={() => setRejectOpen(false)}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Student cancel button ── */}
      {isPending && viewAs === "student" && onCancel && (
        <button style={styles.cancelBtn} onClick={() => onCancel(id)}>
          Cancel Request
        </button>
      )}
    </div>
  );
}

function MetaItem({ label, value, highlight }) {
  return (
    <div>
      <p style={styles.metaLabel}>{label}</p>
      <p style={{ ...styles.metaValue, color: highlight ? "#a5b4fc" : "#cbd5e1" }}>{value || "—"}</p>
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

const STATUS_CONFIG = {
  requested: { label: "Pending",   icon: "⏳", bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  approved:  { label: "Approved",  icon: "✅", bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  rejected:  { label: "Rejected",  icon: "❌", bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  cancelled: { label: "Cancelled", icon: "🚫", bg: "rgba(100,116,139,0.1)",  color: "#64748b" },
  default:   { label: "Unknown",   icon: "❓", bg: "rgba(100,116,139,0.1)",  color: "#94a3b8" },
};

const styles = {
  card:            { background: "rgba(15,23,42,0.65)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  headerLeft:      { display: "flex", alignItems: "center", gap: 10 },
  aptId:           { fontFamily: "monospace", fontSize: 11, color: "#475569", background: "rgba(99,102,241,0.08)", padding: "2px 8px", borderRadius: 4 },
  otherParty:      { fontSize: 15, fontWeight: 600, color: "#e2e8f0" },
  badge:           { fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, letterSpacing: "0.04em", fontFamily: "monospace" },
  meta:            { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: "8px 20px" },
  metaLabel:       { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 2px 0" },
  metaValue:       { fontSize: 13, margin: 0 },
  sectionLabel:    { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 4px 0" },
  purposeBlock:    { background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 6, padding: "10px 14px" },
  purposeText:     { fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 },
  remarksBlock:    { background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 6, padding: "10px 14px" },
  remarksText:     { fontSize: 13, color: "#fca5a5", margin: 0, lineHeight: 1.6 },
  actionsWrap:     { borderTop: "1px solid rgba(99,102,241,0.1)", paddingTop: 14 },
  actionRow:       { display: "flex", gap: 10 },
  approveBtn:      { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 6, padding: "8px 18px", fontSize: 12, color: "#10b981", cursor: "pointer", fontFamily: "monospace", fontWeight: 600 },
  rejectToggleBtn: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 6, padding: "8px 18px", fontSize: 12, color: "#f87171", cursor: "pointer", fontFamily: "monospace" },
  rejectPanel:     { display: "flex", flexDirection: "column", gap: 10 },
  remarksInput:    { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#e2e8f0", resize: "vertical", fontFamily: "inherit", outline: "none" },
  rejectBtn:       { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 6, padding: "8px 18px", fontSize: 12, color: "#f87171", cursor: "pointer", fontFamily: "monospace", fontWeight: 600 },
  backBtn:         { background: "transparent", border: "1px solid rgba(100,116,139,0.25)", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "monospace" },
  cancelBtn:       { alignSelf: "flex-start", background: "transparent", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "7px 16px", fontSize: 12, color: "#f87171", cursor: "pointer", fontFamily: "monospace" },
};

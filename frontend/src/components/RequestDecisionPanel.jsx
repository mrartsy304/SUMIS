/**
 * RequestDecisionPanel — FR-08
 * Action panel shown at the bottom of a selected request.
 * Contains Approve and Reject buttons.
 * Props:
 *   request    — the selected ServiceRequest object
 *   onApprove  — fn(requestId)
 *   onReject   — fn(requestId)
 *   loading    — bool
 */

const STATUS_COLORS = {
  pending:     "#f59e0b",
  in_progress: "#6366f1",
  approved:    "#10b981",
  rejected:    "#ef4444",
  completed:   "#10b981",
};

const DECIDABLE_STATUSES = ["pending", "in_progress"];

export default function RequestDecisionPanel({ request: r, onApprove, onReject, loading }) {
  if (!r) return null;

  const canDecide = DECIDABLE_STATUSES.includes(r.status);

  return (
    <div style={styles.panel}>
      <div style={styles.info}>
        <p style={styles.label}>Current Status</p>
        <span style={{
          ...styles.statusBadge,
          color: STATUS_COLORS[r.status] || "#64748b",
          borderColor: `${STATUS_COLORS[r.status] || "#64748b"}44`,
        }}>
          {r.status?.replace("_", " ")}
        </span>
      </div>

      {canDecide ? (
        <div style={styles.actions}>
          <button
            style={loading ? { ...styles.rejectBtn, ...styles.btnDisabled } : styles.rejectBtn}
            onClick={() => onReject(r.id)}
            disabled={loading}
          >
            ✕ Reject
          </button>
          <button
            style={loading ? { ...styles.approveBtn, ...styles.btnDisabled } : styles.approveBtn}
            onClick={() => onApprove(r.id)}
            disabled={loading}
          >
            ✓ Approve
          </button>
        </div>
      ) : (
        <div style={styles.decided}>
          <p style={styles.decidedText}>
            {r.status === "approved"  && "✓ This request has been approved."}
            {r.status === "rejected"  && "✕ This request has been rejected."}
            {r.status === "completed" && "✓ This request has been completed."}
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  panel:       { background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  info:        { display: "flex", alignItems: "center", gap: 12 },
  label:       { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" },
  statusBadge: { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  actions:     { display: "flex", gap: 10 },
  approveBtn:  { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 2, padding: "9px 24px", color: "#6ee7b7", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em" },
  rejectBtn:   { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2, padding: "9px 24px", color: "#fca5a5", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em" },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  decided:     {},
  decidedText: { margin: 0, fontSize: 13, color: "#64748b", fontFamily: "monospace" },
};

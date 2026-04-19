/**
 * RemarksModal — FR-08
 * Modal dialog shown when staff clicks Reject.
 * Remarks are mandatory for rejection.
 * Props:
 *   isOpen     — bool
 *   onClose    — fn()
 *   onConfirm  — fn(remarks: string)
 *   decision   — "approved" | "rejected"
 *   requestType — string shown in modal header
 */
import { useState, useEffect } from "react";

export default function RemarksModal({ isOpen, onClose, onConfirm, decision, requestType }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (isOpen) { setRemarks(""); setError(""); }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRejection = decision === "rejected";

  const handleConfirm = () => {
    if (isRejection && !remarks.trim()) {
      setError("Remarks are required when rejecting a request.");
      return;
    }
    onConfirm(remarks.trim());
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <h3 style={{
            ...styles.title,
            color: isRejection ? "#fca5a5" : "#6ee7b7",
          }}>
            {isRejection ? "✕ Reject Request" : "✓ Approve Request"}
          </h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={styles.subtitle}>{requestType}</p>

        <div style={styles.divider} />

        {/* Remarks input */}
        <div style={styles.field}>
          <label style={styles.label}>
            Remarks {isRejection && <span style={styles.required}>* required</span>}
          </label>
          <textarea
            style={styles.textarea}
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); setError(""); }}
            placeholder={
              isRejection
                ? "Explain the reason for rejection..."
                : "Add optional remarks for approval..."
            }
            rows={4}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            style={isRejection ? styles.rejectBtn : styles.approveBtn}
            onClick={handleConfirm}
          >
            {isRejection ? "Confirm Rejection" : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:      { background: "#0f0f19", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 4, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title:      { margin: 0, fontSize: 18, fontFamily: "'Georgia', serif", fontWeight: "normal" },
  closeBtn:   { background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 },
  subtitle:   { margin: "0 0 16px", fontSize: 13, color: "#64748b" },
  divider:    { height: 1, background: "rgba(99,102,241,0.1)", margin: "0 0 20px" },
  field:      { marginBottom: 20 },
  label:      { display: "block", fontSize: 10, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 },
  required:   { color: "#f87171", marginLeft: 4 },
  textarea:   { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  error:      { margin: "6px 0 0", fontSize: 12, color: "#fca5a5", fontFamily: "monospace" },
  actions:    { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn:  { background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "9px 20px", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "monospace" },
  approveBtn: { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 2, padding: "9px 20px", color: "#6ee7b7", fontSize: 13, cursor: "pointer", fontFamily: "monospace" },
  rejectBtn:  { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 2, padding: "9px 20px", color: "#fca5a5", fontSize: 13, cursor: "pointer", fontFamily: "monospace" },
};

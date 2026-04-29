import React, { useState } from "react";

/**
 * FR-09 — Usman
 * CompletionButton
 *
 * A self-contained button that triggers the "Mark as Completed" action.
 * Shows a confirmation step before firing to prevent accidental clicks.
 *
 * Props:
 *  - requestId   : number  — the service request ID
 *  - completedBy : number  — the staff/admin user ID performing the action
 *  - onComplete  : fn(updatedRequest) — callback after successful completion
 *  - disabled    : bool (optional)
 */
export default function CompletionButton({ requestId, completedBy, onComplete, disabled = false }) {
  const [phase, setPhase]     = useState("idle");   // idle | confirm | loading | done | error
  const [errMsg, setErrMsg]   = useState("");

  const handleClick = () => {
    if (phase === "idle") { setPhase("confirm"); return; }
  };

  const handleConfirm = async () => {
    setPhase("loading");
    setErrMsg("");
    try {
      const res = await fetch(`/api/requests/${requestId}/complete`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ completed_by: completedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Completion failed");
      setPhase("done");
      onComplete && onComplete(data);
    } catch (err) {
      setErrMsg(err.message);
      setPhase("error");
    }
  };

  const handleCancel = () => setPhase("idle");
  const handleRetry  = () => setPhase("idle");

  if (phase === "done") {
    return (
      <div style={styles.doneBadge}>
        ✅ Marked as Completed
      </div>
    );
  }

  if (phase === "confirm") {
    return (
      <div style={styles.confirmRow}>
        <span style={styles.confirmText}>Mark this request as completed?</span>
        <button style={styles.confirmBtn} onClick={handleConfirm}>Yes, Complete</button>
        <button style={styles.cancelBtn}  onClick={handleCancel}>Cancel</button>
      </div>
    );
  }

  if (phase === "loading") {
    return <button style={{ ...styles.mainBtn, opacity: 0.6 }} disabled>⏳ Processing…</button>;
  }

  if (phase === "error") {
    return (
      <div style={styles.errorRow}>
        <span style={styles.errorText}>⚠️ {errMsg}</span>
        <button style={styles.retryBtn} onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return (
    <button
      style={{ ...styles.mainBtn, ...(disabled ? styles.disabledBtn : {}) }}
      onClick={handleClick}
      disabled={disabled}
    >
      ✔ Mark as Completed
    </button>
  );
}

const styles = {
  mainBtn: {
    background: "rgba(16,185,129,0.15)",
    border: "1px solid rgba(16,185,129,0.35)",
    borderRadius: 6,
    padding: "9px 20px",
    fontSize: 13,
    color: "#10b981",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 600,
    letterSpacing: "0.03em",
    transition: "background 0.15s",
  },
  disabledBtn: { opacity: 0.4, cursor: "not-allowed" },
  confirmRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  confirmText: { fontSize: 13, color: "#94a3b8" },
  confirmBtn: { background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 5, padding: "7px 16px", fontSize: 12, color: "#10b981", cursor: "pointer", fontFamily: "monospace", fontWeight: 600 },
  cancelBtn:  { background: "transparent", border: "1px solid rgba(100,116,139,0.3)", borderRadius: 5, padding: "7px 14px", fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "monospace" },
  doneBadge:  { fontSize: 13, color: "#10b981", fontFamily: "monospace", fontWeight: 600, padding: "8px 0" },
  errorRow:   { display: "flex", alignItems: "center", gap: 10 },
  errorText:  { fontSize: 12, color: "#f87171" },
  retryBtn:   { background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "5px 12px", fontSize: 12, color: "#f87171", cursor: "pointer" },
};

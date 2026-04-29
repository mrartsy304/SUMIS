import React from "react";

/**
 * FR-09 — Usman
 * RequestStatusBadge
 *
 * Displays a colour-coded badge for any request status.
 * Used across the completion dashboard and request cards.
 *
 * Props:
 *  - status : string — e.g. "pending", "approved", "completed", "rejected"
 *  - size   : "sm" | "md" (default "md")
 */
const STATUS_CONFIG = {
  pending:     { label: "Pending",     icon: "⏳", bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  in_progress: { label: "In Progress", icon: "🔄", bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  routed:      { label: "Routed",      icon: "📨", bg: "rgba(14,165,233,0.12)",  color: "#38bdf8" },
  approved:    { label: "Approved",    icon: "👍", bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  rejected:    { label: "Rejected",    icon: "❌", bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  completed:   { label: "Completed",   icon: "✅", bg: "rgba(99,102,241,0.15)",  color: "#a5b4fc" },
  default:     { label: "Unknown",     icon: "❓", bg: "rgba(100,116,139,0.1)",  color: "#94a3b8" },
};

export default function RequestStatusBadge({ status, size = "md" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  const isSmall = size === "sm";

  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           4,
        fontSize:      isSmall ? 10 : 12,
        fontWeight:    600,
        padding:       isSmall ? "2px 8px" : "4px 12px",
        borderRadius:  20,
        background:    cfg.bg,
        color:         cfg.color,
        letterSpacing: "0.04em",
        fontFamily:    "monospace",
        whiteSpace:    "nowrap",
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };

// ─────────────────────────────────────────────────────────────
//  StatusTimeline — FR-13
//  Renders a vertical chronological list of complaint status changes
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Pending:     "#f59e0b",
  "In Progress": "#6366f1",
  Resolved:    "#10b981",
};

export default function StatusTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <p style={styles.empty}>No status history yet.</p>
    );
  }

  return (
    <div style={styles.container}>
      {history.map((h, i) => (
        <div key={h.id || i} style={styles.entry}>
          <div style={styles.dot(STATUS_COLORS[h.new_status] || "#64748b")} />
          {i < history.length - 1 && <div style={styles.line} />}
          <div style={styles.content}>
            <div style={styles.statusRow}>
              {h.old_status && (
                <>
                  <span style={{ ...styles.badge, color: STATUS_COLORS[h.old_status] || "#64748b", borderColor: `${STATUS_COLORS[h.old_status] || "#64748b"}44` }}>
                    {h.old_status}
                  </span>
                  <span style={styles.arrow}>→</span>
                </>
              )}
              <span style={{ ...styles.badge, color: STATUS_COLORS[h.new_status] || "#64748b", borderColor: `${STATUS_COLORS[h.new_status] || "#64748b"}44` }}>
                {h.new_status}
              </span>
            </div>
            <p style={styles.meta}>
              by <span style={styles.name}>{h.changed_by_name || "System"}</span>
              {" · "}
              {h.changed_at ? new Date(h.changed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"}
            </p>
            {h.note && <p style={styles.note}>{h.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: 0 },
  empty:     { color: "#475569", fontFamily: "monospace", fontSize: 13 },
  entry:     { display: "flex", gap: 16, position: "relative", paddingBottom: 24 },
  dot:       (color) => ({
    width: 10, height: 10, borderRadius: "50%",
    background: color, flexShrink: 0, marginTop: 4,
  }),
  line:      {
    position: "absolute", left: 4, top: 14, bottom: 0,
    width: 2, background: "rgba(99,102,241,0.15)",
  },
  content:   { flex: 1 },
  statusRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  badge:     {
    fontSize: 11, padding: "2px 8px", border: "1px solid",
    borderRadius: 2, textTransform: "uppercase",
    letterSpacing: "0.08em", fontFamily: "monospace",
  },
  arrow:     { color: "#475569", fontSize: 12 },
  meta:      { margin: "0 0 4px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  name:      { color: "#94a3b8" },
  note:      { margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic", lineHeight: 1.5 },
};

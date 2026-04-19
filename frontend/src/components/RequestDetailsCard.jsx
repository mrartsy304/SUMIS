/**
 * RequestDetailsCard — FR-08
 * Displays full details of a single service request
 * including department, description, and status history timeline.
 */

const STATUS_COLORS = {
  pending:     "#f59e0b",
  in_progress: "#6366f1",
  approved:    "#10b981",
  rejected:    "#ef4444",
  completed:   "#10b981",
};

export default function RequestDetailsCard({ request: r }) {
  if (!r) return null;

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.requestId}>#{String(r.id).padStart(4, "0")}</p>
          <h3 style={styles.requestType}>{r.request_type}</h3>
        </div>
        <span style={{
          ...styles.statusBadge,
          color: STATUS_COLORS[r.status] || "#64748b",
          borderColor: `${STATUS_COLORS[r.status] || "#64748b"}44`,
        }}>
          {r.status?.replace("_", " ")}
        </span>
      </div>

      <div style={styles.divider} />

      {/* Details */}
      <div style={styles.fields}>
        <DetailRow label="Student ID"   value={`#${r.student_id}`} />
        <DetailRow label="Department"   value={r.department_name || "Not assigned"} />
        <DetailRow label="Submitted"    value={formatDate(r.created_at)} />
        {r.completed_at && (
          <DetailRow label="Closed At"  value={formatDate(r.completed_at)} />
        )}
      </div>

      {/* Description */}
      {r.description && (
        <>
          <div style={styles.divider} />
          <div>
            <p style={styles.descLabel}>Description</p>
            <p style={styles.descText}>{r.description}</p>
          </div>
        </>
      )}

      {/* Status History Timeline */}
      {r.status_history && r.status_history.length > 0 && (
        <>
          <div style={styles.divider} />
          <p style={styles.timelineLabel}>Status Timeline</p>
          <div style={styles.timeline}>
            {r.status_history.map((h, i) => (
              <div key={h.id || i} style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: STATUS_COLORS[h.status] || "#475569" }} />
                <div style={styles.timelineContent}>
                  <div style={styles.timelineTop}>
                    <span style={{ ...styles.timelineStatus, color: STATUS_COLORS[h.status] || "#64748b" }}>
                      {h.status?.replace("_", " ")}
                    </span>
                    <span style={styles.timelineDate}>{formatDate(h.updated_at)}</span>
                  </div>
                  {h.remarks && <p style={styles.timelineRemarks}>{h.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.label}>{label}</span>
      <span style={rowStyles.value}>{value}</span>
    </div>
  );
}

const rowStyles = {
  row:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" },
  label: { fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" },
  value: { fontSize: 13, color: "#e2e8f0" },
};

const styles = {
  card:           { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: 24 },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  requestId:      { margin: "0 0 4px", fontSize: 11, color: "#6366f1", fontFamily: "monospace" },
  requestType:    { margin: 0, fontSize: 18, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  statusBadge:    { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", flexShrink: 0 },
  divider:        { height: 1, background: "rgba(99,102,241,0.08)", margin: "16px 0" },
  fields:         {},
  descLabel:      { fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 },
  descText:       { margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 },
  timelineLabel:  { fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 },
  timeline:       { display: "flex", flexDirection: "column", gap: 12 },
  timelineItem:   { display: "flex", gap: 12, alignItems: "flex-start" },
  timelineDot:    { width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0 },
  timelineContent:{ flex: 1 },
  timelineTop:    { display: "flex", justifyContent: "space-between", marginBottom: 2 },
  timelineStatus: { fontSize: 12, fontFamily: "monospace", textTransform: "capitalize" },
  timelineDate:   { fontSize: 11, color: "#475569", fontFamily: "monospace" },
  timelineRemarks:{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 },
};

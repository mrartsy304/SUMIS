// ─────────────────────────────────────────────────────────────
//  AssignmentCard — FR-12
//  Admin-only: manually assign/override support unit
// ─────────────────────────────────────────────────────────────
import { useState } from "react";

export default function AssignmentCard({ complaintId, supportUnits = [], currentUnit, onAssign }) {
  const [unitId,  setUnitId]  = useState(currentUnit?.id || "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const handleAssign = async () => {
    if (!unitId) return;
    setLoading(true);
    setMsg("");
    try {
      await onAssign(complaintId, { support_unit_id: unitId });
      setMsg("Support unit assigned.");
    } catch {
      setMsg("Assignment failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div style={styles.card}>
      <p style={styles.heading}>Assign Support Unit</p>
      <p style={styles.current}>
        Current: <span style={styles.unitName}>{currentUnit?.name || "Unassigned"}</span>
      </p>
      <div style={styles.row}>
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={styles.select}>
          <option value="">-- Select unit --</option>
          {supportUnits.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <button onClick={handleAssign} disabled={loading || !unitId} style={styles.btn}>
          {loading ? "Assigning..." : "Assign"}
        </button>
      </div>
      {msg && <p style={styles.msg}>{msg}</p>}
    </div>
  );
}

const styles = {
  card:     { padding: "16px", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, background: "rgba(15,15,25,0.6)", marginBottom: 12 },
  heading:  { margin: "0 0 8px", fontSize: 11, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  current:  { margin: "0 0 10px", fontSize: 12, color: "#475569", fontFamily: "monospace" },
  unitName: { color: "#818cf8" },
  row:      { display: "flex", gap: 8 },
  select:   { flex: 1, background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit" },
  btn:      { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, padding: "8px 16px", color: "#818cf8", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  msg:      { margin: "8px 0 0", fontSize: 11, color: "#10b981", fontFamily: "monospace" },
};

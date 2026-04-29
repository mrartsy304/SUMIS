// ─────────────────────────────────────────────────────────────
//  ComplaintClassifier — FR-11
//  Admin-only: update category and priority of a complaint
// ─────────────────────────────────────────────────────────────
import { useState } from "react";

const CATEGORIES = [
  "Internet Issue", "Hardware Issue", "Software Issue",
  "Hostel Issue", "Fee Issue", "Academic Issue",
  "Library Issue", "Transport Issue", "Other",
];
const PRIORITIES = ["Low", "Medium", "High"];

export default function ComplaintClassifier({ complaintId, currentCategory, currentPriority, onUpdate }) {
  const [category, setCategory] = useState(currentCategory || "");
  const [priority, setPriority] = useState(currentPriority || "Medium");
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState("");

  const handleUpdate = async () => {
    setLoading(true);
    setMsg("");
    try {
      await onUpdate(complaintId, { category, priority });
      setMsg("Classification updated.");
    } catch {
      setMsg("Update failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div style={styles.card}>
      <p style={styles.heading}>Update Classification</p>
      <div style={styles.row}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
          <option value="">-- Category --</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={styles.select}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={handleUpdate} disabled={loading} style={styles.btn}>
          {loading ? "Saving..." : "Update"}
        </button>
      </div>
      {msg && <p style={styles.msg}>{msg}</p>}
    </div>
  );
}

const styles = {
  card:    { padding: "16px", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, background: "rgba(15,15,25,0.6)", marginBottom: 12 },
  heading: { margin: "0 0 12px", fontSize: 11, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  row:     { display: "flex", gap: 8, flexWrap: "wrap" },
  select:  { flex: 1, minWidth: 140, background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit" },
  btn:     { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, padding: "8px 16px", color: "#818cf8", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  msg:     { margin: "8px 0 0", fontSize: 11, color: "#10b981", fontFamily: "monospace" },
};

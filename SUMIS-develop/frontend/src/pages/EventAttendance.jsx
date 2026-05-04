import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { attendanceAPI } from "../services/api";

export default function EventAttendance() {
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [attRes, sumRes] = await Promise.all([
        attendanceAPI.get(id),
        attendanceAPI.summary(id),
      ]);
      setRecords(attRes.data);
      setSummary(sumRes.data);
      const init = {};
      attRes.data.forEach(r => { init[r.id] = r.attendance_status || "registered"; });
      setPending(init);
    } catch {
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const bulk = records.map(r => ({ registration_id: r.id, status: pending[r.id] || "registered" }));
      await attendanceAPI.bulk(id, bulk);
      setSuccess("Attendance saved");
      load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const header = "Name,Email,Status,Marked At\n";
    const rows = records.map(r =>
      `"${r.user_name}","${r.user_email}","${r.attendance_status}","${r.marked_at || ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_event_${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_OPTS = ["registered", "present", "absent"];
  const STATUS_COLORS = { present: "#00ff9d", absent: "#dc2626", registered: "#64748b" };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Event Attendance</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Event ID: {id}</p>
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error} <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button></div>}
        {success && <div style={{ background: "#0a1a0a", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#00ff9d" }}>{success}</div>}

        {summary && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[["Total", summary.total, "#e2e8f0"], ["Present", summary.present, "#00ff9d"], ["Absent", summary.absent, "#dc2626"], ["Pending", summary.pending, "#f59e0b"]].map(([label, val, color]) => (
              <div key={label} style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "0.75rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color }}>{val}</div>
                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button onClick={handleBulkSave} disabled={saving}
            style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
            {saving ? "Saving..." : "Save All"}
          </button>
          <button onClick={exportCSV}
            style={{ background: "#0ea5e922", border: "1px solid #0ea5e955", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#0ea5e9", cursor: "pointer", fontFamily: "monospace" }}>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : (
          <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["Name", "Email", "Registered", "Status", "Marked At"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#64748b", fontSize: "0.75rem", fontWeight: "normal" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #1e293b11" }}>
                    <td style={{ padding: "0.75rem 1rem", color: "#e2e8f0", fontSize: "0.85rem" }}>{rec.user_name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>{rec.user_email}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>{rec.registered_at ? new Date(rec.registered_at).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <select value={pending[rec.id] || "registered"} onChange={e => setPending(p => ({ ...p, [rec.id]: e.target.value }))}
                        style={{ background: "#09090f", border: `1px solid ${STATUS_COLORS[pending[rec.id]] || "#1e293b"}55`, borderRadius: 4, padding: "4px 8px", color: STATUS_COLORS[pending[rec.id]] || "#e2e8f0", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>{rec.marked_at ? new Date(rec.marked_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No registrations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

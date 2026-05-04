// ─────────────────────────────────────────────────────────────
//  ComplaintDetail — FR-12 & FR-13
//  Both roles: view complaint + timeline
//  Admin only: change status, assign unit, reclassify
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusTimeline from "../components/StatusTimeline";
import ComplaintClassifier from "../components/ComplaintClassifier";
import AssignmentCard from "../components/AssignmentCard";
import { useAuth } from "../context/AuthContext";
import { complaintsAPI } from "../services/api";

const MOCK_MODE = false;

const MOCK_COMPLAINT = {
  id: 1, user_id: 1, submitted_by: "Abdul Qadir",
  title: "Wi-Fi in Lab 3 not working",
  description: "The Wi-Fi access point in Computer Lab 3 (Block A) has been completely down for two days. Students cannot access online resources or submit assignments.",
  category: "Internet Issue", priority: "High", status: "In Progress",
  support_unit_id: 1, support_unit: "IT Support",
  created_at: "2025-03-10T09:00:00", updated_at: "2025-03-11T11:00:00",
};

const MOCK_HISTORY = [
  { id: 1, old_status: null, new_status: "Pending", changed_by_name: "Abdul Qadir", note: "Complaint submitted", changed_at: "2025-03-10T09:00:00" },
  { id: 2, old_status: "Pending", new_status: "In Progress", changed_by_name: "Admin User", note: "Assigned to IT team for investigation.", changed_at: "2025-03-11T11:00:00" },
];

const MOCK_UNITS = [
  { id: 1, name: "IT Support" }, { id: 2, name: "Hostel Management" },
  { id: 3, name: "Administration" }, { id: 4, name: "Accounts" },
  { id: 5, name: "Maintenance & Facilities" }, { id: 6, name: "Academic Affairs" },
];

const STATUS_COLORS = {
  Pending: "#f59e0b", "In Progress": "#6366f1", Resolved: "#10b981",
};
const PRIORITY_COLORS = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };

const VALID_NEXT = {
  Pending:      ["In Progress", "Resolved"],
  "In Progress":["Resolved"],
  Resolved:     [],
};

export default function ComplaintDetail() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isAdmin    = user?.role === "admin";

  const [complaint,    setComplaint]    = useState(null);
  const [history,      setHistory]      = useState([]);
  const [supportUnits, setSupportUnits] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusNote,   setStatusNote]   = useState("");
  const [newStatus,    setNewStatus]    = useState("");
  const [updating,     setUpdating]     = useState(false);
  const [msg,          setMsg]          = useState("");

  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setComplaint(MOCK_COMPLAINT);
        setHistory(MOCK_HISTORY);
        setSupportUnits(MOCK_UNITS);
        setLoading(false);
        return;
      }
      try {
        const params = { user_id: user?.id, role: user?.role };
        const [cRes, hRes, uRes] = await Promise.all([
          complaintsAPI.getById(id, params),
          complaintsAPI.getHistory(id, params),
          complaintsAPI.getSupportUnits(),
        ]);
        setComplaint(cRes.data);
        setHistory(hRes.data);
        setSupportUnits(uRes.data);
      } catch {
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    setMsg("");

    if (MOCK_MODE) {
      const updated = { ...complaint, status: newStatus, updated_at: new Date().toISOString() };
      const newEntry = {
        id: history.length + 1, old_status: complaint.status,
        new_status: newStatus, changed_by_name: user?.name || "Admin",
        note: statusNote || null, changed_at: new Date().toISOString(),
      };
      setComplaint(updated);
      setHistory((prev) => [...prev, newEntry]);
      setNewStatus("");
      setStatusNote("");
      setMsg("Status updated.");
      setUpdating(false);
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    try {
      const res = await complaintsAPI.updateStatus(id, {
        new_status: newStatus, note: statusNote,
        user_id: user?.id, role: user?.role,
      });
      setComplaint(res.data);
      const hRes = await complaintsAPI.getHistory(id, { user_id: user?.id, role: user?.role });
      setHistory(hRes.data);
      setNewStatus("");
      setStatusNote("");
      setMsg("Status updated successfully.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Status update failed.");
    } finally {
      setUpdating(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const handleCategorize = async (cId, data) => {
    if (MOCK_MODE) {
      setComplaint((prev) => ({ ...prev, category: data.category || prev.category, priority: data.priority || prev.priority }));
      return;
    }
    const res = await complaintsAPI.categorize(cId, { ...data, role: user?.role });
    setComplaint(res.data);
  };

  const handleAssign = async (cId, data) => {
    if (MOCK_MODE) {
      const unit = MOCK_UNITS.find((u) => u.id === Number(data.support_unit_id));
      setComplaint((prev) => ({ ...prev, support_unit: unit?.name, support_unit_id: unit?.id }));
      return;
    }
    const res = await complaintsAPI.assign(cId, { ...data, role: user?.role });
    setComplaint(res.data);
  };

  const allowedNext = complaint ? VALID_NEXT[complaint.status] || [] : [];

  if (loading) return (
    <div style={styles.page}><Navbar /><p style={styles.loading}>Loading complaint...</p></div>
  );

  if (!complaint) return (
    <div style={styles.page}><Navbar /><p style={styles.loading}>Complaint not found.</p></div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <p style={styles.frLabel}>FR-13</p>
        </div>

        <div style={styles.grid}>
          {/* LEFT: Complaint Info */}
          <div>
            <h1 style={styles.title}>{complaint.title}</h1>
            <p style={styles.id}>#{String(complaint.id).padStart(4, "0")}</p>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status</span>
                <span style={{ ...styles.badge, color: STATUS_COLORS[complaint.status] || "#64748b", borderColor: `${STATUS_COLORS[complaint.status] || "#64748b"}44` }}>
                  {complaint.status}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Priority</span>
                <span style={{ ...styles.badge, color: PRIORITY_COLORS[complaint.priority] || "#64748b", borderColor: `${PRIORITY_COLORS[complaint.priority] || "#64748b"}44` }}>
                  {complaint.priority}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Category</span>
                <span style={styles.infoValue}>{complaint.category}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Support Unit</span>
                <span style={styles.infoValue}>{complaint.support_unit || "Unassigned"}</span>
              </div>
              {isAdmin && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Submitted By</span>
                  <span style={styles.infoValue}>{complaint.submitted_by || "—"}</span>
                </div>
              )}
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Submitted</span>
                <span style={styles.infoValue}>
                  {complaint.created_at
                    ? new Date(complaint.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })
                    : "—"}
                </span>
              </div>
            </div>

            <div style={styles.descBlock}>
              <p style={styles.descLabel}>Description</p>
              <p style={styles.desc}>{complaint.description}</p>
            </div>

            {/* Status Timeline */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Status Timeline</h2>
              <StatusTimeline history={history} />
            </div>
          </div>

          {/* RIGHT: Admin Actions */}
          {isAdmin && (
            <div>
              <h2 style={styles.sectionTitle}>Admin Actions</h2>

              {/* Status Update */}
              <div style={styles.actionCard}>
                <p style={styles.actionHeading}>Update Status</p>
                {allowedNext.length === 0 ? (
                  <p style={styles.resolved}>Complaint is fully resolved — no further transitions allowed.</p>
                ) : (
                  <>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={styles.select}>
                      <option value="">-- Select new status --</option>
                      {allowedNext.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note (optional)..."
                      rows={3}
                      style={styles.textarea}
                    />
                    <button onClick={handleStatusUpdate} disabled={updating || !newStatus} style={styles.primaryBtn}>
                      {updating ? "Updating..." : "Update Status →"}
                    </button>
                    {msg && <p style={styles.msg}>{msg}</p>}
                  </>
                )}
              </div>

              {/* Reclassify */}
              <ComplaintClassifier
                complaintId={complaint.id}
                currentCategory={complaint.category}
                currentPriority={complaint.priority}
                onUpdate={handleCategorize}
              />

              {/* Assign Unit */}
              <AssignmentCard
                complaintId={complaint.id}
                supportUnits={supportUnits}
                currentUnit={{ id: complaint.support_unit_id, name: complaint.support_unit }}
                onAssign={handleAssign}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page:         { minHeight: "100vh", background: "#0a0a0f" },
  main:         { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  loading:      { color: "#475569", fontFamily: "monospace", fontSize: 13, padding: 48 },
  topBar:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backBtn:      { background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "7px 14px", color: "#818cf8", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  frLabel:      { fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  grid:         { display: "grid", gridTemplateColumns: "1fr 380px", gap: 48 },
  title:        { margin: "0 0 4px", fontSize: 28, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  id:           { margin: "0 0 24px", fontSize: 12, color: "#6366f1", fontFamily: "monospace" },
  infoGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  infoItem:     { display: "flex", flexDirection: "column", gap: 4 },
  infoLabel:    { fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  infoValue:    { fontSize: 13, color: "#94a3b8" },
  badge:        { fontSize: 11, padding: "3px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", alignSelf: "flex-start" },
  descBlock:    { marginBottom: 32 },
  descLabel:    { margin: "0 0 8px", fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  desc:         { margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.7 },
  section:      { },
  sectionTitle: { margin: "0 0 16px", fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
  actionCard:   { padding: 16, border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, background: "rgba(15,15,25,0.6)", marginBottom: 12 },
  actionHeading:{ margin: "0 0 12px", fontSize: 11, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  resolved:     { fontSize: 12, color: "#10b981", fontFamily: "monospace" },
  select:       { width: "100%", background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 10 },
  textarea:     { width: "100%", background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 10 },
  primaryBtn:   { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" },
  msg:          { margin: "10px 0 0", fontSize: 11, color: "#10b981", fontFamily: "monospace" },
};

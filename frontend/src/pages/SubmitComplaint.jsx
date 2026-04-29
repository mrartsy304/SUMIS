// ─────────────────────────────────────────────────────────────
//  SubmitComplaint — FR-10 & FR-11
//  Non-admin: submit complaint + view own complaints
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ComplaintForm from "../components/ComplaintForm";
import { useAuth } from "../context/AuthContext";
import { complaintsAPI } from "../services/api";

const MOCK_MODE = true;

const MOCK_COMPLAINTS = [
  {
    id: 1, title: "Wi-Fi in Lab 3 not working", category: "Internet Issue",
    priority: "High", status: "In Progress", support_unit: "IT Support",
    created_at: "2025-03-10T09:00:00",
  },
  {
    id: 2, title: "Projector broken in room 201", category: "Hardware Issue",
    priority: "Medium", status: "Pending", support_unit: "IT Support",
    created_at: "2025-03-08T14:30:00",
  },
];

const STATUS_COLORS = {
  Pending:        "#f59e0b",
  "In Progress":  "#6366f1",
  Resolved:       "#10b981",
};
const PRIORITY_COLORS = {
  Low:    "#10b981",
  Medium: "#f59e0b",
  High:   "#ef4444",
};

export default function SubmitComplaint() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab,  setActiveTab]  = useState("submit");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [fieldErrors,setFieldErrors]= useState({});

  // Load own complaints
  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setComplaints(MOCK_COMPLAINTS);
        setLoading(false);
        return;
      }
      try {
        const res = await complaintsAPI.getAll({ user_id: user?.id, role: user?.role });
        setComplaints(res.data);
      } catch {
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    setFieldErrors({});

    if (MOCK_MODE) {
      const newComplaint = {
        id:           complaints.length + 1,
        title:        formData.title,
        category:     formData.category,
        priority:     formData.priority,
        status:       "Pending",
        support_unit: "IT Support",
        created_at:   new Date().toISOString(),
      };
      setComplaints((prev) => [newComplaint, ...prev]);
      setSuccessMsg("Complaint submitted successfully!");
      setActiveTab("my");
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(""), 5000);
      return;
    }

    try {
      const res = await complaintsAPI.create({
        ...formData,
        user_id: user?.id,
        role:    user?.role,
      });
      setComplaints((prev) => [res.data, ...prev]);
      setSuccessMsg("Complaint submitted successfully!");
      setActiveTab("my");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setFieldErrors(data.fields);
      else setErrorMsg(data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const tabs = [
    { id: "submit", label: "Submit Complaint" },
    { id: "my",     label: `My Complaints (${complaints.length})` },
  ];

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header}>
          <p style={styles.frLabel}>FR-10</p>
          <h1 style={styles.title}>Submit a Complaint</h1>
          <p style={styles.subtitle}>Report facility, IT, or administrative issues at FAST-NUCES Karachi</p>
        </header>

        <div style={styles.tabBar}>
          {tabs.map((t) => (
            <button
              key={t.id}
              style={activeTab === t.id ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* SUBMIT TAB */}
        {activeTab === "submit" && (
          <div style={styles.twoCol}>
            <div style={styles.formPanel}>
              <h2 style={styles.sectionTitle}>New Complaint</h2>
              {errorMsg && <div style={styles.errorBanner}>✕ {errorMsg}</div>}
              <ComplaintForm
                onSubmit={handleSubmit}
                loading={submitting}
                errors={fieldErrors}
              />
            </div>

            <div style={styles.infoPanel}>
              <h2 style={styles.sectionTitle}>Complaint Pipeline</h2>
              <div style={styles.steps}>
                {[
                  { step: "01", title: "Submit",      desc: "Fill in the form — category auto-assigns to the right support unit." },
                  { step: "02", title: "In Review",   desc: "Admin categorizes and prioritizes your complaint." },
                  { step: "03", title: "Assigned",    desc: "Complaint is forwarded to the responsible operational unit." },
                  { step: "04", title: "Resolved",    desc: "Unit resolves the issue and closes the complaint." },
                ].map((s) => (
                  <div key={s.step} style={styles.step}>
                    <div style={styles.stepNum}>{s.step}</div>
                    <div>
                      <p style={styles.stepTitle}>{s.title}</p>
                      <p style={styles.stepDesc}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.apiNote}>
                → <code style={styles.code}>POST /api/complaints</code><br />
                → <code style={styles.code}>GET /api/complaints?user_id=...</code>
              </div>
            </div>
          </div>
        )}

        {/* MY COMPLAINTS TAB */}
        {activeTab === "my" && (
          <div>
            <h2 style={styles.sectionTitle}>My Complaints</h2>
            {successMsg && <div style={styles.successBanner}>✓ {successMsg}</div>}

            {loading ? (
              <p style={styles.loadingText}>Loading your complaints...</p>
            ) : complaints.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyIcon}>📋</p>
                <p style={styles.emptyText}>You haven't submitted any complaints yet.</p>
                <button style={styles.emptyBtn} onClick={() => setActiveTab("submit")}>
                  Submit your first complaint →
                </button>
              </div>
            ) : (
              <div style={styles.list}>
                {complaints.map((c) => (
                  <div key={c.id} style={styles.card}
                    onClick={() => window.location.href = `/complaints/${c.id}`}
                  >
                    <div style={styles.cardLeft}>
                      <div style={styles.cardId}>#{String(c.id).padStart(4, "0")}</div>
                      <div>
                        <p style={styles.cardTitle}>{c.title}</p>
                        <p style={styles.cardMeta}>
                          {c.category}
                          {c.support_unit ? ` · ${c.support_unit}` : " · Unassigned"}
                          {" · "}{formatDate(c.created_at)}
                        </p>
                      </div>
                    </div>
                    <div style={styles.badges}>
                      <span style={{ ...styles.badge, color: PRIORITY_COLORS[c.priority] || "#64748b", borderColor: `${PRIORITY_COLORS[c.priority] || "#64748b"}44` }}>
                        {c.priority}
                      </span>
                      <span style={{ ...styles.badge, color: STATUS_COLORS[c.status] || "#64748b", borderColor: `${STATUS_COLORS[c.status] || "#64748b"}44` }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page:         { minHeight: "100vh", background: "#0a0a0f" },
  main:         { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header:       { marginBottom: 36 },
  frLabel:      { margin: "0 0 4px", fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  title:        { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle:     { margin: 0, fontSize: 14, color: "#64748b" },
  tabBar:       { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tab:          { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive:    { color: "#818cf8", borderBottomColor: "#6366f1" },
  twoCol:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 },
  formPanel:    {},
  infoPanel:    {},
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" },
  loadingText:  { color: "#475569", fontFamily: "monospace", fontSize: 13 },
  errorBanner:  { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, padding: "12px 16px", color: "#f87171", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  successBanner:{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 2, padding: "12px 16px", color: "#6ee7b7", fontSize: 13, fontFamily: "monospace", marginBottom: 20 },
  steps:        { display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 },
  step:         { display: "flex", gap: 16, alignItems: "flex-start" },
  stepNum:      { width: 32, height: 32, borderRadius: 2, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#818cf8", fontFamily: "monospace", flexShrink: 0 },
  stepTitle:    { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  stepDesc:     { margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  apiNote:      { marginTop: 24, fontSize: 11, color: "#334155", fontFamily: "monospace", lineHeight: 1.8 },
  code:         { color: "#818cf8" },
  list:         { display: "flex", flexDirection: "column", gap: 10 },
  card:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 2, background: "rgba(15,15,25,0.6)", cursor: "pointer" },
  cardLeft:     { display: "flex", gap: 16, alignItems: "flex-start", flex: 1 },
  cardId:       { fontSize: 11, color: "#6366f1", fontFamily: "monospace", flexShrink: 0, marginTop: 2 },
  cardTitle:    { margin: "0 0 3px", fontSize: 15, color: "#e2e8f0" },
  cardMeta:     { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  badges:       { display: "flex", gap: 6, flexShrink: 0, marginTop: 2 },
  badge:        { fontSize: 10, padding: "3px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  emptyState:   { textAlign: "center", padding: "64px 32px", border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2 },
  emptyIcon:    { fontSize: 40, margin: "0 0 12px" },
  emptyText:    { margin: "0 0 16px", color: "#475569", fontSize: 14, fontFamily: "'Georgia', serif" },
  emptyBtn:     { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace" },
};

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import RequestForm from "../components/RequestForm";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Mock mode — flip to false once backend is running ──
const MOCK_MODE = true;

const MOCK_DEPARTMENTS = [
  { id: 1, name: "Computer Science" },
  { id: 2, name: "Software Engineering" },
  { id: 3, name: "Artificial Intelligence" },
  { id: 4, name: "Data Science" },
];

const MOCK_REQUESTS = [
  { id: 1, request_type: "Transcript Request",  status: "pending",     department_id: 1, description: "Need official transcript for grad school application.", created_at: "2025-03-01T10:00:00" },
  { id: 2, request_type: "Library Card Renewal", status: "completed",  department_id: null, description: "My library card expired last month.", created_at: "2025-02-20T14:30:00" },
  { id: 3, request_type: "Fee Clearance",        status: "in_progress", department_id: 2, description: "Need fee clearance certificate.", created_at: "2025-02-28T09:15:00" },
];

const STATUS_COLORS = {
  pending:     "#f59e0b",
  in_progress: "#6366f1",
  completed:   "#10b981",
  cancelled:   "#ef4444",
};

export default function SubmitRequest() {
  const { user } = useAuth();

  const [departments,  setDepartments]  = useState([]);
  const [myRequests,   setMyRequests]   = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingReqs,  setLoadingReqs]  = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [activeTab,    setActiveTab]    = useState("submit");

  // ── Load departments for dropdown ──
  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setDepartments(MOCK_DEPARTMENTS);
        setLoadingDepts(false);
        return;
      }
      try {
        const res = await api.get("/requests/departments");
        setDepartments(res.data);
      } catch {
        setDepartments(MOCK_DEPARTMENTS);
      } finally {
        setLoadingDepts(false);
      }
    };
    load();
  }, []);

  // ── Load student's existing requests ──
  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setMyRequests(MOCK_REQUESTS);
        setLoadingReqs(false);
        return;
      }
      try {
        const res = await api.get(`/requests/user/${user?.id}`);
        setMyRequests(res.data);
      } catch {
        setMyRequests([]);
      } finally {
        setLoadingReqs(false);
      }
    };
    if (user?.id) load();
  }, [user]);

  // ── Handle form submission ──
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (MOCK_MODE) {
      // Simulate successful submission
      const newReq = {
        id:            myRequests.length + 1,
        request_type:  formData.request_type,
        description:   formData.description,
        department_id: formData.department_id,
        status:        "pending",
        created_at:    new Date().toISOString(),
      };
      setMyRequests((prev) => [newReq, ...prev]);
      setSuccessMsg("Service request submitted successfully!");
      setActiveTab("history");
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(""), 5000);
      return;
    }

    try {
      // Real API call: POST /api/requests
      const res = await api.post("/requests", {
        ...formData,
        student_id: user?.id,
      });
      setMyRequests((prev) => [res.data, ...prev]);
      setSuccessMsg("Service request submitted successfully!");
      setActiveTab("history");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDeptName = (id) => {
    const d = departments.find((d) => d.id === id);
    return d ? d.name : "General";
  };

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const tabs = [
    { id: "submit",  label: "Submit Request" },
    { id: "history", label: `My Requests (${myRequests.length})` },
  ];

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* Header */}
        <header style={styles.header}>
          <p style={styles.frLabel}>FR-05</p>
          <h1 style={styles.title}>Service Request Submission</h1>
          <p style={styles.subtitle}>Submit a new service request or track your existing ones</p>
        </header>

        {/* Tabs */}
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
            {/* Form */}
            <div style={styles.formPanel}>
              <h2 style={styles.sectionTitle}>New Service Request</h2>
              {loadingDepts ? (
                <p style={styles.loadingText}>Loading departments...</p>
              ) : (
                <RequestForm
                  departments={departments}
                  onSubmit={handleSubmit}
                  loading={submitting}
                  successMsg={successMsg}
                  errorMsg={errorMsg}
                />
              )}
            </div>

            {/* Info panel */}
            <div style={styles.infoPanel}>
              <h2 style={styles.sectionTitle}>How It Works</h2>
              <div style={styles.steps}>
                {[
                  { step: "01", title: "Fill the Form",       desc: "Select request type, department, and describe your request." },
                  { step: "02", title: "Submit",              desc: "Your request is submitted with a 'pending' status." },
                  { step: "03", title: "Processing",          desc: "The relevant department reviews and processes your request." },
                  { step: "04", title: "Completion",          desc: "You will be notified once the request is completed." },
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
                → <code style={styles.code}>POST /api/requests</code><br />
                → <code style={styles.code}>GET /api/requests/departments</code>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            <h2 style={styles.sectionTitle}>My Service Requests</h2>

            {successMsg && (
              <div style={styles.successBanner}>✓ {successMsg}</div>
            )}

            {loadingReqs ? (
              <p style={styles.loadingText}>Loading your requests...</p>
            ) : myRequests.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyIcon}>📋</p>
                <p style={styles.emptyText}>You haven't submitted any requests yet.</p>
                <button style={styles.emptyBtn} onClick={() => setActiveTab("submit")}>
                  Submit your first request →
                </button>
              </div>
            ) : (
              <div style={styles.requestList}>
                {myRequests.map((r) => (
                  <div key={r.id} style={styles.requestCard}>
                    <div style={styles.cardLeft}>
                      <div style={styles.cardId}>#{String(r.id).padStart(4, "0")}</div>
                      <div>
                        <p style={styles.cardType}>{r.request_type}</p>
                        <p style={styles.cardMeta}>
                          {r.department_id ? getDeptName(r.department_id) : "General"} · {formatDate(r.created_at)}
                        </p>
                        {r.description && (
                          <p style={styles.cardDesc}>{r.description}</p>
                        )}
                      </div>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      color: STATUS_COLORS[r.status] || "#64748b",
                      borderColor: `${STATUS_COLORS[r.status] || "#64748b"}44`,
                    }}>
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p style={styles.apiNote}>
              → <code style={styles.code}>GET /api/requests/user/{user?.id}</code>
            </p>
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

  steps:        { display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 },
  step:         { display: "flex", gap: 16, alignItems: "flex-start" },
  stepNum:      { width: 32, height: 32, borderRadius: 2, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#818cf8", fontFamily: "monospace", flexShrink: 0 },
  stepTitle:    { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  stepDesc:     { margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 },

  successBanner:{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 2, padding: "12px 16px", color: "#6ee7b7", fontSize: 13, fontFamily: "monospace", marginBottom: 20 },

  emptyState:   { textAlign: "center", padding: "64px 32px", border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2 },
  emptyIcon:    { fontSize: 40, margin: "0 0 12px" },
  emptyText:    { margin: "0 0 16px", color: "#475569", fontSize: 14, fontFamily: "'Georgia', serif" },
  emptyBtn:     { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "10px 20px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace" },

  requestList:  { display: "flex", flexDirection: "column", gap: 10 },
  requestCard:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 20px", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 2, background: "rgba(15,15,25,0.6)" },
  cardLeft:     { display: "flex", gap: 16, alignItems: "flex-start", flex: 1 },
  cardId:       { fontSize: 11, color: "#6366f1", fontFamily: "monospace", flexShrink: 0, marginTop: 2 },
  cardType:     { margin: "0 0 3px", fontSize: 15, color: "#e2e8f0" },
  cardMeta:     { margin: "0 0 4px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  cardDesc:     { margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  statusBadge:  { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", flexShrink: 0, marginTop: 2 },

  apiNote:      { marginTop: 24, fontSize: 11, color: "#334155", fontFamily: "monospace", lineHeight: 1.8 },
  code:         { color: "#818cf8" },
};

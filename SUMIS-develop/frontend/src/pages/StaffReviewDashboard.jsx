import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import RequestDetailsCard from "../components/RequestDetailsCard";
import RequestDecisionPanel from "../components/RequestDecisionPanel";
import RemarksModal from "../components/RemarksModal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Mock mode — flip to false once backend is running ──
const MOCK_MODE = false;

const MOCK_REQUESTS = [
  {
    id: 1, student_id: 101, department_id: 1, department_name: "Computer Science",
    request_type: "Transcript Request", description: "Need official transcript for grad school application.",
    status: "in_progress", created_at: "2025-03-01T10:00:00", completed_at: null,
    status_history: [
      { id: 1, status: "pending",     remarks: "Request submitted by student.",        updated_at: "2025-03-01T10:00:00" },
      { id: 2, status: "in_progress", remarks: "Auto-routed to Computer Science.",     updated_at: "2025-03-01T10:05:00" },
    ],
  },
  {
    id: 2, student_id: 102, department_id: 2, department_name: "Software Engineering",
    request_type: "Library Card Renewal", description: "My library card expired last month.",
    status: "in_progress", created_at: "2025-03-02T11:00:00", completed_at: null,
    status_history: [
      { id: 3, status: "pending",     remarks: "Request submitted.",                  updated_at: "2025-03-02T11:00:00" },
      { id: 4, status: "in_progress", remarks: "Auto-routed to Software Engineering.", updated_at: "2025-03-02T11:05:00" },
    ],
  },
  {
    id: 3, student_id: 103, department_id: 3, department_name: "Artificial Intelligence",
    request_type: "Fee Clearance", description: "Need fee clearance certificate for degree.",
    status: "pending", created_at: "2025-03-03T09:00:00", completed_at: null,
    status_history: [
      { id: 5, status: "pending", remarks: "Request submitted.", updated_at: "2025-03-03T09:00:00" },
    ],
  },
  {
    id: 4, student_id: 104, department_id: 1, department_name: "Computer Science",
    request_type: "Lab Access Request", description: "Need access to AI research lab.",
    status: "approved", created_at: "2025-03-04T14:00:00", completed_at: "2025-03-04T15:00:00",
    status_history: [
      { id: 6, status: "pending",     remarks: "Request submitted.",               updated_at: "2025-03-04T14:00:00" },
      { id: 7, status: "in_progress", remarks: "Auto-routed to Computer Science.", updated_at: "2025-03-04T14:05:00" },
      { id: 8, status: "approved",    remarks: "Access granted for Spring 2025.",  updated_at: "2025-03-04T15:00:00" },
    ],
  },
];

const STATUS_COLORS = {
  pending:     "#f59e0b",
  in_progress: "#6366f1",
  approved:    "#10b981",
  rejected:    "#ef4444",
  completed:   "#10b981",
};

export default function StaffReviewDashboard() {
  const { user } = useAuth();

  const [requests,       setRequests]       = useState([]);
  const [selectedId,     setSelectedId]     = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [activeTab,      setActiveTab]      = useState("pending");
  const [modalOpen,      setModalOpen]      = useState(false);
  const [pendingDecision, setPendingDecision] = useState({ requestId: null, decision: null });
  const [feedbackMsg,    setFeedbackMsg]    = useState("");
  const [feedbackType,   setFeedbackType]   = useState("success");

  // ── Load requests on mount ──
  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setRequests(MOCK_REQUESTS);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/requests/pending-review");
        setRequests(res.data);
      } catch {
        setRequests(MOCK_REQUESTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedRequest = requests.find((r) => r.id === selectedId) || null;

  // ── Filter by tab ──
  const filteredRequests = requests.filter((r) => {
    if (activeTab === "pending")   return ["pending", "in_progress"].includes(r.status);
    if (activeTab === "decided")   return ["approved", "rejected"].includes(r.status);
    return true; // "all"
  });

  // ── Approve ──
  const handleApprove = (requestId) => {
    setPendingDecision({ requestId, decision: "approved" });
    setModalOpen(true);
  };

  // ── Reject ──
  const handleReject = (requestId) => {
    setPendingDecision({ requestId, decision: "rejected" });
    setModalOpen(true);
  };

  // ── Confirm decision from modal ──
  const handleConfirmDecision = async (remarks) => {
    setModalOpen(false);
    setDecisionLoading(true);

    const { requestId, decision } = pendingDecision;

    if (MOCK_MODE) {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          const newHistory = [
            ...r.status_history,
            {
              id:         r.status_history.length + 1,
              status:     decision,
              remarks:    remarks || `Request ${decision} by ${user?.name || "staff"}.`,
              updated_at: new Date().toISOString(),
            },
          ];
          return {
            ...r,
            status:       decision,
            completed_at: decision === "rejected" ? new Date().toISOString() : r.completed_at,
            status_history: newHistory,
          };
        })
      );
      setFeedbackMsg(`✓ Request #${String(requestId).padStart(4,"0")} has been ${decision}.`);
      setFeedbackType("success");
      setDecisionLoading(false);
      setTimeout(() => setFeedbackMsg(""), 5000);
      return;
    }

    try {
      const res = await api.put(`/requests/${requestId}/decision`, {
        decision,
        remarks,
        decided_by: user?.id,
      });
      setRequests((prev) => prev.map((r) => r.id === requestId ? res.data : r));
      setFeedbackMsg(`✓ Request #${String(requestId).padStart(4,"0")} has been ${decision}.`);
      setFeedbackType("success");
    } catch (err) {
      setFeedbackMsg(err.response?.data?.error || "Decision failed. Please try again.");
      setFeedbackType("error");
    } finally {
      setDecisionLoading(false);
      setTimeout(() => setFeedbackMsg(""), 5000);
    }
  };

  const tabs = [
    { id: "pending",  label: `Awaiting Decision (${requests.filter(r => ["pending","in_progress"].includes(r.status)).length})` },
    { id: "decided",  label: `Decided (${requests.filter(r => ["approved","rejected"].includes(r.status)).length})` },
    { id: "all",      label: `All (${requests.length})` },
  ];

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <p style={styles.frLabel}>FR-08</p>
            <h1 style={styles.title}>Request Approval / Rejection</h1>
            <p style={styles.subtitle}>Review assigned service requests and process approve or reject decisions</p>
          </div>
        </header>

        {/* Feedback banner */}
        {feedbackMsg && (
          <div style={feedbackType === "success" ? styles.successBanner : styles.errorBanner}>
            {feedbackMsg}
          </div>
        )}

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

        {loading ? (
          <p style={styles.loadingText}>Loading requests...</p>
        ) : (
          <div style={styles.layout}>

            {/* Left — Request List */}
            <div style={styles.listPanel}>
              {filteredRequests.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyIcon}>✓</p>
                  <p style={styles.emptyText}>No requests in this category.</p>
                </div>
              ) : (
                filteredRequests.map((r) => (
                  <div
                    key={r.id}
                    style={selectedId === r.id
                      ? { ...styles.listItem, ...styles.listItemActive }
                      : styles.listItem
                    }
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div style={styles.itemTop}>
                      <span style={styles.itemId}>#{String(r.id).padStart(4, "0")}</span>
                      <span style={{
                        ...styles.itemBadge,
                        color: STATUS_COLORS[r.status] || "#64748b",
                        borderColor: `${STATUS_COLORS[r.status] || "#64748b"}44`,
                      }}>
                        {r.status?.replace("_", " ")}
                      </span>
                    </div>
                    <p style={styles.itemType}>{r.request_type}</p>
                    <p style={styles.itemMeta}>{r.department_name || "Unassigned"} · Student #{r.student_id}</p>
                  </div>
                ))
              )}
            </div>

            {/* Right — Detail + Decision */}
            <div style={styles.detailPanel}>
              {selectedRequest ? (
                <div style={styles.detailContent}>
                  <RequestDetailsCard request={selectedRequest} />
                  <div style={styles.decisionWrap}>
                    <RequestDecisionPanel
                      request={selectedRequest}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      loading={decisionLoading}
                    />
                  </div>
                </div>
              ) : (
                <div style={styles.noSelection}>
                  <p style={styles.noSelectionIcon}>📋</p>
                  <p style={styles.noSelectionText}>Select a request from the list to review it</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remarks Modal */}
        <RemarksModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmDecision}
          decision={pendingDecision.decision}
          requestType={requests.find(r => r.id === pendingDecision.requestId)?.request_type || ""}
        />


      </main>
    </div>
  );
}

const styles = {
  page:          { minHeight: "100vh", background: "#0a0a0f" },
  main:          { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header:        { marginBottom: 24 },
  frLabel:       { margin: "0 0 4px", fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  title:         { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle:      { margin: 0, fontSize: 14, color: "#64748b" },

  successBanner: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 2, padding: "12px 16px", color: "#6ee7b7", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  errorBanner:   { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, padding: "12px 16px", color: "#fca5a5", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },

  tabBar:        { display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tab:           { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive:     { color: "#818cf8", borderBottomColor: "#6366f1" },
  loadingText:   { color: "#475569", fontFamily: "monospace", fontSize: 13 },

  layout:        { display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" },
  listPanel:     { display: "flex", flexDirection: "column", gap: 8, maxHeight: "75vh", overflowY: "auto", paddingRight: 4 },
  listItem:      { padding: "14px 16px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, background: "rgba(15,15,25,0.6)", cursor: "pointer" },
  listItemActive:{ border: "1px solid rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.06)" },
  itemTop:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemId:        { fontSize: 11, color: "#6366f1", fontFamily: "monospace" },
  itemBadge:     { fontSize: 10, padding: "2px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },
  itemType:      { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  itemMeta:      { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },

  detailPanel:   { position: "sticky", top: 80 },
  detailContent: { display: "flex", flexDirection: "column", gap: 16 },
  decisionWrap:  {},
  noSelection:   { border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2, padding: "64px 32px", textAlign: "center" },
  noSelectionIcon: { fontSize: 40, margin: "0 0 12px" },
  noSelectionText: { margin: 0, color: "#475569", fontFamily: "'Georgia', serif" },

  emptyState:    { textAlign: "center", padding: "48px 0" },
  emptyIcon:     { fontSize: 32, color: "#10b981", margin: "0 0 12px" },
  emptyText:     { margin: 0, color: "#475569", fontFamily: "'Georgia', serif" },

  apiNote:       { marginTop: 24, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code:          { color: "#818cf8" },
};

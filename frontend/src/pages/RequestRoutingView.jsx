import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Mock mode — flip to false once backend is running ──
const MOCK_MODE = true;

// Mock data aligned with service_request.py and department.py models
const MOCK_PENDING = [
  { id: 1, request_type: "Transcript Request",   description: "Need official transcript for grad school.", student_id: 101, status: "pending",     created_at: "2025-03-01T10:00:00" },
  { id: 2, request_type: "Library Card Renewal", description: "My library card expired last month.",       student_id: 102, status: "pending",     created_at: "2025-03-02T11:00:00" },
  { id: 3, request_type: "Fee Clearance",        description: "Need fee clearance for degree.",            student_id: 103, status: "pending",     created_at: "2025-03-03T09:00:00" },
  { id: 4, request_type: "Lab Access Request",   description: "Need access to AI lab.",                   student_id: 104, status: "in_progress", created_at: "2025-03-04T14:00:00", department: "Computer Science" },
  { id: 5, request_type: "Software License",     description: "Need student MATLAB license.",             student_id: 105, status: "in_progress", created_at: "2025-03-05T10:30:00", department: "Software Engineering" },
  { id: 6, request_type: "Data Access",          description: "Need access to research datasets.",        student_id: 106, status: "completed",   created_at: "2025-03-06T08:00:00", department: "Data Science" },
];

const MOCK_STATS = {
  service_requests: { total: 6, pending: 3, in_progress: 2, completed: 1 },
  complaints:       { total: 4, open: 2,    in_review: 1,   resolved: 1  },
  department_breakdown: [
    { department: "Computer Science",      count: 2 },
    { department: "Software Engineering",  count: 1 },
    { department: "Artificial Intelligence", count: 0 },
    { department: "Data Science",          count: 1 },
  ],
};

// Routing logic (mirrors routing_service.py)
const KEYWORD_MAP = {
  transcript: "Computer Science",
  library:    "Software Engineering",
  fee:        "Artificial Intelligence",
  clearance:  "Artificial Intelligence",
  lab:        "Computer Science",
  software:   "Software Engineering",
  data:       "Data Science",
  ai:         "Artificial Intelligence",
  it:         "Computer Science",
};

function detectDepartment(requestType) {
  const lower = requestType.toLowerCase();
  for (const [keyword, dept] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return dept;
  }
  return "Computer Science"; // default
}

const STATUS_COLORS = {
  pending:     "#f59e0b",
  in_progress: "#6366f1",
  completed:   "#10b981",
  cancelled:   "#ef4444",
  in_review:   "#0ea5e9",
  resolved:    "#10b981",
  open:        "#ef4444",
};

export default function RequestRoutingView() {
  const { user } = useAuth();

  const [requests,    setRequests]    = useState([]);
  const [stats,       setStats]       = useState(null);
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [loading,     setLoading]     = useState(true);
  const [routing,     setRouting]     = useState(false);
  const [routeMsg,    setRouteMsg]    = useState("");
  const [routeError,  setRouteError]  = useState("");

  // ── Load data on mount ──
  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setRequests(MOCK_PENDING);
        setStats(MOCK_STATS);
        setLoading(false);
        return;
      }
      try {
        const [pendingRes, statsRes] = await Promise.all([
          api.get("/routing/pending"),
          api.get("/routing/stats"),
        ]);
        setRequests(pendingRes.data);
        setStats(statsRes.data);
      } catch {
        setRequests(MOCK_PENDING);
        setStats(MOCK_STATS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Route a single request (mock) ──
  const handleRouteOne = (requestId) => {
    if (MOCK_MODE) {
      const req = requests.find((r) => r.id === requestId);
      if (!req || req.status !== "pending") return;

      const assignedDept = detectDepartment(req.request_type);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "in_progress", department: assignedDept }
            : r
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        service_requests: {
          ...prev.service_requests,
          pending:     prev.service_requests.pending - 1,
          in_progress: prev.service_requests.in_progress + 1,
        },
      }));

      setRouteMsg(`✓ Request #${String(requestId).padStart(4,"0")} routed to ${assignedDept}`);
      setTimeout(() => setRouteMsg(""), 4000);
      return;
    }

    // Real call
    api.post(`/routing/route-request/${requestId}`)
      .then((res) => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: "in_progress", department: res.data.assigned_to }
              : r
          )
        );
        setRouteMsg(`✓ Routed to ${res.data.assigned_to}`);
        setTimeout(() => setRouteMsg(""), 4000);
      })
      .catch(() => setRouteError("Routing failed. Try again."));
  };

  // ── Route ALL pending ──
  const handleRouteAll = async () => {
    setRouting(true);
    setRouteMsg("");
    setRouteError("");

    if (MOCK_MODE) {
      let count = 0;
      setRequests((prev) =>
        prev.map((r) => {
          if (r.status === "pending") {
            count++;
            return { ...r, status: "in_progress", department: detectDepartment(r.request_type) };
          }
          return r;
        })
      );
      setStats((prev) => ({
        ...prev,
        service_requests: {
          ...prev.service_requests,
          pending:     0,
          in_progress: prev.service_requests.in_progress + prev.service_requests.pending,
        },
      }));
      setRouteMsg(`✓ ${count} pending requests routed successfully`);
      setRouting(false);
      setTimeout(() => setRouteMsg(""), 5000);
      return;
    }

    try {
      const res = await api.post("/routing/route-all");
      setRouteMsg(`✓ Routed ${res.data.routed_requests} requests and ${res.data.routed_complaints} complaints`);
      // Reload data
      const [pendingRes, statsRes] = await Promise.all([
        api.get("/routing/pending"),
        api.get("/routing/stats"),
      ]);
      setRequests(pendingRes.data);
      setStats(statsRes.data);
    } catch {
      setRouteError("Batch routing failed. Try again.");
    } finally {
      setRouting(false);
      setTimeout(() => setRouteMsg(""), 5000);
    }
  };

  const pendingCount    = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;
  const completedCount  = requests.filter((r) => r.status === "completed").length;

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "requests",  label: `All Requests (${requests.length})` },
    { id: "pending",   label: `Pending (${pendingCount})` },
  ];

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <p style={styles.frLabel}>FR-06</p>
            <h1 style={styles.title}>Automated Request Routing</h1>
            <p style={styles.subtitle}>Detect request category, assign department, and update status</p>
          </div>

          {/* Route All button */}
          <button
            style={routing || pendingCount === 0
              ? { ...styles.routeAllBtn, ...styles.routeAllBtnDisabled }
              : styles.routeAllBtn
            }
            onClick={handleRouteAll}
            disabled={routing || pendingCount === 0}
          >
            {routing ? "Routing..." : `⚡ Route All Pending (${pendingCount})`}
          </button>
        </header>

        {/* Feedback */}
        {routeMsg   && <div style={styles.successBanner}>{routeMsg}</div>}
        {routeError && <div style={styles.errorBanner}>{routeError}</div>}

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
          <p style={styles.loadingText}>Loading routing data...</p>
        ) : (
          <>
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && stats && (
              <div>
                {/* Stats grid */}
                <div style={styles.statsGrid}>
                  <StatBox label="Total Requests"  value={stats.service_requests.total}       accent="#6366f1" />
                  <StatBox label="Pending"         value={stats.service_requests.pending}      accent="#f59e0b" />
                  <StatBox label="In Progress"     value={stats.service_requests.in_progress}  accent="#0ea5e9" />
                  <StatBox label="Completed"       value={stats.service_requests.completed}    accent="#10b981" />
                </div>

                <div style={styles.twoCol}>
                  {/* Department breakdown */}
                  <div>
                    <h2 style={styles.sectionTitle}>Requests by Department</h2>
                    {stats.department_breakdown.map((d) => (
                      <div key={d.department} style={styles.deptRow}>
                        <span style={styles.deptName}>{d.department}</span>
                        <div style={styles.barWrap}>
                          <div style={{
                            ...styles.bar,
                            width: `${stats.service_requests.total > 0
                              ? (d.count / stats.service_requests.total) * 100
                              : 0}%`
                          }} />
                        </div>
                        <span style={styles.deptCount}>{d.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Routing logic explanation */}
                  <div>
                    <h2 style={styles.sectionTitle}>Routing Rules</h2>
                    <div style={styles.rulesBox}>
                      {Object.entries(KEYWORD_MAP).map(([keyword, dept]) => (
                        <div key={keyword} style={styles.ruleRow}>
                          <span style={styles.ruleKeyword}>"{keyword}"</span>
                          <span style={styles.ruleArrow}>→</span>
                          <span style={styles.ruleDept}>{dept}</span>
                        </div>
                      ))}
                    </div>
                    <p style={styles.apiNote}>
                      → <code style={styles.code}>POST /api/routing/route-all</code><br />
                      → <code style={styles.code}>GET /api/routing/stats</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ALL REQUESTS TAB */}
            {activeTab === "requests" && (
              <div>
                <h2 style={styles.sectionTitle}>All Service Requests</h2>
                <div style={styles.requestList}>
                  {requests.map((r) => (
                    <RequestRow
                      key={r.id}
                      request={r}
                      onRoute={handleRouteOne}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* PENDING TAB */}
            {activeTab === "pending" && (
              <div>
                <h2 style={styles.sectionTitle}>Pending — Awaiting Routing</h2>
                {pendingCount === 0 ? (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyIcon}>✓</p>
                    <p style={styles.emptyText}>All requests have been routed.</p>
                  </div>
                ) : (
                  <div style={styles.requestList}>
                    {requests.filter((r) => r.status === "pending").map((r) => (
                      <RequestRow
                        key={r.id}
                        request={r}
                        onRoute={handleRouteOne}
                        showRouteBtn
                      />
                    ))}
                  </div>
                )}
                <p style={styles.apiNote}>
                  → <code style={styles.code}>GET /api/routing/pending</code><br />
                  → <code style={styles.code}>POST /api/routing/route-request/{"<id>"}</code>
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, accent }) {
  return (
    <div style={{ ...subStyles.statBox, borderColor: `${accent}22` }}>
      <p style={{ ...subStyles.statValue, color: accent }}>{value}</p>
      <p style={subStyles.statLabel}>{label}</p>
    </div>
  );
}

function RequestRow({ request: r, onRoute, showRouteBtn }) {
  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={subStyles.row}>
      <div style={subStyles.rowLeft}>
        <span style={subStyles.rowId}>#{String(r.id).padStart(4, "0")}</span>
        <div>
          <p style={subStyles.rowType}>{r.request_type}</p>
          <p style={subStyles.rowMeta}>
            Student #{r.student_id} · {formatDate(r.created_at)}
            {r.department && <span style={subStyles.deptTag}> → {r.department}</span>}
          </p>
          {r.description && <p style={subStyles.rowDesc}>{r.description}</p>}
        </div>
      </div>
      <div style={subStyles.rowRight}>
        <span style={{
          ...subStyles.statusBadge,
          color: STATUS_COLORS[r.status] || "#64748b",
          borderColor: `${STATUS_COLORS[r.status] || "#64748b"}44`,
        }}>
          {r.status.replace("_", " ")}
        </span>
        {(showRouteBtn || r.status === "pending") && (
          <button
            style={subStyles.routeBtn}
            onClick={() => onRoute(r.id)}
          >
            Route →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page:         { minHeight: "100vh", background: "#0a0a0f" },
  main:         { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  frLabel:      { margin: "0 0 4px", fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  title:        { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle:     { margin: 0, fontSize: 14, color: "#64748b" },

  routeAllBtn:  { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "12px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em", flexShrink: 0 },
  routeAllBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },

  successBanner:{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 2, padding: "12px 16px", color: "#6ee7b7", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  errorBanner:  { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, padding: "12px 16px", color: "#fca5a5", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },

  tabBar:       { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tab:          { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive:    { color: "#818cf8", borderBottomColor: "#6366f1" },

  loadingText:  { color: "#475569", fontFamily: "monospace", fontSize: 13 },

  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  twoCol:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 },
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },

  deptRow:      { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" },
  deptName:     { fontSize: 13, color: "#94a3b8", width: 180, flexShrink: 0 },
  barWrap:      { flex: 1, height: 4, background: "rgba(99,102,241,0.1)", borderRadius: 2 },
  bar:          { height: "100%", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", borderRadius: 2, transition: "width 0.3s" },
  deptCount:    { fontSize: 13, color: "#e2e8f0", width: 24, textAlign: "right", fontFamily: "monospace" },

  rulesBox:     { background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, padding: "16px" },
  ruleRow:      { display: "flex", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" },
  ruleKeyword:  { fontSize: 12, color: "#818cf8", fontFamily: "monospace", width: 100, flexShrink: 0 },
  ruleArrow:    { fontSize: 12, color: "#475569" },
  ruleDept:     { fontSize: 12, color: "#94a3b8" },

  requestList:  { display: "flex", flexDirection: "column", gap: 8 },
  emptyState:   { textAlign: "center", padding: "48px", border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2 },
  emptyIcon:    { fontSize: 32, color: "#10b981", margin: "0 0 12px" },
  emptyText:    { margin: 0, color: "#475569", fontFamily: "'Georgia', serif" },

  apiNote:      { marginTop: 20, fontSize: 11, color: "#334155", fontFamily: "monospace", lineHeight: 1.8 },
  code:         { color: "#818cf8" },
};

const subStyles = {
  statBox:      { background: "rgba(15,15,25,0.8)", border: "1px solid", borderRadius: 2, padding: "20px 24px", textAlign: "center" },
  statValue:    { margin: "0 0 4px", fontSize: 32, fontFamily: "'Georgia', serif" },
  statLabel:    { margin: 0, fontSize: 11, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },

  row:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, background: "rgba(15,15,25,0.6)" },
  rowLeft:      { display: "flex", gap: 16, flex: 1 },
  rowId:        { fontSize: 11, color: "#6366f1", fontFamily: "monospace", flexShrink: 0, marginTop: 2 },
  rowType:      { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  rowMeta:      { margin: "0 0 4px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  rowDesc:      { margin: 0, fontSize: 12, color: "#64748b" },
  deptTag:      { color: "#818cf8" },
  rowRight:     { display: "flex", gap: 10, alignItems: "center", flexShrink: 0 },
  statusBadge:  { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  routeBtn:     { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, padding: "5px 14px", color: "#818cf8", fontSize: 11, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" },
};

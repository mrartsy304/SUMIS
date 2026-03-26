import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import DepartmentCard from "../components/DepartmentCard";
import { useAuth } from "../context/AuthContext";
import { departmentAPI } from "../services/api";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Temporary mock users until the Auth blueprint is implemented (FR-auth).
const MOCK_USERS = [
  { id: 1, name: "Abdul Qadir",  email: "qadir@sumis.edu",  role: "student",           created_at: "2025-01-10" },
  { id: 2, name: "Dr. Imran",    email: "imran@sumis.edu",  role: "faculty",           created_at: "2025-01-05" },
  { id: 3, name: "Staff Member", email: "staff@sumis.edu",  role: "staff",             created_at: "2025-01-08" },
  { id: 4, name: "Event Coord",  email: "events@sumis.edu", role: "event_coordinator", created_at: "2025-01-12" },
];

const ROLE_COLORS = {
  student:           "#6366f1",
  faculty:           "#0ea5e9",
  staff:             "#10b981",
  admin:             "#f59e0b",
  event_coordinator: "#ec4899",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState("overview");
  const [users]                     = useState(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState("all");

  // ── Department state (FR-02) ───────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [deptSearch,  setDeptSearch]  = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError,   setDeptError]   = useState("");

  // useCallback stabilises fetchDepartments so it can be safely listed in the
  // useEffect dependency array without causing an infinite re-render loop.
  const fetchDepartments = useCallback(async (query = "") => {
    try {
      setDeptLoading(true);
      setDeptError("");

      const res = query
        ? await departmentAPI.search(query)
        : await departmentAPI.getAll();

      // axios wraps the response body in res.data
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Surface the HTTP status code when available so the error message is
      // more actionable than a single generic string.
      const status = err.response?.status;
      if (status) {
        setDeptError(`Failed to load departments (HTTP ${status}). Check that the Flask server is running.`);
      } else {
        setDeptError("Cannot reach the server. Make sure Flask is running on port 5000 and the proxy is set in package.json.");
      }
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // Load departments immediately on mount so the Overview stat card count
  // is populated before the user even clicks the Departments tab.
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Re-fetch when the user switches to the Departments tab.
  useEffect(() => {
    if (activeTab === "departments") {
      fetchDepartments(deptSearch.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tabs = [
    { id: "overview",    label: "Overview"    },
    { id: "users",       label: "Users"       },
    { id: "departments", label: "Departments" },
    { id: "reports",     label: "Reports"     },
  ];

  const filteredUsers =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Admin Portal</p>
            <h1 style={styles.title}>{user?.name}</h1>
          </div>
          <div style={styles.adminBadge}>
            <span style={styles.adminIcon}>⬡</span>
            <span style={styles.adminText}>System Administrator</span>
          </div>
        </header>

        {/* ── Tab Bar ────────────────────────────────────────────────────── */}
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <section>
            <div style={styles.statsGrid}>
              <StatCard label="Total Users"      value={users.length}                           icon="👥" accent="#f59e0b" />
              <StatCard label="Departments"      value={deptLoading ? "…" : departments.length} icon="🏛️" accent="#0ea5e9" />
              <StatCard label="Pending Requests" value="—" icon="📋" accent="#6366f1" sub="Connect backend" />
              <StatCard label="Open Complaints"  value="—" icon="📢" accent="#ef4444" sub="Connect backend" />
            </div>

            <div style={styles.twoCol}>
              <div>
                <h2 style={styles.sectionTitle}>User Breakdown</h2>
                <div style={styles.breakdownList}>
                  {["student", "faculty", "staff", "admin", "event_coordinator"].map((role) => {
                    const count = users.filter((u) => u.role === role).length;
                    return (
                      <div key={role} style={styles.breakdownRow}>
                        <span style={{ ...styles.roleDot, background: ROLE_COLORS[role] || "#475569" }} />
                        <span style={styles.roleName}>{role.replace("_", " ")}</span>
                        <span style={styles.roleCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.actionGrid}>
                  {[
                    { label: "Add User",      desc: "Create new account", icon: "➕" },
                    { label: "View Reports",  desc: "System analytics",   icon: "📊" },
                    { label: "Manage Roles",  desc: "Assign permissions", icon: "🔑" },
                    { label: "Announcements", desc: "Post campus-wide",   icon: "📣" },
                  ].map((a) => (
                    <div key={a.label} style={styles.actionCard}>
                      <span style={styles.actionIcon}>{a.icon}</span>
                      <div>
                        <p style={styles.actionLabel}>{a.label}</p>
                        <p style={styles.actionDesc}>{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* USERS TAB                                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <section>
            <div style={styles.tableHeader}>
              <h2 style={styles.sectionTitle}>User Management</h2>
              <div style={styles.filterRow}>
                {["all", "student", "faculty", "staff", "admin"].map((r) => (
                  <button
                    key={r}
                    style={roleFilter === r
                      ? { ...styles.filterBtn, ...styles.filterBtnActive }
                      : styles.filterBtn}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.table}>
              <div style={styles.tableHeadRow}>
                <span style={styles.thCell}>Name</span>
                <span style={styles.thCell}>Email</span>
                <span style={styles.thCell}>Role</span>
                <span style={styles.thCell}>Created At</span>
              </div>
              {filteredUsers.map((u) => (
                <div key={u.id} style={styles.tableRow}>
                  <span style={styles.tdName}>{u.name}</span>
                  <span style={styles.tdCell}>{u.email}</span>
                  <span style={{
                    ...styles.rolePill,
                    color:       ROLE_COLORS[u.role] || "#818cf8",
                    borderColor: `${ROLE_COLORS[u.role]}33`,
                  }}>
                    {u.role.replace("_", " ")}
                  </span>
                  <span style={styles.tdCell}>{u.created_at}</span>
                </div>
              ))}
            </div>
            <p style={styles.apiNote}>→ Real data: <code style={styles.code}>GET /api/auth/users</code></p>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DEPARTMENTS TAB  (FR-02)                                         */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "departments" && (
          <section id="departments">
            <h2 style={styles.sectionTitle}>Departments</h2>

            {/* Search bar */}
            <div style={styles.deptSearchRow}>
              <input
                type="text"
                placeholder="Search departments by name, description or services…"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDepartments(deptSearch.trim());
                }}
                style={styles.deptSearchInput}
              />
              <button
                style={styles.deptSearchButton}
                onClick={() => fetchDepartments(deptSearch.trim())}
                disabled={deptLoading}
              >
                {deptLoading ? "Searching…" : "Search"}
              </button>
              <button
                style={styles.deptResetButton}
                onClick={() => {
                  setDeptSearch("");
                  fetchDepartments(""); // pass "" explicitly — avoids stale closure bug
                }}
                disabled={deptLoading}
              >
                Reset
              </button>
            </div>

            {/* Error message */}
            {deptError && (
              <p style={styles.deptError}>{deptError}</p>
            )}

            {/* Loading indicator */}
            {deptLoading && departments.length === 0 && (
              <p style={styles.deptStatus}>Loading departments…</p>
            )}

            {/* Empty state */}
            {!deptLoading && departments.length === 0 && !deptError && (
              <p style={styles.deptStatus}>No departments found.</p>
            )}

            {/* Department cards grid */}
            <div style={styles.deptGrid}>
              {departments.map((d) => (
                <DepartmentCard key={d.id} department={d} />
              ))}
            </div>

            <p style={styles.apiNote}>
              → Backed by{" "}
              <code style={styles.code}>GET /api/departments</code> and{" "}
              <code style={styles.code}>GET /api/departments/search?q=</code>
            </p>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* REPORTS TAB                                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <section>
            <h2 style={styles.sectionTitle}>System Reports</h2>
            <div style={styles.reportsPlaceholder}>
              <p style={styles.reportIcon}>📊</p>
              <p style={styles.reportText}>
                Reports available once the reporting endpoints are live.
              </p>
              <p style={styles.apiNote}>
                → <code style={styles.code}>GET /api/reporting/summary</code>
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  page:     { minHeight: "100vh", background: "#0a0a0f" },
  main:     { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },

  // Header
  header:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting: { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  title:    { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  adminBadge: { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 2, color: "#fbbf24" },
  adminIcon:  { fontSize: 18 },
  adminText:  { fontSize: 13, fontFamily: "monospace", letterSpacing: "0.05em" },

  // Tabs
  tabBar:    { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(245,158,11,0.1)" },
  tab:       { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#fbbf24", borderBottomColor: "#f59e0b" },

  // Overview
  statsGrid:     { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  twoCol:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 },
  sectionTitle:  { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  breakdownList: { display: "flex", flexDirection: "column" },
  breakdownRow:  { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(245,158,11,0.06)" },
  roleDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  roleName:      { flex: 1, fontSize: 13, color: "#94a3b8", textTransform: "capitalize" },
  roleCount:     { fontSize: 16, color: "#e2e8f0", fontFamily: "'Georgia', serif" },
  actionGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionCard:    { display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 2, background: "rgba(245,158,11,0.02)", cursor: "pointer" },
  actionIcon:    { fontSize: 20 },
  actionLabel:   { margin: "0 0 2px", fontSize: 13, color: "#e2e8f0" },
  actionDesc:    { margin: 0, fontSize: 11, color: "#475569" },

  // Users table
  tableHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  filterRow:       { display: "flex", gap: 6 },
  filterBtn:       { background: "transparent", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 2, padding: "4px 12px", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: "monospace", textTransform: "capitalize" },
  filterBtnActive: { background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.3)" },
  table:           { border: "1px solid rgba(245,158,11,0.1)", borderRadius: 2, overflow: "hidden" },
  tableHeadRow:    { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", padding: "12px 20px", background: "rgba(245,158,11,0.04)", borderBottom: "1px solid rgba(245,158,11,0.1)" },
  tableRow:        { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", padding: "12px 20px", borderBottom: "1px solid rgba(245,158,11,0.06)", alignItems: "center" },
  thCell:          { fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
  tdName:          { fontSize: 13, color: "#e2e8f0" },
  tdCell:          { fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  rolePill:        { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "capitalize", fontFamily: "monospace", letterSpacing: "0.06em", display: "inline-block", width: "fit-content" },

  // Departments (FR-02)
  deptSearchRow: { display: "flex", gap: 8, marginBottom: 20, alignItems: "center" },
  deptSearchInput: {
    flex: 1,
    padding: "9px 14px",
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 4,
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "monospace",
    outline: "none",
  },
  deptSearchButton: {
    padding: "9px 20px",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: 4,
    color: "#fbbf24",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
  deptResetButton: {
    padding: "9px 16px",
    background: "transparent",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 4,
    color: "#64748b",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
  },
  deptError: {
    margin: "0 0 16px",
    padding: "10px 16px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 4,
    color: "#fca5a5",
    fontSize: 13,
    fontFamily: "monospace",
  },
  deptStatus: {
    margin: "24px 0",
    fontSize: 13,
    color: "#475569",
    fontFamily: "monospace",
    textAlign: "center",
  },
  deptGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 4 },

  // Reports
  reportsPlaceholder: { border: "1px dashed rgba(245,158,11,0.15)", borderRadius: 2, padding: "64px 32px", textAlign: "center" },
  reportIcon:         { fontSize: 40, margin: "0 0 16px" },
  reportText:         { margin: "0 0 8px", color: "#475569", fontSize: 14, fontFamily: "'Georgia', serif" },

  // Shared
  apiNote: { marginTop: 16, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code:    { color: "#818cf8" },
};

import { useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const MOCK_USERS = [
  { id: 1, name: "Abdul Qadir", email: "qadir@sumis.edu", role: "student", department: "CS", status: "active" },
  { id: 2, name: "Dr. Imran", email: "imran@sumis.edu", role: "faculty", department: "CS", status: "active" },
  { id: 3, name: "Staff Member", email: "staff@sumis.edu", role: "staff", department: "Admin", status: "active" },
  { id: 4, name: "Event Coord", email: "events@sumis.edu", role: "event_coordinator", department: "Student Affairs", status: "active" },
];

const MOCK_DEPARTMENTS = [
  { id: 1, name: "Computer Science", head: "Dr. Imran Ahmed", staff: 12, students: 340 },
  { id: 2, name: "Business Administration", head: "Dr. Farah Naz", staff: 8, students: 210 },
  { id: 3, name: "Electrical Engineering", head: "Dr. Tariq Malik", staff: 15, students: 280 },
];

const ROLE_COLORS = {
  student: "#6366f1",
  faculty: "#0ea5e9",
  staff: "#10b981",
  admin: "#f59e0b",
  event_coordinator: "#ec4899",
};

export default function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [users] = useState(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState("all");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "departments", label: "Departments" },
    { id: "reports", label: "Reports" },
  ];

  const filteredUsers = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Admin Portal</p>
            <h1 style={styles.name}>{user?.name}</h1>
          </div>
          <div style={styles.adminBadge}>
            <span style={styles.adminIcon}>⬡</span>
            <span style={styles.adminText}>System Administrator</span>
          </div>
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

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <section>
            <div style={styles.statsGrid}>
              <StatCard label="Total Users" value={users.length} icon="👥" accent="#f59e0b" />
              <StatCard label="Departments" value={MOCK_DEPARTMENTS.length} icon="🏛️" accent="#0ea5e9" />
              <StatCard label="Pending Requests" value="—" icon="📋" accent="#6366f1" sub="Connect backend" />
              <StatCard label="Open Complaints" value="—" icon="📢" accent="#ef4444" sub="Connect backend" />
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
                    { label: "Add User", desc: "Create new account", icon: "➕" },
                    { label: "View Reports", desc: "System analytics", icon: "📊" },
                    { label: "Manage Roles", desc: "Assign permissions", icon: "🔑" },
                    { label: "Announcements", desc: "Post campus-wide", icon: "📣" },
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

        {/* USERS */}
        {activeTab === "users" && (
          <section>
            <div style={styles.tableHeader}>
              <h2 style={styles.sectionTitle}>User Management</h2>
              <div style={styles.filterRow}>
                {["all", "student", "faculty", "staff", "admin"].map((r) => (
                  <button
                    key={r}
                    style={roleFilter === r ? { ...styles.filterBtn, ...styles.filterBtnActive } : styles.filterBtn}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.table}>
              <div style={styles.tableRow}>
                <span style={styles.thCell}>Name</span>
                <span style={styles.thCell}>Email</span>
                <span style={styles.thCell}>Role</span>
                <span style={styles.thCell}>Department</span>
                <span style={styles.thCell}>Status</span>
              </div>
              {filteredUsers.map((u) => (
                <div key={u.id} style={styles.tableRow}>
                  <span style={styles.tdName}>{u.name}</span>
                  <span style={styles.tdCell}>{u.email}</span>
                  <span style={{ ...styles.rolePill, color: ROLE_COLORS[u.role] || "#818cf8", borderColor: `${ROLE_COLORS[u.role]}44` || "#818cf844" }}>
                    {u.role.replace("_", " ")}
                  </span>
                  <span style={styles.tdCell}>{u.department}</span>
                  <span style={styles.tdActive}>● active</span>
                </div>
              ))}
            </div>
            <p style={styles.apiNote}>→ Will load from <code style={styles.code}>GET /auth/users</code> once backend is ready.</p>
          </section>
        )}

        {/* DEPARTMENTS */}
        {activeTab === "departments" && (
          <section>
            <h2 style={styles.sectionTitle}>Departments</h2>
            <div style={styles.deptGrid}>
              {MOCK_DEPARTMENTS.map((d) => (
                <div key={d.id} style={styles.deptCard}>
                  <h3 style={styles.deptName}>{d.name}</h3>
                  <p style={styles.deptHead}>Head: {d.head}</p>
                  <div style={styles.deptStats}>
                    <div style={styles.deptStat}>
                      <span style={styles.deptStatVal}>{d.students}</span>
                      <span style={styles.deptStatLabel}>Students</span>
                    </div>
                    <div style={styles.deptDivider} />
                    <div style={styles.deptStat}>
                      <span style={styles.deptStatVal}>{d.staff}</span>
                      <span style={styles.deptStatLabel}>Faculty</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REPORTS */}
        {activeTab === "reports" && (
          <section>
            <h2 style={styles.sectionTitle}>System Reports</h2>
            <div style={styles.reportsPlaceholder}>
              <p style={styles.reportIcon}>📊</p>
              <p style={styles.reportText}>Reports will be available once Ali's database schema and Usman's reporting endpoints are live.</p>
              <p style={styles.apiNote}>→ <code style={styles.code}>GET /reporting/summary</code></p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting: { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  name: { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  adminBadge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 2,
    color: "#fbbf24",
  },
  adminIcon: { fontSize: 18 },
  adminText: { fontSize: 13, fontFamily: "monospace", letterSpacing: "0.05em" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(245,158,11,0.1)", paddingBottom: 0 },
  tab: {
    background: "transparent",
    border: "none",
    padding: "10px 20px",
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.03em",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
  },
  tabActive: { color: "#fbbf24", borderBottomColor: "#f59e0b" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 },
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  breakdownList: { display: "flex", flexDirection: "column", gap: 0 },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 0",
    borderBottom: "1px solid rgba(245,158,11,0.06)",
  },
  roleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  roleName: { flex: 1, fontSize: 13, color: "#94a3b8", textTransform: "capitalize" },
  roleCount: { fontSize: 16, color: "#e2e8f0", fontFamily: "'Georgia', serif" },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionCard: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "14px 16px",
    border: "1px solid rgba(245,158,11,0.1)",
    borderRadius: 2,
    background: "rgba(245,158,11,0.02)",
    cursor: "pointer",
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { margin: "0 0 2px", fontSize: 13, color: "#e2e8f0" },
  actionDesc: { margin: 0, fontSize: 11, color: "#475569" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  filterRow: { display: "flex", gap: 6 },
  filterBtn: {
    background: "transparent",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: 2,
    padding: "4px 12px",
    fontSize: 11,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "monospace",
    textTransform: "capitalize",
  },
  filterBtnActive: { background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.3)" },
  table: { border: "1px solid rgba(245,158,11,0.1)", borderRadius: 2, overflow: "hidden" },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1fr",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(245,158,11,0.06)",
    alignItems: "center",
  },
  thCell: { fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
  tdName: { fontSize: 13, color: "#e2e8f0" },
  tdCell: { fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  rolePill: {
    fontSize: 10,
    padding: "3px 10px",
    border: "1px solid",
    borderRadius: 2,
    textTransform: "capitalize",
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    display: "inline-block",
    width: "fit-content",
  },
  tdActive: { fontSize: 11, color: "#10b981", fontFamily: "monospace" },
  apiNote: { marginTop: 16, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code: { color: "#818cf8" },
  deptGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  deptCard: {
    padding: "24px",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: 2,
    background: "rgba(245,158,11,0.02)",
  },
  deptName: { margin: "0 0 6px", fontSize: 16, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  deptHead: { margin: "0 0 20px", fontSize: 12, color: "#64748b" },
  deptStats: { display: "flex", gap: 16, alignItems: "center" },
  deptStat: { textAlign: "center" },
  deptStatVal: { display: "block", fontSize: 24, color: "#fbbf24", fontFamily: "'Georgia', serif" },
  deptStatLabel: { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 },
  deptDivider: { width: 1, height: 30, background: "rgba(245,158,11,0.15)" },
  reportsPlaceholder: {
    border: "1px dashed rgba(245,158,11,0.15)",
    borderRadius: 2,
    padding: "64px 32px",
    textAlign: "center",
  },
  reportIcon: { fontSize: 40, margin: "0 0 16px" },
  reportText: { margin: "0 0 8px", color: "#475569", fontSize: 14, fontFamily: "'Georgia', serif" },
};

// ─────────────────────────────────────────────────────────────
//  AdminComplaints — FR-11, FR-12, FR-13
//  Admin only: view all complaints, filter, manage
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { complaintsAPI } from "../services/api";

const MOCK_MODE = true;

const MOCK_ALL_COMPLAINTS = [
  { id: 1, submitted_by: "Abdul Qadir",   title: "Wi-Fi in Lab 3 not working",      category: "Internet Issue",  priority: "High",   status: "In Progress", support_unit: "IT Support",              created_at: "2025-03-10T09:00:00" },
  { id: 2, submitted_by: "Ali Mobeen",    title: "Hostel hot water broken",          category: "Hostel Issue",    priority: "High",   status: "Pending",     support_unit: "Hostel Management",       created_at: "2025-03-09T14:00:00" },
  { id: 3, submitted_by: "Usman Ahmed",   title: "Fee receipt not generated",        category: "Fee Issue",       priority: "Medium", status: "Pending",     support_unit: "Accounts",                created_at: "2025-03-08T10:00:00" },
  { id: 4, submitted_by: "Sara Khan",     title: "Library books missing",            category: "Library Issue",   priority: "Low",    status: "Resolved",    support_unit: "Administration",          created_at: "2025-03-05T11:30:00" },
  { id: 5, submitted_by: "Ahmed Raza",    title: "Bus not running on time",          category: "Transport Issue", priority: "Medium", status: "Pending",     support_unit: null,                      created_at: "2025-03-11T08:00:00" },
  { id: 6, submitted_by: "Fatima Noor",  title: "Projector damaged in room 201",    category: "Hardware Issue",  priority: "Medium", status: "In Progress", support_unit: "IT Support",              created_at: "2025-03-07T13:00:00" },
];

const CATEGORIES = ["", "Internet Issue", "Hardware Issue", "Software Issue", "Hostel Issue", "Fee Issue", "Academic Issue", "Library Issue", "Transport Issue", "Other"];
const PRIORITIES = ["", "Low", "Medium", "High"];
const STATUSES   = ["", "Pending", "In Progress", "Resolved"];

const STATUS_COLORS   = { Pending: "#f59e0b", "In Progress": "#6366f1", Resolved: "#10b981" };
const PRIORITY_COLORS = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };

export default function AdminComplaints() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("all");   // all | unassigned
  const [filters,    setFilters]    = useState({ category: "", priority: "", status: "" });

  useEffect(() => {
    const load = async () => {
      if (MOCK_MODE) {
        setComplaints(MOCK_ALL_COMPLAINTS);
        setLoading(false);
        return;
      }
      try {
        const params = { role: user?.role, user_id: user?.id, ...filters };
        const res = await complaintsAPI.getAll(params);
        setComplaints(res.data);
      } catch {
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, filters]);

  const resetFilters = () => setFilters({ category: "", priority: "", status: "" });

  const displayed = complaints.filter((c) => {
    if (activeTab === "unassigned" && c.support_unit) return false;
    if (filters.category && c.category !== filters.category) return false;
    if (filters.priority && c.priority !== filters.priority) return false;
    if (filters.status   && c.status   !== filters.status)   return false;
    return true;
  });

  const unassignedCount = complaints.filter((c) => !c.support_unit).length;

  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header}>
          <p style={styles.frLabel}>FR-11 · FR-12 · FR-13</p>
          <h1 style={styles.title}>All Complaints</h1>
          <p style={styles.subtitle}>Review, categorize, assign, and resolve complaints across the university</p>
        </header>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Total",       count: complaints.length,                                      color: "#818cf8" },
            { label: "Pending",     count: complaints.filter((c) => c.status === "Pending").length, color: "#f59e0b" },
            { label: "In Progress", count: complaints.filter((c) => c.status === "In Progress").length, color: "#6366f1" },
            { label: "Resolved",    count: complaints.filter((c) => c.status === "Resolved").length, color: "#10b981" },
            { label: "Unassigned",  count: unassignedCount,                                        color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={styles.stat}>
              <p style={{ ...styles.statCount, color: s.color }}>{s.count}</p>
              <p style={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {[
            { id: "all",        label: `All (${complaints.length})` },
            { id: "unassigned", label: `Unassigned (${unassignedCount})` },
          ].map((t) => (
            <button
              key={t.id}
              style={activeTab === t.id ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={styles.filterBar}>
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} style={styles.filterSelect}>
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} style={styles.filterSelect}>
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} style={styles.filterSelect}>
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={resetFilters} style={styles.resetBtn}>Reset</button>
        </div>

        {/* Table */}
        {loading ? (
          <p style={styles.loadingText}>Loading complaints...</p>
        ) : displayed.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>No complaints match your filters.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["ID", "Title", "Submitted By", "Category", "Priority", "Status", "Support Unit", "Date", ""].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}><span style={styles.idCell}>#{String(c.id).padStart(4, "0")}</span></td>
                    <td style={{ ...styles.td, maxWidth: 220 }}><span style={styles.titleCell}>{c.title}</span></td>
                    <td style={styles.td}>{c.submitted_by || "—"}</td>
                    <td style={styles.td}>{c.category}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: PRIORITY_COLORS[c.priority] || "#64748b", borderColor: `${PRIORITY_COLORS[c.priority] || "#64748b"}33` }}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: STATUS_COLORS[c.status] || "#64748b", borderColor: `${STATUS_COLORS[c.status] || "#64748b"}33` }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {c.support_unit
                        ? <span style={styles.unitCell}>{c.support_unit}</span>
                        : <span style={styles.unassigned}>Unassigned</span>}
                    </td>
                    <td style={styles.td}><span style={styles.dateCell}>{formatDate(c.created_at)}</span></td>
                    <td style={styles.td}>
                      <button style={styles.viewBtn} onClick={() => navigate(`/complaints/${c.id}`)}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page:         { minHeight: "100vh", background: "#0a0a0f" },
  main:         { maxWidth: 1400, margin: "0 auto", padding: "48px 32px" },
  header:       { marginBottom: 32 },
  frLabel:      { margin: "0 0 4px", fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  title:        { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle:     { margin: 0, fontSize: 14, color: "#64748b" },
  statsRow:     { display: "flex", gap: 16, marginBottom: 28 },
  stat:         { flex: 1, padding: "16px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, background: "rgba(15,15,25,0.6)", textAlign: "center" },
  statCount:    { margin: "0 0 2px", fontSize: 28, fontFamily: "monospace" },
  statLabel:    { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  tabBar:       { display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tab:          { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive:    { color: "#818cf8", borderBottomColor: "#6366f1" },
  filterBar:    { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  filterSelect: { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "8px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  resetBtn:     { background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "8px 14px", color: "#6366f1", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  loadingText:  { color: "#475569", fontFamily: "monospace", fontSize: 13 },
  emptyState:   { textAlign: "center", padding: "64px 32px", border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2 },
  emptyIcon:    { fontSize: 40, margin: "0 0 12px" },
  emptyText:    { margin: 0, color: "#475569", fontSize: 14, fontFamily: "'Georgia', serif" },
  tableWrap:    { overflowX: "auto" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:           { padding: "10px 14px", textAlign: "left", fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tr:           { borderBottom: "1px solid rgba(99,102,241,0.06)" },
  td:           { padding: "14px 14px", color: "#94a3b8", verticalAlign: "middle" },
  idCell:       { color: "#6366f1", fontFamily: "monospace", fontSize: 11 },
  titleCell:    { color: "#e2e8f0", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 },
  badge:        { fontSize: 10, padding: "2px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  unitCell:     { color: "#64748b", fontSize: 12 },
  unassigned:   { color: "#ef4444", fontSize: 11, fontFamily: "monospace" },
  dateCell:     { color: "#475569", fontSize: 11, fontFamily: "monospace" },
  viewBtn:      { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "5px 12px", color: "#818cf8", fontSize: 11, cursor: "pointer", fontFamily: "monospace" },
};

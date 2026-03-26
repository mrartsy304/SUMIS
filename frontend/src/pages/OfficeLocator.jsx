import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import DepartmentCard from "../components/DepartmentCard";
import { useAuth } from "../context/AuthContext";
import { staffAPI, departmentAPI } from "../services/api";

// ── Mock data — used as fallback when backend is not running ──
// Remove MOCK_MODE = true once backend is live
const MOCK_MODE = true;

const MOCK_STAFF = [
  { id: 2,  name: "Dr. Imran Ahmed",  email: "imran@sumis.edu",  role: "faculty",           department: "Computer Science",      office_location: "Block A, Room 101", specialization: "Software Engineering" },
  { id: 5,  name: "Dr. Farah Naz",    email: "farah@sumis.edu",  role: "faculty",           department: "Business Administration",office_location: "Block B, Room 205", specialization: "Marketing" },
  { id: 6,  name: "Dr. Tariq Malik",  email: "tariq@sumis.edu",  role: "faculty",           department: "Electrical Engineering", office_location: "Block C, Room 302", specialization: "Power Systems" },
  { id: 7,  name: "Hassan Raza",      email: "hassan@sumis.edu", role: "staff",             department: "Administration",         office_location: "Main Block, Room 10",specialization: "Student Affairs" },
  { id: 8,  name: "Sara Qureshi",     email: "sara@sumis.edu",   role: "staff",             department: "Registrar",              office_location: "Main Block, Room 15",specialization: "Admissions" },
  { id: 9,  name: "Ahmed Khan",       email: "ahmed@sumis.edu",  role: "event_coordinator", department: "Student Affairs",        office_location: "Student Center, Room 3", specialization: "Events & Activities" },
];

const ROLE_COLORS = {
  faculty:           "#0ea5e9",
  staff:             "#10b981",
  event_coordinator: "#ec4899",
  admin:             "#f59e0b",
};

const ROLE_LABELS = {
  faculty:           "Faculty",
  staff:             "Staff",
  event_coordinator: "Event Coordinator",
  admin:             "Admin",
};

export default function OfficeLocator() {
  const { user } = useAuth();

  const [staffList,      setStaffList]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [roleFilter,     setRoleFilter]     = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [deptDetail,     setDeptDetail]     = useState(null);  // Ali's DepartmentCard data

  // ── Load all staff on mount ──
  useEffect(() => {
    const loadStaff = async () => {
      if (MOCK_MODE) {
        setStaffList(MOCK_STAFF);
        setLoading(false);
        return;
      }
      try {
        const res = await staffAPI.getAll();
        setStaffList(res.data.staff || []);
      } catch (err) {
        console.error("Failed to load staff:", err);
        setStaffList(MOCK_STAFF); // fallback to mock on error
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  // ── Live search as user types ──
  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (MOCK_MODE) return; // mock filtering handled below

    if (q.trim() === "" && roleFilter === "all") {
      // Reset to full list
      try {
        const res = await staffAPI.getAll();
        setStaffList(res.data.staff || []);
      } catch { /* ignore */ }
      return;
    }

    try {
      const res = await staffAPI.search(q, roleFilter === "all" ? "" : roleFilter);
      setStaffList(res.data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, [roleFilter]);

  // ── When a staff member is selected, fetch their department via Ali's API ──
  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setDeptDetail(null);

    if (MOCK_MODE) return; // department shown from mock data directly

    // Once User has department_id, fetch the full DepartmentCard data from Ali's API
    if (member.department_id) {
      try {
        const res = await departmentAPI.getById(member.department_id);
        setDeptDetail(res.data);
      } catch {
        setDeptDetail(null);
      }
    }
  };

  // ── Client-side filter for mock mode ──
  const displayed = MOCK_MODE
    ? staffList.filter((m) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          q === "" ||
          m.name.toLowerCase().includes(q) ||
          m.department?.toLowerCase().includes(q) ||
          m.specialization?.toLowerCase().includes(q);
        const matchesRole = roleFilter === "all" || m.role === roleFilter;
        return matchesQuery && matchesRole;
      })
    : staffList;

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* Header */}
        <header style={styles.header}>
          <p style={styles.frLabel}>FR-03</p>
          <h1 style={styles.title}>Faculty & Staff Office Locator</h1>
          <p style={styles.subtitle}>Search for faculty and staff members and find their office locations</p>
        </header>

        {/* Search + Filter */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.searchInput}
              placeholder="Search by name, department or specialization..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => handleSearch("")}>✕</button>
            )}
          </div>

          <div style={styles.pills}>
            {["all", "faculty", "staff", "event_coordinator"].map((r) => (
              <button
                key={r}
                style={roleFilter === r
                  ? { ...styles.pill, ...styles.pillActive,
                      borderColor: r === "all" ? "#6366f1" : ROLE_COLORS[r],
                      color:       r === "all" ? "#818cf8" : ROLE_COLORS[r],
                      background:  r === "all" ? "rgba(99,102,241,0.1)" : `${ROLE_COLORS[r]}18`,
                    }
                  : styles.pill
                }
                onClick={() => setRoleFilter(r)}
              >
                {r === "all" ? "All" : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <p style={styles.resultCount}>
          {loading ? "Loading..." : `${displayed.length} ${displayed.length === 1 ? "result" : "results"}${searchQuery ? ` for "${searchQuery}"` : ""}`}
        </p>

        {/* Main layout */}
        <div style={styles.layout}>

          {/* Staff list */}
          <div style={styles.listPanel}>
            {loading ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Loading staff...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyIcon}>⌕</p>
                <p style={styles.emptyText}>No staff found matching your search.</p>
              </div>
            ) : (
              displayed.map((member) => (
                <div
                  key={member.id}
                  style={selectedMember?.id === member.id
                    ? { ...styles.staffCard, ...styles.staffCardActive }
                    : styles.staffCard
                  }
                  onClick={() => handleSelectMember(member)}
                >
                  <div style={{ ...styles.avatar, background: `${ROLE_COLORS[member.role]}22`, color: ROLE_COLORS[member.role] }}>
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardTop}>
                      <p style={styles.cardName}>{member.name}</p>
                      <span style={{ ...styles.roleBadge, color: ROLE_COLORS[member.role], borderColor: `${ROLE_COLORS[member.role]}44` }}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    <p style={styles.cardDept}>{member.department || "Department TBA"}</p>
                    <p style={styles.cardLocation}>📍 {member.office_location || "Office TBA"}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail panel */}
          <div style={styles.detailPanel}>
            {selectedMember ? (
              <div style={styles.detailCard}>
                {/* Staff info */}
                <div style={styles.detailHeader}>
                  <div style={{ ...styles.detailAvatar, background: `${ROLE_COLORS[selectedMember.role]}22`, color: ROLE_COLORS[selectedMember.role] }}>
                    {selectedMember.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 style={styles.detailName}>{selectedMember.name}</h2>
                    <span style={{ ...styles.roleBadge, color: ROLE_COLORS[selectedMember.role], borderColor: `${ROLE_COLORS[selectedMember.role]}44` }}>
                      {ROLE_LABELS[selectedMember.role]}
                    </span>
                  </div>
                </div>

                <div style={styles.divider} />

                <DetailRow icon="✉️" label="Email"          value={selectedMember.email} />
                <DetailRow icon="📍" label="Office"         value={selectedMember.office_location || "TBA"} />
                {selectedMember.specialization && (
                  <DetailRow icon="🎓" label="Specialization" value={selectedMember.specialization} />
                )}

                <div style={styles.divider} />

                {/* Department info — uses Ali's DepartmentCard component */}
                <p style={styles.deptSectionLabel}>Department</p>
                {deptDetail ? (
                  // Real data from Ali's GET /departments/<id>
                  <DepartmentCard department={deptDetail} />
                ) : (
                  // Mock department display until department_id FK added to User
                  <div style={styles.deptMock}>
                    <p style={styles.deptMockName}>{selectedMember.department || "Not assigned"}</p>
                    {selectedMember.office_location && (
                      <p style={styles.deptMockLocation}>📍 {selectedMember.office_location}</p>
                    )}
                    <p style={styles.deptMockNote}>
                      Full department details will appear here once User model gets{" "}
                      <code style={styles.code}>department_id</code> FK.
                    </p>
                  </div>
                )}

                <p style={styles.apiNote}>
                  → <code style={styles.code}>GET /staff/{selectedMember.id}</code>
                </p>
              </div>
            ) : (
              <div style={styles.detailEmpty}>
                <p style={styles.emptyIcon}>👤</p>
                <p style={styles.emptyText}>Select a staff member to view their office details</p>
              </div>
            )}
          </div>
        </div>

        <p style={styles.apiNote}>
          → <code style={styles.code}>GET /staff/search?q={"<query>"}&role={"<role>"}</code>
        </p>
      </main>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.icon}>{icon}</span>
      <div>
        <p style={rowStyles.label}>{label}</p>
        <p style={rowStyles.value}>{value}</p>
      </div>
    </div>
  );
}

const rowStyles = {
  row:   { display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(99,102,241,0.06)" },
  icon:  { fontSize: 16, width: 24, flexShrink: 0, marginTop: 2 },
  label: { margin: "0 0 2px", fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" },
  value: { margin: 0, fontSize: 14, color: "#e2e8f0" },
};

const styles = {
  page:         { minHeight: "100vh", background: "#0a0a0f" },
  main:         { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header:       { marginBottom: 36 },
  frLabel:      { margin: "0 0 4px", fontSize: 10, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" },
  title:        { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle:     { margin: 0, fontSize: 14, color: "#64748b" },

  searchBar:    { display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" },
  searchWrap:   { flex: 1, minWidth: 280, position: "relative", display: "flex", alignItems: "center" },
  searchIcon:   { position: "absolute", left: 14, fontSize: 18, color: "#475569" },
  searchInput:  { width: "100%", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "11px 40px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  clearBtn:     { position: "absolute", right: 12, background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 12 },
  pills:        { display: "flex", gap: 8 },
  pill:         { background: "transparent", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em" },
  pillActive:   {},

  resultCount:  { margin: "0 0 20px", fontSize: 12, color: "#475569", fontFamily: "monospace" },
  layout:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },

  listPanel:    { display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto", paddingRight: 4 },
  staffCard:    { display: "flex", gap: 14, padding: "16px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, background: "rgba(15,15,25,0.6)", cursor: "pointer" },
  staffCardActive: { border: "1px solid rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.06)" },
  avatar:       { width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontFamily: "'Georgia', serif", flexShrink: 0 },
  cardInfo:     { flex: 1, minWidth: 0 },
  cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardName:     { margin: 0, fontSize: 14, color: "#e2e8f0" },
  cardDept:     { margin: "0 0 3px", fontSize: 12, color: "#64748b" },
  cardLocation: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  roleBadge:    { fontSize: 10, padding: "2px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", flexShrink: 0 },

  detailPanel:  { position: "sticky", top: 80 },
  detailCard:   { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2, padding: "28px" },
  detailHeader: { display: "flex", gap: 16, alignItems: "center", marginBottom: 20 },
  detailAvatar: { width: 56, height: 56, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontFamily: "'Georgia', serif", flexShrink: 0 },
  detailName:   { margin: "0 0 6px", fontSize: 20, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  divider:      { height: 1, background: "rgba(99,102,241,0.1)", margin: "16px 0" },

  deptSectionLabel: { margin: "0 0 10px", fontSize: 10, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
  deptMock:     { background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 2, padding: "16px" },
  deptMockName: { margin: "0 0 4px", fontSize: 16, color: "#e2e8f0", fontFamily: "'Georgia', serif" },
  deptMockLocation: { margin: "0 0 10px", fontSize: 13, color: "#64748b" },
  deptMockNote: { margin: 0, fontSize: 11, color: "#334155", fontFamily: "monospace" },

  detailEmpty:  { border: "1px dashed rgba(99,102,241,0.15)", borderRadius: 2, padding: "64px 32px", textAlign: "center" },
  emptyState:   { textAlign: "center", padding: "48px 0" },
  emptyIcon:    { fontSize: 32, margin: "0 0 12px" },
  emptyText:    { margin: 0, color: "#475569", fontSize: 14 },
  apiNote:      { marginTop: 16, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code:         { color: "#818cf8" },
};

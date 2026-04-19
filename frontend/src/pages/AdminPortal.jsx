import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import DepartmentCard from "../components/DepartmentCard";
import { useAuth } from "../context/AuthContext";
import { departmentAPI } from "../services/api";
import { fetchProcedures, createProcedure, deleteProcedure } from "../services/proceduresService";

const MOCK_USERS = [
  { id: 1, name: "Abdul Qadir",  email: "qadir@sumis.edu",  role: "student",           created_at: "2025-01-10" },
  { id: 2, name: "Dr. Imran",    email: "imran@sumis.edu",  role: "faculty",           created_at: "2025-01-05" },
  { id: 3, name: "Staff Member", email: "staff@sumis.edu",  role: "staff",             created_at: "2025-01-08" },
  { id: 4, name: "Event Coord",  email: "events@sumis.edu", role: "event_coordinator", created_at: "2025-01-12" },
];

const ROLE_COLORS = {
  student: "#6366f1", faculty: "#0ea5e9", staff: "#10b981",
  admin: "#f59e0b", event_coordinator: "#ec4899",
};

const VALID_CATEGORIES = [
  { value: "academic",     label: "Academic"     },
  { value: "financial",    label: "Financial"    },
  { value: "registration", label: "Registration" },
  { value: "it_services",  label: "IT Services"  },
  { value: "facilities",   label: "Facilities"   },
  { value: "general",      label: "General"      },
];

const EMPTY_FORM = {
  title: "", message: "", category: "academic",
  estimated_duration: "",
  steps: [{ step_number: 1, title: "", description: "", note: "" }],
};

export default function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState("overview");
  const [users]                     = useState(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState("all");

  // Departments
  const [departments, setDepartments] = useState([]);
  const [deptSearch,  setDeptSearch]  = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError,   setDeptError]   = useState("");

  // Procedures
  const [procedures,   setProcedures]   = useState([]);
  const [procLoading,  setProcLoading]  = useState(false);
  const [procError,    setProcError]    = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");

  // ── Fetch departments ────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async (query = "") => {
    try {
      setDeptLoading(true); setDeptError("");
      const res = query ? await departmentAPI.search(query) : await departmentAPI.getAll();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDeptError(err.response?.status ? `HTTP ${err.response.status}` : "Cannot reach server.");
      setDepartments([]);
    } finally { setDeptLoading(false); }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { if (activeTab === "departments") fetchDepartments(deptSearch.trim()); }, [activeTab]);

  // ── Fetch procedures ──────────────────────────────────────────────────────
  const loadProcedures = useCallback(async () => {
    try {
      setProcLoading(true); setProcError("");
      const result = await fetchProcedures();
      setProcedures(result.procedures || []);
    } catch {
      setProcError("Failed to load procedures.");
    } finally { setProcLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "procedures") loadProcedures(); }, [activeTab, loadProcedures]);

  // ── Step helpers ──────────────────────────────────────────────────────────
  const addStep = () => {
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { step_number: f.steps.length + 1, title: "", description: "", note: "" }],
    }));
  };

  const removeStep = (idx) => {
    setForm((f) => ({
      ...f,
      steps: f.steps
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, step_number: i + 1 })),
    }));
  };

  const updateStep = (idx, field, value) => {
    setForm((f) => {
      const steps = [...f.steps];
      steps[idx] = { ...steps[idx], [field]: value };
      return { ...f, steps };
    });
  };

  // ── Submit new procedure ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = {};
    if (!form.title.trim())   errors.title   = "Title is required.";
    if (!form.message.trim()) errors.message = "Overview is required.";
    if (!form.category)       errors.category = "Category is required.";
    if (form.steps.some((s) => !s.title.trim() || !s.description.trim()))
      errors.steps = "All steps must have a title and description.";

    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSubmitting(true); setFormErrors({});
    try {
      await createProcedure({
        title:              form.title.trim(),
        message:            form.message.trim(),
        category:           form.category,
        estimated_duration: form.estimated_duration.trim() || null,
        steps:              form.steps.map((s) => ({
          step_number:  s.step_number,
          title:        s.title.trim(),
          description:  s.description.trim(),
          note:         s.note.trim() || null,
        })),
      });
      setSuccessMsg("✅ Procedure created successfully!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadProcedures();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to create procedure." });
    } finally { setSubmitting(false); }
  };

  // ── Delete procedure ──────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteProcedure(id);
      loadProcedures();
    } catch {
      alert("Failed to delete procedure.");
    }
  };

  const tabs = [
    { id: "overview",    label: "Overview"    },
    { id: "users",       label: "Users"       },
    { id: "departments", label: "Departments" },
    { id: "procedures",  label: "📋 Procedures" },
    { id: "reports",     label: "Reports"     },
  ];

  const filteredUsers = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div style={s.page}>
      <Navbar />
      <main style={s.main}>

        {/* Header */}
        <header style={s.header}>
          <div>
            <p style={s.greeting}>Admin Portal</p>
            <h1 style={s.title}>{user?.name}</h1>
          </div>
          <div style={s.adminBadge}>
            <span>⬡</span>
            <span style={s.adminText}>System Administrator</span>
          </div>
        </header>

        {/* Tab Bar */}
        <div style={s.tabBar}>
          {tabs.map((t) => (
            <button key={t.id}
              style={activeTab === t.id ? { ...s.tab, ...s.tabActive } : t.id === "procedures" ? { ...s.tab, color: "#818cf8" } : s.tab}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <section>
            <div style={s.statsGrid}>
              <StatCard label="Total Users"      value={users.length}                           icon="👥" accent="#f59e0b" />
              <StatCard label="Departments"      value={deptLoading ? "…" : departments.length} icon="🏛️" accent="#0ea5e9" />
              <StatCard label="Pending Requests" value="—" icon="📋" accent="#6366f1" sub="Connect backend" />
              <StatCard label="Open Complaints"  value="—" icon="📢" accent="#ef4444" sub="Connect backend" />
            </div>
            <div style={s.twoCol}>
              <div>
                <h2 style={s.sectionTitle}>User Breakdown</h2>
                <div style={s.breakdownList}>
                  {["student","faculty","staff","admin","event_coordinator"].map((role) => (
                    <div key={role} style={s.breakdownRow}>
                      <span style={{ ...s.roleDot, background: ROLE_COLORS[role] || "#475569" }} />
                      <span style={s.roleName}>{role.replace("_"," ")}</span>
                      <span style={s.roleCount}>{users.filter((u)=>u.role===role).length}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 style={s.sectionTitle}>Quick Actions</h2>
                <div style={s.actionGrid}>
                  {[
                    { label:"Add User",      desc:"Create new account",  icon:"➕" },
                    { label:"View Reports",  desc:"System analytics",    icon:"📊" },
                    { label:"Manage Roles",  desc:"Assign permissions",  icon:"🔑" },
                    { label:"Announcements", desc:"Post campus-wide",    icon:"📣" },
                  ].map((a) => (
                    <div key={a.label} style={s.actionCard}>
                      <span style={s.actionIcon}>{a.icon}</span>
                      <div><p style={s.actionLabel}>{a.label}</p><p style={s.actionDesc}>{a.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ USERS ═════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <section>
            <div style={s.tableHeader}>
              <h2 style={s.sectionTitle}>User Management</h2>
              <div style={s.filterRow}>
                {["all","student","faculty","staff","admin"].map((r) => (
                  <button key={r}
                    style={roleFilter===r ? { ...s.filterBtn, ...s.filterBtnActive } : s.filterBtn}
                    onClick={() => setRoleFilter(r)}>{r}</button>
                ))}
              </div>
            </div>
            <div style={s.table}>
              <div style={s.tableHeadRow}><span style={s.thCell}>Name</span><span style={s.thCell}>Email</span><span style={s.thCell}>Role</span><span style={s.thCell}>Created At</span></div>
              {filteredUsers.map((u) => (
                <div key={u.id} style={s.tableRow}>
                  <span style={s.tdName}>{u.name}</span>
                  <span style={s.tdCell}>{u.email}</span>
                  <span style={{ ...s.rolePill, color: ROLE_COLORS[u.role]||"#818cf8", borderColor: `${ROLE_COLORS[u.role]}33` }}>{u.role.replace("_"," ")}</span>
                  <span style={s.tdCell}>{u.created_at}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ DEPARTMENTS ═══════════════════════════════════════════════════ */}
        {activeTab === "departments" && (
          <section>
            <h2 style={s.sectionTitle}>Departments</h2>
            <div style={s.searchRow}>
              <input type="text" placeholder="Search departments…" value={deptSearch}
                onChange={(e)=>setDeptSearch(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==="Enter") fetchDepartments(deptSearch.trim()); }}
                style={s.searchInput} />
              <button style={s.searchBtn} onClick={()=>fetchDepartments(deptSearch.trim())} disabled={deptLoading}>{deptLoading?"Searching…":"Search"}</button>
              <button style={s.resetBtn} onClick={()=>{ setDeptSearch(""); fetchDepartments(""); }}>Reset</button>
            </div>
            {deptError && <p style={s.errorText}>{deptError}</p>}
            {deptLoading && <p style={s.statusText}>Loading…</p>}
            {!deptLoading && departments.length === 0 && !deptError && <p style={s.statusText}>No departments found.</p>}
            <div style={s.deptGrid}>{departments.map((d) => <DepartmentCard key={d.id} department={d} />)}</div>
          </section>
        )}

        {/* ══ PROCEDURES (FR-04) ════════════════════════════════════════════ */}
        {activeTab === "procedures" && (
          <section>
            {/* Header */}
            <div style={s.procHeader}>
              <div>
                <h2 style={s.sectionTitle}>Procedure Management</h2>
                <p style={{ margin: "-8px 0 0", fontSize: 13, color: "#475569" }}>
                  Add, view, and delete administrative procedures shown to students.
                </p>
              </div>
              <button style={s.addBtn} onClick={() => { setShowForm(!showForm); setFormErrors({}); }}>
                {showForm ? "✕ Cancel" : "+ Add Procedure"}
              </button>
            </div>

            {successMsg && <div style={s.successBox}>{successMsg}</div>}
            {procError   && <div style={s.errorBox}>⚠ {procError} <button style={s.retryBtn} onClick={loadProcedures}>Retry</button></div>}

            {/* ── Add Procedure Form ──────────────────────────────────────── */}
            {showForm && (
              <div style={s.formCard}>
                <h3 style={s.formHeading}>New Administrative Procedure</h3>

                {/* Title */}
                <div style={s.field}>
                  <label style={s.label}>Title *</label>
                  <input style={formErrors.title ? { ...s.input, borderColor: "#ef4444" } : s.input}
                    value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Transcript Request" />
                  {formErrors.title && <p style={s.fieldError}>{formErrors.title}</p>}
                </div>

                {/* Category + Duration row */}
                <div style={s.twoColForm}>
                  <div style={s.field}>
                    <label style={s.label}>Category *</label>
                    <select style={s.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                      {VALID_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {formErrors.category && <p style={s.fieldError}>{formErrors.category}</p>}
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Estimated Duration</label>
                    <input style={s.input} value={form.estimated_duration}
                      onChange={(e) => setForm((f) => ({ ...f, estimated_duration: e.target.value }))}
                      placeholder="e.g. 3–5 working days" />
                  </div>
                </div>

                {/* Overview/Message */}
                <div style={s.field}>
                  <label style={s.label}>Overview / Description *</label>
                  <textarea style={formErrors.message ? { ...s.textarea, borderColor: "#ef4444" } : s.textarea}
                    value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Brief description of this procedure…" rows={3} />
                  {formErrors.message && <p style={s.fieldError}>{formErrors.message}</p>}
                </div>

                {/* Steps */}
                <div style={s.field}>
                  <div style={s.stepsLabelRow}>
                    <label style={s.label}>Steps *</label>
                    <button style={s.addStepBtn} onClick={addStep}>+ Add Step</button>
                  </div>
                  {formErrors.steps && <p style={s.fieldError}>{formErrors.steps}</p>}
                  {form.steps.map((step, idx) => (
                    <div key={idx} style={s.stepRow}>
                      <div style={s.stepBadge}>{step.step_number}</div>
                      <div style={s.stepFields}>
                        <input style={s.stepInput} placeholder="Step title *"
                          value={step.title} onChange={(e) => updateStep(idx, "title", e.target.value)} />
                        <input style={s.stepInput} placeholder="Step description *"
                          value={step.description} onChange={(e) => updateStep(idx, "description", e.target.value)} />
                        <input style={{ ...s.stepInput, fontSize: 11, color: "#64748b" }} placeholder="Optional note (tip)"
                          value={step.note} onChange={(e) => updateStep(idx, "note", e.target.value)} />
                      </div>
                      {form.steps.length > 1 && (
                        <button style={s.removeStepBtn} onClick={() => removeStep(idx)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submit */}
                {formErrors.submit && <p style={s.fieldError}>{formErrors.submit}</p>}
                <button style={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Creating…" : "Create Procedure"}
                </button>
              </div>
            )}

            {/* ── Procedures List ─────────────────────────────────────────── */}
            {procLoading && <p style={s.statusText}>Loading procedures…</p>}
            {!procLoading && procedures.length === 0 && !procError && (
              <p style={s.statusText}>No procedures yet. Click "+ Add Procedure" to create one.</p>
            )}
            <div style={s.procList}>
              {procedures.map((proc) => (
                <div key={proc.id} style={s.procRow}>
                  <div style={s.procRowLeft}>
                    <span style={{ ...s.catDot, background: proc.category === "academic" ? "#6366f1" : proc.category === "financial" ? "#10b981" : proc.category === "registration" ? "#8b5cf6" : proc.category === "it_services" ? "#0ea5e9" : "#f59e0b" }} />
                    <div>
                      <p style={s.procRowTitle}>{proc.title}</p>
                      <p style={s.procRowMeta}>{proc.category} {proc.estimated_duration ? `· ⏱ ${proc.estimated_duration}` : ""}</p>
                    </div>
                  </div>
                  <button style={s.deleteBtn} onClick={() => handleDelete(proc.id, proc.title)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ REPORTS ═══════════════════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <section>
            <h2 style={s.sectionTitle}>System Reports</h2>
            <div style={s.reportsPlaceholder}>
              <p style={{ fontSize: 40, margin: "0 0 16px" }}>📊</p>
              <p style={{ color: "#475569", fontSize: 14 }}>Reports available once reporting endpoints are live.</p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting: { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  title: { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  adminBadge: { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 2, color: "#fbbf24" },
  adminText: { fontSize: 13, fontFamily: "monospace", letterSpacing: "0.05em" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(245,158,11,0.1)", flexWrap: "wrap" },
  tab: { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#fbbf24", borderBottomColor: "#f59e0b" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 },
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  breakdownList: { display: "flex", flexDirection: "column" },
  breakdownRow: { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(245,158,11,0.06)" },
  roleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  roleName: { flex: 1, fontSize: 13, color: "#94a3b8", textTransform: "capitalize" },
  roleCount: { fontSize: 16, color: "#e2e8f0", fontFamily: "'Georgia', serif" },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionCard: { display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 2, background: "rgba(245,158,11,0.02)", cursor: "pointer" },
  actionIcon: { fontSize: 20 },
  actionLabel: { margin: "0 0 2px", fontSize: 13, color: "#e2e8f0" },
  actionDesc: { margin: 0, fontSize: 11, color: "#475569" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  filterRow: { display: "flex", gap: 6 },
  filterBtn: { background: "transparent", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 2, padding: "4px 12px", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: "monospace", textTransform: "capitalize" },
  filterBtnActive: { background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.3)" },
  table: { border: "1px solid rgba(245,158,11,0.1)", borderRadius: 2, overflow: "hidden" },
  tableHeadRow: { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", padding: "12px 20px", background: "rgba(245,158,11,0.04)", borderBottom: "1px solid rgba(245,158,11,0.1)" },
  tableRow: { display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr", padding: "12px 20px", borderBottom: "1px solid rgba(245,158,11,0.06)", alignItems: "center" },
  thCell: { fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
  tdName: { fontSize: 13, color: "#e2e8f0" },
  tdCell: { fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  rolePill: { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "capitalize", fontFamily: "monospace", letterSpacing: "0.06em", display: "inline-block", width: "fit-content" },
  searchRow: { display: "flex", gap: 8, marginBottom: 16, alignItems: "center" },
  searchInput: { flex: 1, padding: "9px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 4, color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", outline: "none" },
  searchBtn: { padding: "9px 20px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, color: "#fbbf24", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  resetBtn: { padding: "9px 16px", background: "transparent", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 4, color: "#64748b", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  errorText: { color: "#fca5a5", fontSize: 13, fontFamily: "monospace", marginBottom: 12 },
  errorBox: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  retryBtn: { marginLeft: "auto", padding: "4px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, color: "#fca5a5", fontSize: 11, fontFamily: "monospace", cursor: "pointer" },
  statusText: { margin: "32px 0", fontSize: 13, color: "#475569", fontFamily: "monospace", textAlign: "center" },
  deptGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  reportsPlaceholder: { border: "1px dashed rgba(245,158,11,0.15)", borderRadius: 2, padding: "64px 32px", textAlign: "center" },
  // Procedures
  procHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  addBtn: { padding: "9px 20px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, color: "#fbbf24", fontSize: 13, fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.04em" },
  successBox: { padding: "10px 16px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 4, color: "#6ee7b7", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  formCard: { background: "rgba(15,15,25,0.9)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "28px", marginBottom: 28 },
  formHeading: { margin: "0 0 20px", fontSize: 14, color: "#fbbf24", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" },
  twoColForm: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 10, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  fieldError: { margin: "4px 0 0", fontSize: 11, color: "#ef4444", fontFamily: "monospace" },
  stepsLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  addStepBtn: { padding: "4px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, color: "#818cf8", fontSize: 11, fontFamily: "monospace", cursor: "pointer" },
  stepRow: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, padding: "12px", background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 4 },
  stepBadge: { flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "#4f46e5", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 },
  stepFields: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  stepInput: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "7px 10px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  removeStepBtn: { padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2, color: "#fca5a5", fontSize: 11, cursor: "pointer", flexShrink: 0, marginTop: 4 },
  submitBtn: { padding: "11px 28px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 4, color: "#0a0a0f", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.05em" },
  procList: { display: "flex", flexDirection: "column", gap: 8 },
  procRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "rgba(15,15,25,0.7)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 4 },
  procRowLeft: { display: "flex", alignItems: "center", gap: 14 },
  catDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  procRowTitle: { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  procRowMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", textTransform: "capitalize" },
  deleteBtn: { padding: "5px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2, color: "#fca5a5", fontSize: 11, fontFamily: "monospace", cursor: "pointer" },
};
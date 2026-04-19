import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import DepartmentCard from "../components/DepartmentCard";
import { useAuth } from "../context/AuthContext";
import { departmentAPI } from "../services/api";
import { fetchProcedures, fetchProcedureById } from "../services/proceduresService";

const MOCK_REQUESTS = [
  { id: 1, request_type: "Library Card Renewal", status: "pending",     created_at: "2025-03-01" },
  { id: 2, request_type: "Transcript Request",   status: "completed",   created_at: "2025-02-20" },
  { id: 3, request_type: "Fee Clearance",        status: "in_progress", created_at: "2025-02-28" },
];
const MOCK_COMPLAINTS = [
  { id: 1, category: "Facilities", description: "AC not working in Room 204", priority: "high",   status: "open",     created_at: "2025-03-02" },
  { id: 2, category: "Academic",   description: "Grade dispute — CS301",      priority: "medium", status: "resolved", created_at: "2025-02-15" },
];
const MOCK_EVENTS = [
  { id: 1, title: "Tech Symposium 2025", event_date: "2025-03-20", description: "Annual tech event",  capacity: 200, registered: false },
  { id: 2, title: "Career Fair",         event_date: "2025-03-25", description: "Meet top employers", capacity: 500, registered: true  },
];

const CATEGORY_LABELS = {
  academic: "Academic", financial: "Financial", registration: "Registration",
  it_services: "IT Services", facilities: "Facilities", general: "General",
};
const CATEGORY_COLORS = {
  academic: "#6366f1", financial: "#10b981", registration: "#8b5cf6",
  it_services: "#0ea5e9", facilities: "#f59e0b", general: "#64748b",
};
const STATUS_COLORS  = { pending: "#f59e0b", in_progress: "#6366f1", completed: "#10b981", open: "#ef4444", resolved: "#10b981" };
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

export default function StudentPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [requests]   = useState(MOCK_REQUESTS);
  const [complaints] = useState(MOCK_COMPLAINTS);
  const [events, setEvents] = useState(MOCK_EVENTS);

  // Departments
  const [departments, setDepartments] = useState([]);
  const [deptSearch,  setDeptSearch]  = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError,   setDeptError]   = useState("");

  // Procedures
  const [procedures,       setProcedures]       = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [procSearch,       setProcSearch]       = useState("");
  const [activeCategory,   setActiveCategory]   = useState("");
  const [expandedProc,     setExpandedProc]     = useState(null);
  const [selectedProc,     setSelectedProc]     = useState(null);
  const [procLoading,      setProcLoading]      = useState(false);
  const [procError,        setProcError]        = useState("");
  const [detailLoading,    setDetailLoading]    = useState(false);

  // Forms
  const [srForm,  setSrForm]  = useState({ request_type: "", description: "" });
  const [compForm,setCompForm]= useState({ category_id: "", description: "", priority: "medium" });
  const [formMsg, setFormMsg] = useState("");

  const tabs = [
    { id: "overview",         label: "Overview"         },
    { id: "service-requests", label: "Service Requests" },
    { id: "complaints",       label: "Complaints"       },
    { id: "events",           label: "Events"           },
    { id: "departments",      label: "Departments"      },
    { id: "procedures",       label: "📋 Procedures"    },
  ];

  // ── Fetch departments ────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async (query = "") => {
    try {
      setDeptLoading(true); setDeptError("");
      const res = query ? await departmentAPI.search(query) : await departmentAPI.getAll();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDeptError(err.response?.status
        ? `HTTP ${err.response.status} — check Flask server.`
        : "Cannot reach server.");
      setDepartments([]);
    } finally { setDeptLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "departments") fetchDepartments(); }, [activeTab, fetchDepartments]);

  // ── Fetch procedures from API ────────────────────────────────────────────
  const loadProcedures = useCallback(async (category = "") => {
    try {
      setProcLoading(true); setProcError("");
      const result = await fetchProcedures(category);
      setProcedures(result.procedures || []);
      if (result.categories?.length) setCategories(result.categories);
    } catch {
      setProcError("Failed to load procedures. Make sure Flask is running.");
    } finally { setProcLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "procedures") loadProcedures(activeCategory); }, [activeTab, activeCategory, loadProcedures]);

  // ── View full detail of a procedure ──────────────────────────────────────
  const handleViewDetail = async (id) => {
    if (selectedProc?.id === id) { setSelectedProc(null); return; }
    setDetailLoading(true);
    try {
      const proc = await fetchProcedureById(id);
      setSelectedProc(proc);
    } catch { setSelectedProc(null); }
    finally { setDetailLoading(false); }
  };

  // ── Client-side search filter ─────────────────────────────────────────────
  const visibleProcedures = procedures.filter((p) => {
    if (!procSearch.trim()) return true;
    const q = procSearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
  });

  // ── Other handlers ───────────────────────────────────────────────────────
  const handleRegisterEvent = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e)));

  const handleSRSubmit = () => {
    if (!srForm.request_type) return;
    setFormMsg("✓ Request submitted (mock).");
    setSrForm({ request_type: "", description: "" });
    setTimeout(() => setFormMsg(""), 5000);
  };
  const handleCompSubmit = () => {
    if (!compForm.description) return;
    setFormMsg("✓ Complaint submitted (mock).");
    setCompForm({ category_id: "", description: "", priority: "medium" });
    setTimeout(() => setFormMsg(""), 5000);
  };

  return (
    <div style={s.page}>
      <Navbar />
      <main style={s.main}>

        {/* Header */}
        <header style={s.header}>
          <div>
            <p style={s.greeting}>Student Portal</p>
            <h1 style={s.name}>{user?.name}</h1>
          </div>
          <div style={s.idBadge}>
            <span style={s.idLabel}>Student ID</span>
            <span style={s.idValue}>{String(user?.id || 1).padStart(8, "0")}</span>
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
              <StatCard label="Service Requests" value={requests.length}  icon="📋" accent="#6366f1" sub={`${requests.filter(r=>r.status==="pending").length} pending`} />
              <StatCard label="Complaints"       value={complaints.length} icon="📢" accent="#ef4444" sub={`${complaints.filter(c=>c.status==="open").length} open`} />
              <StatCard label="Events"           value={events.length}     icon="📅" accent="#0ea5e9" sub={`${events.filter(e=>e.registered).length} registered`} />
              <StatCard label="Notifications"    value="—"                 icon="🔔" accent="#10b981" sub="Connect backend" />
            </div>
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Recent Activity</h2>
              <div style={s.activityList}>
                {requests.slice(0, 2).map((r) => (
                  <div key={r.id} style={s.activityItem}>
                    <span style={s.activityDot} />
                    <div><p style={s.activityTitle}>{r.request_type}</p><p style={s.activityMeta}>Service Request · {r.created_at}</p></div>
                    <span style={{ ...s.statusBadge, color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}44` }}>{r.status.replace("_"," ")}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Procedures shortcut */}
            <div style={s.procShortcut} onClick={() => setActiveTab("procedures")}>
              <span style={{ fontSize: 28 }}>📋</span>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "#e2e8f0" }}>Administrative Procedures</p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Step-by-step guides for transcripts, withdrawals, ID replacement & more</p>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 18, color: "#6366f1" }}>→</span>
            </div>
          </section>
        )}

        {/* ══ SERVICE REQUESTS ══════════════════════════════════════════════ */}
        {activeTab === "service-requests" && (
          <section>
            <div style={s.twoCol}>
              <div>
                <h2 style={s.sectionTitle}>Your Requests</h2>
                {requests.map((r) => (
                  <div key={r.id} style={s.listItem}>
                    <div><p style={s.listItemTitle}>{r.request_type}</p><p style={s.listItemMeta}>{r.created_at}</p></div>
                    <span style={{ ...s.statusBadge, color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}44` }}>{r.status.replace("_"," ")}</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 style={s.sectionTitle}>New Request</h2>
                <div style={s.formField}><label style={s.formLabel}>Request Type</label><input style={s.formInput} value={srForm.request_type} onChange={(e)=>setSrForm(p=>({...p,request_type:e.target.value}))} placeholder="e.g. Transcript Request" /></div>
                <div style={s.formField}><label style={s.formLabel}>Description</label><textarea style={s.formTextarea} value={srForm.description} onChange={(e)=>setSrForm(p=>({...p,description:e.target.value}))} rows={4} /></div>
                <button style={s.submitBtn} onClick={handleSRSubmit}>Submit Request</button>
                {formMsg && <p style={s.formMsg}>{formMsg}</p>}
              </div>
            </div>
          </section>
        )}

        {/* ══ COMPLAINTS ════════════════════════════════════════════════════ */}
        {activeTab === "complaints" && (
          <section>
            <div style={s.twoCol}>
              <div>
                <h2 style={s.sectionTitle}>Your Complaints</h2>
                {complaints.map((c) => (
                  <div key={c.id} style={s.listItem}>
                    <div>
                      <p style={s.listItemTitle}>{c.description}</p>
                      <p style={s.listItemMeta}>{c.category} · {c.created_at}
                        <span style={{ ...s.priorityTag, color: PRIORITY_COLORS[c.priority], borderColor: `${PRIORITY_COLORS[c.priority]}44` }}>{c.priority}</span>
                      </p>
                    </div>
                    <span style={{ ...s.statusBadge, color: STATUS_COLORS[c.status], borderColor: `${STATUS_COLORS[c.status]}44` }}>{c.status}</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 style={s.sectionTitle}>File a Complaint</h2>
                <div style={s.formField}><label style={s.formLabel}>Category</label>
                  <select style={s.formInput} value={compForm.category_id} onChange={(e)=>setCompForm(p=>({...p,category_id:e.target.value}))}>
                    <option value="">Select category</option>
                    <option value="1">Academic</option><option value="2">Facilities</option>
                    <option value="3">Administration</option><option value="4">Other</option>
                  </select>
                </div>
                <div style={s.formField}><label style={s.formLabel}>Priority</label>
                  <select style={s.formInput} value={compForm.priority} onChange={(e)=>setCompForm(p=>({...p,priority:e.target.value}))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div style={s.formField}><label style={s.formLabel}>Description</label><textarea style={s.formTextarea} value={compForm.description} onChange={(e)=>setCompForm(p=>({...p,description:e.target.value}))} rows={4} /></div>
                <button style={s.submitBtn} onClick={handleCompSubmit}>Submit Complaint</button>
                {formMsg && <p style={s.formMsg}>{formMsg}</p>}
              </div>
            </div>
          </section>
        )}

        {/* ══ EVENTS ════════════════════════════════════════════════════════ */}
        {activeTab === "events" && (
          <section>
            <h2 style={s.sectionTitle}>Upcoming Events</h2>
            <div style={s.eventsGrid}>
              {events.map((ev) => (
                <div key={ev.id} style={s.eventCard}>
                  <div style={s.eventDate}>{ev.event_date}</div>
                  <h3 style={s.eventTitle}>{ev.title}</h3>
                  <p style={s.eventDesc}>{ev.description}</p>
                  <p style={s.eventCapacity}>Capacity: {ev.capacity} seats</p>
                  <button style={ev.registered ? { ...s.eventBtn, ...s.eventBtnReg } : s.eventBtn} onClick={() => handleRegisterEvent(ev.id)}>
                    {ev.registered ? "✓ Registered" : "Register"}
                  </button>
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
              <input type="text" placeholder="Search departments…" value={deptSearch} onChange={(e)=>setDeptSearch(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")fetchDepartments(deptSearch.trim())}} style={s.searchInput} />
              <button style={s.searchBtn} onClick={()=>fetchDepartments(deptSearch.trim())} disabled={deptLoading}>{deptLoading?"Searching…":"Search"}</button>
              {deptSearch && <button style={s.resetBtn} onClick={()=>{setDeptSearch("");fetchDepartments("");}}>Clear</button>}
            </div>
            {deptError && <div style={s.errorBox}>⚠ {deptError}</div>}
            {deptLoading && <p style={s.statusText}>Loading…</p>}
            {!deptLoading && departments.length === 0 && !deptError && <p style={s.statusText}>No departments found.</p>}
            <div style={s.deptGrid}>{departments.map((d) => <DepartmentCard key={d.id} department={d} />)}</div>
          </section>
        )}

        {/* ══ PROCEDURES (FR-04) ════════════════════════════════════════════ */}
        {activeTab === "procedures" && (
          <section>
            {/* Header row */}
            <div style={s.procHeaderRow}>
              <div>
                <h2 style={s.sectionTitle}>Administrative Procedures</h2>
                <p style={s.subtitle}>Step-by-step guides for common university processes at FAST-NUCES Karachi.</p>
              </div>
            </div>

            {/* Search + Reset */}
            <div style={s.searchRow}>
              <input type="text" placeholder="Search procedures or categories…"
                value={procSearch} onChange={(e) => setProcSearch(e.target.value)} style={s.searchInput} />
              {procSearch && (
                <button style={s.resetBtn} onClick={() => { setProcSearch(""); setSelectedProc(null); }}>
                  Reset
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div style={s.catPills}>
              <button style={activeCategory === "" ? { ...s.catPill, ...s.catPillActive } : s.catPill}
                onClick={() => { setActiveCategory(""); setSelectedProc(null); }}>
                All
              </button>
              {categories.map((cat) => (
                <button key={cat}
                  style={activeCategory === cat ? { ...s.catPill, ...s.catPillActive } : s.catPill}
                  onClick={() => { setActiveCategory(cat); setSelectedProc(null); }}>
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            {/* States */}
            {procLoading && <p style={s.statusText}>Loading procedures…</p>}
            {procError   && <div style={s.errorBox}>⚠ {procError} <button style={s.retryBtn} onClick={() => loadProcedures(activeCategory)}>Retry</button></div>}
            {!procLoading && !procError && visibleProcedures.length === 0 && (
              <p style={s.statusText}>{procSearch ? `No procedures match "${procSearch}".` : "No procedures available."}</p>
            )}

            {/* Result count */}
            {!procLoading && visibleProcedures.length > 0 && (
              <p style={s.countText}>{visibleProcedures.length} procedure{visibleProcedures.length !== 1 ? "s" : ""}{procSearch ? ` matching "${procSearch}"` : ""}</p>
            )}

            {/* Procedure cards */}
            <div style={s.procGrid}>
              {visibleProcedures.map((proc) => {
                const catColor  = CATEGORY_COLORS[proc.category] || "#6366f1";
                const isSelected = selectedProc?.id === proc.id;
                return (
                  <div key={proc.id} style={isSelected ? { ...s.procCard, borderColor: catColor } : s.procCard}>
                    {/* Top row */}
                    <div style={s.procCardTop}>
                      <span style={{ ...s.catBadge, background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}44` }}>
                        {CATEGORY_LABELS[proc.category] || proc.category}
                      </span>
                      {proc.estimated_duration && <span style={s.procTime}>⏱ {proc.estimated_duration}</span>}
                    </div>

                    <h3 style={s.procTitle}>{proc.title}</h3>

                    {/* View Steps button */}
                    <button
                      style={isSelected ? { ...s.procBtn, background: `${catColor}22`, borderColor: catColor, color: catColor } : s.procBtn}
                      onClick={() => handleViewDetail(proc.id)}
                      disabled={detailLoading}
                    >
                      {detailLoading && selectedProc?.id !== proc.id ? "Loading…" : isSelected ? "Hide Steps ▲" : "View Steps ▼"}
                    </button>

                    {/* Step-by-step detail */}
                    {isSelected && selectedProc && (
                      <div style={s.stepsContainer}>
                        <p style={s.stepsOverview}>{selectedProc.message}</p>
                        <div style={s.stepsDivider} />
                        {(selectedProc.steps || [])
                          .slice()
                          .sort((a, b) => a.step_number - b.step_number)
                          .map((step) => (
                            <div key={step.step_number} style={s.step}>
                              <div style={{ ...s.stepNum, background: catColor }}>{step.step_number}</div>
                              <div style={s.stepContent}>
                                <p style={s.stepTitle}>{step.title}</p>
                                <p style={s.stepDesc}>{step.description}</p>
                                {step.note && (
                                  <div style={s.stepNote}>💡 {step.note}</div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
  name: { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  idBadge: { textAlign: "right", padding: "12px 20px", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2 },
  idLabel: { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  idValue: { fontSize: 18, color: "#818cf8", fontFamily: "monospace" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(99,102,241,0.12)", flexWrap: "wrap" },
  tab: { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#818cf8", borderBottomColor: "#6366f1" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  section: {},
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  subtitle: { margin: "-8px 0 20px", fontSize: 13, color: "#475569", lineHeight: 1.6 },
  activityList: { display: "flex", flexDirection: "column" },
  activityItem: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(99,102,241,0.08)" },
  activityDot: { width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 },
  activityTitle: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  activityMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  statusBadge: { marginLeft: "auto", fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", flexShrink: 0 },
  priorityTag: { marginLeft: 8, fontSize: 10, padding: "2px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },
  procShortcut: { display: "flex", alignItems: "center", gap: 16, marginTop: 24, padding: "16px 20px", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, cursor: "pointer", background: "rgba(99,102,241,0.04)" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, marginBottom: 8, background: "rgba(15,15,25,0.6)" },
  listItemTitle: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  listItemMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 },
  formField: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 10, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
  formInput: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  formTextarea: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  submitBtn: { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "11px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" },
  formMsg: { marginTop: 12, fontSize: 11, color: "#818cf8", fontFamily: "monospace" },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  eventCard: { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "24px" },
  eventDate: { fontSize: 11, color: "#6366f1", fontFamily: "monospace", marginBottom: 8 },
  eventTitle: { margin: "0 0 6px", fontSize: 16, color: "#e2e8f0", fontWeight: "normal", fontFamily: "'Georgia', serif" },
  eventDesc: { margin: "0 0 6px", fontSize: 12, color: "#64748b" },
  eventCapacity: { margin: "0 0 16px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  eventBtn: { background: "transparent", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 2, padding: "7px 18px", color: "#818cf8", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  eventBtnReg: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" },
  searchRow: { display: "flex", gap: 8, marginBottom: 16, alignItems: "center" },
  searchInput: { flex: 1, padding: "9px 14px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, color: "#e2e8f0", fontSize: 13, fontFamily: "monospace", outline: "none" },
  searchBtn: { padding: "9px 20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, color: "#818cf8", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  resetBtn: { padding: "9px 14px", background: "transparent", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 2, color: "#475569", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  errorBox: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, color: "#fca5a5", fontSize: 13, fontFamily: "monospace", marginBottom: 16 },
  retryBtn: { marginLeft: "auto", padding: "4px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, color: "#fca5a5", fontSize: 11, fontFamily: "monospace", cursor: "pointer" },
  statusText: { margin: "32px 0", fontSize: 13, color: "#475569", fontFamily: "monospace", textAlign: "center" },
  countText: { margin: "0 0 16px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  deptGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  // Procedures
  procHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 8 },
  catPills: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  catPill: { padding: "5px 14px", background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, color: "#64748b", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  catPillActive: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.5)", color: "#818cf8" },
  procGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
  procCard: { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 6, padding: "22px", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.2s" },
  procCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catBadge: { fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "monospace" },
  procTime: { fontSize: 11, color: "#64748b", fontFamily: "monospace" },
  procTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 },
  procBtn: { alignSelf: "flex-start", padding: "7px 16px", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 2, color: "#818cf8", fontSize: 12, fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.04em" },
  stepsContainer: { display: "flex", flexDirection: "column", gap: 12 },
  stepsOverview: { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6, fontStyle: "italic" },
  stepsDivider: { height: 1, background: "rgba(99,102,241,0.12)" },
  step: { display: "flex", gap: 12, alignItems: "flex-start" },
  stepNum: { flexShrink: 0, width: 26, height: 26, borderRadius: "50%", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" },
  stepContent: { flex: 1 },
  stepTitle: { margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  stepDesc: { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 },
  stepNote: { marginTop: 6, padding: "8px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 4, fontSize: 11, color: "#fbbf24", lineHeight: 1.5 },
};
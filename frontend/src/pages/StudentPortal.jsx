import { useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

// ── Mock data aligned with Ali's models ──
// ServiceRequest fields: request_type, description, status, created_at
const MOCK_REQUESTS = [
  { id: 1, request_type: "Library Card Renewal", status: "pending", created_at: "2025-03-01" },
  { id: 2, request_type: "Transcript Request", status: "completed", created_at: "2025-02-20" },
  { id: 3, request_type: "Fee Clearance", status: "in_progress", created_at: "2025-02-28" },
];

// Complaint fields: description, priority, status, category_id, created_at
const MOCK_COMPLAINTS = [
  { id: 1, category: "Facilities", description: "AC not working in Room 204", priority: "high", status: "open", created_at: "2025-03-02" },
  { id: 2, category: "Academic", description: "Grade dispute — CS301", priority: "medium", status: "resolved", created_at: "2025-02-15" },
];

// Event fields: title, description, event_date, capacity
const MOCK_EVENTS = [
  { id: 1, title: "Tech Symposium 2025", event_date: "2025-03-20", description: "Annual tech event", capacity: 200, registered: false },
  { id: 2, title: "Career Fair", event_date: "2025-03-25", description: "Meet top employers", capacity: 500, registered: true },
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  in_progress: "#6366f1",
  completed: "#10b981",
  open: "#ef4444",
  resolved: "#10b981",
  requested: "#f59e0b",
  confirmed: "#10b981",
  cancelled: "#ef4444",
};

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function StudentPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [requests] = useState(MOCK_REQUESTS);
  const [complaints] = useState(MOCK_COMPLAINTS);
  const [events, setEvents] = useState(MOCK_EVENTS);

  // Form state aligned with real model fields
  const [srForm, setSrForm] = useState({ request_type: "", description: "" });
  const [compForm, setCompForm] = useState({ category_id: "", description: "", priority: "medium" });
  const [formMsg, setFormMsg] = useState("");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "service-requests", label: "Service Requests" },
    { id: "complaints", label: "Complaints" },
    { id: "events", label: "Events" },
  ];

  const handleRegisterEvent = (eventId) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, registered: !e.registered } : e))
    );
    // Real call: coordinationAPI.registerEvent(eventId)
    // Creates: EventRegistration { event_id, student_id, attendance_status: "registered" }
  };

  const handleSRSubmit = () => {
    if (!srForm.request_type) return;
    setFormMsg("✓ Request submitted (mock). Real call: POST /service_requests with { request_type, description }");
    setSrForm({ request_type: "", description: "" });
    setTimeout(() => setFormMsg(""), 5000);
  };

  const handleCompSubmit = () => {
    if (!compForm.description) return;
    setFormMsg("✓ Complaint submitted (mock). Real call: POST /complaints with { description, priority, category_id }");
    setCompForm({ category_id: "", description: "", priority: "medium" });
    setTimeout(() => setFormMsg(""), 5000);
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Student Portal</p>
            <h1 style={styles.name}>{user?.name}</h1>
          </div>
          <div style={styles.idBadge}>
            <span style={styles.idLabel}>Student ID</span>
            <span style={styles.idValue}>{String(user?.id || 1).padStart(8, "0")}</span>
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
              <StatCard label="Service Requests" value={requests.length} icon="📋" accent="#6366f1"
                sub={`${requests.filter(r => r.status === "pending").length} pending`} />
              <StatCard label="Complaints" value={complaints.length} icon="📢" accent="#ef4444"
                sub={`${complaints.filter(c => c.status === "open").length} open`} />
              <StatCard label="Events" value={events.length} icon="📅" accent="#0ea5e9"
                sub={`${events.filter(e => e.registered).length} registered`} />
              <StatCard label="Notifications" value="—" icon="🔔" accent="#10b981" sub="Connect backend" />
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
              <div style={styles.activityList}>
                {requests.slice(0, 2).map((r) => (
                  <div key={r.id} style={styles.activityItem}>
                    <span style={styles.activityDot} />
                    <div>
                      <p style={styles.activityTitle}>{r.request_type}</p>
                      <p style={styles.activityMeta}>Service Request · {r.created_at}</p>
                    </div>
                    <span style={{ ...styles.statusBadge, color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}44` }}>
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
                {complaints.slice(0, 1).map((c) => (
                  <div key={c.id} style={styles.activityItem}>
                    <span style={{ ...styles.activityDot, background: "#ef4444" }} />
                    <div>
                      <p style={styles.activityTitle}>{c.description}</p>
                      <p style={styles.activityMeta}>Complaint · {c.created_at}</p>
                    </div>
                    <span style={{ ...styles.statusBadge, color: STATUS_COLORS[c.status], borderColor: `${STATUS_COLORS[c.status]}44` }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SERVICE REQUESTS */}
        {activeTab === "service-requests" && (
          <section>
            <div style={styles.twoCol}>
              <div style={styles.listPanel}>
                <h2 style={styles.sectionTitle}>Your Requests</h2>
                {requests.map((r) => (
                  <div key={r.id} style={styles.listItem}>
                    <div>
                      <p style={styles.listItemTitle}>{r.request_type}</p>
                      <p style={styles.listItemMeta}>{r.created_at}</p>
                    </div>
                    <span style={{ ...styles.statusBadge, color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}44` }}>
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.formPanel}>
                <h2 style={styles.sectionTitle}>New Request</h2>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Request Type</label>
                  <input
                    style={styles.formInput}
                    value={srForm.request_type}
                    onChange={(e) => setSrForm((p) => ({ ...p, request_type: e.target.value }))}
                    placeholder="e.g. Transcript Request"
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    style={styles.formTextarea}
                    value={srForm.description}
                    onChange={(e) => setSrForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your request..."
                    rows={4}
                  />
                </div>
                <button style={styles.submitBtn} onClick={handleSRSubmit}>Submit Request</button>
                {formMsg && <p style={styles.formMsg}>{formMsg}</p>}
              </div>
            </div>
          </section>
        )}

        {/* COMPLAINTS */}
        {activeTab === "complaints" && (
          <section>
            <div style={styles.twoCol}>
              <div style={styles.listPanel}>
                <h2 style={styles.sectionTitle}>Your Complaints</h2>
                {complaints.map((c) => (
                  <div key={c.id} style={styles.listItem}>
                    <div>
                      <p style={styles.listItemTitle}>{c.description}</p>
                      <p style={styles.listItemMeta}>
                        {c.category} · {c.created_at}
                        <span style={{ ...styles.priorityTag, color: PRIORITY_COLORS[c.priority], borderColor: `${PRIORITY_COLORS[c.priority]}44` }}>
                          {c.priority}
                        </span>
                      </p>
                    </div>
                    <span style={{ ...styles.statusBadge, color: STATUS_COLORS[c.status], borderColor: `${STATUS_COLORS[c.status]}44` }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.formPanel}>
                <h2 style={styles.sectionTitle}>File a Complaint</h2>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Category</label>
                  <select
                    style={styles.formInput}
                    value={compForm.category_id}
                    onChange={(e) => setCompForm((p) => ({ ...p, category_id: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    <option value="1">Academic</option>
                    <option value="2">Facilities</option>
                    <option value="3">Administration</option>
                    <option value="4">Other</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Priority</label>
                  <select
                    style={styles.formInput}
                    value={compForm.priority}
                    onChange={(e) => setCompForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    style={styles.formTextarea}
                    value={compForm.description}
                    onChange={(e) => setCompForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                </div>
                <button style={styles.submitBtn} onClick={handleCompSubmit}>Submit Complaint</button>
                {formMsg && <p style={styles.formMsg}>{formMsg}</p>}
              </div>
            </div>
          </section>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
          <section>
            <h2 style={styles.sectionTitle}>Upcoming Events</h2>
            <div style={styles.eventsGrid}>
              {events.map((ev) => (
                <div key={ev.id} style={styles.eventCard}>
                  <div style={styles.eventDate}>{ev.event_date}</div>
                  <h3 style={styles.eventTitle}>{ev.title}</h3>
                  <p style={styles.eventDesc}>{ev.description}</p>
                  <p style={styles.eventCapacity}>Capacity: {ev.capacity} seats</p>
                  <button
                    style={ev.registered ? { ...styles.eventBtn, ...styles.eventBtnRegistered } : styles.eventBtn}
                    onClick={() => handleRegisterEvent(ev.id)}
                  >
                    {ev.registered ? "✓ Registered" : "Register"}
                  </button>
                </div>
              ))}
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
  idBadge: { textAlign: "right", padding: "12px 20px", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 2 },
  idLabel: { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  idValue: { fontSize: 18, color: "#818cf8", fontFamily: "monospace" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(99,102,241,0.12)" },
  tab: { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#818cf8", borderBottomColor: "#6366f1" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  section: {},
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  activityList: { display: "flex", flexDirection: "column" },
  activityItem: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(99,102,241,0.08)" },
  activityDot: { width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 },
  activityTitle: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  activityMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  statusBadge: { marginLeft: "auto", fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", flexShrink: 0 },
  priorityTag: { marginLeft: 8, fontSize: 10, padding: "2px 8px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
  listPanel: {},
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 2, marginBottom: 8, background: "rgba(15,15,25,0.6)" },
  listItemTitle: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  listItemMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 },
  formPanel: {},
  formField: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 10, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
  formInput: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  formTextarea: { width: "100%", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  submitBtn: { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "11px 24px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" },
  formMsg: { marginTop: 12, fontSize: 11, color: "#818cf8", fontFamily: "monospace", lineHeight: 1.6 },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  eventCard: { background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "24px" },
  eventDate: { fontSize: 11, color: "#6366f1", fontFamily: "monospace", marginBottom: 8 },
  eventTitle: { margin: "0 0 6px", fontSize: 16, color: "#e2e8f0", fontWeight: "normal", fontFamily: "'Georgia', serif" },
  eventDesc: { margin: "0 0 6px", fontSize: 12, color: "#64748b" },
  eventCapacity: { margin: "0 0 16px", fontSize: 11, color: "#475569", fontFamily: "monospace" },
  eventBtn: { background: "transparent", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 2, padding: "7px 18px", color: "#818cf8", fontSize: 12, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" },
  eventBtnRegistered: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" },
};

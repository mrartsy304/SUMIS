import { useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const MOCK_APPOINTMENTS = [
  { id: 1, student: "Ahmed Raza", subject: "Academic Counselling", date: "2025-03-10", time: "10:00 AM", status: "confirmed" },
  { id: 2, student: "Sara Khan", subject: "Project Discussion", date: "2025-03-11", time: "2:00 PM", status: "pending" },
  { id: 3, student: "Bilal Iqbal", subject: "Grade Query", date: "2025-03-12", time: "11:30 AM", status: "pending" },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "Mid-Term Schedule Released", date: "2025-03-01", department: "Academic Affairs" },
  { id: 2, title: "Faculty Meeting — March 15", date: "2025-03-03", department: "Administration" },
];

const STATUS_COLORS = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

export default function FacultyPortal() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "appointments", label: "Appointments" },
    { id: "announcements", label: "Announcements" },
  ];

  const handleConfirm = (id) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
    );
    // TODO: coordinationAPI.updateAppointment(id, { status: "confirmed" })
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        <header style={styles.header}>
          <div>
            <p style={styles.greeting}>Faculty Portal</p>
            <h1 style={styles.name}>{user?.name}</h1>
          </div>
          <div style={styles.deptBadge}>
            <span style={styles.deptLabel}>Department</span>
            <span style={styles.deptValue}>Computer Science</span>
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
              <StatCard label="Appointments" value={appointments.length} icon="📆" accent="#0ea5e9" sub={`${appointments.filter(a => a.status === "pending").length} pending`} />
              <StatCard label="Announcements" value={MOCK_ANNOUNCEMENTS.length} icon="📣" accent="#f59e0b" />
              <StatCard label="Notifications" value="—" icon="🔔" accent="#6366f1" sub="Connect backend" />
              <StatCard label="Messages" value="—" icon="✉️" accent="#10b981" sub="Connect backend" />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>Upcoming Appointments</h2>
              {appointments.slice(0, 3).map((a) => (
                <AppointmentRow key={a.id} appointment={a} onConfirm={handleConfirm} />
              ))}
            </div>
          </section>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <section>
            <h2 style={styles.sectionTitle}>All Appointments</h2>
            {appointments.map((a) => (
              <AppointmentRow key={a.id} appointment={a} onConfirm={handleConfirm} />
            ))}
            <p style={styles.apiNote}>
              → Will load from <code style={styles.code}>GET /coordination/appointments</code> once Usman's backend is live.
            </p>
          </section>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <section>
            <h2 style={styles.sectionTitle}>Announcements</h2>
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <div key={a.id} style={styles.announcementCard}>
                <div style={styles.annDot} />
                <div>
                  <p style={styles.annTitle}>{a.title}</p>
                  <p style={styles.annMeta}>{a.department} · {a.date}</p>
                </div>
              </div>
            ))}
            <p style={styles.apiNote}>
              → Will load from <code style={styles.code}>GET /info_navigation/announcements</code> once Usman's backend is live.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function AppointmentRow({ appointment: a, onConfirm }) {
  return (
    <div style={rowStyles.row}>
      <div style={rowStyles.timeBlock}>
        <p style={rowStyles.date}>{a.date}</p>
        <p style={rowStyles.time}>{a.time}</p>
      </div>
      <div style={rowStyles.info}>
        <p style={rowStyles.student}>{a.student}</p>
        <p style={rowStyles.subject}>{a.subject}</p>
      </div>
      <div style={rowStyles.actions}>
        <span style={{ ...rowStyles.badge, color: STATUS_COLORS[a.status], borderColor: `${STATUS_COLORS[a.status]}44` }}>
          {a.status}
        </span>
        {a.status === "pending" && (
          <button style={rowStyles.confirmBtn} onClick={() => onConfirm(a.id)}>
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}

const rowStyles = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "16px 20px",
    border: "1px solid rgba(14,165,233,0.12)",
    borderRadius: 2,
    marginBottom: 8,
    background: "rgba(14,165,233,0.03)",
  },
  timeBlock: { flexShrink: 0, minWidth: 90 },
  date: { margin: 0, fontSize: 12, color: "#0ea5e9", fontFamily: "monospace" },
  time: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  info: { flex: 1 },
  student: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  subject: { margin: 0, fontSize: 12, color: "#64748b" },
  actions: { display: "flex", gap: 10, alignItems: "center" },
  badge: {
    fontSize: 10,
    padding: "3px 10px",
    border: "1px solid",
    borderRadius: 2,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "monospace",
  },
  confirmBtn: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 2,
    padding: "5px 14px",
    color: "#6ee7b7",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },
};

const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting: { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  name: { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  deptBadge: {
    textAlign: "right",
    padding: "12px 20px",
    border: "1px solid rgba(14,165,233,0.2)",
    borderRadius: 2,
  },
  deptLabel: { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  deptValue: { fontSize: 15, color: "#38bdf8", fontFamily: "'Georgia', serif" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(14,165,233,0.1)", paddingBottom: 0 },
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
  tabActive: { color: "#38bdf8", borderBottomColor: "#0ea5e9" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  announcementCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "16px 0",
    borderBottom: "1px solid rgba(14,165,233,0.08)",
  },
  annDot: { width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 5, flexShrink: 0 },
  annTitle: { margin: "0 0 3px", fontSize: 14, color: "#e2e8f0" },
  annMeta: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  apiNote: { marginTop: 20, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code: { color: "#818cf8" },
};

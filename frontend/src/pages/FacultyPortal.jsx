import { useState } from "react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

// Appointment fields: student_id, faculty_id, appointment_time, status
// status values from model default: "requested" | "confirmed" | "cancelled"
const MOCK_APPOINTMENTS = [
  { id: 1, student: "Ahmed Raza", student_id: 101, subject: "Academic Counselling", appointment_time: "2025-03-10T10:00:00", status: "confirmed" },
  { id: 2, student: "Sara Khan", student_id: 102, subject: "Project Discussion", appointment_time: "2025-03-11T14:00:00", status: "requested" },
  { id: 3, student: "Bilal Iqbal", student_id: 103, subject: "Grade Query", appointment_time: "2025-03-12T11:30:00", status: "requested" },
];

// Announcement fields: title, message, created_by, created_at
const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "Mid-Term Schedule Released", message: "Mid-term exams will be held from March 20–25.", created_at: "2025-03-01" },
  { id: 2, title: "Faculty Meeting — March 15", message: "All faculty are required to attend the meeting at 10 AM.", created_at: "2025-03-03" },
];

const STATUS_COLORS = {
  confirmed: "#10b981",
  requested: "#f59e0b",
  cancelled: "#ef4444",
};

function formatDateTime(dt) {
  const d = new Date(dt);
  return {
    date: d.toISOString().split("T")[0],
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

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
    // Real call: coordinationAPI.updateAppointment(id, { status: "confirmed" })
  };

  const handleCancel = (id) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
    // Real call: coordinationAPI.updateAppointment(id, { status: "cancelled" })
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
            <span style={styles.deptLabel}>Role</span>
            <span style={styles.deptValue}>Faculty</span>
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
              <StatCard label="Appointments" value={appointments.length} icon="📆" accent="#0ea5e9"
                sub={`${appointments.filter(a => a.status === "requested").length} pending`} />
              <StatCard label="Announcements" value={MOCK_ANNOUNCEMENTS.length} icon="📣" accent="#f59e0b" />
              <StatCard label="Notifications" value="—" icon="🔔" accent="#6366f1" sub="Connect backend" />
              <StatCard label="Messages" value="—" icon="✉️" accent="#10b981" sub="Connect backend" />
            </div>

            <h2 style={styles.sectionTitle}>Upcoming Appointments</h2>
            {appointments.slice(0, 3).map((a) => (
              <AppointmentRow key={a.id} appointment={a} onConfirm={handleConfirm} onCancel={handleCancel} />
            ))}
          </section>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <section>
            <h2 style={styles.sectionTitle}>All Appointments</h2>
            {appointments.map((a) => (
              <AppointmentRow key={a.id} appointment={a} onConfirm={handleConfirm} onCancel={handleCancel} />
            ))}
            <p style={styles.apiNote}>→ Real data: <code style={styles.code}>GET /coordination/appointments</code></p>
          </section>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <section>
            <h2 style={styles.sectionTitle}>Announcements</h2>
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <div key={a.id} style={styles.announcementCard}>
                <div style={styles.annHeader}>
                  <p style={styles.annTitle}>{a.title}</p>
                  <span style={styles.annDate}>{a.created_at}</span>
                </div>
                <p style={styles.annMessage}>{a.message}</p>
              </div>
            ))}
            <p style={styles.apiNote}>→ Real data: <code style={styles.code}>GET /info_navigation/announcements</code></p>
          </section>
        )}
      </main>
    </div>
  );
}

function AppointmentRow({ appointment: a, onConfirm, onCancel }) {
  const { date, time } = formatDateTime(a.appointment_time);
  return (
    <div style={rowStyles.row}>
      <div style={rowStyles.timeBlock}>
        <p style={rowStyles.date}>{date}</p>
        <p style={rowStyles.time}>{time}</p>
      </div>
      <div style={rowStyles.info}>
        <p style={rowStyles.student}>{a.student}</p>
        <p style={rowStyles.subject}>{a.subject}</p>
      </div>
      <div style={rowStyles.actions}>
        <span style={{ ...rowStyles.badge, color: STATUS_COLORS[a.status], borderColor: `${STATUS_COLORS[a.status]}44` }}>
          {a.status}
        </span>
        {a.status === "requested" && (
          <>
            <button style={rowStyles.confirmBtn} onClick={() => onConfirm(a.id)}>Confirm</button>
            <button style={rowStyles.cancelBtn} onClick={() => onCancel(a.id)}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

const rowStyles = {
  row: { display: "flex", alignItems: "center", gap: 24, padding: "16px 20px", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 2, marginBottom: 8, background: "rgba(14,165,233,0.03)" },
  timeBlock: { flexShrink: 0, minWidth: 90 },
  date: { margin: 0, fontSize: 12, color: "#0ea5e9", fontFamily: "monospace" },
  time: { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  info: { flex: 1 },
  student: { margin: "0 0 2px", fontSize: 14, color: "#e2e8f0" },
  subject: { margin: 0, fontSize: 12, color: "#64748b" },
  actions: { display: "flex", gap: 8, alignItems: "center" },
  badge: { fontSize: 10, padding: "3px 10px", border: "1px solid", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  confirmBtn: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 2, padding: "5px 14px", color: "#6ee7b7", fontSize: 11, cursor: "pointer", fontFamily: "monospace" },
  cancelBtn: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, padding: "5px 14px", color: "#fca5a5", fontSize: 11, cursor: "pointer", fontFamily: "monospace" },
};

const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting: { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  name: { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  deptBadge: { textAlign: "right", padding: "12px 20px", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 2 },
  deptLabel: { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  deptValue: { fontSize: 15, color: "#38bdf8", fontFamily: "'Georgia', serif" },
  tabBar: { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(14,165,233,0.1)" },
  tab: { background: "transparent", border: "none", padding: "10px 20px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#38bdf8", borderBottomColor: "#0ea5e9" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  sectionTitle: { fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  announcementCard: { padding: "18px 20px", border: "1px solid rgba(14,165,233,0.1)", borderRadius: 2, marginBottom: 10, background: "rgba(14,165,233,0.03)" },
  annHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  annTitle: { margin: 0, fontSize: 14, color: "#e2e8f0" },
  annDate: { fontSize: 11, color: "#475569", fontFamily: "monospace" },
  annMessage: { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  apiNote: { marginTop: 20, fontSize: 11, color: "#334155", fontFamily: "monospace" },
  code: { color: "#818cf8" },
};
               
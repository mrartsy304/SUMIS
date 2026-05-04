import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { announcementsAPI, eventsAPI, notificationsAPI, decisionAPI } from "../services/api";

export default function StaffPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements]   = useState([]);
  const [events, setEvents]                 = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab]           = useState("overview");

  useEffect(() => {
    announcementsAPI.getAll()
      .then(r => setAnnouncements(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    eventsAPI.getAll()
      .then(r => setEvents(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    notificationsAPI.mine()
      .then(r => setNotifications(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    decisionAPI.getPendingReview()
      .then(r => setPendingRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const tabs = [
    { id: "overview",      label: "Overview" },
    { id: "requests",      label: "Pending Requests" },
    { id: "announcements", label: "Announcements" },
    { id: "events",        label: "Events" },
    { id: "notifications", label: "Notifications" },
  ];

  const STATUS_COLORS = {
    pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444",
    in_progress: "#0ea5e9", completed: "#6366f1",
  };

  return (
    <div style={s.page}>
      <Navbar />
      <main style={s.main}>

        <header style={s.header}>
          <div>
            <p style={s.greeting}>Staff Portal</p>
            <h1 style={s.name}>{user?.name}</h1>
          </div>
          <div style={s.badge}>
            <span style={s.badgeLabel}>Role</span>
            <span style={s.badgeValue}>Staff</span>
          </div>
        </header>

        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.id}
              style={activeTab === t.id ? { ...s.tab, ...s.tabActive } : s.tab}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.id === "requests" && pendingRequests.length > 0 &&
                <span style={s.tabBadge}>{pendingRequests.length}</span>}
              {t.id === "notifications" && unread > 0 &&
                <span style={s.tabBadge}>{unread}</span>}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <section>
            <div style={s.statsGrid}>
              <StatCard label="Pending Requests"  value={pendingRequests.length}  icon="📋" accent="#10b981" />
              <StatCard label="Announcements"     value={announcements.length}    icon="📣" accent="#0ea5e9" />
              <StatCard label="Events"            value={events.length}           icon="📅" accent="#6366f1" />
              <StatCard label="Notifications"     value={unread}                  icon="🔔" accent="#f59e0b" sub={`${unread} unread`} />
            </div>

            <div style={s.twoCol}>
              <div>
                <h2 style={s.sectionTitle}>Pending Requests</h2>
                {pendingRequests.length === 0
                  ? <p style={s.empty}>No pending requests.</p>
                  : pendingRequests.slice(0, 4).map(r => (
                    <div key={r.id} style={s.card} onClick={() => navigate("/staff-review")}>
                      <div style={s.cardRow}>
                        <p style={s.cardTitle}>{r.request_type || r.type || "Service Request"}</p>
                        <span style={{ ...s.statusBadge, background: (STATUS_COLORS[r.status] || "#6366f1") + "22", color: STATUS_COLORS[r.status] || "#6366f1" }}>
                          {r.status}
                        </span>
                      </div>
                      <p style={s.cardBody}>{r.description?.slice(0, 80)}{r.description?.length > 80 ? "…" : ""}</p>
                      <p style={s.cardMeta}>#{r.id} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                    </div>
                  ))}
                {pendingRequests.length > 4 &&
                  <button style={s.moreBtn} onClick={() => navigate("/staff-review")}>
                    View all {pendingRequests.length} requests →
                  </button>}
              </div>

              <div>
                <h2 style={s.sectionTitle}>Recent Announcements</h2>
                {announcements.length === 0
                  ? <p style={s.empty}>No announcements.</p>
                  : announcements.slice(0, 4).map(a => (
                    <div key={a.id} style={s.card}>
                      <p style={s.cardTitle}>{a.title}</p>
                      <p style={s.cardBody}>{a.body?.slice(0, 80)}{a.body?.length > 80 ? "…" : ""}</p>
                      <p style={s.cardMeta}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</p>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* PENDING REQUESTS */}
        {activeTab === "requests" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={s.sectionTitle}>Pending Requests ({pendingRequests.length})</h2>
              <button style={s.actionBtn} onClick={() => navigate("/staff-review")}>Full Review Dashboard →</button>
            </div>
            {pendingRequests.length === 0
              ? <p style={s.empty}>No pending requests.</p>
              : pendingRequests.map(r => (
                <div key={r.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => navigate("/staff-review")}>
                  <div style={s.cardRow}>
                    <p style={s.cardTitle}>{r.request_type || r.type || "Service Request"}</p>
                    <span style={{ ...s.statusBadge, background: (STATUS_COLORS[r.status] || "#6366f1") + "22", color: STATUS_COLORS[r.status] || "#6366f1" }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={s.cardBody}>{r.description}</p>
                  <p style={s.cardMeta}>Request #{r.id} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                </div>
              ))}
          </section>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <section>
            <h2 style={s.sectionTitle}>Announcements</h2>
            {announcements.length === 0
              ? <p style={s.empty}>No announcements.</p>
              : announcements.map(a => (
                <div key={a.id} style={s.card}>
                  <p style={s.cardTitle}>{a.title}</p>
                  <p style={s.cardBody}>{a.body}</p>
                  <p style={s.cardMeta}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</p>
                </div>
              ))}
          </section>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={s.sectionTitle}>Events ({events.length})</h2>
              <button style={s.actionBtn} onClick={() => navigate("/events")}>View All Events →</button>
            </div>
            {events.length === 0
              ? <p style={s.empty}>No events.</p>
              : events.map(ev => (
                <div key={ev.id} style={s.card}>
                  <p style={s.cardTitle}>{ev.title}</p>
                  {ev.description && <p style={s.cardBody}>{ev.description}</p>}
                  <p style={s.cardMeta}>
                    📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : "TBD"}
                    {ev.location ? ` · 📍 ${ev.location}` : ""}
                    {ev.capacity ? ` · 👥 ${ev.registered_count || 0}/${ev.capacity}` : ""}
                  </p>
                </div>
              ))}
          </section>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <section>
            <h2 style={s.sectionTitle}>Notifications</h2>
            {notifications.length === 0
              ? <p style={s.empty}>No notifications.</p>
              : notifications.map(n => (
                <div key={n.id} style={{ ...s.card, borderLeft: n.is_read ? "3px solid #1e293b" : "3px solid #10b981" }}>
                  {n.title && <p style={s.cardTitle}>{n.title}</p>}
                  <p style={s.cardBody}>{n.body}</p>
                  <p style={s.cardMeta}>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</p>
                </div>
              ))}
          </section>
        )}

      </main>
    </div>
  );
}

const s = {
  page:        { minHeight: "100vh", background: "#0a0a0f" },
  main:        { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  greeting:    { margin: "0 0 4px", fontSize: 12, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" },
  name:        { margin: 0, fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  badge:       { textAlign: "right", padding: "12px 20px", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 2 },
  badgeLabel:  { display: "block", fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
  badgeValue:  { fontSize: 15, color: "#6ee7b7", fontFamily: "'Georgia', serif" },
  tabBar:      { display: "flex", gap: 2, marginBottom: 36, borderBottom: "1px solid rgba(16,185,129,0.1)", flexWrap: "wrap" },
  tab:         { background: "transparent", border: "none", padding: "10px 18px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.03em", borderBottom: "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 6 },
  tabActive:   { color: "#6ee7b7", borderBottomColor: "#10b981" },
  tabBadge:    { background: "#10b981", color: "#000", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: "bold" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
  sectionTitle:{ fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" },
  card:        { padding: "16px 20px", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 2, marginBottom: 10, background: "rgba(16,185,129,0.03)", cursor: "default" },
  cardRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle:   { margin: "0 0 6px", fontSize: 14, color: "#e2e8f0" },
  cardBody:    { margin: "0 0 8px", fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  cardMeta:    { margin: 0, fontSize: 11, color: "#475569", fontFamily: "monospace" },
  statusBadge: { fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em" },
  empty:       { color: "#475569", fontFamily: "monospace", fontSize: 13 },
  actionBtn:   { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 2, padding: "7px 16px", color: "#6ee7b7", fontSize: 12, fontFamily: "monospace", cursor: "pointer" },
  moreBtn:     { background: "transparent", border: "none", color: "#10b981", fontSize: 12, fontFamily: "monospace", cursor: "pointer", padding: "4px 0" },
};
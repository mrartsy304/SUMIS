import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { notificationsAPI } from "../services/api";

const TYPE_COLORS = { info: "#0ea5e9", success: "#00ff9d", warning: "#f59e0b", error: "#dc2626" };
const TYPE_ICONS  = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.mine();
      setNotifications(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationsAPI.readAll();
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch {}
  };

  const remove = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(n => n.filter(x => x.id !== id));
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Notifications</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAll}
              style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>
              Mark All Read
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {["all", "unread", "read"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? "#00ff9d22" : "none", border: `1px solid ${filter === f ? "#00ff9d55" : "#1e293b"}`, borderRadius: 6, padding: "0.4rem 1rem", color: filter === f ? "#00ff9d" : "#64748b", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "3rem" }}>No notifications.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map(n => (
              <div key={n.id} style={{ background: n.is_read ? "#0f0f1a" : "#0f0f1a", border: `1px solid ${n.is_read ? "#1e293b" : TYPE_COLORS[n.type] || "#1e293b"}33`, borderRadius: 8, padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start", borderLeft: `3px solid ${n.is_read ? "#1e293b" : TYPE_COLORS[n.type] || "#1e293b"}` }}>
                <span style={{ fontSize: "1.2rem" }}>{TYPE_ICONS[n.type] || "ℹ️"}</span>
                <div style={{ flex: 1 }}>
                  {n.title && <div style={{ color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "0.25rem", fontWeight: n.is_read ? "normal" : "bold" }}>{n.title}</div>}
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{n.body}</div>
                  <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.5rem" }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      style={{ background: "none", border: "1px solid #00ff9d33", borderRadius: 4, padding: "3px 8px", color: "#00ff9d", cursor: "pointer", fontSize: "0.7rem", fontFamily: "monospace" }}>
                      Read
                    </button>
                  )}
                  <button onClick={() => remove(n.id)}
                    style={{ background: "none", border: "1px solid #dc262633", borderRadius: 4, padding: "3px 8px", color: "#dc2626", cursor: "pointer", fontSize: "0.7rem", fontFamily: "monospace" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

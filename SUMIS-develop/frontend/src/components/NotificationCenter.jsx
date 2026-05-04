import { useState, useEffect, useRef } from "react";
import { notificationsAPI } from "../services/api";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const loadCount = async () => {
    try {
      const res = await notificationsAPI.unreadCount();
      setUnread(res.data.unread_count);
    } catch {}
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.mine();
      setNotifications(res.data);
      setUnread(res.data.filter(n => !n.is_read).length);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationsAPI.readAll();
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(n => n.filter(x => x.id !== id));
      setUnread(c => Math.max(0, c));
    } catch {}
  };

  const TYPE_COLORS = { info: "#0ea5e9", success: "#00ff9d", warning: "#f59e0b", error: "#dc2626" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "1px solid #1e293b", borderRadius: 6, padding: "0.4rem 0.75rem", color: unread > 0 ? "#00ff9d" : "#64748b", cursor: "pointer", fontFamily: "monospace", position: "relative" }}>
        🔔{unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", borderRadius: "50%", width: 16, height: 16, fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 340, background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#e2e8f0", fontSize: "0.9rem", fontFamily: "monospace" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ background: "none", border: "none", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}>Mark all read</button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontFamily: "monospace", fontSize: "0.85rem" }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontFamily: "monospace", fontSize: "0.85rem" }}>No notifications</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #1e293b11", background: n.is_read ? "transparent" : "#00ff9d08", cursor: n.is_read ? "default" : "pointer", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span style={{ color: TYPE_COLORS[n.type] || "#0ea5e9", fontSize: "1rem", marginTop: 2 }}>●</span>
                <div style={{ flex: 1 }}>
                  {n.title && <div style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: n.is_read ? "normal" : "bold" }}>{n.title}</div>}
                  <div style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "0.75rem", marginTop: 2 }}>{n.body}</div>
                  <div style={{ color: "#475569", fontFamily: "monospace", fontSize: "0.7rem", marginTop: 4 }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1rem", padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

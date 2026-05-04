import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { announcementsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PRIORITY_COLORS = { urgent: "#dc2626", high: "#f59e0b", normal: "#00ff9d", low: "#64748b" };

export default function AnnouncementBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === "admin" || user?.role === "event_coordinator";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    announcementsAPI.getAll()
      .then(r => setAnnouncements(r.data))
      .catch(() => setError("Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Announcements</h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Latest campus announcements</p>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "3rem" }}>No announcements.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {announcements.map(ann => (
              <div key={ann.id} onClick={() => canManage && navigate("/admin/announcements")} style={{ background: "#0f0f1a", border: `1px solid ${PRIORITY_COLORS[ann.priority] || "#1e293b"}33`, borderRadius: 8, padding: "1.25rem", borderLeft: `3px solid ${PRIORITY_COLORS[ann.priority] || "#1e293b"}`, cursor: canManage ? "pointer" : "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: "1rem" }}>{ann.title}</h3>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {ann.priority && ann.priority !== "normal" && (
                      <span style={{ background: PRIORITY_COLORS[ann.priority] + "22", border: `1px solid ${PRIORITY_COLORS[ann.priority]}55`, color: PRIORITY_COLORS[ann.priority], fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12 }}>
                        {ann.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.75rem", lineHeight: 1.6 }}>{ann.body}</p>
                <div style={{ color: "#475569", fontSize: "0.75rem" }}>{ann.created_at ? new Date(ann.created_at).toLocaleString() : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

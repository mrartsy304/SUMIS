import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { announcementsAPI } from "../services/api";

const EMPTY_FORM = { title: "", body: "", priority: "normal", target_roles: "all" };
const PRIORITY_COLORS = { urgent: "#dc2626", high: "#f59e0b", normal: "#00ff9d", low: "#64748b" };

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [archived, setArchived] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await announcementsAPI.getAll();
      setAnnouncements(res.data);
    } catch {
      setError("Load failed");
    } finally {
      setLoading(false);
    }
  };

  const loadArchive = async () => {
    try {
      const res = await announcementsAPI.archive();
      setArchived(res.data);
    } catch {
      setError("Archive load failed");
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (showArchive) loadArchive();
  }, [showArchive]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await announcementsAPI.update(editId, form);
        setSuccess("Updated");
      } else {
        await announcementsAPI.create(form);
        setSuccess("Created");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, body: ann.body, priority: ann.priority || "normal", target_roles: ann.target_roles || "all" });
    setEditId(ann.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this announcement?")) return;
    try {
      await announcementsAPI.delete(id);
      setSuccess("Archived");
      load();
    } catch {
      setError("Delete failed");
    }
  };

  const AnnRow = ({ ann, showRestore }) => (
    <div style={{ background: "#0f0f1a", border: `1px solid ${PRIORITY_COLORS[ann.priority] || "#1e293b"}33`, borderRadius: 8, padding: "1rem 1.25rem", borderLeft: `3px solid ${PRIORITY_COLORS[ann.priority] || "#1e293b"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: "#e2e8f0", margin: "0 0 0.25rem 0" }}>{ann.title}</h4>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>{ann.body?.slice(0, 120)}{ann.body?.length > 120 ? "..." : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
          {!showRestore && (
            <>
              <button onClick={() => handleEdit(ann)}
                style={{ background: "none", border: "1px solid #0ea5e955", borderRadius: 4, padding: "4px 10px", color: "#0ea5e9", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}>Edit</button>
              <button onClick={() => handleDelete(ann.id)}
                style={{ background: "none", border: "1px solid #dc262655", borderRadius: 4, padding: "4px 10px", color: "#dc2626", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}>Archive</button>
            </>
          )}
          {showRestore && <span style={{ color: "#475569", fontSize: "0.75rem" }}>Archived {ann.updated_at ? new Date(ann.updated_at).toLocaleDateString() : ""}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Manage Announcements</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Create, edit and archive announcements</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setShowArchive(s => !s)}
              style={{ background: "none", border: "1px solid #334155", borderRadius: 6, padding: "0.5rem 1rem", color: "#64748b", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>
              {showArchive ? "Hide Archive" : "Archive"}
            </button>
            <button onClick={() => { setShowForm(s => !s); setForm(EMPTY_FORM); setEditId(null); }}
              style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
              {showForm ? "Close" : "+ New"}
            </button>
          </div>
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error} <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button></div>}
        {success && <div style={{ background: "#0a1a0a", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#00ff9d" }}>{success}</div>}

        {showForm && (
          <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#00ff9d", marginBottom: "1rem", fontSize: "1rem" }}>{editId ? "Edit Announcement" : "New Announcement"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Title *</div>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Priority</div>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace" }}>
                  {["low", "normal", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Target Roles</div>
                <select value={form.target_roles} onChange={e => setForm(f => ({ ...f, target_roles: e.target.value }))}
                  style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace" }}>
                  {["all", "student", "faculty", "staff", "coordinator", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Body *</div>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4}
                  style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.body}
                style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {announcements.map(ann => <AnnRow key={ann.id} ann={ann} />)}
            {announcements.length === 0 && <div style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No announcements.</div>}
          </div>
        )}

        {showArchive && (
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ color: "#64748b", marginBottom: "1rem" }}>Archived</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {archived.map(ann => <AnnRow key={ann.id} ann={ann} showRestore />)}
              {archived.length === 0 && <div style={{ color: "#475569", textAlign: "center", padding: "1rem" }}>No archived items.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

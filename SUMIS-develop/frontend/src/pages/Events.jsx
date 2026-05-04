import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../services/api";

const EMPTY_FORM = { title: "", description: "", event_date: "", capacity: "", registration_deadline: "", location: "" };

function EventCard({ event, userReg, onRegister, onCancel, canManage, onEdit, onDelete }) {
  const now      = new Date();
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isClosed = deadline && deadline < now;
  const isFull   = event.is_full;
  const canRegister = !userReg && !isClosed && !isFull;

  return (
    <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: "1rem", flex: 1 }}>{event.title}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {isFull   && <span style={{ background: "#dc262622", border: "1px solid #dc262655", color: "#dc2626", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12 }}>FULL</span>}
          {isClosed && !isFull && <span style={{ background: "#f59e0b22", border: "1px solid #f59e0b55", color: "#f59e0b", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12 }}>CLOSED</span>}
          {userReg  && <span style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", color: "#00ff9d", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12 }}>REGISTERED</span>}
        </div>
      </div>
      {event.description && <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{event.description}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>📅 {new Date(event.event_date).toLocaleDateString()}</span>
        {event.location  && <span style={{ color: "#64748b", fontSize: "0.75rem" }}>📍 {event.location}</span>}
        {event.capacity  && <span style={{ color: "#64748b", fontSize: "0.75rem" }}>👥 {event.registered_count}/{event.capacity}</span>}
        {deadline        && <span style={{ color: "#64748b", fontSize: "0.75rem" }}>⏰ Deadline: {deadline.toLocaleDateString()}</span>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {canRegister && (
          <button onClick={() => onRegister(event.id)}
            style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.4rem 1rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>
            Register
          </button>
        )}
        {userReg && (
          <button onClick={() => onCancel(userReg.registration_id)}
            style={{ background: "#dc262622", border: "1px solid #dc262655", borderRadius: 6, padding: "0.4rem 1rem", color: "#dc2626", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>
            Cancel
          </button>
        )}
        {canManage && (
          <>
            <button onClick={() => onEdit(event)}
              style={{ background: "none", border: "1px solid #0ea5e955", borderRadius: 6, padding: "0.4rem 0.75rem", color: "#0ea5e9", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Edit
            </button>
            <button onClick={() => onDelete(event.id)}
              style={{ background: "none", border: "1px solid #dc262655", borderRadius: 6, padding: "0.4rem 0.75rem", color: "#dc2626", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Events() {
  const { user }   = useAuth();
  const [events,   setEvents]   = useState([]);
  const [myRegs,   setMyRegs]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const canManage = user?.role === "event_coordinator" || user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.getAll();
      setEvents(res.data);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (eventId) => {
    try {
      const res = await eventsAPI.register({ event_id: eventId });
      setMyRegs(r => ({ ...r, [eventId]: { registration_id: res.data.id } }));
      setSuccess("Registered successfully");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
    }
  };

  const handleCancel = async (regId) => {
    try {
      await eventsAPI.cancel(regId);
      setMyRegs(r => {
        const n = { ...r };
        Object.keys(n).forEach(k => { if (n[k]?.registration_id === regId) delete n[k]; });
        return n;
      });
      setSuccess("Registration cancelled");
      load();
    } catch {
      setError("Cancel failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        title:                 form.title,
        description:           form.description,
        event_date:            form.event_date,
        capacity:              form.capacity ? parseInt(form.capacity) : null,
        registration_deadline: form.registration_deadline || null,  // backend handles date-only string
        location:              form.location,
      };
      if (editId) {
        await eventsAPI.update(editId, payload);
        setSuccess("Event updated");
      } else {
        await eventsAPI.create(payload);
        setSuccess("Event created");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Save failed — check all required fields");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev) => {
    setForm({
      title:                 ev.title,
      description:           ev.description || "",
      event_date:            ev.event_date?.slice(0, 10) || "",
      capacity:              ev.capacity || "",
      registration_deadline: ev.registration_deadline?.slice(0, 10) || "",
      location:              ev.location || "",
    });
    setEditId(ev.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await eventsAPI.delete(id);   // proper DELETE — needs eventsAPI.delete() in api.js
      setSuccess("Event deleted");
      load();
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Events</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Campus events and registrations</p>
          </div>
          {canManage && (
            <button onClick={() => { setShowForm(s => !s); setForm(EMPTY_FORM); setEditId(null); }}
              style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.6rem 1.25rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
              {showForm ? "Close" : "+ New Event"}
            </button>
          )}
        </div>

        {error   && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error}   <button onClick={() => setError("")}   style={{ marginLeft: 8, background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button></div>}
        {success && <div style={{ background: "#0a1a0a", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#00ff9d" }}>{success} <button onClick={() => setSuccess("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#00ff9d", cursor: "pointer" }}>✕</button></div>}

        {showForm && canManage && (
          <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#00ff9d", marginBottom: "1rem", fontSize: "1rem" }}>{editId ? "Edit Event" : "New Event"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "0.75rem" }}>
              {[
                ["title",                 "Title *",                 "text"],
                ["location",              "Location",                "text"],
                ["event_date",            "Event Date *",            "date"],
                ["registration_deadline", "Registration Deadline",   "date"],
                ["capacity",              "Capacity (max attendees)","number"],
              ].map(([k, lbl, type]) => (
                <div key={k}>
                  <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>{lbl}</div>
                  <input type={type} value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Description</div>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.event_date}
                style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#00ff9d", cursor: saving ? "not-allowed" : "pointer", fontFamily: "monospace", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editId ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "3rem" }}>No events found.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: "1rem" }}>
            {events.map(ev => (
              <EventCard key={ev.id} event={ev} userReg={myRegs[ev.id]}
                onRegister={handleRegister} onCancel={handleCancel}
                canManage={canManage} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
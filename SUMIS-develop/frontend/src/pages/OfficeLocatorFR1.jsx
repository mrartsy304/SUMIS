import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { locationAPI } from "../services/api";

const TYPE_COLORS = {
  department:      "#00ff9d",
  lab:             "#0ea5e9",
  service_counter: "#f59e0b",
};

const TYPE_LABELS = {
  department:      "Department",
  lab:             "Lab",
  service_counter: "Service Counter",
};

const EMPTY_FORM = { name: "", type: "department", floor: "", area: "", room: "", direction: "", building: "" };

export default function OfficeLocator() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await locationAPI.getAll();
      setLocations(res.data);
    } catch {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    locationAPI.buildings().then(r => setBuildings(r.data)).catch(() => {});
  }, [loadAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      loadAll();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await locationAPI.search(query);
        setLocations(res.data);
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, loadAll]);

  const filtered = locations.filter(l => {
    if (filterBuilding && l.building !== filterBuilding) return false;
    if (filterType && l.type !== filterType) return false;
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await locationAPI.update(editId, form);
      } else {
        await locationAPI.create(form);
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      await loadAll();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (loc) => {
    setForm({ name: loc.name, type: loc.type, floor: loc.floor, area: loc.area, room: loc.room, direction: loc.direction, building: loc.building });
    setEditId(loc.id);
    setShowAdmin(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await locationAPI.delete(id);
      await loadAll();
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Office Locator</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Find any room, lab or service counter on campus</p>
        </div>

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>
            {error} <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, area, building, direction..."
            style={{ flex: 1, minWidth: 220, background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 6, padding: "0.6rem 1rem", color: "#e2e8f0", fontFamily: "monospace" }}
          />
          <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}
            style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 6, padding: "0.6rem 1rem", color: "#e2e8f0", fontFamily: "monospace" }}>
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 6, padding: "0.6rem 1rem", color: "#e2e8f0", fontFamily: "monospace" }}>
            <option value="">All Types</option>
            <option value="department">Department</option>
            <option value="lab">Lab</option>
            <option value="service_counter">Service Counter</option>
          </select>
          {user?.role === "admin" && (
            <button onClick={() => { setShowAdmin(s => !s); setForm(EMPTY_FORM); setEditId(null); }}
              style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.6rem 1rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
              {showAdmin ? "Close Panel" : "+ Add Location"}
            </button>
          )}
        </div>

        {/* Admin CRUD Panel */}
        {showAdmin && user?.role === "admin" && (
          <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#00ff9d", marginBottom: "1rem", fontSize: "1rem" }}>{editId ? "Edit Location" : "Add New Location"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "0.75rem" }}>
              {[["name","Name *"],["floor","Floor"],["area","Area"],["room","Room No."],["direction","Direction"],["building","Building"]].map(([k, label]) => (
                <div key={k}>
                  <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>{label}</div>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: 3 }}>Type</div>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: "100%", background: "#09090f", border: "1px solid #1e293b", borderRadius: 4, padding: "0.5rem 0.75rem", color: "#e2e8f0", fontFamily: "monospace" }}>
                  <option value="department">Department</option>
                  <option value="lab">Lab</option>
                  <option value="service_counter">Service Counter</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={handleSave} disabled={saving || !form.name}
                style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1.25rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace" }}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); }}
                style={{ background: "none", border: "1px solid #334155", borderRadius: 6, padding: "0.5rem 1rem", color: "#64748b", cursor: "pointer", fontFamily: "monospace" }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "3rem" }}>No locations found.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: "1rem" }}>
            {filtered.map(loc => (
              <div key={loc.id} style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: "1rem", margin: 0, flex: 1, paddingRight: "0.5rem" }}>{loc.name}</h3>
                  <span style={{ background: TYPE_COLORS[loc.type] + "22", border: `1px solid ${TYPE_COLORS[loc.type]}55`, color: TYPE_COLORS[loc.type], fontSize: "0.7rem", padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap" }}>
                    {TYPE_LABELS[loc.type] || loc.type}
                  </span>
                </div>
                <div style={{ color: "#00ff9d", fontSize: "0.8rem", marginBottom: "0.5rem", fontFamily: "monospace" }}>
                  📍 {loc.formatted_direction}
                </div>
                {loc.building && (
                  <div style={{ color: "#64748b", fontSize: "0.75rem" }}>🏢 {loc.building}</div>
                )}
                {user?.role === "admin" && (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleEdit(loc)}
                      style={{ background: "none", border: "1px solid #0ea5e955", color: "#0ea5e9", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(loc.id)}
                      style={{ background: "none", border: "1px solid #dc262655", color: "#dc2626", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

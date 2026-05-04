import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import DepartmentCard from "../components/DepartmentCard";
import { departmentAPI } from "../services/api";

/**
 * DepartmentsPage — FR-02 (Student view)
 *
 * Allows any logged-in student to browse all university departments,
 * search by name / description / services, and view contact details.
 *
 * Add this page to your router in App.jsx:
 *   <Route path="/departments" element={<DepartmentsPage />} />
 *
 * And link to it from the student dashboard or navbar.
 */
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const fetchDepartments = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const res = query
        ? await departmentAPI.search(query)
        : await departmentAPI.getAll();

      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status
          ? `Could not load departments (HTTP ${status}). Please try again later.`
          : "Cannot reach the server. Make sure the backend is running."
      );
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all departments on first render
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>FAST-NUCES Karachi</p>
            <h1 style={styles.title}>Departments</h1>
            <p style={styles.subtitle}>
              Browse all university departments, their services, locations, and contact information.
            </p>
          </div>
        </header>

        {/* ── Search Bar ───────────────────────────────────────────────── */}
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Search by name, services, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchDepartments(search.trim());
            }}
            style={styles.searchInput}
          />
          <button
            style={styles.searchButton}
            onClick={() => fetchDepartments(search.trim())}
            disabled={loading}
          >
            {loading ? "Searching…" : "Search"}
          </button>
          {search && (
            <button
              style={styles.resetButton}
              onClick={() => {
                setSearch("");
                fetchDepartments("");
              }}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Result count ─────────────────────────────────────────────── */}
        {!loading && !error && departments.length > 0 && (
          <p style={styles.resultCount}>
            {departments.length} department{departments.length !== 1 ? "s" : ""} found
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠</span>
            <div>
              <p style={styles.errorTitle}>Unable to load departments</p>
              <p style={styles.errorMsg}>{error}</p>
              <button
                style={styles.retryButton}
                onClick={() => fetchDepartments(search.trim())}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && departments.length === 0 && (
          <div style={styles.statusBox}>
            <span style={styles.spinner}>⏳</span>
            <p style={styles.statusText}>Loading departments…</p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && departments.length === 0 && !error && (
          <div style={styles.statusBox}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>🏛️</span>
            <p style={styles.statusText}>
              {search
                ? `No departments match "${search}". Try a different keyword.`
                : "No departments available yet."}
            </p>
          </div>
        )}

        {/* ── Department Cards Grid ─────────────────────────────────────── */}
        <div style={styles.grid}>
          {departments.map((d) => (
            <DepartmentCard key={d.id} department={d} />
          ))}
        </div>

      </main>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "48px 32px" },

  // Header
  header:   { marginBottom: 32 },
  eyebrow:  { margin: "0 0 6px", fontSize: 11, color: "#475569", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" },
  title:    { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.6, maxWidth: 560 },

  // Search
  searchRow: { display: "flex", gap: 8, marginBottom: 16, alignItems: "center" },
  searchInput: {
    flex: 1,
    padding: "10px 16px",
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "monospace",
    outline: "none",
    transition: "border-color 0.2s",
  },
  searchButton: {
    padding: "10px 22px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: 6,
    color: "#a5b4fc",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
  resetButton: {
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: 6,
    color: "#475569",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // Result count
  resultCount: {
    margin: "0 0 20px",
    fontSize: 11,
    color: "#475569",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },

  // Error
  errorBox: {
    display: "flex",
    gap: 16,
    padding: "16px 20px",
    background: "rgba(239,68,68,0.07)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 6,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  errorIcon:  { fontSize: 20, marginTop: 2, color: "#f87171" },
  errorTitle: { margin: "0 0 4px", fontSize: 13, color: "#fca5a5", fontWeight: 600 },
  errorMsg:   { margin: "0 0 10px", fontSize: 12, color: "#ef4444", fontFamily: "monospace" },
  retryButton: {
    padding: "6px 14px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 4,
    color: "#fca5a5",
    fontSize: 11,
    fontFamily: "monospace",
    cursor: "pointer",
  },

  // Status (loading / empty)
  statusBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "64px 32px",
    gap: 12,
  },
  spinner:    { fontSize: 28 },
  statusText: { margin: 0, fontSize: 13, color: "#475569", fontFamily: "monospace", textAlign: "center" },

  // Cards grid — auto-fill so it collapses nicely on smaller screens
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
    marginTop: 8,
  },
};

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import AppointmentForm from "../components/AppointmentForm";
import AppointmentCard from "../components/AppointmentCard";
import { useAuth } from "../context/AuthContext";
import { appointmentAPI } from "../services/api";

/**
 * FR-14 Part 1 — Ali
 * BookAppointment Page
 *
 * Student-facing page that lets a logged-in student:
 *  1. Book a new faculty appointment via AppointmentForm
 *  2. View all their past and upcoming appointment requests
 *  3. Cancel a pending appointment
 */
export default function BookAppointment() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [successMsg, setSuccessMsg]     = useState("");
  const [filter, setFilter]             = useState("all");

  // ── Fetch student's appointments ──────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentAPI.getByStudent(user.id);
      setAppointments(res.data || []);
    } catch {
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSuccess = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
    setShowForm(false);
    setSuccessMsg("Appointment request submitted successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleCancel = async (id) => {
    try {
      await appointmentAPI.cancel(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel appointment.");
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = appointments.filter(
    (a) => filter === "all" || a.status === filter
  );

  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        {/* ── Page header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.title}>Faculty Appointments</h1>
            <p style={styles.subtitle}>
              Request a meeting with a faculty member and track your appointments here.
            </p>
          </div>
          <button
            style={showForm ? styles.cancelFormBtn : styles.newBtn}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Cancel" : "+ New Appointment"}
          </button>
        </div>

        {/* ── Success message ── */}
        {successMsg && (
          <div style={styles.successBanner}>✅ {successMsg}</div>
        )}

        {/* ── Booking form ── */}
        {showForm && (
          <div style={styles.formCard}>
            <p style={styles.formTitle}>New Appointment Request</p>
            <AppointmentForm
              student={user}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* ── Summary row ── */}
        <div style={styles.summaryRow}>
          {SUMMARY_ITEMS.map(({ key, label, color, icon }) => (
            <div
              key={key}
              style={{
                ...styles.summaryCard,
                borderColor: filter === key ? color : "rgba(99,102,241,0.12)",
                cursor: "pointer",
              }}
              onClick={() => setFilter(key)}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <p style={{ ...styles.summaryCount, color }}>
                  {key === "all" ? appointments.length : (counts[key] || 0)}
                </p>
                <p style={styles.summaryLabel}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter pills ── */}
        <div style={styles.pills}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{ ...styles.pill, ...(filter === opt.value ? styles.pillActive : {}) }}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading && (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading appointments…</p>
          </div>
        )}

        {error && !loading && (
          <div style={styles.errorBox}>
            ⚠️ {error}
            <button style={styles.retryBtn} onClick={fetchAppointments}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📅</span>
            <p style={styles.emptyTitle}>
              {filter === "all" ? "No appointments yet" : `No ${filter} appointments`}
            </p>
            <p style={styles.emptySubtitle}>
              Click "New Appointment" above to request a meeting with a faculty member.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={styles.list}>
            {filtered.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                viewAs="student"
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const SUMMARY_ITEMS = [
  { key: "all",       label: "Total",     color: "#818cf8", icon: "📋" },
  { key: "requested", label: "Pending",   color: "#f59e0b", icon: "⏳" },
  { key: "approved",  label: "Approved",  color: "#10b981", icon: "✅" },
  { key: "rejected",  label: "Rejected",  color: "#f87171", icon: "❌" },
];

const FILTER_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "requested", label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const styles = {
  page:          { minHeight: "100vh", background: "#080c14", fontFamily: "'Inter', sans-serif" },
  main:          { maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" },
  pageHeader:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title:         { fontSize: 26, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px 0" },
  subtitle:      { fontSize: 13, color: "#64748b", margin: 0 },
  newBtn:        { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 6, padding: "9px 20px", fontSize: 13, color: "#818cf8", cursor: "pointer", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" },
  cancelFormBtn: { background: "transparent", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "9px 18px", fontSize: 13, color: "#f87171", cursor: "pointer", fontFamily: "monospace" },
  successBanner: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 6, padding: "12px 18px", fontSize: 13, color: "#10b981", marginBottom: 20 },
  formCard:      { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "24px 28px", marginBottom: 28 },
  formTitle:     { fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: "0 0 18px 0", fontFamily: "monospace" },
  summaryRow:    { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  summaryCard:   { display: "flex", alignItems: "center", gap: 12, background: "rgba(15,23,42,0.6)", border: "1px solid", borderRadius: 8, padding: "12px 18px", flex: "1 1 100px", cursor: "pointer" },
  summaryCount:  { fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1 },
  summaryLabel:  { fontSize: 10, color: "#475569", margin: "3px 0 0 0", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" },
  pills:         { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 },
  pill:          { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "monospace" },
  pillActive:    { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8" },
  centered:      { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 },
  spinner:       { width: 32, height: 32, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText:   { color: "#475569", fontSize: 13, fontFamily: "monospace" },
  errorBox:      { display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "16px 20px", color: "#f87171", fontSize: 13 },
  retryBtn:      { marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "5px 12px", fontSize: 12, color: "#f87171", cursor: "pointer" },
  emptyState:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10 },
  emptyIcon:     { fontSize: 44 },
  emptyTitle:    { fontSize: 15, color: "#e2e8f0", fontWeight: 600, margin: 0 },
  emptySubtitle: { fontSize: 13, color: "#475569", margin: 0, textAlign: "center", maxWidth: 380 },
  list:          { display: "flex", flexDirection: "column", gap: 12 },
};

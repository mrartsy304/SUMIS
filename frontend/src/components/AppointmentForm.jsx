import React, { useState, useEffect } from "react";
import { appointmentAPI } from "../services/api";

/**
 * FR-14 Part 1 — Ali
 * AppointmentForm
 *
 * Reusable form component for booking a faculty appointment.
 * Auto-fills student info from the session user object.
 * Provides a faculty dropdown (loaded from API), date+time picker,
 * and a purpose text area.
 *
 * Props:
 *  - student    : object  { id, name, email } — from AuthContext
 *  - onSuccess  : fn(newAppointment) — called after successful submission
 *  - onCancel   : fn() — optional, hides the form
 */
export default function AppointmentForm({ student, onSuccess, onCancel }) {
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);

  const [form, setForm] = useState({
    faculty_id:       "",
    appointment_time: "",
    purpose:          "",
  });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");

  // ── Load faculty list on mount ────────────────────────────────────────────
  useEffect(() => {
    appointmentAPI.getFaculty()
      .then((res) => setFacultyList(res.data || []))
      .catch(() => setApiError("Could not load faculty list. Please refresh."))
      .finally(() => setLoadingFaculty(false));
  }, []);

  // ── Field change handler ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.faculty_id)       errs.faculty_id = "Please select a faculty member.";
    if (!form.appointment_time) errs.appointment_time = "Please select a date and time.";
    else if (new Date(form.appointment_time) <= new Date())
      errs.appointment_time = "Appointment time must be in the future.";
    if (!form.purpose.trim())   errs.purpose = "Please describe the purpose of the meeting.";
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError("");
    try {
      const res = await appointmentAPI.create({
        student_id:       student.id,
        faculty_id:       Number(form.faculty_id),
        appointment_time: new Date(form.appointment_time).toISOString(),
        purpose:          form.purpose.trim(),
      });
      onSuccess && onSuccess(res.data);
      setForm({ faculty_id: "", appointment_time: "", purpose: "" });
    } catch (err) {
      setApiError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Min datetime for the picker (now + 30 min, rounded) ──────────────────
  const minDatetime = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div style={styles.form}>
      {/* ── Student info (read-only) ── */}
      <div style={styles.infoRow}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Student</span>
          <span style={styles.infoValue}>{student?.name || "—"}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Email</span>
          <span style={styles.infoValue}>{student?.email || "—"}</span>
        </div>
      </div>

      {/* ── Faculty dropdown ── */}
      <Field label="Faculty Member" error={errors.faculty_id} required>
        {loadingFaculty ? (
          <p style={styles.loadingText}>Loading faculty…</p>
        ) : (
          <select
            name="faculty_id"
            value={form.faculty_id}
            onChange={handleChange}
            style={{ ...styles.input, ...(errors.faculty_id ? styles.inputError : {}) }}
          >
            <option value="">— Select a faculty member —</option>
            {facultyList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.email})
              </option>
            ))}
          </select>
        )}
      </Field>

      {/* ── Date + Time picker ── */}
      <Field label="Preferred Date & Time" error={errors.appointment_time} required>
        <input
          type="datetime-local"
          name="appointment_time"
          value={form.appointment_time}
          min={minDatetime()}
          onChange={handleChange}
          style={{ ...styles.input, ...(errors.appointment_time ? styles.inputError : {}) }}
        />
      </Field>

      {/* ── Purpose textarea ── */}
      <Field label="Purpose of Meeting" error={errors.purpose} required>
        <textarea
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          rows={4}
          placeholder="Briefly describe why you want to meet this faculty member…"
          style={{ ...styles.input, resize: "vertical", minHeight: 90, ...(errors.purpose ? styles.inputError : {}) }}
        />
      </Field>

      {/* ── API error ── */}
      {apiError && <p style={styles.apiError}>⚠️ {apiError}</p>}

      {/* ── Actions ── */}
      <div style={styles.actions}>
        {onCancel && (
          <button style={styles.cancelBtn} onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button
          style={{ ...styles.submitBtn, ...(submitting ? { opacity: 0.6 } : {}) }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Request Appointment"}
        </button>
      </div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, error, required, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
      {error && <p style={styles.fieldError}>{error}</p>}
    </div>
  );
}

const styles = {
  form:       { display: "flex", flexDirection: "column", gap: 18 },
  infoRow:    { display: "flex", gap: 24, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 6, padding: "12px 16px", flexWrap: "wrap" },
  infoItem:   { display: "flex", flexDirection: "column", gap: 3 },
  infoLabel:  { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" },
  infoValue:  { fontSize: 13, color: "#cbd5e1" },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  label:      { fontSize: 12, color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.04em" },
  input: {
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#e2e8f0",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    colorScheme: "dark",
  },
  inputError:  { borderColor: "rgba(239,68,68,0.5)" },
  fieldError:  { fontSize: 12, color: "#f87171", margin: 0 },
  loadingText: { fontSize: 13, color: "#475569", fontFamily: "monospace", margin: 0 },
  apiError:    { fontSize: 13, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "10px 14px", margin: 0 },
  actions:     { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 },
  cancelBtn:   { background: "transparent", border: "1px solid rgba(100,116,139,0.3)", borderRadius: 6, padding: "9px 20px", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "monospace" },
  submitBtn:   { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 6, padding: "9px 22px", fontSize: 13, color: "#818cf8", cursor: "pointer", fontFamily: "monospace", fontWeight: 600 },
};

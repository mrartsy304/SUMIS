/**
 * FR-10 | ComplaintForm.jsx
 * Reusable form component for complaint submission.
 *
 * Props:
 *   onSubmit  (formData) => void  — called with {title, description, category, priority}
 *   loading   boolean             — disables submit button during API call
 *   feedback  {success, message}  — shown as a banner above the button
 *
 * Fix log:
 *   - Removed "status" field entirely (backend always forces "Pending")
 *   - Added width:100% to selects so they fill their flex column
 *   - Textarea uses resize:vertical + min-height for usability
 *   - Priority colour applied to the option text, not the select border
 *   - Validation clears individual field error on change (already correct —
 *     kept and verified)
 */

import { useState } from "react";

const CATEGORIES = ["Facility", "IT", "Academic", "Administrative", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const PRIORITY_COLORS = {
  Low:      "#16a34a",
  Medium:   "#d97706",
  High:     "#dc2626",
  Critical: "#7c3aed",
};

export default function ComplaintForm({ onSubmit, loading, feedback }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "", priority: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.category)           e.category    = "Please select a category.";
    if (!form.priority)           e.priority    = "Please select a priority level.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass ONLY the four fields — status is never sent to the backend
    if (validate()) onSubmit({ title: form.title, description: form.description,
                               category: form.category, priority: form.priority });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={styles.form}>

      {/* Title */}
      <div style={styles.field}>
        <label style={styles.label}>Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Brief summary of the issue"
          style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
        />
        {errors.title && <span style={styles.error}>{errors.title}</span>}
      </div>

      {/* Description */}
      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the issue in detail…"
          rows={5}
          style={{
            ...styles.input,
            ...styles.textarea,
            ...(errors.description ? styles.inputError : {}),
          }}
        />
        {errors.description && <span style={styles.error}>{errors.description}</span>}
      </div>

      {/* Category + Priority — side by side */}
      <div style={styles.row}>
        <div style={{ ...styles.field, flex: 1 }}>
          <label style={styles.label}>Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ ...styles.input, width: "100%", ...(errors.category ? styles.inputError : {}) }}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <span style={styles.error}>{errors.category}</span>}
        </div>

        <div style={{ ...styles.field, flex: 1 }}>
          <label style={styles.label}>Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            style={{
              ...styles.input,
              width: "100%",
              ...(errors.priority ? styles.inputError : {}),
              color: form.priority ? PRIORITY_COLORS[form.priority] : "#374151",
              fontWeight: form.priority ? "600" : "400",
            }}
          >
            <option value="" style={{ color: "#374151", fontWeight: 400 }}>
              Select priority
            </option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p} style={{ color: PRIORITY_COLORS[p], fontWeight: 600 }}>
                {p}
              </option>
            ))}
          </select>
          {errors.priority && <span style={styles.error}>{errors.priority}</span>}
        </div>
      </div>

      {/* Status info — read-only, never a field */}
      <div style={styles.statusHint}>
        🔒 Status is automatically set to <strong>Pending</strong> on submission.
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            ...styles.feedback,
            background: feedback.success ? "#dcfce7" : "#fee2e2",
            color:      feedback.success ? "#166534" : "#991b1b",
            borderColor: feedback.success ? "#86efac" : "#fca5a5",
          }}
        >
          {feedback.success ? "✅ " : "⚠️ "}{feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ ...styles.btn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Submitting…" : "Submit Complaint"}
      </button>
    </form>
  );
}

const styles = {
  form:       { display: "flex", flexDirection: "column", gap: "18px" },
  field:      { display: "flex", flexDirection: "column", gap: "6px" },
  row:        { display: "flex", gap: "16px" },
  label:      { fontSize: "13px", fontWeight: "600", color: "#374151", letterSpacing: "0.02em" },
  input: {
    padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #d1d5db",
    fontSize: "14px", background: "#fff", outline: "none",
    transition: "border-color 0.15s", fontFamily: "inherit", color: "#111827",
  },
  inputError: { borderColor: "#ef4444", background: "#fff7f7" },
  textarea:   { resize: "vertical", minHeight: "110px" },
  error:      { fontSize: "12px", color: "#ef4444", marginTop: "2px" },
  statusHint: {
    fontSize: "12px", color: "#6b7280", background: "#f9fafb",
    border: "1px dashed #d1d5db", borderRadius: "6px", padding: "8px 12px",
  },
  feedback: {
    padding: "10px 14px", borderRadius: "8px", fontSize: "14px",
    fontWeight: "500", border: "1px solid",
  },
  btn: {
    padding: "12px", borderRadius: "8px", border: "none",
    background: "#1d4ed8", color: "#fff", fontSize: "15px",
    fontWeight: "600", transition: "background 0.2s", fontFamily: "inherit",
  },
};
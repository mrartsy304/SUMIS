/**
 * RequestForm — FR-05: Service Request Submission
 *
 * Reusable form component for submitting a service request.
 * Props:
 *   departments  — array of { id, name } from GET /api/requests/departments
 *   onSubmit     — function(formData) called on submit
 *   loading      — bool, disables submit while API call is in progress
 *   successMsg   — string shown after successful submission
 *   errorMsg     — string shown on failure
 */
export default function RequestForm({ departments = [], onSubmit, loading, successMsg, errorMsg }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      request_type:  form.request_type.value.trim(),
      description:   form.description.value.trim(),
      department_id: form.department_id.value ? parseInt(form.department_id.value) : null,
    };

    if (!data.request_type) return;
    onSubmit(data);
    form.reset();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>

      {/* Request Type */}
      <div style={styles.field}>
        <label style={styles.label}>Request Type *</label>
        <input
          name="request_type"
          style={styles.input}
          placeholder="e.g. Transcript Request, Library Card, Fee Clearance"
          required
        />
      </div>

      {/* Department */}
      <div style={styles.field}>
        <label style={styles.label}>Department</label>
        <select name="department_id" style={styles.input}>
          <option value="">Select department (optional)</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          name="description"
          style={styles.textarea}
          placeholder="Describe your request in detail..."
          rows={5}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={loading ? { ...styles.btn, ...styles.btnDisabled } : styles.btn}
      >
        {loading ? "Submitting..." : "Submit Request →"}
      </button>

      {/* Feedback messages */}
      {successMsg && <p style={styles.success}>✓ {successMsg}</p>}
      {errorMsg   && <p style={styles.error}>✕ {errorMsg}</p>}
    </form>
  );
}

const styles = {
  form:       { display: "flex", flexDirection: "column", gap: 20 },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  label:      { fontSize: 10, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" },
  input:      { background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", width: "100%" },
  textarea:   { background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", width: "100%" },
  btn:        { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 2, padding: "12px 24px", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em", alignSelf: "flex-start" },
  btnDisabled:{ opacity: 0.5, cursor: "not-allowed" },
  success:    { margin: 0, fontSize: 13, color: "#6ee7b7", fontFamily: "monospace" },
  error:      { margin: 0, fontSize: 13, color: "#fca5a5", fontFamily: "monospace" },
};

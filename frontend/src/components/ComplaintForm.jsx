// ─────────────────────────────────────────────────────────────
//  ComplaintForm — FR-10
//  Reusable form for submitting a new complaint
// ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Internet Issue",
  "Hardware Issue",
  "Software Issue",
  "Hostel Issue",
  "Fee Issue",
  "Academic Issue",
  "Library Issue",
  "Transport Issue",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];

export default function ComplaintForm({ onSubmit, loading = false, errors = {} }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSubmit({
      title:       fd.get("title"),
      description: fd.get("description"),
      category:    fd.get("category"),
      priority:    fd.get("priority"),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Title */}
      <div style={styles.field}>
        <label style={styles.label}>Title <span style={styles.req}>*</span></label>
        <input
          name="title"
          type="text"
          placeholder="Brief summary of your complaint"
          maxLength={200}
          required
          style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
        />
        {errors.title && <p style={styles.fieldError}>{errors.title}</p>}
      </div>

      {/* Description */}
      <div style={styles.field}>
        <label style={styles.label}>Description <span style={styles.req}>*</span></label>
        <textarea
          name="description"
          rows={5}
          placeholder="Describe your complaint in detail (min 20 characters)..."
          required
          style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
        />
        {errors.description && <p style={styles.fieldError}>{errors.description}</p>}
      </div>

      {/* Category */}
      <div style={styles.twoCol}>
        <div style={styles.field}>
          <label style={styles.label}>Category <span style={styles.req}>*</span></label>
          <select
            name="category"
            required
            defaultValue=""
            style={{ ...styles.select, ...(errors.category ? styles.inputError : {}) }}
          >
            <option value="" disabled>Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p style={styles.fieldError}>{errors.category}</p>}
        </div>

        {/* Priority */}
        <div style={styles.field}>
          <label style={styles.label}>Priority <span style={styles.req}>*</span></label>
          <select
            name="priority"
            defaultValue="Medium"
            style={styles.select}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" disabled={loading} style={styles.btn}>
        {loading ? "Submitting..." : "Submit Complaint →"}
      </button>
    </form>
  );
}

const styles = {
  form:       { display: "flex", flexDirection: "column", gap: 20 },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  twoCol:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label:      { fontSize: 12, color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" },
  req:        { color: "#f87171" },
  input:      {
    background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    fontFamily: "inherit", outline: "none",
  },
  textarea:   {
    background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    fontFamily: "inherit", outline: "none", resize: "vertical",
  },
  select:     {
    background: "rgba(15,15,25,0.8)", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 2, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    fontFamily: "inherit", outline: "none", cursor: "pointer",
  },
  inputError: { borderColor: "rgba(239,68,68,0.5)" },
  fieldError: { margin: "2px 0 0", fontSize: 11, color: "#f87171", fontFamily: "monospace" },
  btn:        {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none",
    borderRadius: 2, padding: "12px 24px", color: "#fff", fontSize: 13,
    cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em",
    alignSelf: "flex-start", opacity: 1,
  },
};

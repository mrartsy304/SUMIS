import { useState } from "react";
import { useAuth }        from "../context/AuthContext";
import { complaintsAPI }  from "../services/api";
import Navbar             from "../components/Navbar";

const CATEGORIES = ["Facility", "IT", "Academic", "Administrative", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const PRIORITY_COLORS = {
  Low:      "#22c55e",
  Medium:   "#f59e0b",
  High:     "#ef4444",
  Critical: "#a855f7",
};

const HOW_IT_WORKS = [
  { step: "01", title: "Fill the Form",   desc: "Select category, priority, and describe your complaint." },
  { step: "02", title: "Submit",          desc: "Your complaint is submitted with a 'Pending' status." },
  { step: "03", title: "Review",          desc: "The administration reviews and categorizes your complaint." },
  { step: "04", title: "Resolution",      desc: "You will be notified once the complaint is resolved." },
];

const ALLOWED_ROLES = ["student", "faculty", "staff"];

export default function SubmitComplaint() {
  const { user } = useAuth();

  const [form, setForm]       = useState({ title: "", description: "", category: "", priority: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formKey, setFormKey] = useState(0);

  // Role guard
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div style={s.root}>
        <Navbar />
        <div style={s.denied}>
          <span style={s.deniedIcon}>⛔</span>
          <p style={s.deniedText}>Administrators cannot submit complaints.</p>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.category)           e.category    = "Select a category.";
    if (!form.priority)           e.priority    = "Select a priority level.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await complaintsAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        priority:    form.priority,
      });
      if (res.data.success) {
        setFeedback({ ok: true, msg: `Complaint #${res.data.data.id} submitted — Status: Pending` });
        setForm({ title: "", description: "", category: "", priority: "" });
        setFormKey((k) => k + 1);
      } else {
        setFeedback({ ok: false, msg: res.data.message || "Submission failed." });
      }
    } catch (err) {
      setFeedback({ ok: false, msg: err.response?.data?.message || "Network error. Could not reach server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <Navbar />

      <div style={s.page}>
        {/* Page heading */}
        <div style={s.pageTop}>
          <p style={s.fr}>FR-10</p>
          <h1 style={s.pageTitle}>Complaint Submission</h1>
          <p style={s.pageSub}>Submit a complaint regarding facility, IT, academic, or administrative issues</p>
        </div>

        <div style={s.body}>
          {/* Left: form */}
          <div style={s.left}>
            <p style={s.sectionLabel}>NEW COMPLAINT</p>

            <form key={formKey} onSubmit={handleSubmit} noValidate style={s.form}>

              {/* Title */}
              <div style={s.field}>
                <label style={s.label}>
                  TITLE <span style={s.required}>*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Broken AC in Lab 3, WiFi not working, Grade dispute"
                  style={{ ...s.input, ...(errors.title ? s.inputErr : {}) }}
                />
                {errors.title && <span style={s.errMsg}>{errors.title}</span>}
              </div>

              {/* Category + Priority row */}
              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>
                    CATEGORY <span style={s.required}>*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    style={{ ...s.input, ...s.select, ...(errors.category ? s.inputErr : {}) }}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <span style={s.errMsg}>{errors.category}</span>}
                </div>

                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>
                    PRIORITY <span style={s.required}>*</span>
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    style={{
                      ...s.input,
                      ...s.select,
                      ...(errors.priority ? s.inputErr : {}),
                      color: form.priority ? PRIORITY_COLORS[form.priority] : "#475569",
                    }}
                  >
                    <option value="" style={{ color: "#475569" }}>Select priority</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p} style={{ color: PRIORITY_COLORS[p] }}>{p}</option>
                    ))}
                  </select>
                  {errors.priority && <span style={s.errMsg}>{errors.priority}</span>}
                </div>
              </div>

              {/* Description */}
              <div style={s.field}>
                <label style={s.label}>
                  DESCRIPTION <span style={s.required}>*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail — location, time, impact…"
                  rows={6}
                  style={{ ...s.input, ...s.textarea, ...(errors.description ? s.inputErr : {}) }}
                />
                {errors.description && <span style={s.errMsg}>{errors.description}</span>}
              </div>

              {/* Status hint */}
              <div style={s.statusHint}>
                🔒 Status is automatically set to <strong style={{ color: "#818cf8" }}>Pending</strong> on submission
              </div>

              {/* Feedback */}
              {feedback && (
                <div style={{ ...s.feedback, ...(feedback.ok ? s.feedbackOk : s.feedbackErr) }}>
                  {feedback.ok ? "✅ " : "⚠️ "}{feedback.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Submitting…" : "Submit Complaint →"}
              </button>

            </form>

            {/* API hint */}
            <div style={s.apiHints}>
              <span style={s.apiHint}>+ POST /api/complaints</span>
            </div>
          </div>

          {/* Right: how it works */}
          <div style={s.right}>
            <p style={s.sectionLabel}>HOW IT WORKS</p>
            <div style={s.steps}>
              {HOW_IT_WORKS.map((h) => (
                <div key={h.step} style={s.step}>
                  <div style={s.stepNum}>{h.step}</div>
                  <div>
                    <p style={s.stepTitle}>{h.title}</p>
                    <p style={s.stepDesc}>{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root:      { minHeight: "100vh", background: "#09090f", fontFamily: "Inter, system-ui, sans-serif", color: "#e2e8f0" },
  page:      { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },

  pageTop:   { marginBottom: 36 },
  fr:        { fontSize: 11, color: "#6366f1", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 6 },
  pageTitle: { margin: "0 0 8px", fontSize: 36, fontWeight: 300, color: "#f1f5f9", letterSpacing: "-0.02em" },
  pageSub:   { margin: 0, fontSize: 14, color: "#475569" },

  body:      { display: "flex", gap: 48, alignItems: "flex-start" },
  left:      { flex: "0 0 580px" },
  right:     { flex: 1, paddingTop: 4 },

  sectionLabel: {
    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em",
    color: "#334155", marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 8,
  },

  form:      { display: "flex", flexDirection: "column", gap: 20 },
  field:     { display: "flex", flexDirection: "column", gap: 6 },
  row:       { display: "flex", gap: 16 },

  label: {
    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
    color: "#64748b", fontWeight: "normal",
  },
  required:  { color: "#6366f1" },

  input: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 4,
    padding: "10px 14px",
    fontSize: 13,
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
    outline: "none",
    transition: "border-color 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  select:    { appearance: "none", cursor: "pointer" },
  textarea:  { resize: "vertical", minHeight: 120, lineHeight: 1.6 },
  inputErr:  { borderColor: "#ef4444" },
  errMsg:    { fontSize: 11, color: "#ef4444", fontFamily: "monospace" },

  statusHint: {
    fontSize: 11, color: "#475569", fontFamily: "monospace",
    background: "#0f172a", border: "1px dashed #1e293b",
    borderRadius: 4, padding: "8px 12px",
  },

  feedback: {
    padding: "10px 14px", borderRadius: 4,
    fontSize: 13, fontWeight: 500, border: "1px solid",
  },
  feedbackOk:  { background: "rgba(34,197,94,0.08)",  color: "#4ade80", borderColor: "rgba(34,197,94,0.2)" },
  feedbackErr: { background: "rgba(239,68,68,0.08)",  color: "#f87171", borderColor: "rgba(239,68,68,0.2)" },

  submitBtn: {
    padding: "12px 24px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "monospace",
    letterSpacing: "0.04em",
    alignSelf: "flex-start",
  },

  apiHints:  { marginTop: 20, display: "flex", flexDirection: "column", gap: 4 },
  apiHint:   { fontSize: 11, fontFamily: "monospace", color: "#334155" },

  // How it works
  steps:     { display: "flex", flexDirection: "column", gap: 20 },
  step:      { display: "flex", alignItems: "flex-start", gap: 16 },
  stepNum: {
    flexShrink: 0,
    width: 32, height: 32,
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontFamily: "monospace", color: "#6366f1",
  },
  stepTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  stepDesc:  { margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.6 },

  // Access denied
  denied:     { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 },
  deniedIcon: { fontSize: 40 },
  deniedText: { fontSize: 15, color: "#f87171", fontFamily: "monospace" },
};
/**
 * DepartmentCard — FR-02: Department Information Management
 *
 * Displays a single department's details: name, description, location,
 * contact email, phone, and services offered.
 *
 * Used in both AdminPortal.jsx (admin view) and DepartmentsPage.jsx (student view).
 */
export default function DepartmentCard({ department }) {
  if (!department) return null;

  const {
    name,
    building_location,
    contact_email,
    contact_phone,
    description,
    services,
  } = department;

  return (
    <div style={styles.card}>

      {/* Department name */}
      <h3 style={styles.name}>{name}</h3>

      {/* Description */}
      {description && (
        <p style={styles.description}>{description}</p>
      )}

      <div style={styles.divider} />

      {/* Location */}
      <div style={styles.row}>
        <span style={styles.label}>📍 Location</span>
        <span style={styles.value}>{building_location || "Not specified"}</span>
      </div>

      {/* Email — clickable mailto link */}
      <div style={styles.row}>
        <span style={styles.label}>✉️ Email</span>
        {contact_email ? (
          <a href={`mailto:${contact_email}`} style={styles.link}>
            {contact_email}
          </a>
        ) : (
          <span style={styles.value}>Not specified</span>
        )}
      </div>

      {/* Phone — clickable tel link */}
      <div style={styles.row}>
        <span style={styles.label}>☎ Phone</span>
        {contact_phone ? (
          <a href={`tel:${contact_phone}`} style={styles.link}>
            {contact_phone}
          </a>
        ) : (
          <span style={styles.value}>Not specified</span>
        )}
      </div>

      {/* Services */}
      {services && (
        <div style={{ ...styles.row, marginTop: 4 }}>
          <span style={styles.label}>🛠 Services</span>
          <span style={styles.value}>{services}</span>
        </div>
      )}

    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  card: {
    padding: 24,
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(15,23,42,0.9)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "border-color 0.2s",
  },
  name: {
    margin: 0,
    fontSize: 16,
    color: "#e2e8f0",
    fontFamily: "'Georgia', serif",
    fontWeight: "normal",
  },
  description: {
    margin: 0,
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  divider: {
    height: 1,
    background: "rgba(148,163,184,0.1)",
    margin: "4px 0",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  label: {
    fontSize: 10,
    color: "#475569",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  value: {
    fontSize: 13,
    color: "#cbd5e1",
  },
  link: {
    fontSize: 13,
    color: "#60a5fa",
    textDecoration: "none",
  },
};

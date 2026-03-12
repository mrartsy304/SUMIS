export default function StatCard({ label, value, icon, accent = "#6366f1", sub }) {
  return (
    <div style={{ ...styles.card, borderColor: `${accent}22` }}>
      <div style={{ ...styles.iconWrap, background: `${accent}14`, color: accent }}>
        {icon}
      </div>
      <div>
        <div style={styles.value}>{value}</div>
        <div style={styles.label}>{label}</div>
        {sub && <div style={styles.sub}>{sub}</div>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(15,15,25,0.8)",
    border: "1px solid",
    borderRadius: 2,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  value: {
    fontSize: 26,
    color: "#e2e8f0",
    fontFamily: "'Georgia', serif",
    lineHeight: 1,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontFamily: "monospace",
  },
  sub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
};

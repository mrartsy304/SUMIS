import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <header style={styles.header}>
          <p style={styles.greeting}>Welcome back,</p>
          <h1 style={styles.name}>{user?.name}</h1>
          <span style={styles.role}>{user?.role?.replace("_", " ")}</span>
        </header>

        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>⬡</span>
          <p style={styles.placeholderText}>
            Dashboard content will appear here once the backend APIs are connected.
          </p>
          <p style={styles.placeholderSub}>
            Waiting for Usman's Flask endpoints — <code style={styles.code}>/api/communication/notifications</code> etc.
          </p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },
  header: { marginBottom: 48 },
  greeting: { margin: 0, fontSize: 13, color: "#64748b", fontFamily: "monospace", letterSpacing: "0.05em" },
  name: { margin: "4px 0 8px", fontSize: 36, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  role: {
    display: "inline-block",
    fontSize: 10,
    padding: "3px 12px",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8",
    borderRadius: 2,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontFamily: "monospace",
  },
  placeholder: {
    border: "1px dashed rgba(99,102,241,0.2)",
    borderRadius: 2,
    padding: "64px 32px",
    textAlign: "center",
  },
  placeholderIcon: { fontSize: 40, color: "#1e1e35", display: "block", marginBottom: 16 },
  placeholderText: { margin: "0 0 8px", color: "#475569", fontSize: 15, fontFamily: "'Georgia', serif" },
  placeholderSub: { margin: 0, color: "#334155", fontSize: 12, fontFamily: "monospace" },
  code: { color: "#818cf8" },
};

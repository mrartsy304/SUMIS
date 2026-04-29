import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users (with the correct role) can access it.
 * Usage: <ProtectedRoute roles={["admin"]}><AdminPortal /></ProtectedRoute>
 * If `roles` is empty / omitted, any authenticated user passes through.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <span style={styles.spinner}>◈</span>
        <p style={styles.text}>Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to their correct portal
    const portals = {
      student: "/dashboard/student",
      faculty: "/dashboard/faculty",
      admin: "/dashboard/admin",
    };
    return <Navigate to={portals[user.role] || "/dashboard"} replace />;
  }

  return children;
}

const styles = {
  loading: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  spinner: {
    fontSize: 32,
    color: "#818cf8",
    animation: "spin 2s linear infinite",
  },
  text: {
    color: "#475569",
    fontFamily: "monospace",
    fontSize: 13,
    letterSpacing: "0.1em",
    margin: 0,
  },
};

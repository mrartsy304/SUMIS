/**
 * ProtectedRoute.jsx — SUMIS Route Guard
 *
 * Usage in App.jsx:
 *   <ProtectedRoute>                          → any authenticated user
 *   <ProtectedRoute roles={["admin"]}>        → admin only
 *   <ProtectedRoute roles={["student","faculty","staff"]}> → non-admin roles
 *
 * Behaviour:
 *   - Not logged in             → redirect to /  (login page)
 *   - Logged in, wrong role     → redirect to their own portal (not /)
 *     so an admin who somehow hits /complaints/submit goes to /dashboard/admin
 *   - Logged in, correct role   → renders children
 *   - Auth still loading        → shows a minimal spinner (no flash of /login)
 *
 * Key fix for Network Error chain:
 *   The previous implementation did not distinguish "loading" from "no user",
 *   which caused a redirect to / before AuthContext had finished its /auth/me
 *   check — wiping the session cookie context and making every subsequent
 *   API call appear unauthenticated (axios sees 401 → Network Error cascade).
 *   This version waits for loading to finish before making any redirect decision.
 */

import { Navigate } from "react-router-dom";
import { useAuth }   from "../context/AuthContext";

// Role → portal path mapping (keeps redirect logic DRY)
const ROLE_HOME = {
  student:           "/dashboard/student",
  faculty:           "/dashboard/faculty",
  admin:             "/dashboard/admin",
  staff:             "/dashboard",
  event_coordinator: "/dashboard",
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  // ── 1. Still resolving session — render a neutral spinner ─────────────────
  //    Critical: never redirect here. The session cookie may still be valid;
  //    redirecting now would log the user out visually and break api.js state.
  if (loading) {
    return (
      <div style={styles.spinnerWrap}>
        <div style={styles.spinner} />
        <span style={styles.spinnerLabel}>Verifying session…</span>
      </div>
    );
  }

  // ── 2. Not authenticated at all — go to login ─────────────────────────────
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ── 3. Role check — redirect to the user's own portal, not to "/" ─────────
  //    Using Array.prototype.includes() — NOT === — so multi-role arrays work.
  //    Example: roles={["student","faculty","staff"]} blocks admin correctly.
  if (roles && !roles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || "/";
    return <Navigate to={home} replace />;
  }

  // ── 4. All checks passed — render the protected page ─────────────────────
  return children;
}

// ─── Minimal spinner styles (no external dependency) ─────────────────────────
const styles = {
  spinnerWrap: {
    minHeight:      "100vh",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "16px",
    background:     "#f9fafb",
  },
  spinner: {
    width:           "32px",
    height:          "32px",
    border:          "3px solid #e5e7eb",
    borderTop:       "3px solid #1d4ed8",
    borderRadius:    "50%",
    animation:       "spin 0.7s linear infinite",
  },
  spinnerLabel: {
    fontSize:   "13px",
    color:      "#9ca3af",
    fontFamily: "monospace",
    letterSpacing: "0.04em",
  },
};

// Inject the @keyframes spin once into the document head (no CSS file needed)
if (typeof document !== "undefined") {
  const id = "sumis-protected-route-spin";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}
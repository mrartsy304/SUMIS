import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = {
  student: [
    { label: "Dashboard",        path: "/dashboard/student" },
    { label: "Service Requests", path: "/dashboard/student#service-requests" },
    { label: "Complaints",       path: "/dashboard/student#complaints" },
    { label: "Events",           path: "/dashboard/student#events" },
    { label: "Departments",      path: "/dashboard/student#departments" },
    { label: "Procedures",       path: "/procedures" },   // ← FR-04 added
  ],
  faculty: [
    { label: "Dashboard",      path: "/dashboard/faculty" },
    { label: "Appointments",   path: "/dashboard/faculty#appointments" },
    { label: "Announcements",  path: "/dashboard/faculty#announcements" },
  ],
  admin: [
    { label: "Dashboard",   path: "/dashboard/admin" },
    { label: "Users",       path: "/dashboard/admin#users" },
    { label: "Reports",     path: "/dashboard/admin#reports" },
    { label: "Departments", path: "/dashboard/admin#departments" },
  ],
  staff: [
    { label: "Dashboard", path: "/dashboard" },
  ],
  event_coordinator: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Events",    path: "/dashboard#events" },
  ],
};

const ROLE_COLORS = {
  student:           "#6366f1",
  faculty:           "#0ea5e9",
  admin:             "#f59e0b",
  staff:             "#10b981",
  event_coordinator: "#ec4899",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = NAV_LINKS[user.role] || NAV_LINKS.staff;
  const roleColor = ROLE_COLORS[user.role] || "#6366f1";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Brand */}
        <div style={styles.brand} onClick={() => navigate("/dashboard")} role="button">
          <span style={styles.brandIcon}>◈</span>
          <span style={styles.brandName}>SUMIS</span>
        </div>

        {/* Links */}
        <div style={styles.links}>
          {links.map((l) => {
            const active = location.pathname === l.path.split("#")[0];
            const isProcedures = l.path === "/procedures";
            return (
              <a
                key={l.label}
                href={l.path}
                style={
                  active
                    ? { ...styles.link, ...styles.linkActive }
                    : isProcedures
                    ? { ...styles.link, ...styles.linkProcedures }
                    : styles.link
                }
                onClick={(e) => {
                  e.preventDefault();
                  navigate(l.path.split("#")[0]);
                }}
              >
                {isProcedures ? "📋 " + l.label : l.label}
              </a>
            );
          })}
        </div>

        {/* User pill */}
        <div style={styles.userArea}>
          <div style={{ ...styles.roleBadge, borderColor: roleColor, color: roleColor }}>
            {user.role.replace("_", " ")}
          </div>
          <span style={styles.userName}>{user.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10,10,15,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(99,102,241,0.12)",
  },
  inner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 32px",
    height: 60,
    display: "flex",
    alignItems: "center",
    gap: 32,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    flexShrink: 0,
  },
  brandIcon: { fontSize: 18, color: "#818cf8" },
  brandName: {
    fontSize: 15,
    fontWeight: "normal",
    color: "#e2e8f0",
    letterSpacing: "0.25em",
    fontFamily: "'Georgia', serif",
  },
  links: { display: "flex", gap: 4, flex: 1 },
  link: {
    padding: "6px 14px",
    borderRadius: 2,
    fontSize: 13,
    color: "#64748b",
    textDecoration: "none",
    transition: "color 0.15s",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
  },
  linkActive: { color: "#e2e8f0", background: "rgba(99,102,241,0.1)" },
  linkProcedures: {
    color: "#818cf8",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 4,
  },
  userArea: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  roleBadge: {
    fontSize: 10,
    padding: "3px 10px",
    border: "1px solid",
    borderRadius: 2,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontFamily: "monospace",
  },
  userName: { fontSize: 13, color: "#94a3b8" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 2,
    padding: "5px 12px",
    fontSize: 12,
    color: "#f87171",
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },
};
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
//  MOCK USER — remove this entire block once Usman's /auth/me
//  endpoint is live. Everything else stays the same.
// ─────────────────────────────────────────────────────────────
const MOCK_USERS = {
  student: { id: 1, name: "Abdul Qadir", email: "qadir@sumis.edu", role: "student" },
  faculty: { id: 2, name: "Dr. Imran", email: "imran@sumis.edu", role: "faculty" },
  staff: { id: 3, name: "Staff User", email: "staff@sumis.edu", role: "staff" },
  admin: { id: 4, name: "Admin User", email: "admin@sumis.edu", role: "admin" },
  event_coordinator: { id: 5, name: "Event Coord", email: "events@sumis.edu", role: "event_coordinator" },
};

const USE_MOCK = true; // ← flip to false when backend is ready

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount — try to restore session
  useEffect(() => {
    const restore = async () => {
      if (USE_MOCK) {
        const saved = localStorage.getItem("mock_user");
        if (saved) setUser(JSON.parse(saved));
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.me();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    if (USE_MOCK) {
      // Mock: email prefix determines role  e.g.  admin@... → admin role
      const roleGuess = Object.keys(MOCK_USERS).find((r) =>
        credentials.email.toLowerCase().includes(r)
      );
      const mockUser = MOCK_USERS[roleGuess] || MOCK_USERS.student;
      localStorage.setItem("mock_user", JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
    try {
      const { data } = await authAPI.login(credentials);
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      localStorage.removeItem("mock_user");
      setUser(null);
      return;
    }
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles) => user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;

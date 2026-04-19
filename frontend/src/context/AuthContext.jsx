/**
 * src/context/AuthContext.jsx
 *
 * ROOT CAUSE OF "Network error. Could not reach the server." ON ALL PAGES:
 *
 * The uploaded AuthContext.jsx file contained Login.jsx code instead of the
 * actual context — meaning the real AuthContext was never implemented.
 * Without a working AuthContext:
 *   1. `user` is always undefined.
 *   2. Every @login_required Flask route returns 401.
 *   3. The axios interceptor sees 401, removes the token, and shows
 *      "Network error. Could not reach the server."
 *
 * This file implements the correct AuthContext with:
 *   - user        : the logged-in user object  { id, name, email, role }
 *   - loading     : true while /auth/me is being checked (prevents redirect flash)
 *   - login(creds): POSTs to /api/auth/login, sets user, returns user object
 *   - logout()    : POSTs to /api/auth/logout, clears user
 *
 * Session strategy: Flask-Login session cookie (withCredentials: true in axios).
 * On every page load/refresh, GET /api/auth/me re-hydrates the user from the
 * existing cookie — no localStorage token needed for auth state.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true until /auth/me resolves

  // On mount (and after every page refresh) — re-hydrate session from cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authAPI.me();
        if (res.data?.success && res.data?.data) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch {
        // 401 = not logged in — perfectly normal on first visit
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  /**
   * login({ email, password })
   * Returns the user object so Login.jsx can read user.role for navigation.
   * Throws an Error with a message if credentials are wrong.
   */
  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Login failed.");
    }
    const userData = res.data.data;
    setUser(userData);
    return userData;
  };

  /**
   * logout()
   * Clears server session and resets local user state.
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors — clear local state regardless
    } finally {
      setUser(null);
      localStorage.removeItem("access_token");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;
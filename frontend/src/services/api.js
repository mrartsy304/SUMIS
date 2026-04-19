// src/services/api.js
//
// BUG FIXED:
//   complaintsAPI.getCategories() was calling GET /api/complaints/categories
//   but that route did not exist in the backend — every call returned a 404,
//   which the axios 401 interceptor could mishandle.  The backend route has
//   now been added in app/routes/Complaints.py, so this call is safe.

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL:         BASE_URL,
  headers:         { "Content-Type": "application/json" },
  withCredentials: true,   // required for Flask-Login session cookies
});

// ── Request interceptor: attach Bearer token if present ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 without redirect loop ───────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || "";

      // DO NOT redirect on /auth/me or /auth/login.
      // Those routes legitimately return 401 when the user is not yet logged in.
      // Redirecting here would cause:
      //   me() → 401 → redirect to "/" → me() → 401 → infinite loop
      const isAuthCheck =
        url.includes("/auth/me") || url.includes("/auth/login");

      if (!isAuthCheck) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);


// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:  (credentials) => api.post("/auth/login",  credentials),
  logout: ()            => api.post("/auth/logout"),
  me:     ()            => api.get("/auth/me"),
};


// ── SERVICE REQUESTS — FR-05 ──────────────────────────────────────────────────
export const serviceRequestAPI = {
  getAll:         ()          => api.get("/requests"),
  getById:        (id)        => api.get(`/requests/${id}`),
  getByStudent:   (studentId) => api.get(`/requests/user/${studentId}`),
  create:         (data)      => api.post("/requests", data),
  getDepartments: ()          => api.get("/requests/departments"),
  getCategories:  ()          => api.get("/requests/categories"),
};


// ── COMPLAINTS — FR-10 to FR-13 ───────────────────────────────────────────────
// BUG FIX: getCategories previously called GET /api/complaints/categories which
// did not exist on the backend (404).  The route has been added in Complaints.py.
export const complaintsAPI = {
  getAll:        ()         => api.get("/complaints"),
  getById:       (id)       => api.get(`/complaints/${id}`),
  create:        (data)     => api.post("/complaints", data),
  updateStatus:  (id, data) => api.patch(`/complaints/${id}/status`, data),
  getCategories: ()         => api.get("/complaints/categories"),  // ✅ route now exists
};


// ── COORDINATION — FR-14, FR-15, FR-16 ───────────────────────────────────────
export const coordinationAPI = {
  getAppointments:   ()         => api.get("/coordination/appointments"),
  createAppointment: (data)     => api.post("/coordination/appointments", data),
  updateAppointment: (id, data) => api.put(`/coordination/appointments/${id}`, data),
  getEvents:         ()         => api.get("/coordination/events"),
  registerEvent:     (eventId)  => api.post(`/coordination/events/${eventId}/register`),
};


// ── ANNOUNCEMENTS — FR-17 ─────────────────────────────────────────────────────
export const infoAPI = {
  getAnnouncements:   ()     => api.get("/info_navigation/announcements"),
  getAnnouncement:    (id)   => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement: (data) => api.post("/info_navigation/announcements", data),
};


// ── NOTIFICATIONS — FR-18 ─────────────────────────────────────────────────────
export const communicationAPI = {
  getNotifications: ()   => api.get("/communication/notifications"),
  markRead:         (id) => api.patch(`/communication/notifications/${id}/read`),
};


// ── DEPARTMENTS — FR-02 ───────────────────────────────────────────────────────
export const departmentAPI = {
  getAll:  ()         => api.get("/departments"),
  getById: (id)       => api.get(`/departments/${id}`),
  search:  (query)    => api.get("/departments/search", { params: { q: query } }),
  update:  (id, data) => api.put(`/departments/${id}`, data),
};


// ── STAFF — FR-03 ─────────────────────────────────────────────────────────────
export const staffAPI = {
  getAll:  ()             => api.get("/staff/all"),
  search:  (q, role = "") => api.get("/staff/search", { params: { q, role } }),
  getById: (id)           => api.get(`/staff/${id}`),
};


// ── REPORTING — FR-19, FR-20 ──────────────────────────────────────────────────
export const reportingAPI = {
  getSummary: ()     => api.get("/reporting/summary"),
  getReport:  (type) => api.get(`/reporting/${type}`),
};


export default api;
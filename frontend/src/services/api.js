import axios from "axios";

// ─────────────────────────────────────────────────────────────
//  BASE CONFIGURATION
//  Once Usman's Flask backend is running, update BASE_URL.
//  All endpoints are already wired — just point to the real API.
// ─────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // needed for Flask session cookies / JWT cookie
});

// Attach JWT token if present (for token-based auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — redirect to login on expired session
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────────────
//  AUTH  —  /auth  (Usman's Blueprint)
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// ─────────────────────────────────────────────────────────────
//  INFO & NAVIGATION  —  /info_navigation
// ─────────────────────────────────────────────────────────────
export const infoAPI = {
  getAnnouncements: () => api.get("/info_navigation/announcements"),
  getAnnouncement: (id) => api.get(`/info_navigation/announcements/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  SERVICE REQUESTS  —  /service_requests
// ─────────────────────────────────────────────────────────────
export const serviceRequestAPI = {
  getAll: () => api.get("/service_requests"),
  getById: (id) => api.get(`/service_requests/${id}`),
  create: (data) => api.post("/service_requests", data),
  update: (id, data) => api.put(`/service_requests/${id}`, data),
  delete: (id) => api.delete(`/service_requests/${id}`),
  getStatusHistory: (id) => api.get(`/service_requests/${id}/history`),
};

// ─────────────────────────────────────────────────────────────
//  COMPLAINTS  —  /complaints
// ─────────────────────────────────────────────────────────────
export const complaintsAPI = {
  getAll: () => api.get("/complaints"),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post("/complaints", data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  getCategories: () => api.get("/complaints/categories"),
};

// ─────────────────────────────────────────────────────────────
//  COORDINATION (Appointments + Events)  —  /coordination
// ─────────────────────────────────────────────────────────────
export const coordinationAPI = {
  getAppointments: () => api.get("/coordination/appointments"),
  createAppointment: (data) => api.post("/coordination/appointments", data),
  getEvents: () => api.get("/coordination/events"),
  registerEvent: (eventId) => api.post(`/coordination/events/${eventId}/register`),
};

// ─────────────────────────────────────────────────────────────
//  COMMUNICATION  —  /communication
// ─────────────────────────────────────────────────────────────
export const communicationAPI = {
  getNotifications: () => api.get("/communication/notifications"),
  markRead: (id) => api.patch(`/communication/notifications/${id}/read`),
};

// ─────────────────────────────────────────────────────────────
//  REPORTING  —  /reporting
// ─────────────────────────────────────────────────────────────
export const reportingAPI = {
  getSummary: () => api.get("/reporting/summary"),
  getReport: (type) => api.get(`/reporting/${type}`),
};

export default api;

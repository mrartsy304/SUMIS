import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

// AUTH — User: { id, name, email, role }
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// SERVICE REQUESTS — fields: request_type, description, status, student_id, department_id, created_at
export const serviceRequestAPI = {
  getAll: () => api.get("/service_requests"),
  getById: (id) => api.get(`/service_requests/${id}`),
  create: (data) => api.post("/service_requests", data),   // { request_type, description, department_id }
  update: (id, data) => api.put(`/service_requests/${id}`, data),
  delete: (id) => api.delete(`/service_requests/${id}`),
  getStatusHistory: (id) => api.get(`/service_requests/${id}/history`),
};

// COMPLAINTS — fields: description, priority, status, category_id, department_id, user_id
export const complaintsAPI = {
  getAll: () => api.get("/complaints"),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post("/complaints", data),  // { description, priority, category_id, department_id }
  update: (id, data) => api.put(`/complaints/${id}`, data),
  getCategories: () => api.get("/complaints/categories"),
};

// COORDINATION — Appointment: { student_id, faculty_id, appointment_time, status }
//                Event: { title, description, event_date, capacity }
export const coordinationAPI = {
  getAppointments: () => api.get("/coordination/appointments"),
  createAppointment: (data) => api.post("/coordination/appointments", data), // { faculty_id, appointment_time }
  updateAppointment: (id, data) => api.put(`/coordination/appointments/${id}`, data), // { status }
  getEvents: () => api.get("/coordination/events"),
  registerEvent: (eventId) => api.post(`/coordination/events/${eventId}/register`),
};

// ANNOUNCEMENTS — fields: title, message, created_by, created_at
export const infoAPI = {
  getAnnouncements: () => api.get("/info_navigation/announcements"),
  getAnnouncement: (id) => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement: (data) => api.post("/info_navigation/announcements", data), // { title, message }
};

// NOTIFICATIONS — fields: user_id, message, is_read, created_at
export const communicationAPI = {
  getNotifications: () => api.get("/communication/notifications"),
  markRead: (id) => api.patch(`/communication/notifications/${id}/read`),
};

// DEPARTMENTS — fields: name, office_location, contact_email
export const departmentAPI = {
  getAll: () => api.get("/departments"),
  getById: (id) => api.get(`/departments/${id}`),
};

// REPORTING
export const reportingAPI = {
  getSummary: () => api.get("/reporting/summary"),
  getReport: (type) => api.get(`/reporting/${type}`),
};

export default api;

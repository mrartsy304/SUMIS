import axios from "axios";

// In production: Flask serves the React build from the same origin, so a
// relative "/api" base works perfectly.
//
// In development: React runs on port 3000 and Flask on port 5000.
// The "proxy" field in package.json forwards all /api/* requests from
// the React dev server to Flask so this relative URL works in both modes.
//
// If you have NOT added the proxy to package.json yet, set this env var
// in a .env file in your React project root:
//   REACT_APP_API_URL=http://127.0.0.1:5000/api
const BASE_URL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  // FIX: withCredentials:true + CORS origins:"*" is a browser security
  // violation — the browser blocks the response. Keep withCredentials true
  // only if your backend explicitly allows it (supports_credentials=True
  // AND a specific origin list, not "*"). The Flask CORS config has been
  // updated to match this. If you are still seeing CORS errors in the
  // browser console, temporarily set this to false to isolate the issue.
  withCredentials: false,
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
  login:  (credentials) => api.post("/auth/login", credentials),
  logout: ()            => api.post("/auth/logout"),
  me:     ()            => api.get("/auth/me"),
};

// SERVICE REQUESTS — fields: request_type, description, status, student_id, department_id, created_at
export const serviceRequestAPI = {
  getAll:           ()         => api.get("/service_requests"),
  getById:          (id)       => api.get(`/service_requests/${id}`),
  create:           (data)     => api.post("/service_requests", data),
  update:           (id, data) => api.put(`/service_requests/${id}`, data),
  delete:           (id)       => api.delete(`/service_requests/${id}`),
  getStatusHistory: (id)       => api.get(`/service_requests/${id}/history`),
};

// COMPLAINTS — fields: description, priority, status, category_id, department_id, user_id
export const complaintsAPI = {
  getAll:       ()         => api.get("/complaints"),
  getById:      (id)       => api.get(`/complaints/${id}`),
  create:       (data)     => api.post("/complaints", data),
  update:       (id, data) => api.put(`/complaints/${id}`, data),
  getCategories:()         => api.get("/complaints/categories"),
};

// COORDINATION — Appointment: { student_id, faculty_id, appointment_time, status }
//                Event:       { title, description, event_date, capacity }
export const coordinationAPI = {
  getAppointments:   ()            => api.get("/coordination/appointments"),
  createAppointment: (data)        => api.post("/coordination/appointments", data),
  updateAppointment: (id, data)    => api.put(`/coordination/appointments/${id}`, data),
  getEvents:         ()            => api.get("/coordination/events"),
  registerEvent:     (eventId)     => api.post(`/coordination/events/${eventId}/register`),
};

// ANNOUNCEMENTS — fields: title, message, created_by, created_at
export const infoAPI = {
  getAnnouncements:  ()     => api.get("/info_navigation/announcements"),
  getAnnouncement:   (id)   => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement:(data) => api.post("/info_navigation/announcements", data),
};

// NOTIFICATIONS — fields: user_id, message, is_read, created_at
export const communicationAPI = {
  getNotifications: ()   => api.get("/communication/notifications"),
  markRead:         (id) => api.patch(`/communication/notifications/${id}/read`),
};

// DEPARTMENTS — fields: name, building_location, contact_email, contact_phone, description, services
export const departmentAPI = {
  getAll:  ()         => api.get("/departments"),
  getById: (id)       => api.get(`/departments/${id}`),
  search:  (query)    => api.get("/departments/search", { params: { q: query } }),
  update:  (id, data) => api.put(`/departments/${id}`, data),
};

// LOCATION — FR-01: Campus location query processing
// Returns: { id, name, building_location, building_lat, building_lng }
export const locationAPI = {
  search:     (query) => api.get("/location/search", { params: { q: query } }),
  department: (id)    => api.get(`/location/department/${id}`),
};

// REPORTING
export const reportingAPI = {
  getSummary: ()     => api.get("/reporting/summary"),
  getReport:  (type) => api.get(`/reporting/${type}`),
};

export default api;
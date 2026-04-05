import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
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

// SERVICE REQUESTS — FR-05 Qadir
// fields: request_type, description, status, student_id, department_id, created_at
export const serviceRequestAPI = {
  getAll:          ()              => api.get("/requests"),
  getById:         (id)            => api.get(`/requests/${id}`),
  getByStudent:    (studentId)     => api.get(`/requests/user/${studentId}`),
  create:          (data)          => api.post("/requests", data),
  // POST body: { request_type, description, department_id, student_id }
  getDepartments:  ()              => api.get("/requests/departments"),
  getCategories:   ()              => api.get("/requests/categories"),
};

// COMPLAINTS — fields: description, priority, status, category_id, department_id, user_id
export const complaintsAPI = {
  getAll:        ()         => api.get("/complaints"),
  getById:       (id)       => api.get(`/complaints/${id}`),
  create:        (data)     => api.post("/complaints", data),
  update:        (id, data) => api.put(`/complaints/${id}`, data),
  getCategories: ()         => api.get("/complaints/categories"),
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
  getAnnouncements:   ()     => api.get("/info_navigation/announcements"),
  getAnnouncement:    (id)   => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement: (data) => api.post("/info_navigation/announcements", data),
};

// NOTIFICATIONS — fields: user_id, message, is_read, created_at
export const communicationAPI = {
  getNotifications: ()   => api.get("/communication/notifications"),
  markRead:         (id) => api.patch(`/communication/notifications/${id}/read`),
};

// DEPARTMENTS — FR-02 Ali
// fields: name, building_location, contact_email, contact_phone, description, services
export const departmentAPI = {
  getAll:  ()         => api.get("/departments"),
  getById: (id)       => api.get(`/departments/${id}`),
  search:  (query)    => api.get("/departments/search", { params: { q: query } }),
  update:  (id, data) => api.put(`/departments/${id}`, data),
};

// STAFF — FR-03 Qadir
// fields: id, name, email, role, department, office_location
export const staffAPI = {
  getAll:  ()              => api.get("/staff/all"),
  search:  (q, role = "") => api.get("/staff/search", { params: { q, role } }),
  getById: (id)            => api.get(`/staff/${id}`),
};

// REPORTING
export const reportingAPI = {
  getSummary: ()     => api.get("/reporting/summary"),
  getReport:  (type) => api.get(`/reporting/${type}`),
};

export default api;

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

// SERVICE REQUESTS — FR-05 Usman
export const serviceRequestAPI = {
  getAll:         ()          => api.get("/requests"),
  getById:        (id)        => api.get(`/requests/${id}`),
  getByStudent:   (studentId) => api.get(`/requests/user/${studentId}`),
  create:         (data)      => api.post("/requests", data),
  getDepartments: ()          => api.get("/requests/departments"),
  getCategories:  ()          => api.get("/requests/categories"),
};

// STATUS TRACKING — FR-07 Ali
export const statusTrackingAPI = {
  getByStudent:  (studentId)       => api.get(`/requests/user/${studentId}`),
  getStatus:     (requestId)       => api.get(`/requests/${requestId}/status`),
  updateStatus:  (requestId, data) => api.patch(`/requests/${requestId}/status`, data),
};

// ROUTING — FR-06 Qadir
export const routingAPI = {
  routeRequest:   (id) => api.post(`/routing/route-request/${id}`),
  routeComplaint: (id) => api.post(`/routing/route-complaint/${id}`),
  routeAll:       ()   => api.post("/routing/route-all"),
  getStats:       ()   => api.get("/routing/stats"),
  getPending:     ()   => api.get("/routing/pending"),
};

// DECISION — FR-08 Qadir
// PUT /requests/<id>/decision — body: { decision, remarks, decided_by }
// decision: "approved" | "rejected"
// remarks required when decision === "rejected"
export const decisionAPI = {
  getPendingReview:  ()              => api.get("/requests/pending-review"),
  getByDepartment:   (deptId)        => api.get(`/requests/by-department/${deptId}`),
  processDecision:   (id, data)      => api.put(`/requests/${id}/decision`, data),
  // data: { decision: "approved"|"rejected", remarks: string, decided_by: int }
};

// COMPLAINTS — fields: description, priority, status, category_id, department_id, user_id
export const complaintsAPI = {
  getAll:        ()         => api.get("/complaints"),
  getById:       (id)       => api.get(`/complaints/${id}`),
  create:        (data)     => api.post("/complaints", data),
  update:        (id, data) => api.put(`/complaints/${id}`, data),
  getCategories: ()         => api.get("/complaints/categories"),
};

// COORDINATION
export const coordinationAPI = {
  getAppointments:   ()         => api.get("/coordination/appointments"),
  createAppointment: (data)     => api.post("/coordination/appointments", data),
  updateAppointment: (id, data) => api.put(`/coordination/appointments/${id}`, data),
  getEvents:         ()         => api.get("/coordination/events"),
  registerEvent:     (eventId)  => api.post(`/coordination/events/${eventId}/register`),
};

// ANNOUNCEMENTS
export const infoAPI = {
  getAnnouncements:   ()     => api.get("/info_navigation/announcements"),
  getAnnouncement:    (id)   => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement: (data) => api.post("/info_navigation/announcements", data),
};

// NOTIFICATIONS
export const communicationAPI = {
  getNotifications: ()   => api.get("/communication/notifications"),
  markRead:         (id) => api.patch(`/communication/notifications/${id}/read`),
};

// DEPARTMENTS — FR-02 Ali
export const departmentAPI = {
  getAll:  ()         => api.get("/departments"),
  getById: (id)       => api.get(`/departments/${id}`),
  search:  (query)    => api.get("/departments/search", { params: { q: query } }),
  update:  (id, data) => api.put(`/departments/${id}`, data),
};

// STAFF — FR-03 Qadir
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

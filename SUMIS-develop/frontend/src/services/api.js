import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "/api";

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
    const url = err.config?.url || "";
    const is401 = err.response?.status === 401;
    if (is401 && !url.includes("/auth/me") && !url.includes("/auth/login")) {
      localStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// AUTH
export const authAPI = {
  login:  (credentials) => api.post("/auth/login", credentials),
  logout: ()            => api.post("/auth/logout"),
  me:     ()            => api.get("/auth/me"),
};

// SERVICE REQUESTS — FR-05
export const serviceRequestAPI = {
  getAll:         ()          => api.get("/requests"),
  getById:        (id)        => api.get(`/requests/${id}`),
  getByStudent:   (studentId) => api.get(`/requests/user/${studentId}`),
  create:         (data)      => api.post("/requests", data),
  getDepartments: ()          => api.get("/requests/departments"),
  getCategories:  ()          => api.get("/requests/categories"),
};

// STATUS TRACKING — FR-07
export const statusTrackingAPI = {
  getByStudent: (studentId)       => api.get(`/requests/user/${studentId}`),
  getStatus:    (requestId)       => api.get(`/requests/${requestId}/status`),
  updateStatus: (requestId, data) => api.patch(`/requests/${requestId}/status`, data),
};

// ROUTING — FR-06
export const routingAPI = {
  routeRequest:   (id) => api.post(`/routing/route-request/${id}`),
  routeComplaint: (id) => api.post(`/routing/route-complaint/${id}`),
  routeAll:       ()   => api.post("/routing/route-all"),
  getStats:       ()   => api.get("/routing/stats"),
  getPending:     ()   => api.get("/routing/pending"),
};

// DECISION — FR-08
export const decisionAPI = {
  getPendingReview: ()         => api.get("/requests/pending-review"),
  getByDepartment:  (deptId)   => api.get(`/requests/by-department/${deptId}`),
  processDecision:  (id, data) => api.put(`/requests/${id}/decision`, data),
};

// COMPLETION — FR-09
export const completionAPI = {
  getApproved:     ()         => api.get("/requests/approved"),
  getCompleted:    ()         => api.get("/requests/completed"),
  completeRequest: (id, data) => api.put(`/requests/${id}/complete`, data),
};

// APPOINTMENTS — FR-14
export const appointmentAPI = {
  getFaculty:   ()           => api.get("/appointments/faculty"),
  create:       (data)       => api.post("/appointments", data),
  getByStudent: (studentId)  => api.get("/appointments", { params: { student_id: studentId } }),
  getByFaculty: (facultyId)  => api.get("/appointments", { params: { faculty_id: facultyId } }),
  getAll:       ()           => api.get("/appointments"),
  getById:      (id)         => api.get(`/appointments/${id}`),
  respond:      (id, data)   => api.put(`/appointments/${id}/respond`, data),
  cancel:       (id)         => api.delete(`/appointments/${id}/cancel`),
};

// COMPLAINTS V2 — FR-10 to FR-13
export const complaintsAPI = {
  create:          (data)         => api.post("/complaints", data),
  getAll:          (params)       => api.get("/complaints", { params }),
  getById:         (id, params)   => api.get(`/complaints/${id}`, { params }),
  categorize:      (id, data)     => api.put(`/complaints/${id}/categorize`, data),
  assign:          (id, data)     => api.post(`/complaints/${id}/assign`, data),
  getUnassigned:   (params)       => api.get("/complaints/unassigned", { params }),
  getSupportUnits: ()             => api.get("/complaints/support-units"),
  getStatus:       (id, params)   => api.get(`/complaints/${id}/status`, { params }),
  updateStatus:    (id, data)     => api.put(`/complaints/${id}/status`, data),
  getHistory:      (id, params)   => api.get(`/complaints/${id}/history`, { params }),
};

// DEPARTMENTS — FR-02
export const departmentAPI = {
  getAll:  ()         => api.get("/departments"),
  getById: (id)       => api.get(`/departments/${id}`),
  search:  (query)    => api.get("/departments/search", { params: { q: query } }),
  update:  (id, data) => api.put(`/departments/${id}`, data),
};

// STAFF — FR-03
export const staffAPI = {
  getAll:  ()              => api.get("/staff/all"),
  search:  (q, role = "") => api.get("/staff/search", { params: { q, role } }),
  getById: (id)            => api.get(`/staff/${id}`),
};

// LOCATION — FR-01
export const locationAPI = {
  search:    (q)       => api.get("/location/search", { params: { q } }),
  getAll:    ()        => api.get("/location"),
  getById:   (id)      => api.get(`/location/${id}`),
  buildings: ()        => api.get("/location/buildings"),
  create:    (data)    => api.post("/location", data),
  update:    (id, data)=> api.put(`/location/${id}`, data),
  delete:    (id)      => api.delete(`/location/${id}`),
};

// EVENTS — FR-15
export const eventsAPI = {
  getAll:    ()        => api.get("/events"),
  getById:   (id)      => api.get(`/events/${id}`),
  create:    (data)    => api.post("/events", data),
  update:    (id, data)=> api.put(`/events/${id}`, data),
  register:  (data)    => api.post("/events/register", data),
  cancel:    (regId)   => api.delete(`/events/register/${regId}`),
};

// ATTENDANCE — FR-16
export const attendanceAPI = {
  get:     (eventId)         => api.get(`/events/${eventId}/attendance`),
  mark:    (eventId, data)   => api.post(`/events/${eventId}/attendance`, data),
  bulk:    (eventId, records)=> api.post(`/events/${eventId}/attendance/bulk`, { records }),
  summary: (eventId)         => api.get(`/events/${eventId}/attendance/summary`),
};

// ANNOUNCEMENTS — FR-17
export const announcementsAPI = {
  getAll:   ()        => api.get("/announcements"),
  archive:  ()        => api.get("/announcements/archive"),
  getById:  (id)      => api.get(`/announcements/${id}`),
  create:   (data)    => api.post("/announcements", data),
  update:   (id, data)=> api.put(`/announcements/${id}`, data),
  delete:   (id)      => api.delete(`/announcements/${id}`),
};

// NOTIFICATIONS — FR-18
export const notificationsAPI = {
  create:       (data) => api.post("/notifications", data),
  mine:         ()     => api.get("/notifications/me"),
  unreadCount:  ()     => api.get("/notifications/me/unread-count"),
  markRead:     (id)   => api.post(`/notifications/${id}/read`),
  readAll:      ()     => api.post("/notifications/read-all"),
  delete:       (id)   => api.delete(`/notifications/${id}`),
};

// REPORTS — FR-19
export const reportsAPI = {
  operations: () => api.get("/reports/operations"),
};

// ANALYTICS — FR-20
export const analyticsAPI = {
  serviceDemand: () => api.get("/analytics/service-demand"),
};

// LEGACY (keep for existing code)
export const coordinationAPI = {
  getAppointments:   ()         => api.get("/coordination/appointments"),
  createAppointment: (data)     => api.post("/coordination/appointments", data),
  updateAppointment: (id, data) => api.put(`/coordination/appointments/${id}`, data),
  getEvents:         ()         => api.get("/coordination/events"),
  registerEvent:     (eventId)  => api.post(`/coordination/events/${eventId}/register`),
};

export const infoAPI = {
  getAnnouncements:   ()     => api.get("/info_navigation/announcements"),
  getAnnouncement:    (id)   => api.get(`/info_navigation/announcements/${id}`),
  createAnnouncement: (data) => api.post("/info_navigation/announcements", data),
};

export const communicationAPI = {
  getNotifications: ()   => api.get("/communication/notifications"),
  markRead:         (id) => api.patch(`/communication/notifications/${id}/read`),
};

export const reportingAPI = {
  getSummary: ()     => api.get("/reporting/summary"),
  getReport:  (type) => api.get(`/reporting/${type}`),
};

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// GET /api/procedures?category=academic
export async function fetchProcedures(category = "") {
  const params = category ? { category } : {};
  const { data } = await api.get("/api/procedures", { params });
  return data.data; // { procedures, categories, total }
}

// GET /api/procedures/<id>
export async function fetchProcedureById(id) {
  const { data } = await api.get(`/api/procedures/${id}`);
  return data.data;
}

// POST /api/procedures  (admin)
export async function createProcedure(payload) {
  const { data } = await api.post("/api/procedures", payload);
  return data.data;
}

// PUT /api/procedures/<id>  (admin)
export async function updateProcedure(id, payload) {
  const { data } = await api.put(`/api/procedures/${id}`, payload);
  return data.data;
}

// DELETE /api/procedures/<id>  (admin)
export async function deleteProcedure(id) {
  const { data } = await api.delete(`/api/procedures/${id}`);
  return data;
}
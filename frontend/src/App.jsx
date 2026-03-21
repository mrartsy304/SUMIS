import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentPortal from "./pages/StudentPortal";
import FacultyPortal from "./pages/FacultyPortal";
import AdminPortal from "./pages/AdminPortal";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Generic dashboard (staff / event_coordinator) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Student portal */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute roles={["student", "admin"]}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />

          {/* Faculty portal */}
          <Route
            path="/dashboard/faculty"
            element={
              <ProtectedRoute roles={["faculty", "admin"]}>
                <FacultyPortal />
              </ProtectedRoute>
            }
          />

          {/* Admin portal */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />                                        {/* ← this was missing */}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
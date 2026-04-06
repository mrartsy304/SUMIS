import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import StudentPortal  from "./pages/StudentPortal";
import FacultyPortal  from "./pages/FacultyPortal";
import AdminPortal    from "./pages/AdminPortal";
import Departmentspage from "./pages/Departmentspage";   // FR-02 — Ali
import OfficeLocator  from "./pages/OfficeLocator";      // FR-03 — Qadir

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

          {/* FR-02 — Ali: Department Information Page */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <Departmentspage />
              </ProtectedRoute>
            }
          />

          {/* FR-03 — Qadir: Faculty & Staff Office Locator */}
          <Route
            path="/office-locator"
            element={
              <ProtectedRoute>
                <OfficeLocator />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
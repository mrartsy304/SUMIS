// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import ProtectedRoute    from "./components/ProtectedRoute";

import Login           from "./pages/Login";
import Dashboard       from "./pages/Dashboard";
import StudentPortal   from "./pages/StudentPortal";
import FacultyPortal   from "./pages/FacultyPortal";
import AdminPortal     from "./pages/AdminPortal";
import Departmentspage from "./pages/Departmentspage";
import SubmitRequest   from "./pages/SubmitRequest";
import OfficeLocator   from "./pages/OfficeLocator";
import SubmitComplaint from "./pages/SubmitComplaint";
// FR-10 — complaint views only (NO SubmitComplaint route)
import AdminComplaints from "./pages/AdminComplaints";
import MyComplaints    from "./pages/MyComplaints";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Generic dashboard (staff / event_coordinator) */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Student portal — admin EXCLUDED */}
          <Route path="/dashboard/student" element={
            <ProtectedRoute roles={["student"]}>
              <StudentPortal />
            </ProtectedRoute>
          } />

          {/* Faculty portal — admin EXCLUDED */}
          <Route path="/dashboard/faculty" element={
            <ProtectedRoute roles={["faculty"]}>
              <FacultyPortal />
            </ProtectedRoute>
          } />

          {/* Admin portal — admin ONLY */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPortal />
            </ProtectedRoute>
          } />

          {/* FR-02 */}
          <Route path="/departments" element={
            <ProtectedRoute><Departmentspage /></ProtectedRoute>
          } />

          {/* FR-05 */}
          <Route path="/submit-request" element={
            <ProtectedRoute roles={["student", "faculty", "staff"]}>
              <SubmitRequest />
            </ProtectedRoute>
          } />

          {/* FR-03 */}
          <Route path="/office-locator" element={
            <ProtectedRoute><OfficeLocator /></ProtectedRoute>
          } />

          {/* FR-10: My complaints — student/faculty/staff; inline form is in their portals */}
          <Route path="/complaints/my" element={
            <ProtectedRoute roles={["student", "faculty", "staff"]}>
              <MyComplaints />
            </ProtectedRoute>
          } />
          
          <Route
          path="/complaints/submit"
          element={
         <ProtectedRoute roles={["student", "faculty", "staff"]}>
      <SubmitComplaint />
    </ProtectedRoute>
  }
/>
          {/* FR-10: Admin view */}
          <Route path="/admin/complaints" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminComplaints />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login                        from "./pages/Login";
import Dashboard                    from "./pages/Dashboard";
import StudentPortal                from "./pages/StudentPortal";
import FacultyPortal                from "./pages/FacultyPortal";
import AdminPortal                  from "./pages/AdminPortal";
import Departmentspage              from "./pages/Departmentspage";              // FR-02 — Ali
import OfficeLocator                from "./pages/OfficeLocator";               // FR-03 — Qadir
import SubmitRequest                from "./pages/SubmitRequest";               // FR-05 — Usman
import RequestRoutingView           from "./pages/RequestRoutingView";          // FR-06 — Qadir
import TrackRequests                from "./pages/TrackRequests";               // FR-07 — Ali
import StaffReviewDashboard         from "./pages/StaffReviewDashboard";        // FR-08 — Qadir
import ServiceCompletionDashboard   from "./pages/ServiceCompletionDashboard";  // FR-09 — Usman
import BookAppointment              from "./pages/BookAppointment";             // FR-14 Part 1 — Ali
import FacultyAppointmentDashboard  from "./pages/FacultyAppointmentDashboard"; // FR-14 Part 2 — Ali

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Generic dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Student portal */}
          <Route path="/dashboard/student" element={
            <ProtectedRoute roles={["student", "admin"]}><StudentPortal /></ProtectedRoute>
          } />

          {/* Faculty portal */}
          <Route path="/dashboard/faculty" element={
            <ProtectedRoute roles={["faculty", "admin"]}><FacultyPortal /></ProtectedRoute>
          } />

          {/* Admin portal */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={["admin"]}><AdminPortal /></ProtectedRoute>
          } />

          {/* FR-02 — Ali */}
          <Route path="/departments" element={
            <ProtectedRoute><Departmentspage /></ProtectedRoute>
          } />

          {/* FR-03 — Qadir */}
          <Route path="/office-locator" element={
            <ProtectedRoute><OfficeLocator /></ProtectedRoute>
          } />

          {/* FR-05 — Usman */}
          <Route path="/submit-request" element={
            <ProtectedRoute roles={["student", "admin"]}><SubmitRequest /></ProtectedRoute>
          } />

          {/* FR-06 — Qadir */}
          <Route path="/request-routing" element={
            <ProtectedRoute roles={["admin", "staff"]}><RequestRoutingView /></ProtectedRoute>
          } />

          {/* FR-07 — Ali */}
          <Route path="/track-requests" element={
            <ProtectedRoute roles={["student", "admin"]}><TrackRequests /></ProtectedRoute>
          } />

          {/* FR-08 — Qadir */}
          <Route path="/staff-review" element={
            <ProtectedRoute roles={["admin", "staff"]}><StaffReviewDashboard /></ProtectedRoute>
          } />

          {/* FR-09 — Usman */}
          <Route path="/service-completion" element={
            <ProtectedRoute roles={["admin", "staff"]}><ServiceCompletionDashboard /></ProtectedRoute>
          } />

          {/* FR-14 Part 1 — Ali: Student appointment booking */}
          <Route path="/book-appointment" element={
            <ProtectedRoute roles={["student", "admin"]}><BookAppointment /></ProtectedRoute>
          } />

          {/* FR-14 Part 2 — Ali: Faculty appointment response dashboard */}
          <Route path="/faculty-appointments" element={
            <ProtectedRoute roles={["faculty", "admin"]}><FacultyAppointmentDashboard /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

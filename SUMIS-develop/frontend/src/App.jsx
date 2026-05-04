import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login                        from "./pages/Login";
import Dashboard                    from "./pages/Dashboard";
import StudentPortal                from "./pages/StudentPortal";
import FacultyPortal                from "./pages/FacultyPortal";
import AdminPortal                  from "./pages/AdminPortal";
import StaffPortal                  from "./pages/StaffPortal";
import CoordinatorPortal            from "./pages/CoordinatorPortal";
import Departmentspage              from "./pages/Departmentspage";
import OfficeLocator                from "./pages/OfficeLocator";
import SubmitRequest                from "./pages/SubmitRequest";
import RequestRoutingView           from "./pages/RequestRoutingView";
import TrackRequests                from "./pages/TrackRequests";
import StaffReviewDashboard         from "./pages/StaffReviewDashboard";
import ServiceCompletionDashboard   from "./pages/ServiceCompletionDashboard";
import BookAppointment              from "./pages/BookAppointment";
import FacultyAppointmentDashboard  from "./pages/FacultyAppointmentDashboard";
import SubmitComplaint              from "./pages/SubmitComplaint";
import ComplaintDetail              from "./pages/ComplaintDetail";
import AdminComplaints              from "./pages/AdminComplaints";

// New FRs
import Events                       from "./pages/Events";
import EventAttendance              from "./pages/EventAttendance";
import AnnouncementBoard            from "./pages/AnnouncementBoard";
import ManageAnnouncements          from "./pages/ManageAnnouncements";
import Notifications                from "./pages/Notifications";
import OperationsReport             from "./pages/OperationsReport";
import DemandAnalytics              from "./pages/DemandAnalytics";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Generic dashboard — redirects to role-specific portal */}
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

          {/* Staff portal — FIX: was rendering <Dashboard /> causing redirect loop */}
          <Route path="/dashboard/staff" element={
            <ProtectedRoute roles={["staff", "admin"]}><StaffPortal /></ProtectedRoute>
          } />

          {/* Event coordinator portal — FIX: was rendering <Dashboard /> causing redirect loop */}
          <Route path="/dashboard/coordinator" element={
            <ProtectedRoute roles={["event_coordinator", "admin"]}><CoordinatorPortal /></ProtectedRoute>
          } />

          {/* FR-02 */}
          <Route path="/departments" element={
            <ProtectedRoute><Departmentspage /></ProtectedRoute>
          } />

          {/* FR-01 */}
          <Route path="/office-locator" element={
            <ProtectedRoute><OfficeLocator /></ProtectedRoute>
          } />

          {/* FR-05 */}
          <Route path="/submit-request" element={
            <ProtectedRoute roles={["student", "admin"]}><SubmitRequest /></ProtectedRoute>
          } />

          {/* FR-06 */}
          <Route path="/request-routing" element={
            <ProtectedRoute roles={["admin", "staff"]}><RequestRoutingView /></ProtectedRoute>
          } />

          {/* FR-07 */}
          <Route path="/track-requests" element={
            <ProtectedRoute roles={["student", "admin"]}><TrackRequests /></ProtectedRoute>
          } />

          {/* FR-08 */}
          <Route path="/staff-review" element={
            <ProtectedRoute roles={["admin", "staff"]}><StaffReviewDashboard /></ProtectedRoute>
          } />

          {/* FR-09 */}
          <Route path="/service-completion" element={
            <ProtectedRoute roles={["admin", "staff"]}><ServiceCompletionDashboard /></ProtectedRoute>
          } />

          {/* FR-14 Part 1 */}
          <Route path="/book-appointment" element={
            <ProtectedRoute roles={["student", "admin"]}><BookAppointment /></ProtectedRoute>
          } />

          {/* FR-14 Part 2 */}
          <Route path="/faculty-appointments" element={
            <ProtectedRoute roles={["faculty", "admin"]}><FacultyAppointmentDashboard /></ProtectedRoute>
          } />

          {/* FR-10 */}
          <Route path="/complaints/submit" element={
            <ProtectedRoute roles={["student", "faculty", "staff"]}><SubmitComplaint /></ProtectedRoute>
          } />

          {/* FR-13 */}
          <Route path="/complaints/:id" element={
            <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
          } />

          {/* FR-11/12/13 */}
          <Route path="/admin/complaints" element={
            <ProtectedRoute roles={["admin"]}><AdminComplaints /></ProtectedRoute>
          } />

          {/* FR-15 */}
          <Route path="/events" element={
            <ProtectedRoute><Events /></ProtectedRoute>
          } />

          {/* FR-16 — FIX: "coordinator" → "event_coordinator" */}
          <Route path="/events/:id/attendance" element={
            <ProtectedRoute roles={["event_coordinator", "admin", "staff"]}><EventAttendance /></ProtectedRoute>
          } />

          {/* FR-17 */}
          <Route path="/announcements" element={
            <ProtectedRoute><AnnouncementBoard /></ProtectedRoute>
          } />

          {/* FR-17 manage — FIX: "coordinator" → "event_coordinator" */}
          <Route path="/admin/announcements" element={
            <ProtectedRoute roles={["admin", "event_coordinator"]}><ManageAnnouncements /></ProtectedRoute>
          } />

          {/* FR-18 */}
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />

          {/* FR-19 — FIX: "coordinator" → "event_coordinator" */}
          <Route path="/reports/operations" element={
            <ProtectedRoute roles={["admin", "event_coordinator", "staff"]}><OperationsReport /></ProtectedRoute>
          } />

          {/* FR-20 — FIX: "coordinator" → "event_coordinator" */}
          <Route path="/analytics/demand" element={
            <ProtectedRoute roles={["admin", "event_coordinator", "staff"]}><DemandAnalytics /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
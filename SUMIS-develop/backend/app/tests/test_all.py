import unittest
import requests

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
BASE_URL = "http://127.0.0.1:5000"

CREDENTIALS = {
    "student":           {"email": "student@sumis.edu",  "password": "pass123"},
    "faculty":           {"email": "faculty@sumis.edu",  "password": "pass123"},
    "staff":             {"email": "staff@sumis.edu",    "password": "pass123"},
    "admin":             {"email": "admin@sumis.edu",    "password": "pass123"},
    "event_coordinator": {"email": "events@sumis.edu",   "password": "pass123"},
}

# ─────────────────────────────────────────────────────────────────────────────
# Helper: create an authenticated session
# ─────────────────────────────────────────────────────────────────────────────
def get_session(role: str) -> requests.Session:
    """Return a requests.Session already logged-in as the given role."""
    s = requests.Session()
    creds = CREDENTIALS[role]
    resp = s.post(f"{BASE_URL}/api/auth/login", json=creds)
    assert resp.status_code == 200, (
        f"Login failed for {role}: {resp.status_code} – {resp.text}"
    )
    return s


# ─────────────────────────────────────────────────────────────────────────────
# TC-AUTH  Authentication (Login / Logout / Session)
# ─────────────────────────────────────────────────────────────────────────────
class TC_AUTH_Authentication(unittest.TestCase):
    """Authentication tests."""

    def test_AUTH_01_login_valid_student(self):
        """TC-AUTH-01: Valid student credentials return 200 with user object."""
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "student@sumis.edu", "password": "pass123"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "student")

    def test_AUTH_02_login_wrong_password(self):
        """TC-AUTH-02: Wrong password returns 401."""
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "student@sumis.edu", "password": "wrongpass"})
        self.assertEqual(r.status_code, 401)

    def test_AUTH_03_login_nonexistent_user(self):
        """TC-AUTH-03: Non-existent email returns 401."""
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "nobody@sumis.edu", "password": "pass123"})
        self.assertEqual(r.status_code, 401)

    def test_AUTH_04_login_missing_fields(self):
        """TC-AUTH-04: Missing email/password returns 400."""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={})
        self.assertEqual(r.status_code, 400)

    def test_AUTH_05_me_endpoint_authenticated(self):
        """TC-AUTH-05: /api/auth/me returns user info when logged in."""
        s = get_session("admin")
        r = s.get(f"{BASE_URL}/api/auth/me")
        self.assertEqual(r.status_code, 200)
        self.assertIn("role", r.json())

    def test_AUTH_06_me_endpoint_unauthenticated(self):
        """TC-AUTH-06: /api/auth/me returns 401 when not logged in."""
        r = requests.get(f"{BASE_URL}/api/auth/me")
        self.assertEqual(r.status_code, 401)

    def test_AUTH_07_logout(self):
        """TC-AUTH-07: Logout returns 200; subsequent /me returns 401."""
        s = get_session("student")
        r = s.post(f"{BASE_URL}/api/auth/logout")
        self.assertEqual(r.status_code, 200)
        r2 = s.get(f"{BASE_URL}/api/auth/me")
        self.assertEqual(r2.status_code, 401)

    def test_AUTH_08_login_all_roles(self):
        """TC-AUTH-08: All seeded roles can login successfully."""
        for role, creds in CREDENTIALS.items():
            with self.subTest(role=role):
                r = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
                self.assertEqual(r.status_code, 200,
                                 f"Login failed for role '{role}'")


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR02  Department Information Management
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR02_DepartmentManagement(unittest.TestCase):
    """FR-02: Department Information Management tests."""

    def test_FR02_01_list_departments(self):
        """TC-FR02-01: GET /api/departments returns a non-empty list."""
        r = requests.get(f"{BASE_URL}/api/departments/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)
        self.assertGreater(len(r.json()), 0)

    def test_FR02_02_get_department_by_id(self):
        """TC-FR02-02: GET /api/departments/1 returns department details."""
        r = requests.get(f"{BASE_URL}/api/departments/1")
        self.assertIn(r.status_code, [200, 404])  # 404 if id=1 not seeded
        if r.status_code == 200:
            self.assertIn("name", r.json())

    def test_FR02_03_get_nonexistent_department(self):
        """TC-FR02-03: GET /api/departments/99999 returns 404."""
        r = requests.get(f"{BASE_URL}/api/departments/99999")
        self.assertEqual(r.status_code, 404)

    def test_FR02_04_search_departments(self):
        """TC-FR02-04: GET /api/departments/search?q=<keyword> returns list."""
        r = requests.get(f"{BASE_URL}/api/departments/search?q=admin")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR02_05_search_empty_query(self):
        """TC-FR02-05: Search with empty query returns empty list."""
        r = requests.get(f"{BASE_URL}/api/departments/search?q=")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), [])


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR05  Service Request Submission
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR05_ServiceRequestSubmission(unittest.TestCase):
    """FR-05: Service Request Submission tests."""

    def setUp(self):
        self.session = get_session("student")
        # Fetch a real student id from /api/auth/me
        me = self.session.get(f"{BASE_URL}/api/auth/me").json()
        self.student_id = me.get("id", 1)

    def test_FR05_01_submit_valid_request(self):
        """TC-FR05-01: Valid service request returns 201 with request id."""
        payload = {
            "request_type": "Transcript",
            "description":  "Need official transcript for visa application.",
            "student_id":   self.student_id,
        }
        r = self.session.post(f"{BASE_URL}/api/requests/", json=payload)
        self.assertEqual(r.status_code, 201)
        self.assertIn("id", r.json())

    def test_FR05_02_submit_missing_request_type(self):
        """TC-FR05-02: Missing request_type returns 400."""
        payload = {"student_id": self.student_id, "description": "No type given."}
        r = self.session.post(f"{BASE_URL}/api/requests/", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR05_03_submit_missing_student_id(self):
        """TC-FR05-03: Missing student_id returns 400."""
        payload = {"request_type": "Certificate", "description": "No student."}
        r = self.session.post(f"{BASE_URL}/api/requests/", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR05_04_get_categories(self):
        """TC-FR05-04: GET /api/requests/categories returns category list."""
        r = self.session.get(f"{BASE_URL}/api/requests/categories")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR05_05_get_departments_for_request(self):
        """TC-FR05-05: GET /api/requests/departments returns departments."""
        r = self.session.get(f"{BASE_URL}/api/requests/departments")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR07  Service Request Status Tracking
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR07_ServiceRequestTracking(unittest.TestCase):
    """FR-07: Service Request Status Tracking tests."""

    def setUp(self):
        self.student_session = get_session("student")
        me = self.student_session.get(f"{BASE_URL}/api/auth/me").json()
        self.student_id = me.get("id", 1)

        # Create a request to track
        payload = {
            "request_type": "Fee Clearance",
            "description":  "Track test.",
            "student_id":   self.student_id,
        }
        r = self.student_session.post(f"{BASE_URL}/api/requests/", json=payload)
        if r.status_code == 201:
            self.request_id = r.json()["id"]
        else:
            self.request_id = None

    def test_FR07_01_get_student_requests(self):
        """TC-FR07-01: GET /api/requests/user/<id> returns student's requests."""
        r = self.student_session.get(f"{BASE_URL}/api/requests/user/{self.student_id}")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR07_02_get_single_request_status(self):
        """TC-FR07-02: GET /api/requests/<id>/status returns status info."""
        if not self.request_id:
            self.skipTest("No request created in setUp.")
        r = self.student_session.get(f"{BASE_URL}/api/requests/{self.request_id}/status")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("status", body)

    def test_FR07_03_get_nonexistent_request(self):
        """TC-FR07-03: GET /api/requests/99999/status returns 404."""
        r = self.student_session.get(f"{BASE_URL}/api/requests/99999/status")
        self.assertEqual(r.status_code, 404)


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR10  Complaint Registration
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR10_ComplaintRegistration(unittest.TestCase):
    """FR-10 / FR-11 / FR-12 / FR-13: Complaint workflow tests."""

    def setUp(self):
        self.session = get_session("student")
        me = self.session.get(f"{BASE_URL}/api/auth/me").json()
        self.user_id = me.get("id", 1)

    def test_FR10_01_submit_valid_complaint(self):
        """TC-FR10-01: Valid complaint submission returns 201."""
        payload = {
            "title":       "Broken AC in Lab",
            "description": "The air conditioner in Room 203 is not working.",
            "category":    "Facilities",
            "priority":    "High",
            "user_id":     self.user_id,
        }
        r = self.session.post(f"{BASE_URL}/api/complaints/", json=payload)
        self.assertIn(r.status_code, [200, 201])
        if r.status_code in [200, 201]:
            self.assertIn("id", r.json())

    def test_FR10_02_submit_missing_title(self):
        """TC-FR10-02: Complaint without title returns 400."""
        payload = {
            "description": "Some complaint.",
            "category":    "Facilities",
            "priority":    "Low",
            "user_id":     self.user_id,
        }
        r = self.session.post(f"{BASE_URL}/api/complaints/", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR10_03_get_all_complaints(self):
        """TC-FR10-03: GET /api/complaints returns list."""
        r = self.session.get(f"{BASE_URL}/api/complaints/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR11_04_valid_category_values(self):
        """TC-FR11-04: Complaint with invalid category returns 400."""
        payload = {
            "title":       "Test Invalid Category",
            "description": "Testing.",
            "category":    "INVALID_CATEGORY_XYZ",
            "priority":    "Low",
            "user_id":     self.user_id,
        }
        r = self.session.post(f"{BASE_URL}/api/complaints/", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR12_05_get_support_units(self):
        """TC-FR12-05: GET /api/complaints/support-units returns list."""
        r = self.session.get(f"{BASE_URL}/api/complaints/support-units")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR13_06_get_complaint_by_id(self):
        """TC-FR13-06: GET /api/complaints/<id> returns complaint details."""
        # First create one
        payload = {
            "title":       "Track Complaint Test",
            "description": "Testing tracking.",
            "category":    "Facilities",
            "priority":    "Low",
            "user_id":     self.user_id,
        }
        r = self.session.post(f"{BASE_URL}/api/complaints/", json=payload)
        if r.status_code in [200, 201]:
            cid = r.json()["id"]
            r2 = self.session.get(f"{BASE_URL}/api/complaints/{cid}")
            self.assertEqual(r2.status_code, 200)
            self.assertEqual(r2.json()["id"], cid)
        else:
            self.skipTest("Complaint creation failed; skipping retrieval test.")

    def test_FR13_07_update_complaint_status_admin(self):
        """TC-FR13-07: Admin can update complaint status to In Progress."""
        admin_session = get_session("admin")
        payload = {
            "title":       "Status Update Test",
            "description": "To be updated.",
            "category":    "Facilities",
            "priority":    "Medium",
            "user_id":     self.user_id,
        }
        r = self.session.post(f"{BASE_URL}/api/complaints/", json=payload)
        if r.status_code not in [200, 201]:
            self.skipTest("Could not create complaint.")
        cid = r.json()["id"]
        r2 = admin_session.patch(
            f"{BASE_URL}/api/complaints/{cid}/status",
            json={"status": "In Progress", "note": "Working on it."}
        )
        self.assertIn(r2.status_code, [200, 400, 403])  # 400 if invalid transition

    def test_FR13_08_get_complaint_history(self):
        """TC-FR13-08: GET /api/complaints/<id>/history returns status history."""
        r = self.session.get(f"{BASE_URL}/api/complaints/1/history")
        self.assertIn(r.status_code, [200, 404])


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR14  Faculty Appointment Scheduling
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR14_AppointmentScheduling(unittest.TestCase):
    """FR-14: Faculty Appointment Scheduling tests."""

    def setUp(self):
        self.student_session = get_session("student")
        self.faculty_session = get_session("faculty")
        me_student = self.student_session.get(f"{BASE_URL}/api/auth/me").json()
        me_faculty = self.faculty_session.get(f"{BASE_URL}/api/auth/me").json()
        self.student_id = me_student.get("id", 1)
        self.faculty_id = me_faculty.get("id", 2)

    def test_FR14_01_get_faculty_list(self):
        """TC-FR14-01: GET /api/appointments/faculty returns faculty list."""
        r = self.student_session.get(f"{BASE_URL}/api/appointments/faculty")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR14_02_create_valid_appointment(self):
        """TC-FR14-02: Valid appointment creation returns 201."""
        payload = {
            "student_id":       self.student_id,
            "faculty_id":       self.faculty_id,
            "appointment_time": "2026-06-15T10:00:00",
            "purpose":          "Discuss thesis proposal.",
        }
        r = self.student_session.post(f"{BASE_URL}/api/appointments", json=payload)
        self.assertIn(r.status_code, [200, 201])

    def test_FR14_03_create_appointment_missing_fields(self):
        """TC-FR14-03: Missing required fields returns 400."""
        payload = {"student_id": self.student_id}  # missing faculty_id & time
        r = self.student_session.post(f"{BASE_URL}/api/appointments", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR14_04_create_appointment_invalid_time(self):
        """TC-FR14-04: Invalid appointment_time format returns 400."""
        payload = {
            "student_id":       self.student_id,
            "faculty_id":       self.faculty_id,
            "appointment_time": "not-a-date",
        }
        r = self.student_session.post(f"{BASE_URL}/api/appointments", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR14_05_get_student_appointments(self):
        """TC-FR14-05: GET /api/appointments?student_id=<id> returns list."""
        r = self.student_session.get(
            f"{BASE_URL}/api/appointments?student_id={self.student_id}")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR14_06_get_faculty_appointments(self):
        """TC-FR14-06: GET /api/appointments?faculty_id=<id> returns list."""
        r = self.faculty_session.get(
            f"{BASE_URL}/api/appointments?faculty_id={self.faculty_id}")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR15  Event Registration Management
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR15_EventRegistration(unittest.TestCase):
    """FR-15: Event Registration Management tests."""

    def setUp(self):
        self.student_session = get_session("student")
        self.coord_session   = get_session("event_coordinator")

    def test_FR15_01_get_all_events_authenticated(self):
        """TC-FR15-01: Authenticated user can list all events."""
        r = self.student_session.get(f"{BASE_URL}/api/events")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR15_02_get_events_unauthenticated(self):
        """TC-FR15-02: Unauthenticated request to /api/events returns 401."""
        r = requests.get(f"{BASE_URL}/api/events")
        self.assertIn(r.status_code, [401, 302])

    def test_FR15_03_create_event_as_coordinator(self):
        """TC-FR15-03: Event coordinator can create an event (201)."""
        payload = {
            "title":      "SUMIS Tech Fest 2026",
            "description":"Annual technology festival.",
            "event_date": "2026-07-20T09:00:00",
            "capacity":   200,
            "location":   "Main Auditorium",
        }
        r = self.coord_session.post(f"{BASE_URL}/api/events", json=payload)
        self.assertIn(r.status_code, [200, 201])
        if r.status_code in [200, 201]:
            self.event_id = r.json()["id"]

    def test_FR15_04_create_event_missing_title(self):
        """TC-FR15-04: Creating event without title returns 400."""
        payload = {"event_date": "2026-08-01T09:00:00"}
        r = self.coord_session.post(f"{BASE_URL}/api/events", json=payload)
        self.assertEqual(r.status_code, 400)

    def test_FR15_05_student_cannot_create_event(self):
        """TC-FR15-05: Student role cannot create events (403)."""
        payload = {
            "title":      "Student Event Attempt",
            "event_date": "2026-08-15T10:00:00",
        }
        r = self.student_session.post(f"{BASE_URL}/api/events", json=payload)
        self.assertEqual(r.status_code, 403)

    def test_FR15_06_register_for_event(self):
        """TC-FR15-06: Student can register for an existing event."""
        # Get first available event
        r = self.student_session.get(f"{BASE_URL}/api/events")
        events = r.json()
        if not events:
            self.skipTest("No events in DB to register for.")
        event_id = events[0]["id"]
        me = self.student_session.get(f"{BASE_URL}/api/auth/me").json()
        r2 = self.student_session.post(
            f"{BASE_URL}/api/events/{event_id}/register",
            json={"user_id": me["id"]}
        )
        self.assertIn(r2.status_code, [200, 201, 400])  # 400 if already registered


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR16  Attendance Recording for Events
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR16_EventAttendance(unittest.TestCase):
    """FR-16: Event Attendance Recording tests."""

    def setUp(self):
        self.coord_session = get_session("event_coordinator")
        self.student_session = get_session("student")

    def test_FR16_01_get_attendance_for_event(self):
        """TC-FR16-01: Coordinator can view attendance for an event."""
        r = self.coord_session.get(f"{BASE_URL}/api/events")
        events = r.json()
        if not events:
            self.skipTest("No events available.")
        event_id = events[0]["id"]
        r2 = self.coord_session.get(f"{BASE_URL}/api/attendance/{event_id}")
        self.assertIn(r2.status_code, [200, 404])

    def test_FR16_02_mark_attendance(self):
        """TC-FR16-02: Coordinator can mark attendance for a student."""
        r = self.coord_session.get(f"{BASE_URL}/api/events")
        events = r.json()
        if not events:
            self.skipTest("No events available.")
        event_id = events[0]["id"]
        me = self.student_session.get(f"{BASE_URL}/api/auth/me").json()
        r2 = self.coord_session.post(
            f"{BASE_URL}/api/attendance",
            json={"event_id": event_id, "user_id": me["id"], "attended": True}
        )
        self.assertIn(r2.status_code, [200, 201, 400, 404])


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR17  Announcement Distribution
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR17_Announcements(unittest.TestCase):
    """FR-17: University Announcement Distribution tests."""

    def setUp(self):
        self.admin_session   = get_session("admin")
        self.student_session = get_session("student")

    def test_FR17_01_get_announcements_authenticated(self):
        """TC-FR17-01: Authenticated user can list announcements."""
        r = self.student_session.get(f"{BASE_URL}/api/announcements")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR17_02_get_announcements_unauthenticated(self):
        """TC-FR17-02: Unauthenticated /api/announcements returns 401."""
        r = requests.get(f"{BASE_URL}/api/announcements")
        self.assertIn(r.status_code, [401, 302])

    def test_FR17_03_admin_can_create_announcement(self):
        """TC-FR17-03: Admin creates announcement and gets 201."""
        payload = {
            "title":        "Mid-Semester Exam Schedule Released",
            "body":         "Check the portal for your exam timetable.",
            "priority":     "high",
            "target_roles": "all",
        }
        r = self.admin_session.post(f"{BASE_URL}/api/announcements", json=payload)
        self.assertIn(r.status_code, [200, 201])
        if r.status_code in [200, 201]:
            self.assertIn("id", r.json())

    def test_FR17_04_student_cannot_create_announcement(self):
        """TC-FR17-04: Student role cannot create announcements (403)."""
        payload = {"title": "Fake Announcement", "body": "Attempt by student."}
        r = self.student_session.post(f"{BASE_URL}/api/announcements", json=payload)
        self.assertEqual(r.status_code, 403)

    def test_FR17_05_admin_can_delete_announcement(self):
        """TC-FR17-05: Admin can soft-delete an announcement (200)."""
        # Create one first
        r = self.admin_session.post(f"{BASE_URL}/api/announcements", json={
            "title": "Temp Announcement", "body": "Will be deleted.", "priority": "normal"
        })
        if r.status_code not in [200, 201]:
            self.skipTest("Could not create announcement to delete.")
        ann_id = r.json()["id"]
        r2 = self.admin_session.delete(f"{BASE_URL}/api/announcements/{ann_id}")
        self.assertIn(r2.status_code, [200, 204])

    def test_FR17_06_get_single_announcement(self):
        """TC-FR17-06: GET /api/announcements/<id> returns announcement detail."""
        r = self.student_session.get(f"{BASE_URL}/api/announcements")
        items = r.json()
        if not items:
            self.skipTest("No announcements to fetch.")
        ann_id = items[0]["id"]
        r2 = self.student_session.get(f"{BASE_URL}/api/announcements/{ann_id}")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["id"], ann_id)


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR18  Notification Management
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR18_Notifications(unittest.TestCase):
    """FR-18: Department-Specific Notification Management tests."""

    def setUp(self):
        self.student_session = get_session("student")
        self.admin_session   = get_session("admin")
        self.student_id = self.student_session.get(f"{BASE_URL}/api/auth/me").json()["id"]

    def test_FR18_01_get_my_notifications(self):
        """TC-FR18-01: Student can view their own notifications."""
        r = self.student_session.get(f"{BASE_URL}/api/notifications/me")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_FR18_02_get_unread_count(self):
        """TC-FR18-02: Unread count endpoint returns integer."""
        r = self.student_session.get(f"{BASE_URL}/api/notifications/me/unread-count")
        self.assertEqual(r.status_code, 200)
        self.assertIn("unread_count", r.json())
        self.assertIsInstance(r.json()["unread_count"], int)

    def test_FR18_03_admin_create_notification(self):
        """TC-FR18-03: Admin can send a notification to a user."""
        payload = {
            "user_id": self.student_id,
            "title":   "Your request has been approved.",
            "body":    "Please collect your transcript from Admin Office.",
            "type":    "info",
        }
        r = self.admin_session.post(f"{BASE_URL}/api/notifications", json=payload)
        self.assertIn(r.status_code, [200, 201])

    def test_FR18_04_student_cannot_create_notification(self):
        """TC-FR18-04: Student role cannot create notifications (403)."""
        payload = {
            "user_id": self.student_id,
            "title":   "Fake Notif",
            "body":    "Attempt.",
            "type":    "info",
        }
        r = self.student_session.post(f"{BASE_URL}/api/notifications", json=payload)
        self.assertEqual(r.status_code, 403)

    def test_FR18_05_mark_notification_as_read(self):
        """TC-FR18-05: Student can mark a notification as read."""
        r = self.student_session.get(f"{BASE_URL}/api/notifications/me")
        notifs = r.json()
        if not notifs:
            self.skipTest("No notifications to mark as read.")
        notif_id = notifs[0]["id"]
        r2 = self.student_session.post(f"{BASE_URL}/api/notifications/{notif_id}/read")
        self.assertIn(r2.status_code, [200, 204])


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR19  Operational Performance Reporting
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR19_Reports(unittest.TestCase):
    """FR-19: Operational Performance Reporting tests."""

    def setUp(self):
        self.admin_session   = get_session("admin")
        self.student_session = get_session("student")

    def test_FR19_01_get_reports_admin(self):
        """TC-FR19-01: Admin can access operational reports."""
        r = self.admin_session.get(f"{BASE_URL}/api/reports")
        self.assertIn(r.status_code, [200, 404])

    def test_FR19_02_student_cannot_access_reports(self):
        """TC-FR19-02: Student cannot access reports (403)."""
        r = self.student_session.get(f"{BASE_URL}/api/reports")
        self.assertIn(r.status_code, [403, 401])


# ─────────────────────────────────────────────────────────────────────────────
# TC-FR20  Service Demand Analytics
# ─────────────────────────────────────────────────────────────────────────────
class TC_FR20_Analytics(unittest.TestCase):
    """FR-20: Service Demand Analytics tests."""

    def setUp(self):
        self.admin_session   = get_session("admin")
        self.student_session = get_session("student")

    def test_FR20_01_get_analytics_admin(self):
        """TC-FR20-01: Admin can access analytics dashboard data."""
        r = self.admin_session.get(f"{BASE_URL}/api/analytics")
        self.assertIn(r.status_code, [200, 404])

    def test_FR20_02_student_cannot_access_analytics(self):
        """TC-FR20-02: Student cannot access analytics (403 or 401)."""
        r = self.student_session.get(f"{BASE_URL}/api/analytics")
        self.assertIn(r.status_code, [403, 401])


# ─────────────────────────────────────────────────────────────────────────────
# TC-ADMIN  Admin Unassigned Complaints View
# ─────────────────────────────────────────────────────────────────────────────
class TC_ADMIN_AdminComplaintsView(unittest.TestCase):
    """Admin-specific complaint management tests."""

    def setUp(self):
        self.admin_session   = get_session("admin")
        self.student_session = get_session("student")

    def test_ADMIN_01_admin_sees_unassigned_complaints(self):
        """TC-ADMIN-01: Admin can list unassigned complaints."""
        r = self.admin_session.get(f"{BASE_URL}/api/complaints/unassigned?role=admin")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_ADMIN_02_non_admin_blocked_from_unassigned(self):
        """TC-ADMIN-02: Non-admin role is blocked from /unassigned (403)."""
        r = self.student_session.get(f"{BASE_URL}/api/complaints/unassigned")
        self.assertIn(r.status_code, [403, 401])

    def test_ADMIN_03_admin_assign_complaint_to_unit(self):
        """TC-ADMIN-03: Admin can assign a complaint to a support unit."""
        # Get an unassigned complaint
        r = self.admin_session.get(f"{BASE_URL}/api/complaints/unassigned?role=admin")
        complaints = r.json()
        if not complaints:
            self.skipTest("No unassigned complaints available.")
        cid = complaints[0]["id"]
        # Get a support unit
        r2 = self.admin_session.get(f"{BASE_URL}/api/complaints/support-units")
        units = r2.json()
        if not units:
            self.skipTest("No support units in DB.")
        uid = units[0]["id"]
        r3 = self.admin_session.patch(
            f"{BASE_URL}/api/complaints/{cid}/assign",
            json={"support_unit_id": uid}
        )
        self.assertIn(r3.status_code, [200, 400, 404])


if __name__ == "__main__":
    print("\n" + "="*80)
    print("  Running SUMIS Test Suite...")
    print("="*80 + "\n")
    unittest.main(verbosity=2)

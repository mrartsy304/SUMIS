# CHANGES — SUMIS Complaint Management Pipeline (FR-10 to FR-13)
**Branch:** develop  |  **Author:** Abdul Qadir  |  **Date:** 2025

---

## NEW FILES CREATED

### Backend — Models
| File | Description |
|------|-------------|
| `backend/app/models/support_unit.py` | SupportUnit model (`support_units` table) — the 6 operational units (IT Support, Hostel Management, Administration, Accounts, Maintenance & Facilities, Academic Affairs) |
| `backend/app/models/complaint_v2.py` | ComplaintV2 model (`complaints_v2` table) — full FR-10 complaint entity with title, category, priority, status, and support_unit_id. Includes ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES constants and CATEGORY_UNIT_MAP auto-routing logic |
| `backend/app/models/complaint_status_history.py` | ComplaintStatusHistory model (`complaint_status_history` table) — tracks every status transition with old_status, new_status, changed_by, note, and changed_at |

### Backend — Services
| File | Description |
|------|-------------|
| `backend/app/services/seed_support_units.py` | Seeds the `support_units` table with the 6 required operational units on first run |

### Backend — Routes
| File | Description |
|------|-------------|
| `backend/app/routes/complaints_v2.py` | New Flask Blueprint registered at `/api/complaints`. Implements all FR-10 to FR-13 API endpoints: POST (submit), GET list, GET single, PUT categorize, POST assign, GET/PUT status, GET history. Enforces status transition rules and role-based access |

### Frontend — Components
| File | Description |
|------|-------------|
| `frontend/src/components/StatusTimeline.jsx` | Renders a vertical chronological timeline of complaint status history entries with badges, timestamps, and notes |
| `frontend/src/components/ComplaintForm.jsx` | Reusable complaint submission form with category dropdown, priority selector, title, and description fields |
| `frontend/src/components/ComplaintClassifier.jsx` | Admin-only component to update category and priority of an existing complaint (FR-11) |
| `frontend/src/components/AssignmentCard.jsx` | Admin-only component to manually assign or override the support unit for a complaint (FR-12) |

### Frontend — Pages
| File | Description |
|------|-------------|
| `frontend/src/pages/SubmitComplaint.jsx` | FR-10: Non-admin page with two tabs — submit new complaint (with auto-routing) and view own complaint history |
| `frontend/src/pages/ComplaintDetail.jsx` | FR-12/13: Complaint detail view with status timeline for all users; admin also gets status update panel, ComplaintClassifier, and AssignmentCard |
| `frontend/src/pages/AdminComplaints.jsx` | FR-11/12/13: Admin-only dashboard showing all complaints in a filterable table with category/priority/status filters and an "Unassigned" tab |

---

## EXISTING FILES MODIFIED

| File | Change |
|------|--------|
| `backend/app/__init__.py` | Added imports for SupportUnit, ComplaintV2, ComplaintStatusHistory models; imported and registered `complaints_v2_bp` blueprint; added `seed_support_units()` call in app factory |
| `frontend/src/services/api.js` | Replaced stub `complaintsAPI` with the full FR-10 to FR-13 API surface: create, getAll, getById, categorize, assign, getUnassigned, getSupportUnits, getStatus, updateStatus, getHistory |
| `frontend/src/App.jsx` | Added imports for SubmitComplaint, ComplaintDetail, AdminComplaints; registered three new routes: `/complaints/submit`, `/complaints/:id`, `/admin/complaints` |
| `frontend/src/components/Navbar.jsx` | Added "Complaints" nav link for student, faculty, and staff roles (→ `/complaints/submit`); added "Complaints" nav link for admin role (→ `/admin/complaints`) |

---

## NO EXISTING FILES WERE REMOVED OR BROKEN

- The existing `Complaint` and `ComplaintCategory` models were NOT modified (new model is `ComplaintV2` in a separate table `complaints_v2`)
- All existing API endpoints remain unchanged
- All existing routes and blueprints remain unchanged
- Database schema additions only — no drops or alterations

---

## HOW TO RUN

Same commands as before:

```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py

# Frontend
cd frontend
npm install
npm start
```

The `support_units` table is seeded automatically on first backend start.

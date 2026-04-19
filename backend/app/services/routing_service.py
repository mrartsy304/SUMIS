"""
FR-06: Automated Request Routing Service
Uses: complaint.py, department.py

Routing logic:
- Detects category from complaint/request
- Assigns the responsible department based on category
- Updates request status
"""

from app.models import db
from app.models.complaint import Complaint
from app.models.service_request import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.department import Department
from app.models.complaint_category import ComplaintCategory
from datetime import datetime


# ── Category → Department mapping ────────────────────────────────────────────
# Maps complaint category names to department names.
# Extend this as more departments are added.
CATEGORY_DEPARTMENT_MAP = {
    "Academic":       "Computer Science",
    "Facilities":     "Software Engineering",
    "Administration": "Data Science",
    "IT Support":     "Computer Science",
    "Financial":      "Artificial Intelligence",
    "Other":          "Computer Science",
}


def route_request(request_id: int) -> dict:
    """
    Core routing function for FR-06.

    Steps:
    1. Find the service request
    2. Look up its category
    3. Find the responsible department based on CATEGORY_DEPARTMENT_MAP
    4. Assign department_id to the request
    5. Update status to 'in_progress'
    6. Log to request_status_history

    Returns a dict with routing result.
    """
    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return {"error": "Request not found", "success": False}

    if sr.status not in ["pending"]:
        return {
            "error": f"Request is already '{sr.status}' — only pending requests can be routed.",
            "success": False
        }

    # Determine department based on request_type keyword matching
    # (since ServiceRequest doesn't have category_id, we match by request_type text)
    assigned_dept = _detect_department_from_request(sr)

    if not assigned_dept:
        # Default fallback department
        assigned_dept = Department.query.first()

    # Assign department and update status
    sr.department_id = assigned_dept.id
    sr.status = "in_progress"

    # Log status change to request_status_history
    history_entry = RequestStatusHistory(
        request_id = sr.id,
        status     = "in_progress",
        remarks    = f"Auto-routed to {assigned_dept.name} by FR-06 routing engine.",
        updated_at = datetime.utcnow(),
    )

    db.session.add(history_entry)
    db.session.commit()

    return {
        "success":        True,
        "request_id":     sr.id,
        "request_type":   sr.request_type,
        "assigned_to":    assigned_dept.name,
        "department_id":  assigned_dept.id,
        "new_status":     sr.status,
        "routed_at":      datetime.utcnow().isoformat(),
    }


def route_complaint(complaint_id: int) -> dict:
    """
    Route a complaint to the correct department based on its category.
    Uses: complaint.py, department.py, complaint_category.py
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return {"error": "Complaint not found", "success": False}

    if complaint.status != "open":
        return {
            "error": f"Complaint is already '{complaint.status}' — only open complaints can be routed.",
            "success": False
        }

    # Get category name
    category_name = "Other"
    if complaint.category_id:
        cat = ComplaintCategory.query.get(complaint.category_id)
        if cat:
            category_name = cat.name

    # Find department from mapping
    dept_name = CATEGORY_DEPARTMENT_MAP.get(category_name, "Computer Science")
    assigned_dept = Department.query.filter_by(name=dept_name).first()

    if not assigned_dept:
        assigned_dept = Department.query.first()

    # Assign department and update status
    complaint.department_id = assigned_dept.id
    complaint.status = "in_review"

    db.session.commit()

    return {
        "success":       True,
        "complaint_id":  complaint.id,
        "category":      category_name,
        "assigned_to":   assigned_dept.name,
        "department_id": assigned_dept.id,
        "new_status":    complaint.status,
        "routed_at":     datetime.utcnow().isoformat(),
    }


def get_routing_stats() -> dict:
    """
    Returns routing statistics for the admin view.
    """
    total_requests    = ServiceRequest.query.count()
    pending_requests  = ServiceRequest.query.filter_by(status="pending").count()
    routed_requests   = ServiceRequest.query.filter_by(status="in_progress").count()
    completed         = ServiceRequest.query.filter_by(status="completed").count()

    total_complaints  = Complaint.query.count()
    open_complaints   = Complaint.query.filter_by(status="open").count()
    routed_complaints = Complaint.query.filter_by(status="in_review").count()
    resolved          = Complaint.query.filter_by(status="resolved").count()

    # Requests per department
    dept_breakdown = []
    departments = Department.query.all()
    for dept in departments:
        count = ServiceRequest.query.filter_by(department_id=dept.id).count()
        dept_breakdown.append({"department": dept.name, "count": count})

    return {
        "service_requests": {
            "total":     total_requests,
            "pending":   pending_requests,
            "in_progress": routed_requests,
            "completed": completed,
        },
        "complaints": {
            "total":     total_complaints,
            "open":      open_complaints,
            "in_review": routed_complaints,
            "resolved":  resolved,
        },
        "department_breakdown": dept_breakdown,
    }


# ── Private helpers ───────────────────────────────────────────────────────────

def _detect_department_from_request(sr: ServiceRequest) -> Department:
    """
    Match request_type keywords to a department.
    Falls back to first department if no match found.
    """
    keyword_map = {
        "transcript":   "Computer Science",
        "library":      "Software Engineering",
        "fee":          "Artificial Intelligence",
        "clearance":    "Artificial Intelligence",
        "admission":    "Data Science",
        "lab":          "Computer Science",
        "software":     "Software Engineering",
        "data":         "Data Science",
        "ai":           "Artificial Intelligence",
        "it":           "Computer Science",
    }

    request_lower = sr.request_type.lower()
    for keyword, dept_name in keyword_map.items():
        if keyword in request_lower:
            dept = Department.query.filter_by(name=dept_name).first()
            if dept:
                return dept

    # If department already assigned, keep it
    if sr.department_id:
        return Department.query.get(sr.department_id)

    return Department.query.first()

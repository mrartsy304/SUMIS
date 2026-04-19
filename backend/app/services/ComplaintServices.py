"""
backend/app/services/ComplaintService.py

Pure service-layer helpers for complaint operations (FR-10 to FR-13).
Does NOT define a Blueprint — that lives exclusively in app/routes/Complaints.py.

BUG FIXED:
  Previously this file contained a full duplicate Blueprint definition
  (complaints_bp = Blueprint("complaints", ...)) with the same name and
  url_prefix as app/routes/Complaints.py.  Flask raises:
      AssertionError: The name 'complaints' is already registered for a
      different blueprint.
  on startup if both are ever imported, crashing the server entirely and
  causing every API call to return "Network error. Could not reach the server."
  The Blueprint code has been removed.  Only stateless helper functions live here.
"""

from app.models import db
from app.models.complaint import Complaint


# ── Allowed value sets (single source of truth for service layer) ─────────────
VALID_CATEGORIES = {"Facility", "IT", "Academic", "Administrative", "Other"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}
VALID_STATUSES   = {"Pending", "Completed"}


def get_all_complaints():
    """Return all complaints ordered newest first (admin use)."""
    return (
        Complaint.query
        .order_by(Complaint.created_at.desc())
        .all()
    )


def get_complaints_by_user(user_id: int):
    """Return only the complaints submitted by a specific user."""
    return (
        Complaint.query
        .filter_by(user_id=user_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


def get_complaint_by_id(complaint_id: int):
    """Return a single Complaint or None."""
    return Complaint.query.get(complaint_id)


def create_complaint(user_id: int, title: str, description: str,
                     category: str, priority: str):
    """
    Validate fields and persist a new Complaint.
    Returns (complaint, error_message).  On success error_message is None.
    """
    if category not in VALID_CATEGORIES:
        return None, f"Invalid category. Choose from: {', '.join(sorted(VALID_CATEGORIES))}"
    if priority not in VALID_PRIORITIES:
        return None, f"Invalid priority. Choose from: {', '.join(sorted(VALID_PRIORITIES))}"

    complaint = Complaint(
        user_id     = user_id,
        title       = title.strip(),
        description = description.strip(),
        category    = category,
        priority    = priority,
        status      = "Pending",   # always forced — never caller-supplied
    )
    db.session.add(complaint)
    db.session.commit()
    return complaint, None


def update_complaint_status(complaint_id: int, new_status: str):
    """
    Update the status of a complaint (admin only action).
    Returns (complaint, error_message).
    """
    if new_status not in VALID_STATUSES:
        return None, f"Invalid status. Choose from: {', '.join(sorted(VALID_STATUSES))}"

    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return None, "Complaint not found."

    complaint.status = new_status
    db.session.commit()
    return complaint, None
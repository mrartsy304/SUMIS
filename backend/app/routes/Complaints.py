"""
backend/app/routes/Complaints.py

FR-10  Complaint Registration          POST   /api/complaints
FR-11  Categorization & Priority       (enforced at submission + PATCH)
FR-12  Assignment to responsible unit  (department_id field + PATCH admin)
FR-13  Resolution Tracking             PATCH  /api/complaints/<id>/status

FIXES APPLIED:
  1. Added None guard on role — if current_user.role is somehow None, we return
     403 clearly instead of silently falling through with no response.
  2. Added print() logging on GET /api/complaints so you can confirm the route
     is being hit and see what role is being received.
  3. Defensive check: if current_user is not authenticated despite @login_required
     passing (should not happen, but belt-and-suspenders).

Role rules:
  - admin              → GET /api/complaints (all)
                         GET /api/complaints/<id>
                         GET /api/complaints/categories
                         PATCH /api/complaints/<id>/status
                         NO POST
  - student/faculty/staff → POST
                            GET /api/complaints (own only)
                            GET /api/complaints/<id> (own only)
                            NO PATCH status
"""

import sys
from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required

from app.models import db
from app.models.complaint import Complaint

complaints_bp = Blueprint("complaints", __name__, url_prefix="/api/complaints")

# ── Allowed values (single source of truth) ───────────────────────────────────
VALID_CATEGORIES = {"Facility", "IT", "Academic", "Administrative", "Other"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}
VALID_STATUSES   = {"Pending", "Completed"}

SUBMITTER_ROLES  = {"student", "faculty", "staff"}
ADMIN_ROLES      = {"admin"}


# ── Helper ────────────────────────────────────────────────────────────────────
def _resp(success: bool, data=None, message: str = "", status: int = 200):
    return jsonify({"success": success, "data": data, "message": message}), status


def _current_role():
    """Return the role string of the logged-in user, or None."""
    if current_user and current_user.is_authenticated:
        return getattr(current_user, "role", None)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/complaints/categories
#   Must be declared BEFORE /<int:complaint_id> so Flask doesn't try to
#   cast "categories" as an integer.
# ─────────────────────────────────────────────────────────────────────────────
@complaints_bp.route("/categories", methods=["GET"])
@login_required
def get_categories():
    return _resp(True, data=sorted(VALID_CATEGORIES))


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/complaints
#   - admin  → returns ALL complaints (with submitter info)
#   - others → returns only their OWN complaints
# ─────────────────────────────────────────────────────────────────────────────
@complaints_bp.route("", methods=["GET"])
@login_required
def get_complaints():
    role = _current_role()

    # FIX: log to console so you can confirm the route is hit and see the role
    print(
        f"[Complaints] GET /api/complaints — user_id={getattr(current_user, 'id', '?')} "
        f"role={role!r}",
        flush=True,
        file=sys.stdout,
    )

    # FIX: explicit None guard — prevents silent fall-through with no response
    if role is None:
        return _resp(False, message="Could not determine user role. Please log in again.", status=403)

    if role in ADMIN_ROLES:
        complaints = (
            Complaint.query
            .order_by(Complaint.created_at.desc())
            .all()
        )
        return _resp(True, data=[c.to_dict(include_user=True) for c in complaints])

    if role in SUBMITTER_ROLES:
        complaints = (
            Complaint.query
            .filter_by(user_id=current_user.id)
            .order_by(Complaint.created_at.desc())
            .all()
        )
        return _resp(True, data=[c.to_dict() for c in complaints])

    return _resp(False, message=f"Access denied for role '{role}'.", status=403)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/complaints/<id>
#   - admin  → any complaint
#   - others → only their own
# ─────────────────────────────────────────────────────────────────────────────
@complaints_bp.route("/<int:complaint_id>", methods=["GET"])
@login_required
def get_complaint(complaint_id):
    role = _current_role()

    if role is None:
        return _resp(False, message="Could not determine user role.", status=403)

    complaint = Complaint.query.get(complaint_id)

    if not complaint:
        return _resp(False, message="Complaint not found.", status=404)

    if role in ADMIN_ROLES:
        return _resp(True, data=complaint.to_dict(include_user=True))

    if role in SUBMITTER_ROLES:
        if complaint.user_id != current_user.id:
            return _resp(False, message="Access denied.", status=403)
        return _resp(True, data=complaint.to_dict())

    return _resp(False, message=f"Access denied for role '{role}'.", status=403)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/complaints   — students / faculty / staff only
# FR-10: Complaint Registration
# ─────────────────────────────────────────────────────────────────────────────
@complaints_bp.route("", methods=["POST"])
@login_required
def create_complaint():
    role = _current_role()

    if role is None:
        return _resp(False, message="Could not determine user role.", status=403)

    if role in ADMIN_ROLES:
        return _resp(False, message="Administrators cannot submit complaints.", status=403)
    if role not in SUBMITTER_ROLES:
        return _resp(False, message="Your role is not permitted to submit complaints.", status=403)

    body = request.get_json(silent=True) or {}

    required = ["title", "description", "category", "priority"]
    missing  = [f for f in required if not str(body.get(f, "")).strip()]
    if missing:
        return _resp(False, message=f"Missing required fields: {', '.join(missing)}", status=400)

    category = body["category"].strip()
    priority = body["priority"].strip()

    if category not in VALID_CATEGORIES:
        return _resp(False,
                     message=f"Invalid category. Choose from: {', '.join(sorted(VALID_CATEGORIES))}",
                     status=400)
    if priority not in VALID_PRIORITIES:
        return _resp(False,
                     message=f"Invalid priority. Choose from: {', '.join(sorted(VALID_PRIORITIES))}",
                     status=400)

    try:
        complaint = Complaint(
            user_id     = current_user.id,
            title       = body["title"].strip(),
            description = body["description"].strip(),
            category    = category,
            priority    = priority,
            status      = "Pending",   # ENFORCED — body value always ignored
        )
        db.session.add(complaint)
        db.session.commit()
        return _resp(True,
                     data=complaint.to_dict(),
                     message="Complaint registered successfully.",
                     status=201)
    except Exception as exc:
        db.session.rollback()
        return _resp(False, message=f"Database error: {exc}", status=500)


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /api/complaints/<id>/status   — admin only
# FR-13: Complaint Resolution Tracking
# ─────────────────────────────────────────────────────────────────────────────
@complaints_bp.route("/<int:complaint_id>/status", methods=["PATCH"])
@login_required
def update_complaint_status(complaint_id):
    role = _current_role()

    if role is None:
        return _resp(False, message="Could not determine user role.", status=403)

    if role not in ADMIN_ROLES:
        return _resp(False, message="Only administrators can update complaint status.", status=403)

    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return _resp(False, message="Complaint not found.", status=404)

    body       = request.get_json(silent=True) or {}
    new_status = str(body.get("status", "")).strip()

    if new_status not in VALID_STATUSES:
        return _resp(False,
                     message=f"Invalid status. Choose from: {', '.join(sorted(VALID_STATUSES))}",
                     status=400)

    try:
        complaint.status = new_status
        db.session.commit()
        return _resp(True,
                     data=complaint.to_dict(include_user=True),
                     message=f"Complaint #{complaint_id} marked as {new_status}.")
    except Exception as exc:
        db.session.rollback()
        return _resp(False, message=f"Database error: {exc}", status=500)
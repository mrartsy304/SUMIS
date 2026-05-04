from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db
from app.models.complaint_v2 import ComplaintV2, ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES, CATEGORY_UNIT_MAP
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.support_unit import SupportUnit
from app.models.user import User

complaints_v2_bp = Blueprint("complaints_v2", __name__, url_prefix="/api/complaints")

# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

VALID_TRANSITIONS = {
    "Pending":     ["In Progress", "Resolved"],
    "In Progress": ["Resolved"],
    "Resolved":    [],
}


def _get_user_from_request():
    """
    Pull user_id from session or JWT token.
    The project uses Flask-Login sessions (no JWT yet) and a MOCK mode
    on the frontend. We accept user_id from the JSON body as fallback
    to stay compatible with the mock auth pattern used by the rest of the app.
    """
    from flask_login import current_user
    if current_user and current_user.is_authenticated:
        return current_user
    # Fallback: accept user_id from body (mirrors how other routes work)
    data = request.get_json(silent=True) or {}
    uid = data.get("user_id") or request.args.get("user_id")
    if uid:
        return User.query.get(int(uid))
    return None


def _auto_assign_unit(category: str):
    """Return the SupportUnit matching the category mapping, or None."""
    unit_name = CATEGORY_UNIT_MAP.get(category)
    if not unit_name:
        return None
    return SupportUnit.query.filter_by(name=unit_name).first()


def _serialize_complaint(c: ComplaintV2, include_user: bool = False) -> dict:
    unit = SupportUnit.query.get(c.support_unit_id) if c.support_unit_id else None
    submitter = User.query.get(c.user_id) if c.user_id else None
    result = {
        "id":               c.id,
        "user_id":          c.user_id,
        "submitted_by":     submitter.name if submitter else None,
        "title":            c.title,
        "description":      c.description,
        "category":         c.category,
        "priority":         c.priority,
        "status":           c.status,
        "support_unit_id":  c.support_unit_id,
        "support_unit":     unit.name if unit else None,
        "created_at":       c.created_at.isoformat() if c.created_at else None,
        "updated_at":       c.updated_at.isoformat() if c.updated_at else None,
    }
    return result


def _serialize_history(h: ComplaintStatusHistory) -> dict:
    user = User.query.get(h.changed_by) if h.changed_by else None
    return {
        "id":               h.id,
        "complaint_id":     h.complaint_id,
        "old_status":       h.old_status,
        "new_status":       h.new_status,
        "changed_by":       h.changed_by,
        "changed_by_name":  user.name if user else "Unknown",
        "note":             h.note,
        "changed_at":       h.changed_at.isoformat() if h.changed_at else None,
    }


# ─────────────────────────────────────────────────────────────
#  GET /api/complaints/support-units
#  Return all support units  (any authenticated user)
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/support-units")
def get_support_units():
    units = SupportUnit.query.order_by(SupportUnit.name.asc()).all()
    return jsonify([
        {"id": u.id, "name": u.name, "description": u.description}
        for u in units
    ]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/complaints/unassigned
#  Admin only — complaints with no support unit
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/unassigned")
def get_unassigned():
    # Role check via query param (matches mock auth pattern)
    role = request.args.get("role", "")
    if role != "admin":
        user_id = request.args.get("user_id")
        if user_id:
            from flask_login import current_user
            if current_user and current_user.is_authenticated and current_user.role != "admin":
                return jsonify({"error": "Admin access required"}), 403
        else:
            return jsonify({"error": "Admin access required"}), 403

    unassigned = (
        ComplaintV2.query
        .filter(ComplaintV2.support_unit_id.is_(None))
        .order_by(ComplaintV2.created_at.desc())
        .all()
    )
    return jsonify([_serialize_complaint(c) for c in unassigned]), 200


# ─────────────────────────────────────────────────────────────
#  FR-10: POST /api/complaints  — Submit a new complaint
#  Non-admin only (student, faculty, staff)
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.post("/")
def create_complaint():
    data = request.get_json(silent=True) or {}

    # Admin guard — admins cannot submit complaints
    role = data.get("role", "")
    if role == "admin":
        return jsonify({"error": "Administrators cannot submit complaints"}), 403

    # Validate required fields
    title       = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    category    = (data.get("category") or "").strip()
    priority    = (data.get("priority") or "Medium").strip()
    user_id     = data.get("user_id")

    errors = {}
    if not title:
        errors["title"] = "Title is required"
    elif len(title) > 200:
        errors["title"] = "Title must be 200 characters or fewer"
    if not description:
        errors["description"] = "Description is required"
    if category not in ALLOWED_CATEGORIES:
        errors["category"] = f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}"
    if priority not in ALLOWED_PRIORITIES:
        errors["priority"] = f"Priority must be one of: {', '.join(ALLOWED_PRIORITIES)}"
    if not user_id:
        errors["user_id"] = "user_id is required"

    if errors:
        return jsonify({"error": "Validation failed", "fields": errors}), 400

    # Auto-assign support unit based on category
    unit = _auto_assign_unit(category)

    complaint = ComplaintV2(
        user_id        = int(user_id),
        title          = title,
        description    = description,
        category       = category,
        priority       = priority,
        status         = "Pending",
        support_unit_id= unit.id if unit else None,
        created_at     = datetime.utcnow(),
        updated_at     = datetime.utcnow(),
    )
    db.session.add(complaint)
    db.session.flush()   # get complaint.id before history insert

    # First status history entry (old_status = null)
    history = ComplaintStatusHistory(
        complaint_id = complaint.id,
        old_status   = None,
        new_status   = "Pending",
        changed_by   = int(user_id),
        note         = "Complaint submitted",
        changed_at   = datetime.utcnow(),
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(_serialize_complaint(complaint)), 201


# ─────────────────────────────────────────────────────────────
#  GET /api/complaints  — List complaints
#  Admin → all; others → own only
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/")
def get_complaints():
    role    = request.args.get("role", "")
    user_id = request.args.get("user_id")

    query = ComplaintV2.query

    # Non-admin: only own complaints
    if role != "admin":
        if not user_id:
            return jsonify({"error": "user_id required"}), 400
        query = query.filter(ComplaintV2.user_id == int(user_id))

    # Optional filters
    cat      = request.args.get("category")
    priority = request.args.get("priority")
    status   = request.args.get("status")
    if cat:
        query = query.filter(ComplaintV2.category == cat)
    if priority:
        query = query.filter(ComplaintV2.priority == priority)
    if status:
        query = query.filter(ComplaintV2.status == status)

    complaints = query.order_by(ComplaintV2.created_at.desc()).all()
    return jsonify([_serialize_complaint(c) for c in complaints]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/complaints/<id>  — Single complaint
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/<int:complaint_id>")
def get_complaint(complaint_id):
    role    = request.args.get("role", "")
    user_id = request.args.get("user_id")

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    # Non-admin can only view own complaints
    if role != "admin" and user_id and c.user_id != int(user_id):
        return jsonify({"error": "Access denied"}), 403

    return jsonify(_serialize_complaint(c)), 200


# ─────────────────────────────────────────────────────────────
#  FR-11: PUT /api/complaints/<id>/categorize  — Admin only
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.put("/<int:complaint_id>/categorize")
def categorize_complaint(complaint_id):
    data = request.get_json(silent=True) or {}
    role = data.get("role", "")

    if role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    category = (data.get("category") or "").strip()
    priority = (data.get("priority") or "").strip()

    errors = {}
    if category and category not in ALLOWED_CATEGORIES:
        errors["category"] = f"Must be one of: {', '.join(ALLOWED_CATEGORIES)}"
    if priority and priority not in ALLOWED_PRIORITIES:
        errors["priority"] = f"Must be one of: {', '.join(ALLOWED_PRIORITIES)}"
    if errors:
        return jsonify({"error": "Validation failed", "fields": errors}), 400

    if category:
        c.category = category
        # Re-run auto-assignment based on new category
        unit = _auto_assign_unit(category)
        c.support_unit_id = unit.id if unit else None

    if priority:
        c.priority = priority

    c.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(_serialize_complaint(c)), 200


# ─────────────────────────────────────────────────────────────
#  FR-12: POST /api/complaints/<id>/assign  — Admin only
#         Manual override of support unit
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.post("/<int:complaint_id>/assign")
def assign_complaint(complaint_id):
    data = request.get_json(silent=True) or {}
    role = data.get("role", "")

    if role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    support_unit_id = data.get("support_unit_id")
    if not support_unit_id:
        return jsonify({"error": "support_unit_id is required"}), 400

    unit = SupportUnit.query.get(int(support_unit_id))
    if not unit:
        return jsonify({"error": "Support unit not found"}), 404

    c.support_unit_id = unit.id
    c.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(_serialize_complaint(c)), 200


# ─────────────────────────────────────────────────────────────
#  FR-13: GET /api/complaints/<id>/status  — Current status
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/<int:complaint_id>/status")
def get_status(complaint_id):
    role    = request.args.get("role", "")
    user_id = request.args.get("user_id")

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    if role != "admin" and user_id and c.user_id != int(user_id):
        return jsonify({"error": "Access denied"}), 403

    unit = SupportUnit.query.get(c.support_unit_id) if c.support_unit_id else None
    return jsonify({
        "complaint_id":  c.id,
        "current_status": c.status,
        "support_unit":  unit.name if unit else None,
    }), 200


# ─────────────────────────────────────────────────────────────
#  FR-13: PUT /api/complaints/<id>/status  — Admin only
#         Update status with transition validation
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.put("/<int:complaint_id>/status")
def update_status(complaint_id):
    data = request.get_json(silent=True) or {}
    role    = data.get("role", "")
    user_id = data.get("user_id")

    if role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    new_status = (data.get("new_status") or "").strip()
    note       = (data.get("note") or "").strip() or None

    if new_status not in ALLOWED_STATUSES:
        return jsonify({"error": f"new_status must be one of: {', '.join(ALLOWED_STATUSES)}"}), 400

    # Enforce valid transitions (no backwards movement)
    allowed_next = VALID_TRANSITIONS.get(c.status, [])
    if new_status not in allowed_next:
        return jsonify({
            "error": f"Invalid transition: cannot move from '{c.status}' to '{new_status}'. "
                     f"Allowed next states: {allowed_next or ['none (already resolved)']}"
        }), 400

    old_status = c.status
    c.status   = new_status
    c.updated_at = datetime.utcnow()

    history = ComplaintStatusHistory(
        complaint_id = c.id,
        old_status   = old_status,
        new_status   = new_status,
        changed_by   = int(user_id) if user_id else 0,
        note         = note,
        changed_at   = datetime.utcnow(),
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(_serialize_complaint(c)), 200


# ─────────────────────────────────────────────────────────────
#  FR-13: GET /api/complaints/<id>/history  — Status history
# ─────────────────────────────────────────────────────────────
@complaints_v2_bp.get("/<int:complaint_id>/history")
def get_history(complaint_id):
    role    = request.args.get("role", "")
    user_id = request.args.get("user_id")

    c = ComplaintV2.query.get(complaint_id)
    if not c:
        return jsonify({"error": "Complaint not found"}), 404

    if role != "admin" and user_id and c.user_id != int(user_id):
        return jsonify({"error": "Access denied"}), 403

    history = (
        ComplaintStatusHistory.query
        .filter_by(complaint_id=complaint_id)
        .order_by(ComplaintStatusHistory.changed_at.asc())
        .all()
    )
    return jsonify([_serialize_history(h) for h in history]), 200

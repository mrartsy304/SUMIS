from flask import Blueprint, jsonify
from datetime import datetime
from app.models import db
from app.models.service_request import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.department import Department

status_bp = Blueprint("status", __name__, url_prefix="/api/requests")


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/user/<student_id>
#  Retrieve all service requests submitted by a specific student
#  Uses: service_request.py, request_status_history.py
# ─────────────────────────────────────────────────────────────
@status_bp.get("/user/<int:student_id>")
def get_student_requests(student_id):
    """
    FR-07: Returns all service requests for a given student,
    ordered newest-first. Each request includes its department
    name and the full status history timeline.
    """
    requests_list = (
        ServiceRequest.query
        .filter_by(student_id=student_id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return jsonify([_serialize_with_history(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/<id>/status
#  Retrieve current status + full timeline for a single request
#  Uses: service_request.py, request_status_history.py
# ─────────────────────────────────────────────────────────────
@status_bp.get("/<int:request_id>/status")
def get_request_status(request_id):
    """
    FR-07: Returns the current status and complete history
    timeline for a specific service request.
    """
    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return jsonify({"error": "Request not found"}), 404
    return jsonify(_serialize_with_history(sr)), 200


# ─────────────────────────────────────────────────────────────
#  PATCH /api/requests/<id>/status
#  Admin / staff: update the status of a service request
#  and append an entry to request_status_history
#  Uses: service_request.py, request_status_history.py
# ─────────────────────────────────────────────────────────────
@status_bp.patch("/<int:request_id>/status")
def update_request_status(request_id):
    """
    FR-07 (admin/staff helper): Changes the request status and
    records the transition in request_status_history.
    Body: { "status": "in_progress" | "resolved" | "rejected",
            "remarks": "optional note" }
    """
    from flask import request as flask_request
    data = flask_request.get_json(silent=True) or {}

    new_status = data.get("status", "").strip().lower()
    allowed_statuses = {"pending", "in_progress", "resolved", "rejected"}
    if new_status not in allowed_statuses:
        return jsonify({
            "error": f"status must be one of: {', '.join(sorted(allowed_statuses))}"
        }), 400

    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return jsonify({"error": "Request not found"}), 404

    # Update the request itself
    sr.status = new_status
    if new_status in ("resolved", "rejected"):
        sr.completed_at = datetime.utcnow()

    # Record in history
    history_entry = RequestStatusHistory(
        request_id=sr.id,
        status=new_status,
        remarks=data.get("remarks", "").strip() or None,
        updated_at=datetime.utcnow(),
    )
    db.session.add(history_entry)
    db.session.commit()

    return jsonify(_serialize_with_history(sr)), 200


# ─────────────────────────────────────────────────────────────
#  Helper serializers
# ─────────────────────────────────────────────────────────────
def _serialize_history_entry(h: RequestStatusHistory) -> dict:
    return {
        "id":         h.id,
        "status":     h.status,
        "remarks":    h.remarks,
        "updated_at": h.updated_at.isoformat() if h.updated_at else None,
    }


def _serialize_with_history(sr: ServiceRequest) -> dict:
    # Resolve department name without an extra join
    dept_name = None
    if sr.department_id:
        dept = Department.query.get(sr.department_id)
        dept_name = dept.name if dept else None

    history = sorted(sr.status_history, key=lambda h: h.updated_at or datetime.min)

    return {
        "id":               sr.id,
        "student_id":       sr.student_id,
        "department_id":    sr.department_id,
        "department_name":  dept_name,
        "request_type":     sr.request_type,
        "description":      sr.description,
        "status":           sr.status,
        "created_at":       sr.created_at.isoformat() if sr.created_at else None,
        "completed_at":     sr.completed_at.isoformat() if sr.completed_at else None,
        "status_history":   [_serialize_history_entry(h) for h in history],
    }

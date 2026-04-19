from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db
from app.models.service_request import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.department import Department

completion_bp = Blueprint("completion", __name__, url_prefix="/api/requests")


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/approved
#  Retrieve all approved requests awaiting completion
#  Uses: service_request.py
# ─────────────────────────────────────────────────────────────
@completion_bp.get("/approved")
def get_approved_requests():
    """
    FR-09: Returns all requests with status 'approved',
    ordered oldest-first so staff can action the backlog in order.
    Each entry includes department name and full status history.
    """
    requests_list = (
        ServiceRequest.query
        .filter_by(status="approved")
        .order_by(ServiceRequest.created_at.asc())
        .all()
    )
    return jsonify([_serialize_with_history(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  PUT /api/requests/<id>/complete
#  Mark an approved request as completed
#  Uses: service_request.py, request_status_history.py
#  Body: { completed_by: int, remarks?: string }
# ─────────────────────────────────────────────────────────────
@completion_bp.put("/<int:request_id>/complete")
def complete_request(request_id):
    """
    FR-09: Validates the request is in 'approved' state, updates
    its status to 'completed', stamps completed_at, and inserts a
    completion log entry into request_status_history.
    """
    data         = request.get_json(silent=True) or {}
    completed_by = data.get("completed_by")
    remarks      = data.get("remarks", "").strip()

    if not completed_by:
        return jsonify({"error": "completed_by (user id) is required"}), 400

    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return jsonify({"error": "Request not found"}), 404

    # Only approved requests can be marked complete
    if sr.status != "approved":
        return jsonify({
            "error": f"Cannot complete a request with status '{sr.status}'. "
                     f"Only 'approved' requests can be marked as completed."
        }), 400

    now = datetime.utcnow()

    # Update the service request
    sr.status       = "completed"
    sr.completed_at = now

    # Log completion to request_status_history
    log_entry = RequestStatusHistory(
        request_id = sr.id,
        status     = "completed",
        remarks    = remarks or f"Request completed by staff member #{completed_by}",
        updated_at = now,
    )
    db.session.add(log_entry)
    db.session.commit()

    return jsonify(_serialize_with_history(sr)), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/completed
#  Retrieve all completed requests (for history / reporting)
#  Uses: service_request.py, request_status_history.py
# ─────────────────────────────────────────────────────────────
@completion_bp.get("/completed")
def get_completed_requests():
    """
    FR-09: Returns all completed requests, newest-first.
    Useful for audit trail and status tracking (FR-07) integration.
    """
    requests_list = (
        ServiceRequest.query
        .filter_by(status="completed")
        .order_by(ServiceRequest.completed_at.desc())
        .all()
    )
    return jsonify([_serialize_with_history(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  Helper serializer — consistent with decision.py pattern
# ─────────────────────────────────────────────────────────────
def _serialize_with_history(sr: ServiceRequest) -> dict:
    dept_name = None
    if sr.department_id:
        dept = Department.query.get(sr.department_id)
        dept_name = dept.name if dept else None

    history = sorted(sr.status_history, key=lambda h: h.updated_at or datetime.min)

    return {
        "id":              sr.id,
        "student_id":      sr.student_id,
        "department_id":   sr.department_id,
        "department_name": dept_name,
        "request_type":    sr.request_type,
        "description":     sr.description,
        "status":          sr.status,
        "created_at":      sr.created_at.isoformat() if sr.created_at else None,
        "completed_at":    sr.completed_at.isoformat() if sr.completed_at else None,
        "status_history":  [
            {
                "id":         h.id,
                "status":     h.status,
                "remarks":    h.remarks,
                "updated_at": h.updated_at.isoformat() if h.updated_at else None,
            }
            for h in history
        ],
    }

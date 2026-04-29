from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db
from app.models.service_request import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.department import Department

decision_bp = Blueprint("decision", __name__, url_prefix="/api/requests")


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/pending
#  Get all requests in 'in_progress' state for staff review
#  Uses: service_request.py
# ─────────────────────────────────────────────────────────────
@decision_bp.get("/pending-review")
def get_pending_review():
    """
    Returns all requests that have been routed (in_progress)
    and are awaiting staff approval or rejection.
    """
    requests_list = (
        ServiceRequest.query
        .filter(ServiceRequest.status.in_(["in_progress", "pending"]))
        .order_by(ServiceRequest.created_at.asc())
        .all()
    )
    return jsonify([_serialize_with_history(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/by-department/<department_id>
#  Get all requests assigned to a specific department
# ─────────────────────────────────────────────────────────────
@decision_bp.get("/by-department/<int:department_id>")
def get_by_department(department_id):
    requests_list = (
        ServiceRequest.query
        .filter_by(department_id=department_id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return jsonify([_serialize_with_history(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  PUT /api/requests/<id>/decision
#  Process approve or reject decision on a request
#  Uses: service_request.py, request_status_history.py
#  Body: { decision: "approved"|"rejected", remarks: string, decided_by: int }
# ─────────────────────────────────────────────────────────────
@decision_bp.put("/<int:request_id>/decision")
def process_decision(request_id):
    data = request.get_json(silent=True) or {}

    decision    = data.get("decision", "").strip().lower()
    remarks     = data.get("remarks", "").strip()
    decided_by  = data.get("decided_by")

    # Validate decision value
    if decision not in ["approved", "rejected"]:
        return jsonify({"error": "decision must be 'approved' or 'rejected'"}), 400

    # Remarks are mandatory for rejection
    if decision == "rejected" and not remarks:
        return jsonify({"error": "remarks are required when rejecting a request"}), 400

    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return jsonify({"error": "Request not found"}), 404

    # Validate state — only routed/in_progress requests can be decided
    if sr.status not in ["in_progress", "pending"]:
        return jsonify({
            "error": f"Cannot process decision on a request with status '{sr.status}'. "
                     f"Only 'pending' or 'in_progress' requests can be approved/rejected."
        }), 400

    # Update the service request
    sr.status = decision
    if decision == "rejected":
        sr.completed_at = datetime.utcnow()

    # Log decision to request_status_history
    history_entry = RequestStatusHistory(
        request_id = sr.id,
        status     = decision,
        remarks    = remarks or f"Request {decision} by staff member #{decided_by}",
        updated_at = datetime.utcnow(),
    )

    db.session.add(history_entry)
    db.session.commit()

    return jsonify(_serialize_with_history(sr)), 200


# ─────────────────────────────────────────────────────────────
#  Helper serializers
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

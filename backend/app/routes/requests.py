from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db
from app.models.service_request import ServiceRequest
from app.models.complaint_category import ComplaintCategory
from app.models.department import Department

requests_bp = Blueprint("requests", __name__, url_prefix="/api/requests")


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/categories
#  Returns all complaint categories for the dropdown
#  Uses: complaint_category.py
# ─────────────────────────────────────────────────────────────
@requests_bp.get("/categories")
def get_categories():
    categories = ComplaintCategory.query.order_by(ComplaintCategory.name.asc()).all()
    return jsonify([
        {"id": c.id, "name": c.name, "description": c.description}
        for c in categories
    ]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/departments
#  Returns all departments for the department dropdown
#  Uses: department.py
# ─────────────────────────────────────────────────────────────
@requests_bp.get("/departments")
def get_departments():
    departments = Department.query.order_by(Department.name.asc()).all()
    return jsonify([
        {"id": d.id, "name": d.name}
        for d in departments
    ]), 200


# ─────────────────────────────────────────────────────────────
#  POST /api/requests
#  Submit a new service request
#  Uses: service_request.py
#  Body: { request_type, description, department_id, student_id }
# ─────────────────────────────────────────────────────────────
@requests_bp.post("/")
def create_request():
    data = request.get_json(silent=True) or {}

    # Validate required fields
    if not data.get("request_type"):
        return jsonify({"error": "request_type is required"}), 400
    if not data.get("student_id"):
        return jsonify({"error": "student_id is required"}), 400

    new_request = ServiceRequest(
        student_id    = data["student_id"],
        department_id = data.get("department_id"),
        request_type  = data["request_type"].strip(),
        description   = data.get("description", "").strip(),
        status        = "pending",
        created_at    = datetime.utcnow(),
    )

    db.session.add(new_request)
    db.session.commit()

    return jsonify(_serialize(new_request)), 201


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/user/<student_id>
#  Get all service requests submitted by a specific student
#  Uses: service_request.py
# ─────────────────────────────────────────────────────────────
@requests_bp.get("/user/<int:student_id>")
def get_student_requests(student_id):
    requests_list = (
        ServiceRequest.query
        .filter_by(student_id=student_id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return jsonify([_serialize(r) for r in requests_list]), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests/<id>
#  Get a single service request by ID
# ─────────────────────────────────────────────────────────────
@requests_bp.get("/<int:request_id>")
def get_request(request_id):
    sr = ServiceRequest.query.get(request_id)
    if not sr:
        return jsonify({"error": "Request not found"}), 404
    return jsonify(_serialize(sr)), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/requests
#  Get all service requests (admin view)
# ─────────────────────────────────────────────────────────────
@requests_bp.get("/")
def get_all_requests():
    all_requests = (
        ServiceRequest.query
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return jsonify([_serialize(r) for r in all_requests]), 200


# ─────────────────────────────────────────────────────────────
#  Helper — serialize ServiceRequest to dict
# ─────────────────────────────────────────────────────────────
def _serialize(sr: ServiceRequest) -> dict:
    return {
        "id":            sr.id,
        "student_id":    sr.student_id,
        "department_id": sr.department_id,
        "request_type":  sr.request_type,
        "description":   sr.description,
        "status":        sr.status,
        "created_at":    sr.created_at.isoformat() if sr.created_at else None,
        "completed_at":  sr.completed_at.isoformat() if sr.completed_at else None,
    }

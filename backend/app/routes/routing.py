from flask import Blueprint, request, jsonify
from app.models.service_request import ServiceRequest
from app.models.complaint import Complaint
from app.models.department import Department
from app.services.routing_service import (
    route_request,
    route_complaint,
    get_routing_stats,
)

routing_bp = Blueprint("routing", __name__, url_prefix="/api/routing")


# ─────────────────────────────────────────────────────────────
#  POST /api/routing/route-request/<request_id>
#  Route a single service request to a department
#  Uses: service_request.py, department.py
# ─────────────────────────────────────────────────────────────
@routing_bp.post("/route-request/<int:request_id>")
def route_single_request(request_id):
    result = route_request(request_id)
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result), 200


# ─────────────────────────────────────────────────────────────
#  POST /api/routing/route-complaint/<complaint_id>
#  Route a complaint to responsible department based on category
#  Uses: complaint.py, department.py, complaint_category.py
# ─────────────────────────────────────────────────────────────
@routing_bp.post("/route-complaint/<int:complaint_id>")
def route_single_complaint(complaint_id):
    result = route_complaint(complaint_id)
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result), 200


# ─────────────────────────────────────────────────────────────
#  POST /api/routing/route-all
#  Batch route ALL pending requests and open complaints
#  Main FR-06 endpoint per PDF spec
# ─────────────────────────────────────────────────────────────
@routing_bp.post("/route-all")
def route_all():
    # Route all pending service requests
    pending_requests = ServiceRequest.query.filter_by(status="pending").all()
    request_results = []
    for sr in pending_requests:
        result = route_request(sr.id)
        request_results.append(result)

    # Route all open complaints
    open_complaints = Complaint.query.filter_by(status="open").all()
    complaint_results = []
    for c in open_complaints:
        result = route_complaint(c.id)
        complaint_results.append(result)

    routed_requests   = sum(1 for r in request_results   if r.get("success"))
    routed_complaints = sum(1 for r in complaint_results if r.get("success"))

    return jsonify({
        "success":            True,
        "routed_requests":    routed_requests,
        "routed_complaints":  routed_complaints,
        "request_details":    request_results,
        "complaint_details":  complaint_results,
    }), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/routing/stats
#  Routing statistics for admin dashboard
# ─────────────────────────────────────────────────────────────
@routing_bp.get("/stats")
def routing_stats():
    stats = get_routing_stats()
    return jsonify(stats), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/routing/pending
#  Get all unrouted (pending) requests
# ─────────────────────────────────────────────────────────────
@routing_bp.get("/pending")
def get_pending():
    pending = ServiceRequest.query.filter_by(status="pending").all()
    return jsonify([{
        "id":           sr.id,
        "request_type": sr.request_type,
        "description":  sr.description,
        "student_id":   sr.student_id,
        "status":       sr.status,
        "created_at":   sr.created_at.isoformat() if sr.created_at else None,
    } for sr in pending]), 200

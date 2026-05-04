from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

SLA_HOURS = 48


@reports_bp.get("/operations")
@login_required
def operations_report():
    if current_user.role not in ("admin", "event_coordinator", "staff"):
        return jsonify({"error": "Forbidden"}), 403

    complaints_stats = db.session.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending,
            COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
            ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 2) AS avg_resolution_hours
        FROM complaints_v2
    """)).fetchone()

    service_stats = db.session.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending,
            COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 2) AS avg_completion_hours,
            COUNT(*) FILTER (
                WHERE status = 'completed'
                AND completed_at > created_at + INTERVAL '1 hour' * :sla
            ) AS breached_sla
        FROM service_requests
    """), {"sla": SLA_HOURS}).fetchone()

    by_dept = db.session.execute(text("""
        SELECT d.name AS department, COUNT(sr.id) AS total,
               COUNT(*) FILTER (WHERE sr.status = 'completed') AS completed,
               COUNT(*) FILTER (WHERE sr.status = 'pending') AS pending
        FROM departments d
        LEFT JOIN service_requests sr ON sr.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY total DESC
    """)).fetchall()

    return jsonify({
        "complaints": {
            "total": complaints_stats.total,
            "resolved": complaints_stats.resolved,
            "pending": complaints_stats.pending,
            "in_progress": complaints_stats.in_progress,
            "avg_resolution_hours": float(complaints_stats.avg_resolution_hours or 0),
        },
        "services": {
            "total": service_stats.total,
            "completed": service_stats.completed,
            "pending": service_stats.pending,
            "rejected": service_stats.rejected,
            "avg_completion_hours": float(service_stats.avg_completion_hours or 0),
            "breached_sla": service_stats.breached_sla,
            "sla_hours": SLA_HOURS,
        },
        "by_department": [
            {
                "department": r.department,
                "total": r.total,
                "completed": r.completed,
                "pending": r.pending,
            } for r in by_dept
        ],
    })

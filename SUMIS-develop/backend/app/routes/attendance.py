from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/events")


def _reg_row(row):
    return {
        "id": row.id,
        "event_id": row.event_id,
        "user_id": row.user_id,
        "user_name": row.user_name if hasattr(row, "user_name") else None,
        "user_email": row.user_email if hasattr(row, "user_email") else None,
        "registered_at": row.registered_at.isoformat() if row.registered_at else None,
        "attendance_status": row.attendance_status,
        "marked_at": row.marked_at.isoformat() if row.marked_at else None,
        "marked_by": row.marked_by,
    }


@attendance_bp.get("/<int:event_id>/attendance")
@login_required
def get_attendance(event_id):
    if current_user.role not in ("event_coordinator", "admin", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    rows = db.session.execute(text("""
        SELECT er.*, u.name AS user_name, u.email AS user_email
        FROM event_registrations er
        JOIN users u ON u.id = er.user_id
        WHERE er.event_id = :eid
        ORDER BY u.name
    """), {"eid": event_id}).fetchall()
    return jsonify([_reg_row(r) for r in rows])


@attendance_bp.post("/<int:event_id>/attendance")
@login_required
def mark_attendance(event_id):
    if current_user.role not in ("event_coordinator", "admin", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    reg_id = data.get("registration_id")
    status = data.get("status", "present")
    row = db.session.execute(text("""
        UPDATE event_registrations
        SET attendance_status=:status, marked_at=NOW(), marked_by=:marked_by
        WHERE id=:rid AND event_id=:eid RETURNING *
    """), {"status": status, "marked_by": current_user.id, "rid": reg_id, "eid": event_id}).fetchone()
    db.session.commit()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_reg_row(row))


@attendance_bp.post("/<int:event_id>/attendance/bulk")
@login_required
def bulk_attendance(event_id):
    if current_user.role not in ("event_coordinator", "admin", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    records = request.json.get("records", [])
    for rec in records:
        db.session.execute(text("""
            UPDATE event_registrations
            SET attendance_status=:status, marked_at=NOW(), marked_by=:marked_by
            WHERE id=:rid AND event_id=:eid
        """), {"status": rec["status"], "marked_by": current_user.id, "rid": rec["registration_id"], "eid": event_id})
    db.session.commit()
    return jsonify({"message": f"Updated {len(records)} records"})


@attendance_bp.get("/<int:event_id>/attendance/summary")
@login_required
def attendance_summary(event_id):
    if current_user.role not in ("event_coordinator", "admin", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    row = db.session.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE attendance_status = 'present') AS present,
            COUNT(*) FILTER (WHERE attendance_status = 'absent') AS absent,
            COUNT(*) FILTER (WHERE attendance_status = 'registered' OR attendance_status IS NULL) AS pending
        FROM event_registrations WHERE event_id = :eid
    """), {"eid": event_id}).fetchone()
    return jsonify({
        "total": row.total, "present": row.present,
        "absent": row.absent, "pending": row.pending,
    })

from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db
from app.models.appointment import Appointment
from app.models.user import User

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


def serialize(apt):
    student = User.query.get(apt.student_id)
    faculty = User.query.get(apt.faculty_id)
    return {
        "id":               apt.id,
        "student_id":       apt.student_id,
        "faculty_id":       apt.faculty_id,
        "student_name":     student.name if student else None,
        "faculty_name":     faculty.name if faculty else None,
        "appointment_time": apt.appointment_time.isoformat() if apt.appointment_time else None,
        "status":           apt.status,
        "created_at":       apt.created_at.isoformat() if apt.created_at else None,
    }


@appointments_bp.route("/faculty", methods=["GET"])
def get_faculty():
    """Return all users with role=faculty for the dropdown."""
    faculty = User.query.filter_by(role="faculty").all()
    return jsonify([{"id": f.id, "name": f.name, "email": f.email} for f in faculty]), 200


@appointments_bp.route("", methods=["GET"])
def get_appointments():
    student_id = request.args.get("student_id", type=int)
    faculty_id = request.args.get("faculty_id", type=int)

    q = Appointment.query
    if student_id:
        q = q.filter_by(student_id=student_id)
    elif faculty_id:
        q = q.filter_by(faculty_id=faculty_id)

    apts = q.order_by(Appointment.created_at.desc()).all()
    return jsonify([serialize(a) for a in apts]), 200


@appointments_bp.route("", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    student_id = data.get("student_id")
    faculty_id = data.get("faculty_id")
    apt_time   = data.get("appointment_time") or data.get("time")
    purpose    = data.get("purpose", "")

    if not student_id or not faculty_id or not apt_time:
        return jsonify({"error": "student_id, faculty_id, and appointment_time are required"}), 400

    # Parse date/time — accept ISO string or separate date+time
    if isinstance(apt_time, str):
        try:
            parsed_time = datetime.fromisoformat(apt_time)
        except ValueError:
            date_str = data.get("date", "")
            time_str = apt_time
            try:
                parsed_time = datetime.fromisoformat(f"{date_str}T{time_str}")
            except ValueError:
                return jsonify({"error": "Invalid appointment_time format"}), 400
    else:
        return jsonify({"error": "appointment_time must be a string"}), 400

    # If separate date+time fields were sent
    if "date" in data and "time" in data:
        try:
            parsed_time = datetime.fromisoformat(f"{data['date']}T{data['time']}")
        except ValueError:
            pass  # keep what we parsed above

    apt = Appointment(
        student_id=student_id,
        faculty_id=faculty_id,
        appointment_time=parsed_time,
        status="requested",
    )
    db.session.add(apt)
    db.session.commit()
    return jsonify(serialize(apt)), 201


@appointments_bp.route("/<int:apt_id>", methods=["GET"])
def get_appointment(apt_id):
    apt = Appointment.query.get_or_404(apt_id)
    return jsonify(serialize(apt)), 200


@appointments_bp.route("/<int:apt_id>/respond", methods=["PUT"])
def respond_appointment(apt_id):
    apt  = Appointment.query.get_or_404(apt_id)
    data = request.get_json() or {}
    status = data.get("status") or data.get("response")

    if status not in ("approved", "rejected", "Approved", "Rejected"):
        return jsonify({"error": "status must be 'Approved' or 'Rejected'"}), 400

    apt.status = status.lower()
    db.session.commit()
    return jsonify(serialize(apt)), 200


@appointments_bp.route("/<int:apt_id>/cancel", methods=["DELETE"])
def cancel_appointment(apt_id):
    apt = Appointment.query.get_or_404(apt_id)
    apt.status = "cancelled"
    db.session.commit()
    return jsonify({"message": "Appointment cancelled", "id": apt_id}), 200

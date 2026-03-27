from flask import Blueprint, jsonify, request
from flask_login import current_user
from app.models.announcement import Announcement
from app.models import db
from sqlalchemy import asc

procedures_bp = Blueprint("procedures", __name__, url_prefix="/api/procedures")

VALID_CATEGORIES = {"academic", "financial", "registration", "it_services", "facilities", "general"}


def base_query():
    return Announcement.query.filter_by(content_type="procedure", is_active=True)


# ── GET /api/procedures ───────────────────────────────────────────────────────
@procedures_bp.route("", methods=["GET"])
def list_procedures():
    category = request.args.get("category", "").strip().lower() or None

    if category and category not in VALID_CATEGORIES:
        return jsonify({"status": "error", "message": f"Invalid category '{category}'."}), 422

    query = base_query()
    if category:
        query = query.filter_by(category=category)
    query = query.order_by(asc(Announcement.category), asc(Announcement.title))

    procedures = query.all()

    all_cats = [
        row.category
        for row in db.session.query(Announcement.category)
        .filter_by(content_type="procedure", is_active=True)
        .distinct()
        .order_by(asc(Announcement.category))
        .all()
        if row.category
    ]

    return jsonify({
        "status": "success",
        "data": {
            "procedures":  [p.to_summary_dict() for p in procedures],
            "categories":  all_cats,
            "total":       len(procedures),
        },
    }), 200


# ── GET /api/procedures/<id> ──────────────────────────────────────────────────
@procedures_bp.route("/<int:procedure_id>", methods=["GET"])
def get_procedure(procedure_id):
    proc = base_query().filter_by(id=procedure_id).first()
    if not proc:
        return jsonify({"status": "error", "message": f"Procedure {procedure_id} not found."}), 404
    return jsonify({"status": "success", "data": proc.to_detail_dict()}), 200


# ── POST /api/procedures  (admin only) ───────────────────────────────────────
@procedures_bp.route("", methods=["POST"])
def create_procedure():

    data   = request.get_json(silent=True) or {}
    errors = {}

    title    = (data.get("title")   or "").strip()
    message  = (data.get("message") or "").strip()
    category = (data.get("category") or "").strip().lower()
    steps    = data.get("steps")

    if not title:           errors["title"]    = "Title is required."
    elif len(title) > 150:  errors["title"]    = "Max 150 characters."
    if not message:         errors["message"]  = "Message is required."
    if category not in VALID_CATEGORIES:
        errors["category"] = f"Invalid category. Choose from: {sorted(VALID_CATEGORIES)}"
    if not isinstance(steps, list) or len(steps) == 0:
        errors["steps"] = "At least one step is required."

    if errors:
        return jsonify({"status": "error", "errors": errors}), 422

    proc = Announcement(
        title              = title,
        message            = message,
        content_type       = "procedure",
        category           = category,
        steps              = steps,
        estimated_duration = (data.get("estimated_duration") or "").strip() or None,
        created_by         = None,
        is_active          = True,
    )
    db.session.add(proc)
    db.session.commit()
    return jsonify({"status": "success", "data": proc.to_detail_dict()}), 201


# ── DELETE /api/procedures/<id>  (admin only) ─────────────────────────────────
@procedures_bp.route("/<int:procedure_id>", methods=["DELETE"])
def delete_procedure(procedure_id):
   
    proc = Announcement.query.filter_by(id=procedure_id, content_type="procedure").first()
    if not proc:
        return jsonify({"status": "error", "message": "Procedure not found."}), 404

    proc.is_active = False
    db.session.commit()
    return jsonify({"status": "success", "message": "Procedure deleted."}), 200


import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from app.models import db
from app.models.user import User
from app.models.service_request import ServiceRequest
from app.models.complaint import Complaint
from app.models.complaint_category import ComplaintCategory
from app.models.appointment import Appointment
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.notification import Notification
from app.models.announcement import Announcement
from app.models.request_status_history import RequestStatusHistory
from app.routes.departments import departments_bp
from app.routes.staff import staff_bp          # FR-03

load_dotenv()


def create_app() -> Flask:
    """
    Application factory for the SUMIS backend.
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    react_build_dir = os.path.join(base_dir, "frontend", "build")

    app = Flask(
        __name__,
        static_folder=react_build_dir,
        static_url_path="/",
    )

    app.url_map.strict_slashes = False

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me-in-production")

    db.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:5000",
                "http://127.0.0.1:5000",
            ],
            "supports_credentials": True,
        }},
    )

    # ── Register Blueprints ───────────────────────────────────
    app.register_blueprint(departments_bp)   # FR-02 — Ali
    app.register_blueprint(staff_bp)         # FR-03 — Qadir

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        """Serve React SPA for any non-API route."""
        index = os.path.join(react_build_dir, "index.html")
        if os.path.exists(index):
            return app.send_static_file("index.html")
        return jsonify({"message": "Frontend not built yet"}), 200

    with app.app_context():
        db.create_all()

        from app.models.department import Department

        if Department.query.count() == 0:
            seed_departments = [
                Department(
                    name="Computer Science",
                    building_location="Block A, Room 101",
                    contact_email="cs@sumis.edu",
                    contact_phone="+92 300-1111111",
                    description="Focuses on software development and computing.",
                    services="Labs, Programming Help, Research Support",
                ),
                Department(
                    name="Software Engineering",
                    building_location="Block B, Room 201",
                    contact_email="se@sumis.edu",
                    contact_phone="+92 300-2222222",
                    description="Specializes in software design and development lifecycle.",
                    services="Project Guidance, Labs, Industry Training",
                ),
                Department(
                    name="Artificial Intelligence",
                    building_location="Block C, Room 301",
                    contact_email="ai@sumis.edu",
                    contact_phone="+92 300-3333333",
                    description="Covers machine learning, deep learning, and AI systems.",
                    services="AI Labs, Research, Model Development",
                ),
                Department(
                    name="Data Science",
                    building_location="Block D, Room 401",
                    contact_email="ds@sumis.edu",
                    contact_phone="+92 300-4444444",
                    description="Focuses on data analysis and big data technologies.",
                    services="Data Labs, Analytics Support, Research",
                ),
            ]
            db.session.add_all(seed_departments)
            db.session.commit()
            print("✅ Sample departments seeded")

    return app

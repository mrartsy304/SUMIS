import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
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
from app.routes.procedures import procedures_bp

# ── Model imports (order matters — parents before children) ───────────────────
from app.models.user import User
from app.models.department import Department
from app.models.complaint_category import ComplaintCategory
from app.models.complaint import Complaint
from app.models.service_request import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.appointment import Appointment
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.notification import Notification
from app.models.announcement import Announcement

load_dotenv()


def create_app() -> Flask:
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
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me")

    # ── Initialize extensions ─────────────────────────────────────────────────
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
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Serve React SPA ───────────────────────────────────────────────────────
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        index = os.path.join(react_build_dir, "index.html")
        if os.path.exists(index):
            return app.send_static_file("index.html")
        return jsonify({"message": "Frontend not built yet"}), 200

    with app.app_context():
        db.create_all()

        # Seed departments if empty
        if Department.query.count() == 0:
            db.session.add_all(
                [
                    Department(
                        name="Computer Science",
                        building_location="Block A, Room 101",
                        contact_email="cs@sumis.edu",
                        contact_phone="+92 300-1111111",
                        description="Software development and computing.",
                        services="Labs, Programming Help, Research Support",
                    ),
                    Department(
                        name="Software Engineering",
                        building_location="Block B, Room 201",
                        contact_email="se@sumis.edu",
                        contact_phone="+92 300-2222222",
                        description="Software design and development lifecycle.",
                        services="Project Guidance, Labs, Industry Training",
                    ),
                    Department(
                        name="Artificial Intelligence",
                        building_location="Block C, Room 301",
                        contact_email="ai@sumis.edu",
                        contact_phone="+92 300-3333333",
                        description="Machine learning, deep learning, AI.",
                        services="AI Labs, Research, Model Development",
                    ),
                    Department(
                        name="Data Science",
                        building_location="Block D, Room 401",
                        contact_email="ds@sumis.edu",
                        contact_phone="+92 300-4444444",
                        description="Data analysis and big data technologies.",
                        services="Data Labs, Analytics Support, Research",
                    ),
                ]
            )
            db.session.commit()
            print("✅ Departments seeded")

    return app

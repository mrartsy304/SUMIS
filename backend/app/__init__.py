import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from dotenv import load_dotenv

from app.models import db
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

from app.routes.auth import auth_bp
from app.routes.departments import departments_bp
from app.routes.staff import staff_bp
from app.routes.procedures import procedures_bp
from app.routes.requests import requests_bp
from app.routes.Complaints import complaints_bp

load_dotenv()


def _migrate_complaints(conn):
    """Add any columns missing from the complaints table (safe to run every startup)."""
    COLUMNS = [
        ("title",       "VARCHAR(255)",             "'Untitled'"),
        ("description", "TEXT",                     "''"),
        ("category",    "VARCHAR(50)",              "'Other'"),
        ("priority",    "VARCHAR(20)",              "'Low'"),
        ("status",      "VARCHAR(20)",              "'Pending'"),
        ("updated_at",  "TIMESTAMP WITH TIME ZONE", "NOW()"),
    ]
    for col, col_type, default in COLUMNS:
        exists = conn.execute(
            db.text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='complaints' AND column_name=:c"
            ),
            {"c": col},
        ).fetchone()
        if not exists:
            conn.execute(
                db.text(
                    f"ALTER TABLE complaints ADD COLUMN {col} {col_type} NOT NULL DEFAULT {default};"
                )
            )
            print(f"  ✅ complaints: added column '{col}'", flush=True)
    conn.commit()


def _seed_complaints():
    """Insert 8 sample complaints if the table is empty. Safe to call every startup."""
    if Complaint.query.count() > 0:
        return

    student = User.query.filter_by(role="student").first()
    faculty = User.query.filter_by(role="faculty").first()
    staff   = User.query.filter_by(role="staff").first()
    fallback = User.query.first()

    def uid(u):
        return u.id if u else (fallback.id if fallback else None)

    samples = [
        Complaint(
            user_id=uid(student), status="Pending", category="Facility", priority="High",
            title="AC not working in Lab 3",
            description="The air conditioning unit in Lab 3 (Block A) has been non-functional for 3 days. Temperature is affecting student concentration during lab sessions.",
        ),
        Complaint(
            user_id=uid(student), status="Pending", category="IT", priority="Medium",
            title="WiFi dropping in Library",
            description="The WiFi connection in the main library drops every 15-20 minutes, disrupting online research and exam preparation.",
        ),
        Complaint(
            user_id=uid(faculty), status="Pending", category="IT", priority="Critical",
            title="Projector bulb burnt out — Room 204",
            description="The projector in Room 204 has a dead bulb. Lectures cannot proceed. Replacement was requested to IT two weeks ago with no response.",
        ),
        Complaint(
            user_id=uid(student), status="Pending", category="Academic", priority="High",
            title="Grade discrepancy in Data Structures",
            description="My mid-term marks were entered incorrectly. I scored 38/50 but the portal shows 28/50. I have the marked paper as evidence.",
        ),
        Complaint(
            user_id=uid(staff), status="Completed", category="Facility", priority="Medium",
            title="Washroom on Block B 2nd floor out of order",
            description="The washroom on the second floor of Block B had a broken flush and water leakage for over a week. Now resolved.",
        ),
        Complaint(
            user_id=uid(student), status="Pending", category="Administrative", priority="Critical",
            title="Transcript request delayed beyond stated timeline",
            description="Transcript request submitted 3 weeks ago. Stated processing time is 5 working days. No update received and the exam requiring it is in 4 days.",
        ),
        Complaint(
            user_id=uid(faculty), status="Completed", category="IT", priority="High",
            title="Student portal login broken for new batch",
            description="Fall 2025 batch students unable to log in. Accounts exist but password reset emails were not arriving. Now resolved.",
        ),
        Complaint(
            user_id=uid(student), status="Pending", category="Other", priority="Low",
            title="Canteen food quality has dropped significantly",
            description="Over the past month canteen food quality has declined. Multiple students reported stomach issues. A hygiene inspection is requested.",
        ),
    ]

    db.session.add_all(samples)
    db.session.commit()
    print(f"✅ {len(samples)} sample complaints seeded", flush=True)


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

    app.config["SQLALCHEMY_DATABASE_URI"]        = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"]                     = os.getenv("SECRET_KEY", "change-me")

    app.config["SESSION_COOKIE_SAMESITE"]  = "Lax"
    app.config["SESSION_COOKIE_SECURE"]    = False
    app.config["SESSION_COOKIE_HTTPONLY"]  = True
    app.config["REMEMBER_COOKIE_SAMESITE"] = "Lax"
    app.config["REMEMBER_COOKIE_SECURE"]   = False

    db.init_app(app)
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"success": False, "data": None, "message": "Authentication required."}), 401

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5000",
                "http://127.0.0.1:5000",
            ],
            "supports_credentials": True,
        }},
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(procedures_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(complaints_bp)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        index = os.path.join(react_build_dir, "index.html")
        if os.path.exists(index):
            return app.send_static_file("index.html")
        return jsonify({"message": "Frontend not built yet"}), 200

    with app.app_context():
        db.create_all()

        # Add any missing columns to complaints table
        with db.engine.connect() as conn:
            _migrate_complaints(conn)

        if Department.query.count() == 0:
            db.session.add_all([
                Department(name="Computer Science",        building_location="Block A, Room 101", contact_email="cs@sumis.edu", contact_phone="+92 300-1111111", description="Software development and computing.",         services="Labs, Programming Help, Research Support"),
                Department(name="Software Engineering",    building_location="Block B, Room 201", contact_email="se@sumis.edu", contact_phone="+92 300-2222222", description="Software design and development lifecycle.", services="Project Guidance, Labs, Industry Training"),
                Department(name="Artificial Intelligence", building_location="Block C, Room 301", contact_email="ai@sumis.edu", contact_phone="+92 300-3333333", description="Machine learning, deep learning, AI.",       services="AI Labs, Research, Model Development"),
                Department(name="Data Science",            building_location="Block D, Room 401", contact_email="ds@sumis.edu", contact_phone="+92 300-4444444", description="Data analysis and big data technologies.",   services="Data Labs, Analytics Support, Research"),
            ])
            db.session.commit()
            print("✅ Departments seeded")

        if ComplaintCategory.query.count() == 0:
            from app.services.seed_categories import seed_categories
            seed_categories()

        # Seed sample complaints (only if table is empty)
        _seed_complaints()

    return app
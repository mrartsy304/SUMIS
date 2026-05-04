import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from dotenv import load_dotenv

from app.models import db
from sqlalchemy import text
# ── Model imports ─────────────────────────────────────────────────────────────
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
from app.models.support_unit import SupportUnit
from app.models.complaint_v2 import ComplaintV2
from app.models.complaint_status_history import ComplaintStatusHistory

# ── Blueprint imports ─────────────────────────────────────────────────────────
from app.routes.departments import departments_bp
from app.routes.staff       import staff_bp
from app.routes.procedures  import procedures_bp
from app.routes.requests    import requests_bp
from app.routes.routing     import routing_bp
from app.routes.status      import status_bp
from app.routes.decision    import decision_bp
from app.routes.completion  import completion_bp
from app.routes.complaints_v2 import complaints_v2_bp
from app.routes.auth          import auth_bp
from app.routes.appointments  import appointments_bp

# ── New FR blueprints ─────────────────────────────────────────────────────────
from app.routes.location      import location_bp      # FR-01
from app.routes.events        import events_bp        # FR-15
from app.routes.attendance    import attendance_bp    # FR-16
from app.routes.announcements import announcements_bp # FR-17
from app.routes.notifications import notifications_bp # FR-18
from app.routes.reports       import reports_bp       # FR-19
from app.routes.analytics     import analytics_bp     # FR-20

load_dotenv()


def create_app() -> Flask:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    react_build_dir = os.path.join(base_dir, "frontend", "build")

    app = Flask(__name__, static_folder=react_build_dir, static_url_path="/")
    app.url_map.strict_slashes = False

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me")
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    CORS(app, resources={r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5000",
        ],
        "supports_credentials": True,
    }})

    # ── Register existing blueprints ──────────────────────────────────────────
    app.register_blueprint(departments_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(procedures_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(routing_bp)
    app.register_blueprint(status_bp)
    app.register_blueprint(decision_bp)
    app.register_blueprint(completion_bp)
    app.register_blueprint(complaints_v2_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointments_bp)

    # ── Register new blueprints ───────────────────────────────────────────────
    app.register_blueprint(location_bp)      # FR-01
    app.register_blueprint(events_bp)        # FR-15
    app.register_blueprint(attendance_bp)    # FR-16
    app.register_blueprint(announcements_bp) # FR-17
    app.register_blueprint(notifications_bp) # FR-18
    app.register_blueprint(reports_bp)       # FR-19
    app.register_blueprint(analytics_bp)     # FR-20

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        index = os.path.join(react_build_dir, "index.html")
        if os.path.exists(index):
            return app.send_static_file("index.html")
        return jsonify({"message": "Frontend not built yet"}), 200

    with app.app_context():
        db.create_all()

        # ── FR-01: campus_locations ───────────────────────────────────────────
        tbl_exists = db.session.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name='campus_locations'"
        )).fetchone()
        if not tbl_exists:
            db.session.execute(text("""
                CREATE TABLE campus_locations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    type VARCHAR(30) DEFAULT 'department',
                    floor VARCHAR(50),
                    area VARCHAR(100),
                    room VARCHAR(50),
                    direction TEXT,
                    building VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            db.session.commit()

        loc_count = db.session.execute(text("SELECT COUNT(*) FROM campus_locations")).scalar()
        if loc_count == 0:
            db.session.execute(text("""
                INSERT INTO campus_locations (name, type, floor, area, room, direction, building) VALUES
                ('CS Department Office',       'department',      'Ground Floor', 'Block A',       '101', 'Enter main gate, turn left',         'Academic Block A'),
                ('SE Department Office',       'department',      'First Floor',  'Block B',       '201', 'Take stairs near cafeteria',         'Academic Block B'),
                ('AI Research Lab',            'lab',             'Second Floor', 'Block C',       '301', 'Elevator to floor 2, turn right',    'Academic Block C'),
                ('Data Science Lab',           'lab',             'Third Floor',  'Block D',       '401', 'Use staircase near main entrance',   'Academic Block D'),
                ('Registrar Office',           'service_counter', 'Ground Floor', 'Main Block',    '005', 'Straight from main entrance',        'Administration Block'),
                ('Finance Office',             'service_counter', 'Ground Floor', 'Main Block',    '010', 'Right of main entrance lobby',       'Administration Block'),
                ('Student Affairs',            'service_counter', 'First Floor',  'Student Centre','110', 'Student Centre, first floor left',   'Student Centre'),
                ('Library',                    'service_counter', 'Ground Floor', 'Library Block', '001', 'Opposite cafeteria',                 'Library Block'),
                ('IT Help Desk',               'service_counter', 'Ground Floor', 'Block A',       '005', 'Next to Block A entrance',           'Academic Block A'),
                ('Physics Lab',                'lab',             'First Floor',  'Science Block', '102', 'Science block, first floor',         'Science Block'),
                ('Chemistry Lab',              'lab',             'First Floor',  'Science Block', '104', 'Science block, opposite Physics Lab','Science Block'),
                ('Dean Office',                'department',      'Second Floor', 'Admin Block',   '201', 'Admin Block second floor, end hall',  'Administration Block')
            """))
            db.session.commit()
            print("✅ campus_locations seeded")

        # ── FR-15: events table upgrades ──────────────────────────────────────
        for col, col_type in [("registration_deadline", "TIMESTAMP WITH TIME ZONE"), ("location", "VARCHAR(200)"), ("created_by", "INTEGER"), ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()")]:
            col_exists = db.session.execute(text(
                "SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name=:col"
            ), {"col": col}).fetchone()
            if not col_exists:
                db.session.execute(text(f"ALTER TABLE events ADD COLUMN {col} {col_type}"))
                db.session.commit()

        # ── FR-15: event_registrations rename/upgrade ─────────────────────────
        er_exists = db.session.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name='event_registrations'"
        )).fetchone()
        if not er_exists:
            db.session.execute(text("""
                CREATE TABLE event_registrations (
                    id SERIAL PRIMARY KEY,
                    event_id INTEGER NOT NULL REFERENCES events(id),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    attendance_status VARCHAR(20) DEFAULT 'registered',
                    marked_at TIMESTAMP WITH TIME ZONE,
                    marked_by INTEGER REFERENCES users(id),
                    UNIQUE(event_id, user_id)
                )
            """))
            db.session.commit()

        # ── FR-16: attendance columns on event_registrations ──────────────────
        for col, col_type in [("attendance_status", "VARCHAR(20) DEFAULT 'registered'"), ("marked_at", "TIMESTAMP WITH TIME ZONE"), ("marked_by", "INTEGER")]:
            col_exists = db.session.execute(text(
                "SELECT 1 FROM information_schema.columns WHERE table_name='event_registrations' AND column_name=:col"
            ), {"col": col}).fetchone()
            if not col_exists:
                db.session.execute(text(f"ALTER TABLE event_registrations ADD COLUMN {col} {col_type}"))
                db.session.commit()

        # ── FR-17: campus_announcements ───────────────────────────────────────
        ann_exists = db.session.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name='campus_announcements'"
        )).fetchone()
        if not ann_exists:
            db.session.execute(text("""
                CREATE TABLE campus_announcements (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    body TEXT NOT NULL,
                    priority VARCHAR(20) DEFAULT 'normal',
                    target_roles VARCHAR(50) DEFAULT 'all',
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            db.session.commit()

        # ── FR-18: user_notifications ─────────────────────────────────────────
        notif_exists = db.session.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name='user_notifications'"
        )).fetchone()
        if not notif_exists:
            db.session.execute(text("""
                CREATE TABLE user_notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    title VARCHAR(200),
                    body TEXT NOT NULL,
                    type VARCHAR(30) DEFAULT 'info',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            db.session.commit()

        # ── FR-20: ALTER service_requests add type, category ──────────────────
        for col, col_type in [("type", "VARCHAR(100)"), ("category", "VARCHAR(100)")]:
            col_exists = db.session.execute(text(
                "SELECT 1 FROM information_schema.columns WHERE table_name='service_requests' AND column_name=:col"
            ), {"col": col}).fetchone()
            if not col_exists:
                db.session.execute(text(f"ALTER TABLE service_requests ADD COLUMN {col} {col_type}"))
                db.session.commit()

        # ── Existing seeds ────────────────────────────────────────────────────
        if Department.query.count() == 0:
            db.session.add_all([
                Department(name="Computer Science",        building_location="Block A, Room 101", contact_email="cs@sumis.edu", contact_phone="+92 300-1111111", description="Software development and computing.",        services="Labs, Programming Help, Research Support"),
                Department(name="Software Engineering",    building_location="Block B, Room 201", contact_email="se@sumis.edu", contact_phone="+92 300-2222222", description="Software design and development lifecycle.", services="Project Guidance, Labs, Industry Training"),
                Department(name="Artificial Intelligence", building_location="Block C, Room 301", contact_email="ai@sumis.edu", contact_phone="+92 300-3333333", description="Machine learning, deep learning, AI.",        services="AI Labs, Research, Model Development"),
                Department(name="Data Science",            building_location="Block D, Room 401", contact_email="ds@sumis.edu", contact_phone="+92 300-4444444", description="Data analysis and big data technologies.",  services="Data Labs, Analytics Support, Research"),
            ])
            db.session.commit()
            print("✅ Departments seeded")

        if ComplaintCategory.query.count() == 0:
            from app.services.seed_categories import seed_categories
            seed_categories()

        if SupportUnit.query.count() == 0:
            from app.services.seed_support_units import seed_support_units
            seed_support_units()

        if User.query.count() == 0:
            from app.services.seed_users import seed_users
            seed_users()

    return app
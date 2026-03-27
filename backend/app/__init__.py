import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text

from app.models import db
from app.routes.departments import departments_bp
from app.routes.location import location_bp

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

    # FIX 1: Disable strict slashes globally so /api/departments and
    # /api/departments/ are treated as the same route. Without this Flask
    # returns a 308 redirect for the version without a trailing slash,
    # which axios follows but the CORS preflight then fails.
    app.url_map.strict_slashes = False

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me-in-production")

    db.init_app(app)

    # FIX 2: withCredentials:true in axios is incompatible with origins="*".
    # The browser blocks the response when both are set simultaneously.
    # Solution: explicitly list the React dev server origin and set
    # supports_credentials=True. Add your production domain here later.
    CORS(
        app,
        resources={r"/api/*": {
            "origins": [
                "http://localhost:5000",
                "http://127.0.0.1:5000",
            ],
            "supports_credentials": True,
        }},
    )

    app.register_blueprint(departments_bp)
    app.register_blueprint(location_bp)

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

        # If this repo was already used with an older schema, `create_all()`
        # won't add new columns automatically. Ensure campus coordinate columns
        # exist so FR-01 can work without manual migrations.
        if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
            db.engine.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.tables
                            WHERE table_name = 'departments'
                        ) THEN
                            ALTER TABLE departments ADD COLUMN IF NOT EXISTS building_lat DOUBLE PRECISION;
                            ALTER TABLE departments ADD COLUMN IF NOT EXISTS building_lng DOUBLE PRECISION;
                        END IF;
                    END
                    $$;
                    """
                )
            )

        from app.models.department import Department

        # FR-01: Seed/fill campus map coordinates.
        #
        # For the real university map (Leaflet + OpenStreetMap tiles),
        # `building_lat` / `building_lng` must be geographic coordinates.
        seed_departments = [
            {
                "name": "Computer Science",
                "building_location": "Block A, Room 101",
                "building_lat": 24.8607,
                "building_lng": 67.0011,
                "contact_email": "cs@sumis.edu",
                "contact_phone": "+92 300-1111111",
                "description": "Focuses on software development and computing.",
                "services": "Labs, Programming Help, Research Support",
            },
            {
                "name": "Software Engineering",
                "building_location": "Block B, Room 201",
                "building_lat": 24.8612,
                "building_lng": 67.0020,
                "contact_email": "se@sumis.edu",
                "contact_phone": "+92 300-2222222",
                "description": "Specializes in software design and development lifecycle.",
                "services": "Project Guidance, Labs, Industry Training",
            },
            {
                "name": "Artificial Intelligence",
                "building_location": "Block C, Room 301",
                "building_lat": 24.8620,
                "building_lng": 67.0004,
                "contact_email": "ai@sumis.edu",
                "contact_phone": "+92 300-3333333",
                "description": "Covers machine learning, deep learning, and AI systems.",
                "services": "AI Labs, Research, Model Development",
            },
            {
                "name": "Data Science",
                "building_location": "Block D, Room 401",
                "building_lat": 24.8599,
                "building_lng": 67.0030,
                "contact_email": "ds@sumis.edu",
                "contact_phone": "+92 300-4444444",
                "description": "Focuses on data analysis and big data technologies.",
                "services": "Data Labs, Analytics Support, Research",
            },
            {
                "name": "AI Research Lab",
                "building_location": "Block C, Floor 2, Lab 12",
                "building_lat": 24.8624,
                "building_lng": 67.0013,
                "contact_email": "ai-lab@sumis.edu",
                "contact_phone": "+92 300-5555555",
                "description": "Dedicated artificial intelligence lab used for projects and research sprints.",
                "services": "Model training, GPU cluster access, project workspaces",
            },
            {
                "name": "Central Library",
                "building_location": "Library Block, Ground Floor",
                "building_lat": 24.8602,
                "building_lng": 67.0028,
                "contact_email": "library@sumis.edu",
                "contact_phone": "+92 300-6666666",
                "description": "Main campus library with collaborative spaces and digital resource access.",
                "services": "Book lending, study rooms, digital archives",
            },
            {
                "name": "Student Services Center",
                "building_location": "Student Center, Lobby",
                "building_lat": 24.8596,
                "building_lng": 67.0019,
                "contact_email": "support@sumis.edu",
                "contact_phone": "+92 300-7777777",
                "description": "Front-desk for student affairs, counselling, and general guidance.",
                "services": "Advising, counselling, ID card and enrollment support",
            },
        ]

        # Upsert: add missing departments + backfill coordinates when needed.
        changed = False
        for seed in seed_departments:
            dept = Department.query.filter(Department.name == seed["name"]).first()

            if not dept:
                db.session.add(Department(**seed))
                changed = True
                continue

            coords_missing = dept.building_lat is None or dept.building_lng is None

            # If the app was previously run with the pixel-based CRS.Simple
            # map, lat/lng might be in the ~[0..800]/[0..1200] ranges.
            # Pixel-based values from the CRS.Simple version were roughly
            # in the [150..650] / [200..1000] ranges.
            coords_looks_like_pixels = (
                isinstance(dept.building_lat, (int, float))
                and isinstance(dept.building_lng, (int, float))
                and dept.building_lat >= 0
                and dept.building_lat <= 800
                and dept.building_lng >= 0
                and dept.building_lng <= 1200
                and dept.building_lat > 100
                and dept.building_lng > 100
            )

            if coords_missing or coords_looks_like_pixels:
                dept.building_location = seed["building_location"]
                dept.building_lat = seed["building_lat"]
                dept.building_lng = seed["building_lng"]
                changed = True

        if changed:
            db.session.commit()
            print("✅ Campus locations upserted/backfilled")

    return app
from app import create_app

app = create_app()

# db.create_all() is already called inside create_app() via the app_context
# block in __init__.py. No need to repeat it here.

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
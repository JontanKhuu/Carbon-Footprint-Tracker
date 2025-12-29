import os
from app import create_app, db
from flask_migrate import upgrade

# Get environment from environment variable or default to development
# Note: FLASK_ENV can be 'testing' which uses SQLite, but we want to use the DATABASE_URL
# So we check if DATABASE_URL is set and use 'development' config if it points to PostgreSQL
flask_env = os.environ.get('FLASK_ENV', 'development').lower()
database_url = os.environ.get('DATABASE_URL', '')

# If DATABASE_URL is set and points to PostgreSQL, use development config
# Otherwise, respect FLASK_ENV setting
if database_url and 'postgresql' in database_url.lower():
    config_name = 'development'
elif flask_env == 'production':
    config_name = 'production'
elif flask_env == 'testing':
    config_name = 'testing'
else:
    config_name = 'development'

app = create_app(config_name)


@app.cli.command()
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database initialized!")


@app.cli.command()
def migrate_db():
    """Run database migrations"""
    upgrade()
    print("Database migrations completed!")


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = config_name == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)


import os
from app import create_app, db
from flask_migrate import upgrade

# Get environment from environment variable or default to development
config_name = os.environ.get('FLASK_ENV', 'development').lower()
if config_name == 'production':
    config_name = 'production'
elif config_name == 'testing':
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


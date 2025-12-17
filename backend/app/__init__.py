from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flasgger import Swagger
from config import config
import sys
import os

# Add backend directory to path to import swagger_config
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
from swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()


def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints FIRST (before Swagger initialization)
    from app.routes import emissions_bp, users_bp, health_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(emissions_bp, url_prefix='/api/emissions')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Initialize Swagger for API documentation AFTER routes are registered
    # This allows Flasgger to scan and document all registered routes
    # Create a new Swagger instance for this app
    try:
        swagger = Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)
        app.logger.info("Flasgger initialized successfully")
    except Exception as e:
        app.logger.error(f"Failed to initialize Flasgger: {e}", exc_info=True)
        # Don't fail the app startup if Swagger fails, but log the error
        import traceback
        app.logger.error(traceback.format_exc())
    
    # Create database tables if they don't exist
    # db.create_all() with checkfirst=True (default) is safe - it only creates
    # tables that don't exist and does NOT drop existing tables or data
    with app.app_context():
        db.create_all()
    
    return app


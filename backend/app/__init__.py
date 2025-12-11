from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import config

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
    
    # Register blueprints
    from app.routes import emissions_bp, users_bp, health_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(emissions_bp, url_prefix='/api/emissions')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Create database tables if they don't exist
    # db.create_all() with checkfirst=True (default) is safe - it only creates
    # tables that don't exist and does NOT drop existing tables or data
    with app.app_context():
        db.create_all()
    
    return app


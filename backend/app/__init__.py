from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flasgger import Swagger
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
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
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour"],
    storage_uri=None,  # Use in-memory storage by default
    strategy="fixed-window",
    headers_enabled=True  # Enable rate limit headers in responses
)


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
    
    # Initialize rate limiter
    if app.config.get('RATELIMIT_ENABLED', True):
        # Configure storage URL if provided (e.g., Redis for production)
        storage_url = app.config.get('RATELIMIT_STORAGE_URL')
        if storage_url:
            limiter.storage_uri = storage_url
        limiter.init_app(app)
        app.logger.info("Rate limiting enabled")
    else:
        app.logger.info("Rate limiting disabled")
    
    # Register blueprints FIRST (before Swagger initialization)
    from app.routes import emissions_bp, users_bp, health_bp
    # Register health blueprint with /api prefix to match Swagger basePath
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(emissions_bp, url_prefix='/api/emissions')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Rate limiting is now applied via decorators in the route files
    # No need for programmatic wrapping here
    
    # Register routes to serve custom Swagger CSS and JS
    @app.route('/static/swagger_custom.css')
    def swagger_custom_css():
        """Serve custom CSS for Swagger UI"""
        from flask import send_from_directory
        import os
        css_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'swagger_custom.css')
        return send_from_directory(os.path.dirname(css_path), 'swagger_custom.css', mimetype='text/css')
    
    @app.route('/static/swagger_custom.js')
    def swagger_custom_js():
        """Serve custom JavaScript for Swagger UI"""
        from flask import send_from_directory
        import os
        js_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'swagger_custom.js')
        return send_from_directory(os.path.dirname(js_path), 'swagger_custom.js', mimetype='application/javascript')
    
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
    
    # Inject custom CSS and JS into Swagger UI responses
    @app.after_request
    def inject_swagger_custom_assets(response):
        """Inject custom CSS and JS into Swagger UI to fix text visibility"""
        # Only modify Swagger UI HTML responses
        if response.content_type and 'text/html' in response.content_type:
            try:
                # Check if this is a Swagger UI page
                data = response.get_data(as_text=True)
                # Check for Swagger UI indicators in the HTML or URL path
                is_swagger_page = (
                    'swagger-ui' in data.lower() or 
                    'swagger' in data.lower() or
                    (hasattr(response, 'request') and response.request and 
                     ('apidocs' in response.request.path.lower() if hasattr(response.request, 'path') else False))
                )
                
                if is_swagger_page:
                    # Inject custom CSS link
                    css_injection = '<link rel="stylesheet" type="text/css" href="/static/swagger_custom.css" />'
                    # Inject custom JS
                    js_injection = '<script src="/static/swagger_custom.js"></script>'
                    
                    # Inject before closing head tag
                    if '</head>' in data:
                        data = data.replace('</head>', f'    {css_injection}\n</head>')
                    # Inject before closing body tag
                    if '</body>' in data:
                        data = data.replace('</body>', f'    {js_injection}\n</body>')
                    
                    response.set_data(data)
            except Exception as e:
                # If injection fails, log but don't break the response
                app.logger.warning(f"Failed to inject Swagger custom assets: {e}")
        
        return response
    
    # Add error handler for rate limit exceeded
    @app.errorhandler(429)
    def ratelimit_handler(e):
        """Handle rate limit exceeded errors"""
        return jsonify({
            'error': 'Rate limit exceeded. Please try again later.',
            'message': str(e.description) if hasattr(e, 'description') else 'Too many requests',
            'code': 'RATE_LIMIT_EXCEEDED'
        }), 429
    
    # Create database tables if they don't exist
    # db.create_all() with checkfirst=True (default) is safe - it only creates
    # tables that don't exist and does NOT drop existing tables or data
    with app.app_context():
        db.create_all()
    
    return app


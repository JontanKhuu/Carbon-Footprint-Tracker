from flask import Blueprint, jsonify, current_app
from app import db

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health Check Endpoint
    ---
    tags:
      - Health
    summary: Check API and database health status
    description: Returns the health status of the API and database connection. This endpoint does not require authentication.
    security: []  # No authentication required
    responses:
      200:
        description: Health status information
        schema:
          type: object
          properties:
            status:
              type: string
              example: healthy
            database:
              type: string
              example: connected
        examples:
          application/json:
            status: healthy
            database: connected
    """
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status
    }), 200


@health_bp.route('/debug/routes', methods=['GET'])
def debug_routes():
    """
    Debug endpoint to list all registered routes
    ---
    tags:
      - Health
    summary: List all registered routes (debug endpoint)
    description: Returns a list of all registered routes for debugging purposes
    security: []  # No authentication required
    responses:
      200:
        description: List of routes
    """
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'rule': rule.rule,
            'endpoint': rule.endpoint,
            'methods': sorted(rule.methods),
            'arguments': list(rule.arguments) if rule.arguments else []
        })
    
    # Check for Flasgger
    flasgger_info = {
        'installed': False,
        'initialized': False,
        'routes_found': []
    }
    
    try:
        import flasgger
        flasgger_info['installed'] = True
        flasgger_info['version'] = getattr(flasgger, '__version__', 'unknown')
        
        if hasattr(current_app, 'extensions') and 'swagger' in current_app.extensions:
            flasgger_info['initialized'] = True
            flasgger_info['swagger_instance'] = str(current_app.extensions['swagger'])
        
        # Find Flasgger routes
        for route in routes:
            if any(keyword in route['endpoint'].lower() for keyword in ['swagger', 'flasgger', 'apidocs', 'apispec']):
                flasgger_info['routes_found'].append(route)
    except ImportError:
        pass
    
    return jsonify({
        'total_routes': len(routes),
        'routes': routes,
        'flasgger': flasgger_info
    }), 200


@health_bp.route('/debug/headers', methods=['GET'])
def debug_headers():
    """
    Debug endpoint to inspect request headers
    ---
    tags:
      - Health
    summary: Debug request headers (debug endpoint)
    description: Returns all request headers for debugging authentication issues
    security: []  # No authentication required
    responses:
      200:
        description: Request headers
    """
    from flask import request
    headers = dict(request.headers)
    return jsonify({
        'headers': headers,
        'authorization_header': request.headers.get('Authorization', 'NOT FOUND'),
        'authorization_parts': request.headers.get('Authorization', '').split() if request.headers.get('Authorization') else []
    }), 200


"""
CSRF protection utilities for the API

For REST APIs with JWT authentication, CSRF protection works differently than
traditional cookie-based sessions. We use a token-based approach where:
1. CSRF token is generated and returned on login/registration
2. Token is stored client-side and sent in X-CSRF-Token header
3. Token is validated for state-changing operations (POST, PUT, DELETE)
"""
import secrets
from functools import wraps
from flask import request, jsonify
from typing import Optional, Dict


# CSRF token configuration
CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_HEADER = 'X-CSRF-Token'


def generate_csrf_token() -> str:
    """
    Generate a secure random CSRF token.
    
    Returns:
        A URL-safe base64-encoded token string
    """
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def get_csrf_token_from_request() -> Optional[str]:
    """
    Extract CSRF token from request header.
    
    Returns:
        CSRF token string or None if not found
    """
    return request.headers.get(CSRF_TOKEN_HEADER)


def validate_csrf_token(token: str, stored_token: str) -> bool:
    """
    Validate a CSRF token against a stored token.
    Uses constant-time comparison to prevent timing attacks.
    
    Args:
        token: Token from request
        stored_token: Token stored in JWT payload or client
        
    Returns:
        True if tokens match, False otherwise
    """
    if not token or not stored_token:
        return False
    
    # Use secrets.compare_digest for constant-time comparison
    return secrets.compare_digest(token, stored_token)


def get_csrf_token_from_jwt() -> Optional[str]:
    """
    Extract CSRF token from JWT token payload.
    The CSRF token is embedded in the JWT when it's generated.
    
    Returns:
        CSRF token string or None if not found
    """
    try:
        # Lazy import to avoid circular dependency
        from app.utils.jwt import verify_token, get_token_from_request
        
        token = get_token_from_request()
        if not token:
            return None
        
        payload = verify_token(token, token_type='access')
        return payload.get('csrf_token')
    except Exception:
        return None


def csrf_protect(f):
    """
    Decorator to protect routes from CSRF attacks.
    Requires a valid CSRF token in the X-CSRF-Token header.
    
    For JWT-based authentication, the CSRF token is embedded in the JWT payload
    and must match the token sent in the header.
    
    Usage:
        @emissions_bp.route('/emissions', methods=['POST'])
        @token_required
        @csrf_protect
        def create_emission(current_user):
            # ... rest of function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if CSRF protection is enabled
        from flask import current_app
        if not current_app.config.get('CSRF_ENABLED', True):
            return f(*args, **kwargs)
        
        # Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return f(*args, **kwargs)
        
        # Get CSRF token from request header
        csrf_token = get_csrf_token_from_request()
        
        if not csrf_token:
            return jsonify({
                'error': 'CSRF token missing',
                'code': 'CSRF_TOKEN_MISSING',
                'message': 'CSRF token is required for this request. Please include X-CSRF-Token header.'
            }), 403
        
        # Get stored token from JWT payload
        stored_token = get_csrf_token_from_jwt()
        
        if not stored_token:
            return jsonify({
                'error': 'CSRF token not found in authentication token',
                'code': 'CSRF_TOKEN_NOT_FOUND',
                'message': 'CSRF token not found. Please log in again to get a new token.'
            }), 403
        
        # Validate token
        if not validate_csrf_token(csrf_token, stored_token):
            return jsonify({
                'error': 'Invalid CSRF token',
                'code': 'CSRF_TOKEN_INVALID',
                'message': 'CSRF token validation failed. Please refresh the page and try again.'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated


def csrf_exempt(f):
    """
    Decorator to exempt a route from CSRF protection.
    Use sparingly and only for endpoints that don't modify state.
    
    Usage:
        @health_bp.route('/health', methods=['GET'])
        @csrf_exempt
        def health_check():
            # ... rest of function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    
    # Mark function as CSRF exempt
    decorated._csrf_exempt = True
    return decorated


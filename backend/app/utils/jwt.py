"""
JWT utility functions for token generation and verification
"""
import jwt
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional
from flask import request, jsonify
from app import db
from app.models.user import User


# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24  # Token expires in 24 hours
JWT_REFRESH_EXPIRATION_DAYS = 7  # Refresh token expires in 7 days


def generate_token(user_id: int, username: str, email: str) -> dict:
    """
    Generate JWT access token and refresh token for a user.
    
    Args:
        user_id: User's ID
        username: User's username
        email: User's email
    
    Returns:
        Dictionary containing 'access_token', 'refresh_token', and 'expires_in'
    """
    now = datetime.now(timezone.utc)
    
    # Access token payload
    access_payload = {
        'user_id': user_id,
        'username': username,
        'email': email,
        'type': 'access',
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    
    # Refresh token payload
    refresh_payload = {
        'user_id': user_id,
        'type': 'refresh',
        'iat': now,
        'exp': now + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
    }
    
    # Generate tokens (jwt.encode returns a string in PyJWT 2.x)
    access_token = jwt.encode(access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': JWT_EXPIRATION_HOURS * 3600,  # seconds
        'token_type': 'Bearer'
    }


def verify_token(token: str, token_type: str = 'access') -> dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        token_type: Expected token type ('access' or 'refresh')
    
    Returns:
        Dictionary containing decoded token payload
    
    Raises:
        jwt.ExpiredSignatureError: If token is expired
        jwt.InvalidTokenError: If token is invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != token_type:
            raise jwt.InvalidTokenError('Invalid token type')
        
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError('Token has expired')
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f'Invalid token: {str(e)}')


def get_current_user() -> User:
    """
    Get the current authenticated user from the JWT token in the request.
    
    Returns:
        User object
    
    Raises:
        ValueError: If token is missing or invalid
    """
    token = get_token_from_request()
    if not token:
        raise ValueError('No token provided')
    
    payload = verify_token(token, token_type='access')
    user_id = payload.get('user_id')
    
    if not user_id:
        raise ValueError('Invalid token payload')
    
    user = User.query.get(user_id)
    if not user:
        raise ValueError('User not found')
    
    return user


def get_token_from_request() -> Optional[str]:
    """
    Extract JWT token from request headers.
    
    Returns:
        Token string or None if not found
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    # Check for Bearer token format
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]


def token_required(f):
    """
    Decorator to protect routes that require authentication.
    
    Usage:
        @emissions_bp.route('/emissions', methods=['GET'])
        @token_required
        def get_emissions():
            current_user = get_current_user()
            # ... rest of function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            user = get_current_user()
            # Add current_user to kwargs so route can access it
            kwargs['current_user'] = user
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except ValueError as e:
            error_message = str(e)
            if 'No token provided' in error_message:
                return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
            else:
                return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN'}), 401
    
    return decorated


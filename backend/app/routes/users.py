from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.utils.jwt import generate_token, verify_token, token_required

users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
def get_users():
    """Get all users"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user by ID"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@users_bp.route('', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields: username, email, password'}), 400
    
    # Collect all validation errors
    errors = {}
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        errors['username'] = 'Username already exists'
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        errors['email'] = 'Email already exists'
    
    # Validate password strength
    password = data.get('password', '')
    password_errors = []
    
    if len(password) < 8:
        password_errors.append('Password must be at least 8 characters long')
    if not any(c.isupper() for c in password):
        password_errors.append('Password must contain at least one uppercase letter')
    if not any(c.islower() for c in password):
        password_errors.append('Password must contain at least one lowercase letter')
    if not any(c.isdigit() for c in password):
        password_errors.append('Password must contain at least one number')
    if not any(not c.isalnum() for c in password):
        password_errors.append('Password must contain at least one special character')
    
    if password_errors:
        errors['password'] = '. '.join(password_errors)
    
    # If there are any errors, return them all
    if errors:
        return jsonify({
            'error': 'Validation failed',
            'errors': errors
        }), 400
    
    try:
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update an existing user"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    try:
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    user = User.query.get_or_404(user_id)
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@users_bp.route('/login', methods=['POST'])
def login():
    """Login a user and return JWT tokens"""
    data = request.get_json()
    
    # Check if usernameOrEmail and password are provided
    if not data or 'usernameOrEmail' not in data or 'password' not in data:
        return jsonify({'error': 'Missing username/email or password'}), 400
    
    username_or_email = data['usernameOrEmail']
    password = data['password']
    
    # Try to find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT tokens
    tokens = generate_token(user.id, user.username, user.email)
    
    # Return user data and tokens
    return jsonify({
        'user': user.to_dict(),
        **tokens
    }), 200


@users_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Refresh token required'}), 400
    
    refresh_token_str = data['refresh_token']
    
    try:
        # Verify refresh token
        payload = verify_token(refresh_token_str, token_type='refresh')
        user_id = payload.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate new access token
        tokens = generate_token(user.id, user.username, user.email)
        
        # Return new access token (and new refresh token)
        return jsonify({
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'expires_in': tokens['expires_in'],
            'token_type': tokens['token_type']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 401


@users_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_info(current_user):
    """Get current authenticated user's information"""
    return jsonify(current_user.to_dict()), 200
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.utils.jwt import generate_token, verify_token, token_required

users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
def get_users():
    """
    Get All Users
    ---
    tags:
      - Users
    summary: Retrieve all users
    description: Returns a list of all registered users in the system
    responses:
      200:
        description: List of users
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              username:
                type: string
                example: john_doe
              email:
                type: string
                example: john@example.com
              created_at:
                type: string
                format: date-time
                example: "2024-01-01T00:00:00"
              updated_at:
                type: string
                format: date-time
                example: "2024-01-01T00:00:00"
    """
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    Get User by ID
    ---
    tags:
      - Users
    summary: Retrieve a specific user by ID
    description: Returns detailed information about a specific user
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: The ID of the user to retrieve
    responses:
      200:
        description: User information
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 1
            username:
              type: string
              example: john_doe
            email:
              type: string
              example: john@example.com
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      404:
        description: User not found
    """
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@users_bp.route('', methods=['POST'])
def create_user():
    """
    Create New User
    ---
    tags:
      - Users
    summary: Register a new user
    description: Creates a new user account with username, email, and password
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
              example: john_doe
              description: Unique username
            email:
              type: string
              example: john@example.com
              description: Valid email address
            password:
              type: string
              example: SecurePass123!
              description: Password (min 8 chars, must contain uppercase, lowercase, number, and special char)
    responses:
      201:
        description: User created successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
            email:
              type: string
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      400:
        description: Validation error or user already exists
        schema:
          type: object
          properties:
            error:
              type: string
            errors:
              type: object
    """
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
    """
    Update User
    ---
    tags:
      - Users
    summary: Update an existing user
    description: Updates user information (username, email, or password)
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: The ID of the user to update
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              example: new_username
            email:
              type: string
              example: newemail@example.com
            password:
              type: string
              example: NewSecurePass123!
    responses:
      200:
        description: User updated successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
            email:
              type: string
      400:
        description: Validation error
      404:
        description: User not found
    """
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
    """
    Delete User
    ---
    tags:
      - Users
    summary: Delete a user account
    description: Permanently deletes a user account and all associated data
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: The ID of the user to delete
    responses:
      200:
        description: User deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: User deleted successfully
      404:
        description: User not found
    """
    user = User.query.get_or_404(user_id)
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@users_bp.route('/login', methods=['POST'])
def login():
    """
    User Login
    ---
    tags:
      - Users
    summary: Authenticate user and get JWT tokens
    description: Authenticates a user with username/email and password, returns JWT access and refresh tokens
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - usernameOrEmail
            - password
          properties:
            usernameOrEmail:
              type: string
              example: john_doe
              description: Username or email address
            password:
              type: string
              example: SecurePass123!
              description: User password
    responses:
      200:
        description: Login successful, returns user data and tokens
        schema:
          type: object
          properties:
            user:
              type: object
              properties:
                id:
                  type: integer
                username:
                  type: string
                email:
                  type: string
            access_token:
              type: string
              description: JWT access token (valid for 24 hours)
            refresh_token:
              type: string
              description: JWT refresh token (valid for 7 days)
            expires_in:
              type: integer
              example: 86400
              description: Token expiration time in seconds
            token_type:
              type: string
              example: Bearer
        examples:
          application/json:
            user:
              id: 1
              username: john_doe
              email: john@example.com
            access_token: eyJ0eXAiOiJKV1QiLCJhbGc...
            refresh_token: eyJ0eXAiOiJKV1QiLCJhbGc...
            expires_in: 86400
            token_type: Bearer
      400:
        description: Missing credentials
      401:
        description: Invalid credentials
    """
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
    """
    Refresh Access Token
    ---
    tags:
      - Users
    summary: Refresh JWT access token
    description: Generates a new access token using a valid refresh token
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - refresh_token
          properties:
            refresh_token:
              type: string
              example: eyJ0eXAiOiJKV1QiLCJhbGc...
              description: Valid refresh token
    responses:
      200:
        description: New tokens generated successfully
        schema:
          type: object
          properties:
            access_token:
              type: string
            refresh_token:
              type: string
            expires_in:
              type: integer
            token_type:
              type: string
              example: Bearer
      400:
        description: Refresh token missing
      401:
        description: Invalid or expired refresh token
    """
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
    """
    Get Current User Info
    ---
    tags:
      - Users
    summary: Get authenticated user's information
    description: Returns information about the currently authenticated user (requires JWT token)
    security:
      - Bearer: []
    responses:
      200:
        description: Current user information
        schema:
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
            email:
              type: string
            created_at:
              type: string
              format: date-time
            updated_at:
              type: string
              format: date-time
      401:
        description: Unauthorized - Invalid or missing token
    """
    return jsonify(current_user.to_dict()), 200
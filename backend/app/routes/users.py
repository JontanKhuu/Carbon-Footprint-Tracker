from flask import Blueprint, request, jsonify, current_app
from app import db, limiter
from app.models.user import User
from app.utils.jwt import generate_token, verify_token, token_required
from app.utils.csrf import csrf_protect
from flask_limiter.util import get_remote_address
import re

users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
def get_users():
    """
    Get All Users
    ---
    tags:
      - Users
    summary: Retrieve all users
    description: Returns a list of all registered users in the system. This endpoint does not require authentication.
    security: []  # No authentication required
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
@limiter.limit("5 per minute", key_func=get_remote_address)
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
    
    # Validate email format - only .com domains allowed
    email = data.get('email', '').strip()
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$'
    if not email or not re.match(email_pattern, email):
        errors['email'] = 'Please enter a valid email address ending with .com'
    elif len(email) > 254:  # RFC 5321 limit
        errors['email'] = 'Email address is too long'
    else:
        # Check if email already exists (only if format is valid)
        if User.query.filter_by(email=email).first():
            errors['email'] = 'Email already exists'
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        errors['username'] = 'Username already exists'
    
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
        current_app.logger.info(f"Creating user: {data['username']}")
        
        # Check sequence before creating user (PostgreSQL only)
        from sqlalchemy import text
        try:
            with db.engine.connect() as seq_conn:
                seq_result = seq_conn.execute(text("SELECT last_value, is_called FROM users_id_seq")).fetchone()
                current_app.logger.info(f"Sequence before user creation: last_value={seq_result[0]}, is_called={seq_result[1]}")
        except Exception as seq_err:
            current_app.logger.warning(f"Could not check sequence (might be SQLite or other DB): {seq_err}")
        
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        current_app.logger.info(f"User object created, ID before add: {getattr(user, 'id', 'None')}")
        
        db.session.add(user)
        current_app.logger.info(f"User added to session, ID after add: {getattr(user, 'id', 'None')}")
        
        current_app.logger.debug("Flushing to get ID from database...")
        db.session.flush()  # Flush to get the ID from database
        user_id = user.id
        username = user.username
        current_app.logger.info(f"User flushed with ID: {user_id}, Username: {username}")
        
        # Check sequence after flush (PostgreSQL only)
        try:
            with db.engine.connect() as seq_conn:
                seq_result = seq_conn.execute(text("SELECT last_value, is_called FROM users_id_seq")).fetchone()
                current_app.logger.info(f"Sequence after flush: last_value={seq_result[0]}, is_called={seq_result[1]}")
        except Exception as seq_err:
            current_app.logger.warning(f"Could not check sequence after flush: {seq_err}")
        
        # Commit the transaction - ensure it's fully committed
        db.session.commit()
        current_app.logger.info(f"Transaction committed for user ID: {user_id}, Username: {username}")
        
        # Check sequence after commit (PostgreSQL only)
        try:
            with db.engine.connect() as seq_conn:
                seq_result = seq_conn.execute(text("SELECT last_value, is_called FROM users_id_seq")).fetchone()
                current_app.logger.info(f"Sequence after commit: last_value={seq_result[0]}, is_called={seq_result[1]}")
        except Exception as seq_err:
            current_app.logger.warning(f"Could not check sequence after commit: {seq_err}")
        
        # Verify the commit actually persisted
        # For PostgreSQL: use a separate connection to ensure we see committed data
        # For SQLite: skip verification (SQLite transaction isolation is different and verification doesn't work the same way)
        is_postgresql = 'postgresql' in str(db.engine.url).lower()
        
        if is_postgresql:
            # PostgreSQL: Use separate connection for verification
            # Force the session to expire all objects to ensure we're not using cached data
            db.session.expire_all()
            
            with db.engine.connect() as separate_conn:
                result = separate_conn.execute(
                    text("SELECT id, username, email, created_at, updated_at FROM users WHERE id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()
                current_app.logger.info(f"Verification query result for ID {user_id}: {result}")
                
                if not result:
                    current_app.logger.error(f"CRITICAL: User {user_id} ({username}) NOT FOUND in database after commit!")
                    with db.engine.connect() as check_conn:
                        all_users = check_conn.execute(text("SELECT id, username FROM users ORDER BY id")).fetchall()
                        current_app.logger.error(f"All users in database: {all_users}")
                    return jsonify({'error': 'Failed to create user - transaction was not persisted'}), 500
                
                if result[1] != username:
                    current_app.logger.error(f"CRITICAL: Verification found wrong user! Expected username '{username}', got '{result[1]}'")
                    return jsonify({'error': f'User creation verification failed - found different user (ID: {result[0]}, Username: {result[1]})'}), 500
                
                current_app.logger.info(f"Successfully verified user {user_id} ({username}) in database via separate connection")
                
                # Return the user data from the raw query result
                # Note: Raw SQL returns datetime as strings, so we can return them directly
                user_dict = {
                    'id': result[0],
                    'username': result[1],
                    'email': result[2],
                    'created_at': result[3] if result[3] else None,
                    'updated_at': result[4] if result[4] else None
                }
        else:
            # SQLite: Skip verification and return user object directly
            # SQLite's transaction model is different and the separate connection verification doesn't work
            # The commit should have worked, so we trust it and return the user data
            current_app.logger.info(f"User created successfully for ID {user_id}, Username: {username} (SQLite - verification skipped)")
            
            # Return the user data from the model
            user_dict = user.to_dict()
        
        return jsonify(user_dict), 201
    except Exception as e:
        # Ensure session is rolled back on any error
        if db.session.is_active:
            db.session.rollback()
        current_app.logger.error(f"Error creating user: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 400


@users_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
@csrf_protect
def update_user(user_id, current_user):
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
            email = data['email'].strip()
            # Validate email format - only .com domains allowed
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$'
            if not email or not re.match(email_pattern, email):
                return jsonify({'error': 'Please enter a valid email address ending with .com'}), 400
            if len(email) > 254:  # RFC 5321 limit
                return jsonify({'error': 'Email address is too long'}), 400
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'Email already exists'}), 400
            user.email = email
        
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@token_required
@csrf_protect
def delete_user(user_id, current_user):
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
@limiter.limit("5 per minute", key_func=get_remote_address)
def login():
    """
    User Login
    ---
    tags:
      - Users
    summary: Authenticate user and get JWT tokens
    description: |
      Authenticates a user with username/email and password, returns JWT access and refresh tokens.
      
      **After successful login:**
      1. Copy the `access_token` value from the response
      2. Click the "Authorize" button at the top of the Swagger UI
      3. Paste the token into the "Value" field (do NOT include "Bearer " - Swagger UI adds it automatically)
      4. Click "Authorize" to save the token
      5. Now you can test protected endpoints
    security: []  # No authentication required for login
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
    
    # Generate JWT tokens (includes CSRF token)
    tokens = generate_token(user.id, user.username, user.email)
    
    # Return user data and tokens (including CSRF token)
    return jsonify({
        'user': user.to_dict(),
        **tokens
    }), 200


@users_bp.route('/refresh', methods=['POST'])
@limiter.limit("5 per minute", key_func=get_remote_address)
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
        
        # Generate new access token (includes new CSRF token)
        tokens = generate_token(user.id, user.username, user.email)
        
        # Return new access token (and new refresh token) with CSRF token
        return jsonify({
            'access_token': tokens['access_token'],
            'refresh_token': tokens['refresh_token'],
            'csrf_token': tokens['csrf_token'],  # Include CSRF token in response
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
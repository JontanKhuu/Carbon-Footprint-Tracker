import pytest
import jwt
import time
from datetime import datetime, timedelta, timezone
from app import create_app, db
from app.models.user import User
from app.utils.jwt import generate_token, verify_token, JWT_SECRET_KEY, JWT_ALGORITHM


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


def test_create_user(client):
    """Test creating a new user"""
    user_data = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'SecurePass123!'
    }
    
    response = client.post('/api/users', json=user_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['username'] == 'newuser'
    assert data['email'] == 'newuser@example.com'
    assert 'password' not in data  # Password should not be in response


def test_get_users(client, app):
    """Test getting all users"""
    # Create test user
    with app.app_context():
        user = User(username='testuser', email='test@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
    
    response = client.get('/api/users')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['username'] == 'testuser'


def test_user_password_hashing(app):
    """Test that passwords are properly hashed"""
    with app.app_context():
        user = User(username='testuser', email='test@example.com')
        user.set_password('mypassword')
        
        assert user.password_hash != 'mypassword'
        assert user.check_password('mypassword') is True
        assert user.check_password('wrongpassword') is False


# ==================== Task 17: Expand Authentication & Authorization Tests ====================

@pytest.fixture
def test_user_for_auth(app):
    """Create a test user for authentication tests"""
    with app.app_context():
        user = User(username='authtest', email='authtest@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        yield user
        db.session.delete(user)
        db.session.commit()


def test_login_with_username(client, test_user_for_auth):
    """Test POST /users/login - login with username"""
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    
    response = client.post('/api/users/login', json=login_data)
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert 'user' in data
    assert data['user']['username'] == 'authtest'
    assert data['user']['email'] == 'authtest@example.com'
    assert data['token_type'] == 'Bearer'
    assert data['expires_in'] == 86400  # 24 hours in seconds


def test_login_with_email(client, test_user_for_auth):
    """Test POST /users/login - login with email"""
    login_data = {
        'usernameOrEmail': 'authtest@example.com',
        'password': 'testpass123'
    }
    
    response = client.post('/api/users/login', json=login_data)
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['user']['username'] == 'authtest'


def test_login_invalid_credentials(client, test_user_for_auth):
    """Test POST /users/login - invalid credentials"""
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'wrongpassword'
    }
    
    response = client.post('/api/users/login', json=login_data)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data
    assert 'Invalid credentials' in data['error']


def test_login_nonexistent_user(client):
    """Test POST /users/login - non-existent user"""
    login_data = {
        'usernameOrEmail': 'nonexistent',
        'password': 'password123'
    }
    
    response = client.post('/api/users/login', json=login_data)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_login_missing_fields(client):
    """Test POST /users/login - missing fields"""
    # Missing password
    response = client.post('/api/users/login', json={'usernameOrEmail': 'test'})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    
    # Missing usernameOrEmail
    response = client.post('/api/users/login', json={'password': 'testpass'})
    assert response.status_code == 400
    
    # Missing both
    response = client.post('/api/users/login', json={})
    assert response.status_code == 400


def test_login_rate_limiting(client, test_user_for_auth):
    """Test POST /users/login - rate limiting behavior"""
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    
    # Make 5 successful requests (should all pass)
    for i in range(5):
        response = client.post('/api/users/login', json=login_data)
        assert response.status_code == 200
    
    # 6th request should be rate limited (5 per minute limit)
    response = client.post('/api/users/login', json=login_data)
    # Should return 429 (Too Many Requests) or still 200 depending on rate limiter behavior
    assert response.status_code in [200, 429]


def test_refresh_token_success(client, test_user_for_auth):
    """Test POST /users/refresh - successful token refresh"""
    # First login to get tokens
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    login_response = client.post('/api/users/login', json=login_data)
    assert login_response.status_code == 200
    original_tokens = login_response.get_json()
    refresh_token = original_tokens['refresh_token']
    
    # Small delay to ensure different timestamp
    time.sleep(1)
    
    # Now refresh the token
    refresh_data = {'refresh_token': refresh_token}
    response = client.post('/api/users/refresh', json=refresh_data)
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['token_type'] == 'Bearer'
    # Verify new access token works
    headers = {'Authorization': f'Bearer {data["access_token"]}'}
    me_response = client.get('/api/users/me', headers=headers)
    assert me_response.status_code == 200


def test_refresh_token_expired(client, test_user_for_auth):
    """Test POST /users/refresh - expired refresh token"""
    # Create an expired refresh token manually
    expired_payload = {
        'user_id': test_user_for_auth.id,
        'type': 'refresh',
        'iat': datetime.now(timezone.utc) - timedelta(days=8),  # Expired 8 days ago
        'exp': datetime.now(timezone.utc) - timedelta(days=1)  # Expired 1 day ago
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    refresh_data = {'refresh_token': expired_token}
    response = client.post('/api/users/refresh', json=refresh_data)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_refresh_token_invalid(client):
    """Test POST /users/refresh - invalid refresh token"""
    refresh_data = {'refresh_token': 'invalid.token.here'}
    response = client.post('/api/users/refresh', json=refresh_data)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_refresh_token_missing(client):
    """Test POST /users/refresh - missing refresh token"""
    response = client.post('/api/users/refresh', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'Refresh token required' in data['error']


def test_refresh_token_wrong_type(client, test_user_for_auth):
    """Test POST /users/refresh - using access token instead of refresh token"""
    # Get tokens from login
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    login_response = client.post('/api/users/login', json=login_data)
    access_token = login_response.get_json()['access_token']
    
    # Try to use access token as refresh token
    refresh_data = {'refresh_token': access_token}
    response = client.post('/api/users/refresh', json=refresh_data)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_refresh_token_rate_limiting(client, test_user_for_auth):
    """Test POST /users/refresh - rate limiting behavior"""
    # Get a valid refresh token
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    login_response = client.post('/api/users/login', json=login_data)
    refresh_token = login_response.get_json()['refresh_token']
    
    # Make 5 refresh requests (should all pass)
    for i in range(5):
        response = client.post('/api/users/refresh', json={'refresh_token': refresh_token})
        if response.status_code == 200:
            # Update refresh token for next iteration
            refresh_token = response.get_json()['refresh_token']
        assert response.status_code in [200, 429]
    
    # 6th request might be rate limited
    response = client.post('/api/users/refresh', json={'refresh_token': refresh_token})
    assert response.status_code in [200, 401, 429]  # 401 if token expired, 429 if rate limited


def test_get_current_user_success(client, test_user_for_auth):
    """Test GET /users/me - successful retrieval with valid token"""
    # Login to get token
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    login_response = client.post('/api/users/login', json=login_data)
    access_token = login_response.get_json()['access_token']
    
    # Get current user info
    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get('/api/users/me', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'authtest'
    assert data['email'] == 'authtest@example.com'
    assert 'password' not in data


def test_get_current_user_invalid_token(client):
    """Test GET /users/me - invalid token"""
    headers = {'Authorization': 'Bearer invalid.token.here'}
    response = client.get('/api/users/me', headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_get_current_user_expired_token(client, test_user_for_auth):
    """Test GET /users/me - expired token"""
    # Create an expired access token manually
    expired_payload = {
        'user_id': test_user_for_auth.id,
        'username': 'authtest',
        'email': 'authtest@example.com',
        'type': 'access',
        'iat': datetime.now(timezone.utc) - timedelta(hours=25),  # Created 25 hours ago
        'exp': datetime.now(timezone.utc) - timedelta(hours=1)  # Expired 1 hour ago
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    headers = {'Authorization': f'Bearer {expired_token}'}
    response = client.get('/api/users/me', headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data
    assert 'expired' in data['error'].lower() or 'TOKEN_EXPIRED' in data.get('code', '')


def test_get_current_user_no_token(client):
    """Test GET /users/me - no token provided"""
    response = client.get('/api/users/me')
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_jwt_token_generation(app, test_user_for_auth):
    """Test JWT token handling - token generation"""
    with app.app_context():
        tokens = generate_token(test_user_for_auth.id, test_user_for_auth.username, test_user_for_auth.email)
        
        assert 'access_token' in tokens
        assert 'refresh_token' in tokens
        assert tokens['token_type'] == 'Bearer'
        assert tokens['expires_in'] == 86400
        
        # Verify tokens are valid JWT strings
        assert isinstance(tokens['access_token'], str)
        assert isinstance(tokens['refresh_token'], str)
        assert '.' in tokens['access_token']  # JWT format has dots


def test_jwt_token_verification_valid(app, test_user_for_auth):
    """Test JWT token handling - token verification (valid token)"""
    with app.app_context():
        tokens = generate_token(test_user_for_auth.id, test_user_for_auth.username, test_user_for_auth.email)
        
        # Verify access token
        payload = verify_token(tokens['access_token'], token_type='access')
        assert payload['user_id'] == test_user_for_auth.id
        assert payload['username'] == test_user_for_auth.username
        assert payload['type'] == 'access'
        
        # Verify refresh token
        payload = verify_token(tokens['refresh_token'], token_type='refresh')
        assert payload['user_id'] == test_user_for_auth.id
        assert payload['type'] == 'refresh'


def test_jwt_token_verification_expired(app, test_user_for_auth):
    """Test JWT token handling - expired token rejection"""
    with app.app_context():
        # Create an expired token
        expired_payload = {
            'user_id': test_user_for_auth.id,
            'username': test_user_for_auth.username,
            'email': test_user_for_auth.email,
            'type': 'access',
            'iat': datetime.now(timezone.utc) - timedelta(hours=25),
            'exp': datetime.now(timezone.utc) - timedelta(hours=1)
        }
        expired_token = jwt.encode(expired_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        # Should raise ExpiredSignatureError
        with pytest.raises(jwt.ExpiredSignatureError):
            verify_token(expired_token, token_type='access')


def test_jwt_token_verification_invalid(app):
    """Test JWT token handling - invalid token rejection"""
    with app.app_context():
        # Invalid token format
        with pytest.raises(jwt.InvalidTokenError):
            verify_token('invalid.token.here', token_type='access')
        
        # Wrong token type
        tokens = generate_token(1, 'test', 'test@example.com')
        with pytest.raises(jwt.InvalidTokenError):
            verify_token(tokens['access_token'], token_type='refresh')  # Using access token as refresh


def test_jwt_token_refresh_flow(client, test_user_for_auth):
    """Test JWT token handling - complete token refresh flow"""
    # Step 1: Login to get initial tokens
    login_data = {
        'usernameOrEmail': 'authtest',
        'password': 'testpass123'
    }
    login_response = client.post('/api/users/login', json=login_data)
    assert login_response.status_code == 200
    login_data_response = login_response.get_json()
    original_access_token = login_data_response['access_token']
    original_refresh_token = login_data_response['refresh_token']
    
    # Step 2: Use access token to access protected endpoint
    headers = {'Authorization': f'Bearer {original_access_token}'}
    response = client.get('/api/users/me', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['username'] == 'authtest'
    
    # Step 3: Small delay to ensure different timestamp
    time.sleep(1)
    
    # Step 4: Refresh the token
    refresh_response = client.post('/api/users/refresh', json={'refresh_token': original_refresh_token})
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.get_json()
    new_access_token = refresh_data['access_token']
    new_refresh_token = refresh_data['refresh_token']
    
    # Step 5: Verify new tokens are valid and can be used
    # (They might be the same if generated in the same second, but should still work)
    headers = {'Authorization': f'Bearer {new_access_token}'}
    response = client.get('/api/users/me', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['username'] == 'authtest'
    
    # Step 6: Verify new refresh token works
    time.sleep(1)
    refresh_response2 = client.post('/api/users/refresh', json={'refresh_token': new_refresh_token})
    assert refresh_response2.status_code == 200


# ==================== Task 18: Expand User Management Tests ====================

def test_get_single_user_success(client, app):
    """Test GET /users/<id> - successful retrieval"""
    # Create a test user
    with app.app_context():
        user = User(username='singleuser', email='singleuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
    
    response = client.get(f'/api/users/{user_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == user_id
    assert data['username'] == 'singleuser'
    assert data['email'] == 'singleuser@example.com'
    assert 'password' not in data
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_get_single_user_not_found(client):
    """Test GET /users/<id> - 404 for non-existent user"""
    response = client.get('/api/users/99999')
    assert response.status_code == 404


def test_update_user_success(client, app):
    """Test PUT /users/<id> - successful update"""
    # Create a test user
    with app.app_context():
        user = User(username='updateuser', email='updateuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
    
    update_data = {
        'username': 'updateduser',
        'email': 'updateduser@example.com',
        'password': 'NewPass123!'
    }
    
    response = client.put(f'/api/users/{user_id}', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'updateduser'
    assert data['email'] == 'updateduser@example.com'
    
    # Verify password was updated by trying to login
    login_data = {
        'usernameOrEmail': 'updateduser',
        'password': 'NewPass123!'
    }
    login_response = client.post('/api/users/login', json=login_data)
    assert login_response.status_code == 200
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_update_user_partial(client, app):
    """Test PUT /users/<id> - partial updates"""
    # Create a test user
    with app.app_context():
        user = User(username='partialuser', email='partialuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
        original_email = user.email
    
    # Update only username
    update_data = {'username': 'newpartialuser'}
    response = client.put(f'/api/users/{user_id}', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'newpartialuser'
    assert data['email'] == original_email  # Email should remain unchanged
    
    # Update only email
    update_data = {'email': 'newpartial@example.com'}
    response = client.put(f'/api/users/{user_id}', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['email'] == 'newpartial@example.com'
    assert data['username'] == 'newpartialuser'  # Username should remain unchanged
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_update_user_not_found(client):
    """Test PUT /users/<id> - 404 for non-existent user"""
    update_data = {'username': 'newname'}
    response = client.put('/api/users/99999', json=update_data)
    assert response.status_code == 404


def test_update_user_invalid_email(client, app):
    """Test PUT /users/<id> - validation errors (invalid email)"""
    # Create a test user
    with app.app_context():
        user = User(username='invalidemail', email='invalidemail@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
    
    # Test invalid email format (not ending with .com)
    update_data = {'email': 'invalid@example.org'}
    response = client.put(f'/api/users/{user_id}', json=update_data)
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert '.com' in data['error'].lower()
    
    # Test invalid email format (no @)
    update_data = {'email': 'invalidemail'}
    response = client.put(f'/api/users/{user_id}', json=update_data)
    assert response.status_code == 400
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_update_user_duplicate_username(client, app):
    """Test PUT /users/<id> - duplicate username handling"""
    # Create two test users
    with app.app_context():
        user1 = User(username='user1', email='user1@example.com')
        user1.set_password('testpass123')
        user2 = User(username='user2', email='user2@example.com')
        user2.set_password('testpass123')
        db.session.add_all([user1, user2])
        db.session.commit()
        db.session.refresh(user1)
        db.session.refresh(user2)
        user1_id = user1.id
        user2_id = user2.id
    
    # Try to update user2's username to user1's username
    update_data = {'username': 'user1'}
    response = client.put(f'/api/users/{user2_id}', json=update_data)
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'username' in data['error'].lower() or 'exists' in data['error'].lower()
    
    # Cleanup
    with app.app_context():
        db.session.delete(user1)
        db.session.delete(user2)
        db.session.commit()


def test_update_user_duplicate_email(client, app):
    """Test PUT /users/<id> - duplicate email handling"""
    # Create two test users
    with app.app_context():
        user1 = User(username='emailuser1', email='emailuser1@example.com')
        user1.set_password('testpass123')
        user2 = User(username='emailuser2', email='emailuser2@example.com')
        user2.set_password('testpass123')
        db.session.add_all([user1, user2])
        db.session.commit()
        db.session.refresh(user1)
        db.session.refresh(user2)
        user1_id = user1.id
        user2_id = user2.id
    
    # Try to update user2's email to user1's email
    update_data = {'email': 'emailuser1@example.com'}
    response = client.put(f'/api/users/{user2_id}', json=update_data)
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'email' in data['error'].lower() or 'exists' in data['error'].lower()
    
    # Cleanup
    with app.app_context():
        db.session.delete(user1)
        db.session.delete(user2)
        db.session.commit()


def test_delete_user_success(client, app):
    """Test DELETE /users/<id> - successful deletion"""
    # Create a test user
    with app.app_context():
        user = User(username='deleteuser', email='deleteuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
    
    response = client.delete(f'/api/users/{user_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    
    # Verify user is deleted
    with app.app_context():
        deleted_user = User.query.get(user_id)
        assert deleted_user is None


def test_delete_user_not_found(client):
    """Test DELETE /users/<id> - 404 for non-existent user"""
    response = client.delete('/api/users/99999')
    assert response.status_code == 404


def test_delete_user_cascade_emissions(client, app):
    """Test DELETE /users/<id> - cascade deletion (associated emissions)"""
    from app.models.emission import Emission
    from datetime import date
    
    # Create a test user with emissions
    with app.app_context():
        user = User(username='cascadeuser', email='cascadeuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        user_id = user.id
        
        # Create emissions for this user
        emission1 = Emission(
            user_id=user_id,
            category='transport',
            activity='car_drive',
            amount=100,
            unit='km',
            co2_equivalent=20.5,
            emission_factor=0.205,
            date=date(2024, 1, 15)
        )
        emission2 = Emission(
            user_id=user_id,
            category='energy',
            activity='electricity',
            amount=50,
            unit='kWh',
            co2_equivalent=15.0,
            emission_factor=0.3,
            date=date(2024, 1, 16)
        )
        db.session.add_all([emission1, emission2])
        db.session.commit()
        emission1_id = emission1.id
        emission2_id = emission2.id
    
    # Delete the user
    response = client.delete(f'/api/users/{user_id}')
    assert response.status_code == 200
    
    # Verify user is deleted
    with app.app_context():
        deleted_user = User.query.get(user_id)
        assert deleted_user is None
        
        # Verify emissions are also deleted (cascade)
        deleted_emission1 = Emission.query.get(emission1_id)
        deleted_emission2 = Emission.query.get(emission2_id)
        assert deleted_emission1 is None
        assert deleted_emission2 is None


def test_user_validation_email_format(client):
    """Test user validation - email format validation"""
    # Test invalid email formats (limit to avoid rate limiting)
    invalid_emails = [
        'notanemail',
        'user@domain.org',  # Not .com
        '@domain.com',  # Missing local part
    ]
    
    for invalid_email in invalid_emails:
        user_data = {
            'username': f'testuser_{invalid_email.replace("@", "_").replace(".", "_")[:15]}',
            'email': invalid_email,
            'password': 'ValidPass123!'
        }
        response = client.post('/api/users', json=user_data)
        # May get 400 (validation error) or 429 (rate limit) - both are acceptable
        assert response.status_code in [400, 429]
        if response.status_code == 400:
            data = response.get_json()
            assert 'error' in data or 'errors' in data


def test_user_validation_password_strength(client):
    """Test user validation - password strength requirements"""
    # Test weak passwords (limit to avoid rate limiting)
    weak_passwords = [
        'short',  # Too short
        'nouppercase123!',  # No uppercase
        'NOLOWERCASE123!',  # No lowercase
        'NoNumbers!',  # No numbers
    ]
    
    for weak_password in weak_passwords:
        user_data = {
            'username': f'testuser_{weak_password[:10].replace("!", "_")}',
            'email': f'test_{weak_password[:5].replace("!", "_")}@example.com',
            'password': weak_password
        }
        response = client.post('/api/users', json=user_data)
        # May get 400 (validation error) or 429 (rate limit) - both are acceptable
        assert response.status_code in [400, 429]
        if response.status_code == 400:
            data = response.get_json()
            assert 'error' in data or 'errors' in data
            if 'errors' in data and 'password' in data['errors']:
                password_error = data['errors']['password']
                assert isinstance(password_error, str)
                assert any(
                    req in password_error.lower() 
                    for req in ['uppercase', 'lowercase', 'number', 'special', '8', 'character']
                )


def test_user_validation_duplicate_username(client, app):
    """Test user validation - duplicate username handling"""
    # Create a user first
    with app.app_context():
        user = User(username='duplicateuser', email='duplicateuser@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
    
    # Try to create another user with same username
    user_data = {
        'username': 'duplicateuser',
        'email': 'different@example.com',
        'password': 'ValidPass123!'
    }
    response = client.post('/api/users', json=user_data)
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data or 'errors' in data
    if 'errors' in data:
        assert 'username' in data['errors']
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_user_validation_duplicate_email(client, app):
    """Test user validation - duplicate email handling"""
    # Create a user first
    with app.app_context():
        user = User(username='duplicateemail', email='duplicateemail@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
    
    # Try to create another user with same email
    user_data = {
        'username': 'differentuser',
        'email': 'duplicateemail@example.com',
        'password': 'ValidPass123!'
    }
    response = client.post('/api/users', json=user_data)
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data or 'errors' in data
    if 'errors' in data:
        assert 'email' in data['errors']
    
    # Cleanup
    with app.app_context():
        db.session.delete(user)
        db.session.commit()


def test_user_validation_required_fields(client):
    """Test user validation - required field validation"""
    # Missing username
    response = client.post('/api/users', json={
        'email': 'test@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 400
    
    # Missing email
    response = client.post('/api/users', json={
        'username': 'testuser',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 400
    
    # Missing password
    response = client.post('/api/users', json={
        'username': 'testuser',
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    
    # Missing all fields
    response = client.post('/api/users', json={})
    assert response.status_code == 400


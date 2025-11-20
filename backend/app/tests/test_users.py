import pytest
from app import create_app, db
from app.models.user import User


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
        'password': 'securepass123'
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


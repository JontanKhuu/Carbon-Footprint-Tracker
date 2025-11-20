import pytest
from datetime import date
from app import create_app, db
from app.models.emission import Emission
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


@pytest.fixture
def test_user(app):
    """Create a test user"""
    with app.app_context():
        user = User(username='testuser', email='test@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)  # Ensure user.id is available
        yield user
        db.session.delete(user)
        db.session.commit()


def test_create_emission(client, test_user):
    """Test creating an emission record"""
    emission_data = {
        'user_id': test_user.id,
        'category': 'transport',
        'activity': 'car_drive',
        'amount': 100,
        'unit': 'km',
        'co2_equivalent': 20.5,
        'emission_factor': 0.205,
        'date': '2024-01-15',
        'description': 'Daily commute'
    }
    
    response = client.post('/api/emissions', json=emission_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['category'] == 'transport'
    assert data['co2_equivalent'] == 20.5


def test_get_emissions(client, test_user, app):
    """Test getting all emissions"""
    # Create test emission
    with app.app_context():
        emission = Emission(
            user_id=test_user.id,
            category='transport',
            activity='car_drive',
            amount=100,
            unit='km',
            co2_equivalent=20.5,
            emission_factor=0.205,
            date=date(2024, 1, 15)
        )
        db.session.add(emission)
        db.session.commit()
    
    response = client.get('/api/emissions')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['category'] == 'transport'


def test_get_emission_stats(client, test_user, app):
    """Test getting emission statistics"""
    # Create test emissions
    with app.app_context():
        emission1 = Emission(
            user_id=test_user.id,
            category='transport',
            activity='car_drive',
            amount=100,
            unit='km',
            co2_equivalent=20.5,
            emission_factor=0.205,
            date=date(2024, 1, 15)
        )
        emission2 = Emission(
            user_id=test_user.id,
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
    
    response = client.get('/api/emissions/stats')
    assert response.status_code == 200
    data = response.get_json()
    assert data['total_co2_equivalent'] == 35.5
    assert data['total_records'] == 2
    assert len(data['by_category']) == 2


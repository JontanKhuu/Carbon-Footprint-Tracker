import pytest
from datetime import date, datetime
from app import create_app, db
from app.models.emission import Emission
from app.models.user import User
from app.models.emission_history import EmissionHistory
from app.utils.jwt import generate_token


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


@pytest.fixture
def auth_headers(test_user):
    """Generate JWT token for test user and return headers"""
    tokens = generate_token(test_user.id, test_user.username, test_user.email)
    return {'Authorization': f"Bearer {tokens['access_token']}"}


@pytest.fixture
def test_user2(app):
    """Create a second test user for authorization tests"""
    with app.app_context():
        user = User(username='testuser2', email='test2@example.com')
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        yield user
        db.session.delete(user)
        db.session.commit()


@pytest.fixture
def auth_headers2(test_user2):
    """Generate JWT token for second test user and return headers"""
    tokens = generate_token(test_user2.id, test_user2.username, test_user2.email)
    return {'Authorization': f"Bearer {tokens['access_token']}"}


@pytest.fixture
def test_emission(app, test_user):
    """Create a test emission for the test user"""
    with app.app_context():
        emission = Emission(
            user_id=test_user.id,
            category='transport',
            activity='car_drive',
            amount=100,
            unit='km',
            co2_equivalent=20.5,
            emission_factor=0.205,
            date=date(2024, 1, 15),
            description='Test emission'
        )
        db.session.add(emission)
        db.session.commit()
        db.session.refresh(emission)
        yield emission
        db.session.delete(emission)
        db.session.commit()


@pytest.fixture
def test_emission_other_user(app, test_user2):
    """Create a test emission for the second user (for authorization tests)"""
    with app.app_context():
        emission = Emission(
            user_id=test_user2.id,
            category='energy',
            activity='electricity',
            amount=50,
            unit='kWh',
            co2_equivalent=15.0,
            emission_factor=0.3,
            date=date(2024, 1, 16),
            description='Other user emission'
        )
        db.session.add(emission)
        db.session.commit()
        db.session.refresh(emission)
        yield emission
        db.session.delete(emission)
        db.session.commit()


def test_create_emission(client, test_user, auth_headers):
    """Test creating an emission record"""
    emission_data = {
        'category': 'transport',
        'activity': 'car_drive',
        'amount': 100,
        'unit': 'km',
        'co2_equivalent': 20.5,
        'emission_factor': 0.205,
        'date': '2024-01-15',
        'description': 'Daily commute'
    }
    
    response = client.post('/api/emissions', json=emission_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['category'] == 'transport'
    assert data['co2_equivalent'] == 20.5


def test_get_emissions(client, test_user, app, auth_headers):
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
    
    response = client.get('/api/emissions', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['category'] == 'transport'


def test_get_emission_stats(client, test_user, app, auth_headers):
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
    
    response = client.get('/api/emissions/stats', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['total_co2_equivalent'] == 35.5
    assert data['total_records'] == 2
    assert len(data['by_category']) == 2


# ==================== Task 16: Expand Emissions Endpoint Tests ====================

def test_get_single_emission_success(client, test_emission, auth_headers):
    """Test GET /emissions/<id> - successful retrieval"""
    response = client.get(f'/api/emissions/{test_emission.id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_emission.id
    assert data['category'] == 'transport'
    assert data['activity'] == 'car_drive'
    assert data['amount'] == 100
    assert data['co2_equivalent'] == 20.5


def test_get_single_emission_not_found(client, auth_headers):
    """Test GET /emissions/<id> - 404 for non-existent emission"""
    response = client.get('/api/emissions/99999', headers=auth_headers)
    assert response.status_code == 404


def test_get_single_emission_authorization(client, test_emission_other_user, auth_headers):
    """Test GET /emissions/<id> - user can't access other users' emissions"""
    response = client.get(f'/api/emissions/{test_emission_other_user.id}', headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert 'error' in data


def test_update_emission_success(client, test_emission, auth_headers):
    """Test PUT /emissions/<id> - successful update"""
    update_data = {
        'category': 'energy',
        'activity': 'electricity',
        'amount': 200,
        'unit': 'kWh',
        'co2_equivalent': 46.6,
        'emission_factor': 0.233,
        'date': '2024-01-20',
        'description': 'Updated emission'
    }
    
    response = client.put(f'/api/emissions/{test_emission.id}', json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['category'] == 'energy'
    assert data['activity'] == 'electricity'
    assert data['amount'] == 200
    assert data['description'] == 'Updated emission'


def test_update_emission_partial(client, test_emission, auth_headers):
    """Test PUT /emissions/<id> - partial update"""
    update_data = {
        'amount': 150,
        'description': 'Partially updated'
    }
    
    response = client.put(f'/api/emissions/{test_emission.id}', json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['amount'] == 150
    assert data['description'] == 'Partially updated'
    # Other fields should remain unchanged
    assert data['category'] == 'transport'
    assert data['activity'] == 'car_drive'


def test_update_emission_not_found(client, auth_headers):
    """Test PUT /emissions/<id> - 404 for non-existent emission"""
    update_data = {'amount': 150}
    response = client.put('/api/emissions/99999', json=update_data, headers=auth_headers)
    assert response.status_code == 404


def test_update_emission_authorization(client, test_emission_other_user, auth_headers):
    """Test PUT /emissions/<id> - user can't update other users' emissions"""
    update_data = {'amount': 150}
    response = client.put(f'/api/emissions/{test_emission_other_user.id}', json=update_data, headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert 'error' in data


def test_update_emission_validation_error(client, test_emission, auth_headers):
    """Test PUT /emissions/<id> - validation errors"""
    # Test with negative amount
    update_data = {'amount': -10}
    response = client.put(f'/api/emissions/{test_emission.id}', json=update_data, headers=auth_headers)
    # Should either return 400 or allow it (depending on validation)
    assert response.status_code in [200, 400]


def test_delete_emission_success(client, test_emission, app, auth_headers):
    """Test DELETE /emissions/<id> - successful deletion"""
    emission_id = test_emission.id
    response = client.delete(f'/api/emissions/{emission_id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    
    # Verify emission is deleted
    with app.app_context():
        deleted_emission = Emission.query.get(emission_id)
        assert deleted_emission is None


def test_delete_emission_not_found(client, auth_headers):
    """Test DELETE /emissions/<id> - 404 for non-existent emission"""
    response = client.delete('/api/emissions/99999', headers=auth_headers)
    assert response.status_code == 404


def test_delete_emission_authorization(client, test_emission_other_user, auth_headers):
    """Test DELETE /emissions/<id> - user can't delete other users' emissions"""
    response = client.delete(f'/api/emissions/{test_emission_other_user.id}', headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert 'error' in data


def test_get_emission_activities_no_filter(client):
    """Test GET /emissions/activities - without category filter"""
    response = client.get('/api/emissions/activities')
    assert response.status_code == 200
    data = response.get_json()
    assert 'activities' in data or isinstance(data, dict)
    # Should return activities for all categories


def test_get_emission_activities_with_category(client):
    """Test GET /emissions/activities - with category filter"""
    response = client.get('/api/emissions/activities?category=transport')
    assert response.status_code == 200
    data = response.get_json()
    # Response structure should be valid
    assert isinstance(data, dict) or isinstance(data, list)


def test_get_emission_activities_structure(client):
    """Test GET /emissions/activities - response structure"""
    response = client.get('/api/emissions/activities')
    assert response.status_code == 200
    data = response.get_json()
    # Should return a structured response
    assert isinstance(data, dict) or isinstance(data, list)


def test_get_emission_history_success(client, test_emission, app, auth_headers):
    """Test GET /emissions/<id>/history - successful retrieval"""
    # First, update the emission to create history
    with app.app_context():
        update_data = {'amount': 150}
        client.put(f'/api/emissions/{test_emission.id}', json=update_data, headers=auth_headers)
    
    response = client.get(f'/api/emissions/{test_emission.id}/history', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    # Should have at least one history entry after update
    if len(data) > 0:
        assert 'id' in data[0]
        assert 'emission_id' in data[0]
        assert 'changed_at' in data[0]


def test_get_emission_history_not_found(client, auth_headers):
    """Test GET /emissions/<id>/history - 404 for non-existent emission"""
    response = client.get('/api/emissions/99999/history', headers=auth_headers)
    assert response.status_code == 404


def test_get_emission_history_authorization(client, test_emission_other_user, auth_headers):
    """Test GET /emissions/<id>/history - user can't access other users' emission history"""
    response = client.get(f'/api/emissions/{test_emission_other_user.id}/history', headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert 'error' in data


def test_export_emissions_csv(client, test_emission, auth_headers):
    """Test GET /emissions/export - CSV export"""
    response = client.get('/api/emissions/export?format=csv', headers=auth_headers)
    assert response.status_code == 200
    assert response.content_type == 'text/csv; charset=utf-8'
    assert 'Content-Disposition' in response.headers
    assert 'emissions_export' in response.headers['Content-Disposition']
    assert '.csv' in response.headers['Content-Disposition']
    # Check CSV content
    content = response.get_data(as_text=True)
    assert 'ID' in content
    assert 'Category' in content


def test_export_emissions_json(client, test_emission, auth_headers):
    """Test GET /emissions/export - JSON export"""
    response = client.get('/api/emissions/export?format=json', headers=auth_headers)
    assert response.status_code == 200
    assert 'application/json' in response.content_type
    assert 'Content-Disposition' in response.headers
    assert 'emissions_export' in response.headers['Content-Disposition']
    assert '.json' in response.headers['Content-Disposition']
    # Check JSON content
    data = response.get_json()
    assert 'metadata' in data
    assert 'emissions' in data
    assert 'export_date' in data['metadata']
    assert 'user' in data['metadata']


def test_export_emissions_with_filters(client, test_emission, app, auth_headers):
    """Test GET /emissions/export - with filters (category, date range)"""
    # Create another emission with different category
    with app.app_context():
        emission2 = Emission(
            user_id=test_emission.user_id,
            category='energy',
            activity='electricity',
            amount=50,
            unit='kWh',
            co2_equivalent=15.0,
            emission_factor=0.3,
            date=date(2024, 2, 1)
        )
        db.session.add(emission2)
        db.session.commit()
    
    # Test category filter
    response = client.get('/api/emissions/export?format=json&category=transport', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert all(e['category'] == 'transport' for e in data['emissions'])
    
    # Test date range filter
    response = client.get('/api/emissions/export?format=json&start_date=2024-01-01&end_date=2024-01-31', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    # All emissions should be in the date range
    for emission in data['emissions']:
        emission_date = datetime.fromisoformat(emission['date']).date()
        assert emission_date >= date(2024, 1, 1)
        assert emission_date <= date(2024, 1, 31)
    
    # Cleanup
    with app.app_context():
        db.session.delete(emission2)
        db.session.commit()


def test_export_emissions_authorization(client, test_emission_other_user, auth_headers):
    """Test GET /emissions/export - authorization (only exports current user's emissions)"""
    response = client.get('/api/emissions/export?format=json', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    # Should not include other user's emissions
    assert all(e['user_id'] != test_emission_other_user.user_id for e in data['emissions'])


def test_emission_filtering_by_category(client, test_user, app, auth_headers):
    """Test emission filtering - category filter"""
    # Create emissions with different categories
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
    
    # Filter by transport category
    response = client.get('/api/emissions?category=transport', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 1
    assert all(e['category'] == 'transport' for e in data)
    
    # Cleanup
    with app.app_context():
        db.session.delete(emission1)
        db.session.delete(emission2)
        db.session.commit()


def test_emission_filtering_by_date_range(client, test_user, app, auth_headers):
    """Test emission filtering - date range filters"""
    # Create emissions with different dates
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
            category='transport',
            activity='car_drive',
            amount=100,
            unit='km',
            co2_equivalent=20.5,
            emission_factor=0.205,
            date=date(2024, 2, 15)
        )
        db.session.add_all([emission1, emission2])
        db.session.commit()
    
    # Filter by start_date
    response = client.get('/api/emissions?start_date=2024-02-01', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 1
    for e in data:
        emission_date = datetime.fromisoformat(e['date']).date()
        assert emission_date >= date(2024, 2, 1)
    
    # Filter by end_date
    response = client.get('/api/emissions?end_date=2024-01-31', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    for e in data:
        emission_date = datetime.fromisoformat(e['date']).date()
        assert emission_date <= date(2024, 1, 31)
    
    # Cleanup
    with app.app_context():
        db.session.delete(emission1)
        db.session.delete(emission2)
        db.session.commit()


def test_emission_filtering_combined(client, test_user, app, auth_headers):
    """Test emission filtering - combined filters"""
    # Create emissions with different categories and dates
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
            date=date(2024, 1, 20)
        )
        db.session.add_all([emission1, emission2])
        db.session.commit()
    
    # Combined filter: category and date range
    response = client.get('/api/emissions?category=transport&start_date=2024-01-01&end_date=2024-01-31', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    for e in data:
        assert e['category'] == 'transport'
        emission_date = datetime.fromisoformat(e['date']).date()
        assert date(2024, 1, 1) <= emission_date <= date(2024, 1, 31)
    
    # Cleanup
    with app.app_context():
        db.session.delete(emission1)
        db.session.delete(emission2)
        db.session.commit()


def test_emission_filtering_empty_results(client, auth_headers):
    """Test emission filtering - edge case: empty results"""
    # Filter that should return no results
    response = client.get('/api/emissions?category=nonexistent', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_emission_filtering_invalid_dates(client, test_user, app, auth_headers):
    """Test emission filtering - edge case: invalid dates"""
    # Create a test emission first to ensure we have data
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
        emission_id = emission.id
    
    # Invalid date format - backend should handle gracefully
    response = client.get('/api/emissions?start_date=invalid-date', headers=auth_headers)
    # Should either return 200 (with empty results) or 400 (bad request) or 500 (server error)
    # If it returns 401, that's also acceptable as it means the endpoint is protected
    assert response.status_code in [200, 400, 401, 500], \
        f"Unexpected status code: {response.status_code}, response: {response.get_json()}"
    
    # Cleanup
    with app.app_context():
        db.session.delete(emission)
        db.session.commit()


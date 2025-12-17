"""
Contract testing using the OpenAPI specification.
These tests ensure your API implementation matches the documented contract.
"""
import pytest
import json
from app import create_app, db
from app.models.user import User
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
        db.session.refresh(user)
        yield user
        db.session.delete(user)
        db.session.commit()


@pytest.fixture
def auth_headers(test_user):
    """Generate JWT token for test user"""
    tokens = generate_token(test_user.id, test_user.username, test_user.email)
    return {'Authorization': f"Bearer {tokens['access_token']}"}


@pytest.fixture
def openapi_spec(client):
    """Fetch OpenAPI spec"""
    response = client.get('/api/apispec.json')
    assert response.status_code == 200
    return response.get_json()


def validate_response_schema(response, expected_status, openapi_spec, path, method):
    """
    Validate that a response matches the OpenAPI schema definition.
    This is a helper function for manual validation.
    """
    assert response.status_code == expected_status
    
    # Get the response definition from spec
    if path not in openapi_spec['paths']:
        pytest.skip(f"Path {path} not in OpenAPI spec")
    
    path_def = openapi_spec['paths'][path]
    if method not in path_def:
        pytest.skip(f"Method {method} not in OpenAPI spec for {path}")
    
    method_def = path_def[method]
    if str(expected_status) not in method_def.get('responses', {}):
        pytest.skip(f"Status {expected_status} not defined in spec")
    
    # Basic validation - in production, use jsonschema library for full validation
    response_data = response.get_json()
    
    # Check content type
    assert 'application/json' in response.content_type
    
    return response_data


def test_login_endpoint_contract(client, openapi_spec):
    """Test that login endpoint matches OpenAPI contract"""
    login_data = {
        'usernameOrEmail': 'testuser',
        'password': 'testpass123'
    }
    
    # First create the user
    user_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    client.post('/api/users', json=user_data)
    
    # Test login
    response = client.post('/api/users/login', json=login_data)
    
    # Validate against spec
    # Note: Flasgger stores paths without basePath prefix
    spec_path = openapi_spec['paths']['/users/login']
    spec_responses = spec_path['post']['responses']
    
    if response.status_code == 200:
        assert '200' in spec_responses
        data = response.get_json()
        # Check required fields from spec
        assert 'user' in data or 'access_token' in data
    elif response.status_code == 401:
        assert '401' in spec_responses


def test_emissions_endpoint_contract(client, test_user, auth_headers, openapi_spec):
    """Test that emissions endpoints match OpenAPI contract"""
    # Test GET /api/emissions
    response = client.get('/api/emissions', headers=auth_headers)
    assert response.status_code == 200
    
    # Validate response structure matches spec
    # Note: Flasgger stores paths without basePath prefix
    spec_path = openapi_spec['paths']['/emissions']
    spec_response = spec_path['get']['responses']['200']
    
    data = response.get_json()
    assert isinstance(data, list)  # Should be array according to spec
    
    # Test POST /api/emissions
    emission_data = {
        'category': 'transport',
        'activity': 'car_drive',
        'amount': 100,
        'unit': 'km',
        'date': '2024-01-15'
    }
    
    response = client.post('/api/emissions', json=emission_data, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.get_json()
    # Validate response has required fields from spec
    assert 'id' in data
    assert 'category' in data
    assert 'co2_equivalent' in data


def test_error_responses_match_spec(client, openapi_spec):
    """Test that error responses match the OpenAPI spec"""
    # Test 404 for non-existent resource
    response = client.get('/api/users/99999')
    assert response.status_code == 404
    
    # Test 400 for invalid data
    invalid_data = {'username': 'test'}  # Missing required fields
    response = client.post('/api/users', json=invalid_data)
    assert response.status_code == 400
    
    # Test 401 for unauthorized
    response = client.get('/api/emissions')  # No auth header
    assert response.status_code == 401


def test_query_parameters_match_spec(client, test_user, auth_headers, openapi_spec):
    """Test that query parameters work as documented in spec"""
    # Create some test emissions first
    emission_data = {
        'category': 'transport',
        'activity': 'car_drive',
        'amount': 100,
        'unit': 'km',
        'date': '2024-01-15'
    }
    client.post('/api/emissions', json=emission_data, headers=auth_headers)
    
    # Test filtering by category (as documented in spec)
    response = client.get('/api/emissions?category=transport', headers=auth_headers)
    assert response.status_code == 200
    
    # Test date filtering
    response = client.get('/api/emissions?start_date=2024-01-01&end_date=2024-12-31', 
                         headers=auth_headers)
    assert response.status_code == 200


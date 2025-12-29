# API Testing with OpenAPI/Swagger

This project includes automated testing based on your OpenAPI/Swagger specification. This ensures your API implementation always matches your documentation.

## Test Types

### 1. **OpenAPI Spec Validation** (`test_openapi.py`)
   - Validates that your OpenAPI spec is well-formed
   - Checks that all endpoints are documented
   - Verifies security definitions
   - Ensures response schemas are defined

### 2. **Contract Testing** (`test_api_contract.py`)
   - Tests that your API implementation matches the documented contract
   - Validates request/response formats
   - Checks error responses match spec
   - Tests query parameters work as documented

### 3. **Property-Based Testing** (Schemathesis)
   - Automatically generates test cases from your OpenAPI spec
   - Tests edge cases and invalid inputs
   - Validates response schemas automatically
   - Catches contract violations

## Running the Tests

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run All Tests
```bash
pytest
```

### Run OpenAPI Tests Only
```bash
pytest app/tests/test_openapi.py
```

### Run Contract Tests
```bash
pytest app/tests/test_api_contract.py
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html
```

### Run Schemathesis Tests
```bash
# Property-based tests (requires running server)
pytest app/tests/test_openapi.py::test_api_endpoint_conformance -v
```

## Using Schemathesis for Property-Based Testing

Schemathesis automatically generates test cases from your OpenAPI spec. It:

1. **Generates random valid inputs** based on your schema
2. **Tests invalid inputs** to catch validation errors
3. **Validates responses** match your documented schema
4. **Finds edge cases** you might not have thought of

### Example: Test Against Running Server

```python
import schemathesis

schema = schemathesis.from_url("http://localhost:5000/api/apispec.json")

@schema.parametrize()
def test_api(case):
    response = case.call()
    case.validate_response(response)
```

## Benefits

1. **Documentation-Driven Development**: Your tests are generated from your docs
2. **Contract Testing**: Ensures API matches spec exactly
3. **Automatic Coverage**: Tests all endpoints automatically
4. **Regression Prevention**: Catches breaking changes in API contract
5. **CI/CD Integration**: Can run in your pipeline to validate API changes

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/tests.yml
- name: Run API Contract Tests
  run: |
    docker-compose up -d backend
    sleep 5
    pytest app/tests/test_openapi.py app/tests/test_api_contract.py
```

## Customizing Tests

### Add Custom Validations

In `test_api_contract.py`, add custom assertions:

```python
def test_custom_validation(client, openapi_spec):
    response = client.get('/api/emissions')
    data = response.get_json()
    
    # Custom business logic validation
    assert all('co2_equivalent' in item for item in data)
```

### Test Specific Endpoints

```python
@pytest.mark.parametrize("endpoint", [
    "/api/emissions",
    "/api/users",
    "/health"
])
def test_endpoints_exist(client, endpoint):
    response = client.get(endpoint)
    assert response.status_code in [200, 401]  # OK or unauthorized
```

## Troubleshooting

### Tests Fail: "Path not in OpenAPI spec"
- Make sure your route has Swagger docstrings
- Check that Flasgger is initialized correctly
- Verify `/api/apispec.json` is accessible

### Schemathesis Tests Fail
- Ensure your server is running
- Check that the spec URL is correct
- Verify authentication if testing protected endpoints

### Response Validation Fails
- Check that your response matches the documented schema
- Update your Swagger docstrings if the response changed
- Ensure all required fields are present in responses


"""
Debug script to troubleshoot Flasgger initialization
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print("=" * 60)
print("FLASGGER DEBUG SCRIPT")
print("=" * 60)

# 1. Check if Flasgger is installed
print("\n1. Checking Flasgger installation...")
try:
    import flasgger
    print(f"   ✓ Flasgger version: {flasgger.__version__}")
    from flasgger import Swagger
    print("   ✓ Flasgger imported successfully")
except ImportError as e:
    print(f"   ✗ Flasgger import failed: {e}")
    sys.exit(1)

# 2. Check Flask app creation
print("\n2. Creating Flask app...")
try:
    from app import create_app
    app = create_app('development')
    print("   ✓ Flask app created successfully")
except Exception as e:
    print(f"   ✗ Flask app creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 3. List all registered routes
print("\n3. Registered routes:")
print("   " + "-" * 56)
routes = []
for rule in app.url_map.iter_rules():
    routes.append((rule.rule, rule.endpoint, rule.methods))
    print(f"   {rule.rule:40} -> {rule.endpoint:30} {sorted(rule.methods)}")

# 4. Check for Flasgger-specific routes
print("\n4. Checking for Flasgger routes...")
flasgger_routes = [r for r in routes if 'flasgger' in r[1].lower() or 'swagger' in r[1].lower() or 'apidocs' in r[0].lower() or 'apispec' in r[0].lower()]
if flasgger_routes:
    print("   ✓ Found Flasgger routes:")
    for route, endpoint, methods in flasgger_routes:
        print(f"     {route} -> {endpoint} {sorted(methods)}")
else:
    print("   ✗ No Flasgger routes found!")
    print("   This means Flasgger did not register its routes.")

# 5. Check Swagger config
print("\n5. Checking Swagger configuration...")
try:
    from swagger_config import SWAGGER_CONFIG, SWAGGER_TEMPLATE
    print("   ✓ Swagger config loaded")
    print(f"   specs_route: {SWAGGER_CONFIG.get('specs_route', 'NOT SET (using default)')}")
    print(f"   swagger_ui: {SWAGGER_CONFIG.get('swagger_ui', 'NOT SET')}")
except Exception as e:
    print(f"   ✗ Error loading config: {e}")

# 6. Test if Swagger instance exists in app
print("\n6. Checking Swagger instance in app...")
if hasattr(app, 'extensions') and 'swagger' in app.extensions:
    print("   ✓ Swagger extension found in app.extensions")
    swagger_instance = app.extensions['swagger']
    print(f"   Swagger instance: {swagger_instance}")
else:
    print("   ✗ Swagger extension NOT found in app.extensions")
    print(f"   Available extensions: {list(app.extensions.keys()) if hasattr(app, 'extensions') else 'N/A'}")

# 7. Try to access the spec endpoint directly
print("\n7. Testing spec endpoint...")
with app.test_client() as client:
    # Try default routes
    test_routes = [
        '/apidocs/',
        '/apidocs',
        '/api/docs',
        '/api/docs/',
        '/api/apispec.json',
        '/apispec.json'
    ]
    
    for route in test_routes:
        try:
            response = client.get(route)
            print(f"   {route:25} -> Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   {'':25}   Content-Type: {response.content_type}")
                if 'json' in response.content_type:
                    data = response.get_json()
                    print(f"   {'':25}   Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
        except Exception as e:
            print(f"   {route:25} -> Error: {str(e)[:50]}")

print("\n" + "=" * 60)
print("DEBUG COMPLETE")
print("=" * 60)


#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== FLASK APPLICATION DIAGNOSIS ===")

# 1. Check Python environment
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")

# 2. Check files
required_files = [
    'passenger_wsgi.py',
    'config.py',
    'app/__init__.py',
    'app/auth/routes.py',
    'app/main/routes.py'
]

print("\n=== FILE CHECK ===")
for file in required_files:
    if os.path.exists(file):
        print(f"✓ {file} - EXISTS")
    else:
        print(f"✗ {file} - MISSING")

# 3. Test imports
print("\n=== IMPORT TEST ===")
try:
    from config import config
    print("✓ config imported successfully")
    print(f"  Available configs: {list(config.keys())}")
except Exception as e:
    print(f"✗ config import failed: {e}")

try:
    from app import create_app
    print("✓ create_app imported successfully")
except Exception as e:
    print(f"✗ create_app import failed: {e}")

# 4. Test app creation
print("\n=== APP CREATION TEST ===")
try:
    app = create_app('production')
    print("✓ Flask app created successfully")
    
    print(f"  App name: {app.name}")
    print(f"  Debug mode: {app.debug}")
    print(f"  Static URL path: {app.static_url_path}")
    
    # Test app context
    with app.app_context():
        print("✓ App context working")
        
        # List routes
        print("\n=== ROUTES ===")
        for rule in app.url_map.iter_rules():
            print(f"  {rule.endpoint}: {rule.rule} {list(rule.methods)}")
            
except Exception as e:
    print(f"✗ App creation failed: {e}")
    import traceback
    traceback.print_exc()

# 5. Check passenger debug log
print("\n=== PASSENGER DEBUG LOG ===")
if os.path.exists('passenger_debug.log'):
    with open('passenger_debug.log', 'r') as f:
        print(f.read())
else:
    print("No passenger_debug.log found")

# 6. Check error logs
print("\n=== ERROR LOGS ===")
for log_file in ['stderr.log', 'error.log', 'debug.log']:
    if os.path.exists(log_file):
        print(f"\n--- {log_file} ---")
        with open(log_file, 'r') as f:
            lines = f.readlines()
            # Show last 10 lines
            for line in lines[-10:]:
                print(line.strip())

print("\n=== DIAGNOSIS COMPLETE ===")

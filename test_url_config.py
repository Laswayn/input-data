#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    from flask import url_for
    
    # Test dengan production config
    app = create_app('production')
    
    print("=== TESTING FIXED URL CONFIGURATION ===")
    print(f"Server Name: {app.config.get('SERVER_NAME')}")
    print(f"Application Root: {app.config.get('APPLICATION_ROOT', 'NOT SET (GOOD!)')}")
    print(f"URL Scheme: {app.config.get('PREFERRED_URL_SCHEME')}")
    print(f"Static URL Path: {app.static_url_path}")
    
    with app.app_context():
        print("\n=== URL GENERATION TEST (SHOULD BE FIXED) ===")
        
        try:
            login_url = url_for('auth.login')
            print(f"✓ auth.login: {login_url}")
            expected = "http://pahlawan140.com/sensus/auth/login"
            if login_url == expected:
                print(f"  ✅ CORRECT! Expected: {expected}")
            else:
                print(f"  ❌ WRONG! Expected: {expected}")
        except Exception as e:
            print(f"✗ auth.login ERROR: {e}")
            
        try:
            logout_url = url_for('auth.logout')
            print(f"✓ auth.logout: {logout_url}")
            expected = "http://pahlawan140.com/sensus/auth/logout"
            if logout_url == expected:
                print(f"  ✅ CORRECT! Expected: {expected}")
            else:
                print(f"  ❌ WRONG! Expected: {expected}")
        except Exception as e:
            print(f"✗ auth.logout ERROR: {e}")
            
        try:
            dashboard_url = url_for('main.dashboard')
            print(f"✓ main.dashboard: {dashboard_url}")
            expected = "http://pahlawan140.com/sensus/dashboard"
            if dashboard_url == expected:
                print(f"  ✅ CORRECT! Expected: {expected}")
            else:
                print(f"  ❌ WRONG! Expected: {expected}")
        except Exception as e:
            print(f"✗ main.dashboard ERROR: {e}")
    
    print("\n=== ROUTES LIST (Should have single /sensus prefix) ===")
    with app.app_context():
        for rule in app.url_map.iter_rules():
            if not rule.endpoint.startswith('static'):
                print(f"   {rule.endpoint}: {rule.rule}")
    
    print("\n=== URL CONFIG TEST COMPLETE ===")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

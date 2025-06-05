#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    from flask import url_for
    
    app = create_app()
    
    print("=== DEBUGGING FLASK ROUTES ===")
    
    with app.app_context():
        # List all routes
        print("\n1. Available Routes:")
        for rule in app.url_map.iter_rules():
            print(f"   {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
        
        # Test URL generation
        print("\n2. URL Generation Test:")
        try:
            login_url = url_for('auth.login')
            print(f"   auth.login: {login_url}")
        except Exception as e:
            print(f"   auth.login ERROR: {e}")
            
        try:
            logout_url = url_for('auth.logout')
            print(f"   auth.logout: {logout_url}")
        except Exception as e:
            print(f"   auth.logout ERROR: {e}")
            
        try:
            dashboard_url = url_for('main.dashboard')
            print(f"   main.dashboard: {dashboard_url}")
        except Exception as e:
            print(f"   main.dashboard ERROR: {e}")
    
    print("\n3. App Configuration:")
    print(f"   SECRET_KEY: {'SET' if app.config.get('SECRET_KEY') else 'NOT SET'}")
    print(f"   SESSION_TIMEOUT: {app.config.get('SESSION_TIMEOUT', 'NOT SET')}")
    print(f"   PERMANENT_SESSION_LIFETIME: {app.config.get('PERMANENT_SESSION_LIFETIME', 'NOT SET')}")
    
    print("\n=== ROUTES DEBUG COMPLETE ===")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

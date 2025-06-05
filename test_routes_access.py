#!/usr/bin/env python3
import requests
import sys

def test_route(url, description):
    try:
        print(f"\n🔍 Testing {description}")
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=10, allow_redirects=False)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"   ✅ SUCCESS - Route accessible")
        elif response.status_code in [301, 302, 307, 308]:
            print(f"   🔄 REDIRECT to: {response.headers.get('Location', 'Unknown')}")
        elif response.status_code == 404:
            print(f"   ❌ NOT FOUND - Route not accessible")
        else:
            print(f"   ⚠️  OTHER STATUS: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("=== TESTING ROUTE ACCESS ===")

# Test routes yang seharusnya ada
routes_to_test = [
    ("http://pahlawan140.com/sensus/auth/login", "Login Page"),
    ("http://pahlawan140.com/sensus/dashboard", "Dashboard"),
    ("http://pahlawan140.com/sensus/", "Home Page"),
    ("http://pahlawan140.com/sensus/index", "Index Page"),
]

for url, description in routes_to_test:
    test_route(url, description)

print("\n=== ROUTE ACCESS TEST COMPLETE ===")

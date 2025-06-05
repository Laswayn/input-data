# Script untuk mengecek konfigurasi SSL dan memberikan panduan

import ssl
import socket
import requests
from urllib.parse import urlparse

def check_ssl_certificate(hostname, port=443):
    """Check SSL certificate for a domain"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                print(f"SSL Certificate found for {hostname}")
                print(f"Subject: {cert.get('subject')}")
                print(f"Issuer: {cert.get('issuer')}")
                print(f"Valid from: {cert.get('notBefore')}")
                print(f"Valid until: {cert.get('notAfter')}")
                return True
    except Exception as e:
        print(f"SSL Certificate check failed for {hostname}: {str(e)}")
        return False

def check_http_redirect(url):
    """Check if HTTP redirects to HTTPS"""
    try:
        response = requests.get(url, allow_redirects=False, timeout=10)
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            if location.startswith('https://'):
                print(f"HTTP redirects to HTTPS: {location}")
                return True
        print(f"No HTTPS redirect found. Status: {response.status_code}")
        return False
    except Exception as e:
        print(f"HTTP check failed: {str(e)}")
        return False

# Check the domain
domain = "pahlawan140.com"
print(f"Checking SSL configuration for {domain}")
print("=" * 50)

# Check SSL certificate
ssl_ok = check_ssl_certificate(domain)

# Check HTTP redirect
http_redirect = check_http_redirect(f"http://{domain}")

print("\n" + "=" * 50)
print("RECOMMENDATIONS:")
print("=" * 50)

if not ssl_ok:
    print("1. Install SSL Certificate:")
    print("   - Use Let's Encrypt (free): https://letsencrypt.org/")
    print("   - Or purchase from a CA like Cloudflare, DigiCert, etc.")
    print("   - Configure your web server (Apache/Nginx) to use the certificate")

if http_redirect and not ssl_ok:
    print("2. Fix HTTPS redirect:")
    print("   - Remove HTTPS redirect until SSL certificate is properly installed")
    print("   - Or install valid SSL certificate first")

print("3. Temporary workaround:")
print("   - Access via HTTP: http://pahlawan140.com/sensus")
print("   - Click 'Continue to site' (not recommended for production)")

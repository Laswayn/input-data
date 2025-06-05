#!/bin/bash
# Script untuk install SSL certificate menggunakan Let's Encrypt

echo "SSL Certificate Installation Guide"
echo "=================================="

echo "1. Install Certbot (Let's Encrypt client):"
echo "   For Ubuntu/Debian:"
echo "   sudo apt update"
echo "   sudo apt install certbot python3-certbot-apache"
echo ""
echo "   For CentOS/RHEL:"
echo "   sudo yum install certbot python3-certbot-apache"
echo ""

echo "2. Generate SSL Certificate:"
echo "   sudo certbot --apache -d pahlawan140.com -d www.pahlawan140.com"
echo ""

echo "3. Test automatic renewal:"
echo "   sudo certbot renew --dry-run"
echo ""

echo "4. Configure Apache Virtual Host:"
echo "   Edit /etc/apache2/sites-available/pahlawan140.com-ssl.conf"
echo ""

cat << 'EOF'
<VirtualHost *:443>
    ServerName pahlawan140.com
    ServerAlias www.pahlawan140.com
    DocumentRoot /var/www/html
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/pahlawan140.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/pahlawan140.com/privkey.pem
    
    # Python/Flask Configuration
    WSGIDaemonProcess sensus python-path=/path/to/your/sensus/app
    WSGIProcessGroup sensus
    WSGIScriptAlias /sensus /path/to/your/sensus/passenger_wsgi.py
    
    <Directory /path/to/your/sensus>
        WSGIApplicationGroup %{GLOBAL}
        Require all granted
    </Directory>
    
    # Static files
    Alias /sensus/static /path/to/your/sensus/app/static
    <Directory /path/to/your/sensus/app/static>
        Require all granted
    </Directory>
</VirtualHost>
EOF

echo ""
echo "5. Enable SSL module and restart Apache:"
echo "   sudo a2enmod ssl"
echo "   sudo systemctl restart apache2"

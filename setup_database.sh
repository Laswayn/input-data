#!/bin/bash

echo "🚀 Setting up Census Data Collection Database"
echo "============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install required packages
echo "📦 Installing required packages..."
pip3 install flask flask-sqlalchemy flask-migrate werkzeug

# Initialize the database
echo "🔄 Initializing database..."
python3 init_db.py

echo ""
echo "✅ Database setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Run the application: python3 run.py"
echo "2. Open browser: http://localhost:5000"
echo "3. Login with:"
echo "   - Admin: admin / pahlawan140"
echo "   - User: user / bps140"
echo ""
echo "🔧 Useful commands:"
echo "   - Check database: python3 check_db.py"
echo "   - Reset database: python3 init_db.py reset"
echo "   - Export data: python3 check_db.py export"

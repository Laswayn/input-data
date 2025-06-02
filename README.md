# Sidokepung Data Collection App

A Flask web application for collecting and managing data for Desa Sidokepung.

## Deployment

This application is configured for deployment on Render.com.

### Environment Variables Required

- `SECRET_KEY`: Flask secret key for session management
- `ADMIN_USERNAME`: Admin username for login
- `ADMIN_PASSWORD`: Admin password for login
- `SESSION_TIMEOUT`: Session timeout in seconds (default: 3600)

### Deployment Steps

1. Push code to GitHub
2. Create new Web Service on Render.com
3. Connect to GitHub repository
4. Set environment variables
5. Deploy

### Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run development server:
```bash
flask run
```

## Features

- Secure admin login
- Data collection forms
- Excel export
- Session management
- Mobile-responsive design
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sensus-secret-key-pahlawan140'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/data_sensus.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)
    SESSION_TIMEOUT = 3600
    
    # Session cookie configuration untuk subdirectory
    SESSION_COOKIE_PATH = '/'
    SESSION_COOKIE_SECURE = False    # Set True jika HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # User credentials untuk sensus
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'pahlawan140'
    USER_PASSWORD = os.environ.get('USER_PASSWORD') or 'bps140'
    
    # Upload configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    
    # Konfigurasi khusus untuk folder sensus
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Database path untuk folder sensus
    INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{os.path.join(INSTANCE_DIR, "data_sensus.db")}'
    
    # Upload folder untuk sensus
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Application root untuk subdirectory sensus
    APPLICATION_ROOT = '/sensus'
    
    # Static files configuration untuk sensus
    STATIC_URL_PATH = '/sensus/static'
    
    # Session cookie path untuk subdirectory
    SESSION_COOKIE_PATH = '/sensus'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

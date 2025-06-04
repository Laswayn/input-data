import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sensus-secret-key-pahlawan140'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///data_sensus.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)
    SESSION_TIMEOUT = 3600
    
    # User credentials untuk sensus
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'pahlawan140')
    USER_PASSWORD = os.environ.get('USER_PASSWORD', 'bps140')
    
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
    
    @staticmethod
    def init_app(app):
        # Create necessary directories untuk sensus
        base_dir = os.path.dirname(os.path.abspath(__file__))
        instance_dir = os.path.join(base_dir, 'instance')
        upload_dir = os.path.join(base_dir, 'uploads')
        
        os.makedirs(instance_dir, exist_ok=True)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Set static folder path
        app.static_url_path = '/sensus/static'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

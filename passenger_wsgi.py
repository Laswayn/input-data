#!/usr/bin/python3
import sys
import os

# Path untuk folder sensus
current_dir = os.path.dirname(os.path.abspath(__file__))
sensus_dir = current_dir  # Kita sudah di dalam folder sensus

# Add paths
sys.path.insert(0, sensus_dir)
sys.path.insert(0, os.path.join(sensus_dir, 'app'))

try:
    from app import create_app
    
    # Create Flask app untuk folder sensus
    application = create_app('production')
    
    # Set application root untuk subdirectory sensus
    application.config['APPLICATION_ROOT'] = '/sensus'
    
    # Debug log
    with open(os.path.join(sensus_dir, 'debug.log'), 'w') as f:
        f.write(f"Sensus app started successfully\n")
        f.write(f"Sensus directory: {sensus_dir}\n")
        f.write(f"Application root: /sensus\n")
        f.write(f"Python path: {sys.path}\n")
        
except Exception as e:
    with open(os.path.join(sensus_dir, 'error.log'), 'w') as f:
        f.write(f"Error starting sensus app: {str(e)}\n")
        f.write(f"Sensus directory: {sensus_dir}\n")
        import traceback
        f.write(f"Traceback: {traceback.format_exc()}\n")
    raise e

if __name__ == '__main__':
    application.run()

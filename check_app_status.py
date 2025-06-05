#!/usr/bin/env python3
import os
import sys
import subprocess
import glob

def print_header(text):
    print("\n" + "=" * 50)
    print(text)
    print("=" * 50)

def check_file_exists(filepath):
    if os.path.exists(filepath):
        print(f"✅ File exists: {filepath}")
        return True
    else:
        print(f"❌ File missing: {filepath}")
        return False

def print_file_content(filepath, lines=20):
    if check_file_exists(filepath):
        print(f"\nLast {lines} lines of {filepath}:")
        try:
            with open(filepath, 'r') as f:
                content = f.readlines()
                for line in content[-lines:]:
                    print(line.strip())
        except Exception as e:
            print(f"Error reading file: {e}")

def check_python_version():
    print_header("Python Version")
    try:
        python_version = subprocess.check_output(["python3", "--version"]).decode().strip()
        print(f"Python version: {python_version}")
    except:
        print("Could not determine Python version")

def check_app_files():
    print_header("Application Files")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    critical_files = [
        "passenger_wsgi.py",
        "run.py",
        "config.py",
        "app/__init__.py",
        "app/main/routes.py",
        "app/auth/routes.py",
        "app/models.py"
    ]
    
    for file in critical_files:
        check_file_exists(os.path.join(base_dir, file))

def check_logs():
    print_header("Log Files")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    log_files = [
        "stderr.log",
        "debug.log",
        "logs/app.log"
    ]
    
    for log_file in log_files:
        log_path = os.path.join(base_dir, log_file)
        if check_file_exists(log_path):
            print_file_content(log_path)
    
    # Check for other log files
    print("\nSearching for other log files...")
    all_logs = glob.glob(os.path.join(base_dir, "**/*.log"), recursive=True)
    for log in all_logs:
        if log not in [os.path.join(base_dir, lf) for lf in log_files]:
            print(f"Found additional log: {log}")

def check_permissions():
    print_header("File Permissions")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    dirs_to_check = [
        ".",
        "app",
        "app/main",
        "app/auth",
        "instance",
        "uploads",
        "logs"
    ]
    
    for dir_name in dirs_to_check:
        dir_path = os.path.join(base_dir, dir_name)
        if os.path.exists(dir_path):
            try:
                mode = oct(os.stat(dir_path).st_mode)[-3:]
                print(f"Directory {dir_path}: permissions {mode}")
            except Exception as e:
                print(f"Error checking permissions for {dir_path}: {e}")

def main():
    print_header("Application Status Check")
    print(f"Current directory: {os.getcwd()}")
    
    check_python_version()
    check_app_files()
    check_logs()
    check_permissions()
    
    print("\nStatus check complete.")

if __name__ == "__main__":
    main()

from flask import render_template, request, jsonify, redirect, url_for, session, current_app
from app.auth import bp
from app.models import User
from app import db
from datetime import datetime

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Check against config credentials for now
        users = {
            'admin': {
                'password': current_app.config['ADMIN_PASSWORD'],
                'role': 'admin'
            },
            'user': {
                'password': current_app.config['USER_PASSWORD'],
                'role': 'user'
            }
        }
        
        if username in users and users[username]['password'] == password:
            session.permanent = True
            session['logged_in'] = True
            session['username'] = username
            session['role'] = users[username]['role']
            session['last_activity'] = datetime.now().isoformat()
            return jsonify({
                'success': True,
                'message': 'Login berhasil',
                'redirect_url': url_for('main.dashboard'),
                'role': users[username]['role']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Username atau password salah!'
            }), 401
    
    # If already logged in, redirect to dashboard
    if 'logged_in' in session:
        return redirect(url_for('main.dashboard'))
    
    return render_template('auth/login.html')

@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

@bp.route('/check-session')
def check_session():
    """API endpoint to check session status"""
    if 'logged_in' not in session:
        return jsonify({'logged_in': False})
    
    # Check session timeout
    if 'last_activity' in session:
        last_activity = datetime.fromisoformat(session['last_activity'])
        timeout = current_app.config['SESSION_TIMEOUT']
        if (datetime.now() - last_activity).total_seconds() > timeout:
            session.clear()
            return jsonify({'logged_in': False, 'expired': True})
    
    # Update last activity
    session['last_activity'] = datetime.now().isoformat()
    return jsonify({'logged_in': True})

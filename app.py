import os
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session
import pandas as pd
from datetime import datetime, timedelta
import secrets
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# Create static/Excel folder if it doesn't exist
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
EXCEL_FOLDER = os.path.join(STATIC_FOLDER, 'Excel')
SIGNATURES_FOLDER = os.path.join(STATIC_FOLDER, 'signatures')
os.makedirs(EXCEL_FOLDER, exist_ok=True)
os.makedirs(SIGNATURES_FOLDER, exist_ok=True)

EXCEL_FILENAME = 'data_sensus.xlsx'
EXCEL_FILE = os.path.join(EXCEL_FOLDER, EXCEL_FILENAME)

# Login credentials - use environment variables in production
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'pahlawan140')

# Session timeout (1 hour in seconds)
SESSION_TIMEOUT = int(os.environ.get('SESSION_TIMEOUT', 3600))  # 1 hour

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        
        # Check session timeout
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.now() - last_activity > timedelta(seconds=SESSION_TIMEOUT):
                session.clear()
                return redirect(url_for('login', message='Session expired'))
        
        # Update last activity
        session['last_activity'] = datetime.now().isoformat()
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            session['username'] = username
            session['last_activity'] = datetime.now().isoformat()
            return jsonify({
                'success': True,
                'message': 'Login berhasil',
                'redirect_url': url_for('dashboard')
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Username atau password salah!'
            }), 401
    
    # If already logged in, redirect to dashboard
    if 'logged_in' in session:
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/check-session')
def check_session():
    """API endpoint to check session status"""
    if 'logged_in' not in session:
        return jsonify({'logged_in': False})
    
    # Check session timeout
    if 'last_activity' in session:
        last_activity = datetime.fromisoformat(session['last_activity'])
        if datetime.now() - last_activity > timedelta(seconds=SESSION_TIMEOUT):
            session.clear()
            return jsonify({'logged_in': False, 'expired': True})
    
    # Update last activity
    session['last_activity'] = datetime.now().isoformat()
    return jsonify({'logged_in': True})

@app.route('/debug-session')
def debug_session():
    """Debug route to check session data"""
    if 'keluarga_data' in session:
        keluarga_data = session['keluarga_data']
        return jsonify({
            'session_exists': True,
            'jumlah_anggota_15plus': keluarga_data.get('jumlah_anggota_15plus', 'Not found'),
            'original_jumlah_anggota_15plus': keluarga_data.get('original_jumlah_anggota_15plus', 'Not found'),
            'anggota_count': keluarga_data.get('anggota_count', 'Not found'),
            'total_members_processed': len(keluarga_data.get('all_members_data', [])),
            'all_members_data': keluarga_data.get('all_members_data', [])
        })
    else:
        return jsonify({'session_exists': False})

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

# Halaman utama aplikasi
@app.route('/index')
@login_required
def index():
    return render_template('index.html')

@app.route('/back-to-index')
@login_required
def back_to_index():
    """Route to go back to index and clear session data"""
    # Clear all form-related session data
    session.pop('keluarga_data', None)
    session.pop('individu_data', None)
    return redirect(url_for('index') + '?clear=true')

@app.route('/submit', methods=['POST'])
@login_required
def submit():
    try:
        # Clear any existing session data when starting new family
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)
        
        # Get form data
        rt = request.form.get('rt')
        rw = request.form.get('rw')
        dusun = request.form.get('dusun')
        nama_kepala = request.form.get('nama_kepala')
        alamat = request.form.get('alamat')
        jumlah_anggota = request.form.get('jumlah_anggota')
        jumlah_anggota_15plus = request.form.get('jumlah_anggota_15plus')
        
        # Server-side validation
        if not all([rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus]):
            return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400
        
        # Convert to integers
        try:
            jumlah_anggota = int(jumlah_anggota)
            jumlah_anggota_15plus = int(jumlah_anggota_15plus)
        except ValueError:
            return jsonify({'success': False, 'message': 'Jumlah anggota harus berupa angka'}), 400
        
        # Validate member counts
        if jumlah_anggota < 1:
            return jsonify({'success': False, 'message': 'Jumlah anggota keluarga minimal 1'}), 400
        
        if jumlah_anggota_15plus < 0:
            return jsonify({'success': False, 'message': 'Jumlah anggota usia 15+ tidak boleh negatif'}), 400
            
        if jumlah_anggota_15plus > jumlah_anggota:
            return jsonify({'success': False, 'message': 'Jumlah anggota usia 15+ tidak boleh lebih dari jumlah anggota keluarga'}), 400

        timestamp = datetime.now().strftime("%d-%m-%YYYY %H:%M:%S")
        keluarga_id = f"KEL-{rt}{rw}-{datetime.now().strftime('%d%m%Y%H%M%S')}"
        
        # Save basic family data to session
        session['keluarga_data'] = {
            'keluarga_id': keluarga_id,
            'rt': rt,
            'rw': rw,
            'dusun': dusun,
            'nama_kepala': nama_kepala,
            'alamat': alamat,
            'jumlah_anggota': jumlah_anggota,
            'jumlah_anggota_15plus': jumlah_anggota_15plus,
            'original_jumlah_anggota_15plus': jumlah_anggota_15plus,  # Store original count
            'anggota_count': 0,
            'timestamp': timestamp,
            'all_members_data': []  # Store all member data temporarily
        }
        
        print(f"DEBUG SUBMIT: Initial jumlah_anggota_15plus: {jumlah_anggota_15plus}")
        
        # If there are members aged 15+, redirect to member input
        if jumlah_anggota_15plus > 0:
            return jsonify({
                'success': True,
                'message': 'Data keluarga berhasil disimpan. Lanjutkan ke input anggota keluarga.',
                'redirect': True,
                'redirect_url': url_for('lanjutan')
            })
        else:
            # No members 15+, go directly to final page
            return jsonify({
                'success': True,
                'message': 'Data keluarga berhasil disimpan. Lanjutkan ke halaman akhir.',
                'redirect': True,
                'redirect_url': url_for('final_page')
            })
            
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

@app.route('/lanjutan')
@login_required
def lanjutan():
    # Check if family data exists in session
    if 'keluarga_data' not in session:
        return redirect(url_for('index'))
    
    keluarga_data = session['keluarga_data']
    print(f"DEBUG LANJUTAN: Current remaining: {keluarga_data.get('jumlah_anggota_15plus', 'Not found')}")
    return render_template('lanjutan.html', keluarga_data=keluarga_data)

@app.route('/pekerjaan')
@login_required
def pekerjaan():
    # Check if family and individual data exist in session
    if 'keluarga_data' not in session or 'individu_data' not in session:
        return redirect(url_for('index'))
    
    keluarga_data = session['keluarga_data']
    individu_data = session['individu_data']
    return render_template('pekerjaan.html', keluarga_data=keluarga_data, individu_data=individu_data)

@app.route('/final')
@login_required
def final_page():
    # Check if family data exists in session
    if 'keluarga_data' not in session:
        return redirect(url_for('index'))
    
    keluarga_data = session['keluarga_data']
    print(f"DEBUG FINAL: Accessing final page with {len(keluarga_data.get('all_members_data', []))} members")
    return render_template('final.html', keluarga_data=keluarga_data)

@app.route('/submit-individu', methods=['POST'])
@login_required
def submit_individu():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400
        
        keluarga_data = session['keluarga_data']
        
        print(f"DEBUG SUBMIT_INDIVIDU START: Remaining before processing: {keluarga_data.get('jumlah_anggota_15plus', 'Not found')}")
        print(f"DEBUG SUBMIT_INDIVIDU START: Members processed so far: {len(keluarga_data.get('all_members_data', []))}")
        
        # Collect individual data from form
        nama = request.form.get('nama')
        umur = request.form.get('umur')
        hubungan = request.form.get('hubungan')
        jenis_kelamin = request.form.get('jenis_kelamin')
        status_perkawinan = request.form.get('status_perkawinan')
        pendidikan = request.form.get('pendidikan')
        kegiatan = request.form.get('kegiatan')
        memiliki_pekerjaan = request.form.get('memiliki_pekerjaan')
        status_pekerjaan_diinginkan = request.form.get('status_pekerjaan_diinginkan')
        bidang_usaha_diminati = request.form.get('bidang_usaha')
        
        # Validate individual data
        required_fields = [nama, umur, hubungan, jenis_kelamin, status_perkawinan, pendidikan, kegiatan, memiliki_pekerjaan]
        if not all(required_fields):
            return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400
        
        try:
            umur_int = int(umur)
        except ValueError:
            return jsonify({'success': False, 'message': 'Usia harus berupa angka'}), 400
        
        if umur_int < 15:
            return jsonify({'success': False, 'message': 'Usia minimal 15 tahun'}), 400
        
        # Increment anggota_count
        keluarga_data['anggota_count'] = keluarga_data.get('anggota_count', 0) + 1
        
        # Create individu data
        individu_data = {
            'Anggota Ke': keluarga_data['anggota_count'],
            'Nama Anggota': nama,
            'Umur': umur_int,
            'Hubungan dengan Kepala Keluarga': hubungan,
            'Jenis Kelamin': jenis_kelamin,
            'Status Perkawinan': status_perkawinan,
            'Pendidikan Terakhir': pendidikan,
            'Kegiatan Sehari-hari': kegiatan,
            'Apakah Memiliki Pekerjaan': memiliki_pekerjaan or '',
            'Status Pekerjaan yang Diinginkan': status_pekerjaan_diinginkan or '',
            'Bidang Usaha yang Diminati': bidang_usaha_diminati or '',
        }
        
        # If memiliki_pekerjaan is "Ya", redirect to pekerjaan page
        if memiliki_pekerjaan == "Ya":
            # Store individu_data in session for pekerjaan page
            session['individu_data'] = individu_data
            return jsonify({
                'success': True,
                'message': 'Data berhasil disimpan. Lanjutkan ke input data pekerjaan.',
                'redirect': True,
                'redirect_url': url_for('pekerjaan')
            })
        else:
            # Add empty job fields since we're skipping detailed job input
            individu_data.update({
                'Bidang Pekerjaan': '',
                'Status Pekerjaan Utama': '',
                'Pemasaran Usaha Utama': '',
                'Penjualan Marketplace Utama': '',
                'Status Pekerjaan Diinginkan Utama': '',
                'Bidang Usaha Utama': '',
                'Bidang Pekerjaan Sampingan 1': '',
                'Status Pekerjaan Sampingan 1': '',
                'Pemasaran Usaha Sampingan 1': '',
                'Penjualan Marketplace Sampingan 1': '',
                'Status Pekerjaan Diinginkan Sampingan 1': '',
                'Bidang Usaha Sampingan 1': '',
                'Bidang Pekerjaan Sampingan 2': '',
                'Status Pekerjaan Sampingan 2': '',
                'Pemasaran Usaha Sampingan 2': '',
                'Penjualan Marketplace Sampingan 2': '',
                'Status Pekerjaan Diinginkan Sampingan 2': '',
                'Bidang Usaha Sampingan 2': '',
                'Memiliki Lebih dari Satu Pekerjaan': '',
            })
            
            # Add to all_members_data
            keluarga_data['all_members_data'].append(individu_data)
            
            # Decrease remaining members count
            keluarga_data['jumlah_anggota_15plus'] -= 1
            session['keluarga_data'] = keluarga_data

            print(f"DEBUG SUBMIT_INDIVIDU END: Remaining after processing: {keluarga_data['jumlah_anggota_15plus']}")
            print(f"DEBUG SUBMIT_INDIVIDU END: Total members processed: {len(keluarga_data['all_members_data'])}")

            # Check if there are more members to process
            if keluarga_data['jumlah_anggota_15plus'] > 0:
                return jsonify({
                    'success': True,
                    'message': 'Data berhasil disimpan. Lanjutkan ke anggota berikutnya.',
                    'remaining': keluarga_data['jumlah_anggota_15plus'],
                    'continue_next_member': True
                })
            else:
                # All members processed, go to final page
                print("DEBUG SUBMIT_INDIVIDU: All members processed, redirecting to final page")
                return jsonify({
                    'success': True,
                    'message': 'Semua data anggota berhasil disimpan. Lanjutkan ke halaman akhir.',
                    'redirect': True,
                    'redirect_url': url_for('final_page')
                })
        
    except Exception as e:
        print(f"ERROR in submit_individu: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/submit-pekerjaan', methods=['POST'])
@login_required
def submit_pekerjaan():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        if 'individu_data' not in session:
            return jsonify({'success': False, 'message': 'Data individu tidak ditemukan'}), 400

        keluarga_data = session['keluarga_data']
        individu_data = session['individu_data']
        form_data = request.form.to_dict()

        print(f"DEBUG SUBMIT_PEKERJAAN START: Remaining before processing: {keluarga_data.get('jumlah_anggota_15plus', 'Not found')}")
        print(f"DEBUG SUBMIT_PEKERJAAN START: Members processed so far: {len(keluarga_data.get('all_members_data', []))}")

        # Build member data with job information
        member_data = {
            'Anggota Ke': individu_data['Anggota Ke'],
            'Nama Anggota': individu_data['Nama Anggota'],
            'Umur': individu_data['Umur'],
            'Hubungan dengan Kepala Keluarga': individu_data['Hubungan dengan Kepala Keluarga'],
            'Jenis Kelamin': individu_data['Jenis Kelamin'],
            'Status Perkawinan': individu_data['Status Perkawinan'],
            'Pendidikan Terakhir': individu_data['Pendidikan Terakhir'],
            'Kegiatan Sehari-hari': individu_data['Kegiatan Sehari-hari'],
            'Apakah Memiliki Pekerjaan': individu_data['Apakah Memiliki Pekerjaan'],
            'Status Pekerjaan yang Diinginkan': individu_data['Status Pekerjaan yang Diinginkan'],
            'Bidang Usaha yang Diminati': individu_data['Bidang Usaha yang Diminati'],
        }

        # Add bidang pekerjaan
        member_data['Bidang Pekerjaan'] = form_data.get('bidang_pekerjaan', '')

        # Add multiple jobs info
        member_data['Memiliki Lebih dari Satu Pekerjaan'] = form_data.get('lebih_dari_satu_pekerjaan', 'Tidak')

        # Process main job (index 0)
        main_job_status = form_data.get('status_pekerjaan_0', '')
        if not main_job_status:
            return jsonify({'success': False, 'message': 'Status pekerjaan utama harus diisi'}), 400
        
        member_data.update({
            'Status Pekerjaan Utama': main_job_status,
            'Pemasaran Usaha Utama': form_data.get('pemasaran_usaha_0', ''),
            'Penjualan Marketplace Utama': form_data.get('penjualan_marketplace_0', ''),
        })

        # Process side jobs (up to 2 side jobs)
        for i in range(1, 3):  # Side jobs 1 and 2
            member_data.update({
                f'Bidang Pekerjaan Sampingan {i}': form_data.get(f'bidang_pekerjaan_{i}', ''),
                f'Status Pekerjaan Sampingan {i}': form_data.get(f'status_pekerjaan_{i}', ''),
                f'Pemasaran Usaha Sampingan {i}': form_data.get(f'pemasaran_usaha_{i}', ''),
                f'Penjualan Marketplace Sampingan {i}': form_data.get(f'penjualan_marketplace_{i}', ''),
            })

        # Add to all_members_data
        keluarga_data['all_members_data'].append(member_data)
        
        # Decrease remaining members count
        keluarga_data['jumlah_anggota_15plus'] -= 1
        session['keluarga_data'] = keluarga_data

        # Remove individual data from session
        session.pop('individu_data', None)

        print(f"DEBUG SUBMIT_PEKERJAAN END: Remaining after processing: {keluarga_data['jumlah_anggota_15plus']}")
        print(f"DEBUG SUBMIT_PEKERJAAN END: Total members processed: {len(keluarga_data['all_members_data'])}")

        # Check if there are more members to process
        if keluarga_data['jumlah_anggota_15plus'] > 0:
            return jsonify({
                'success': True,
                'message': 'Data pekerjaan berhasil disimpan. Lanjutkan ke anggota berikutnya.',
                'redirect': True,
                'redirect_url': url_for('lanjutan')
            })
        else:
            # All members processed, go to final page
            print("DEBUG SUBMIT_PEKERJAAN: All members processed, redirecting to final page")
            return jsonify({
                'success': True,
                'message': 'Semua data berhasil disimpan. Lanjutkan ke halaman akhir.',
                'redirect': True,
                'redirect_url': url_for('final_page')
            })

    except Exception as e:
        print(f"ERROR in submit_pekerjaan: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/submit-final', methods=['POST'])
@login_required
def submit_final():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        keluarga_data = session['keluarga_data']
        
        # Get surveyor and respondent information
        nama_pencacah = request.form.get('nama_pencacah')
        hp_pencacah = request.form.get('hp_pencacah')
        tanggal_pencacah = request.form.get('tanggal_pencacah')
        ttd_pencacah = request.files.get('ttd_pencacah')
        
        nama_pemberi_jawaban = request.form.get('nama_pemberi_jawaban')
        hp_pemberi_jawaban = request.form.get('hp_pemberi_jawaban')
        tanggal_pemberi_jawaban = request.form.get('tanggal_pemberi_jawaban')
        ttd_pemberi_jawaban = request.files.get('ttd_pemberi_jawaban')
        
        catatan = request.form.get('catatan')
        
        # Validate required fields
        if not all([nama_pencacah, hp_pencacah, nama_pemberi_jawaban, hp_pemberi_jawaban]):
            return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400

        # Set current timestamp for both dates
        current_timestamp = datetime.now().strftime("%d-%m-%YYYY %H:%M:%S")
        tanggal_pencacah = current_timestamp
        tanggal_pemberi_jawaban = current_timestamp
        
        # Prepare all rows for Excel
        all_rows = []
        
        # Add head of family row
        head_row = {
            'Timestamp': keluarga_data['timestamp'],
            'ID Keluarga': keluarga_data['keluarga_id'],
            'RT': keluarga_data['rt'],
            'RW': keluarga_data['rw'],
            'Dusun': keluarga_data['dusun'],
            'Nama Kepala Keluarga': keluarga_data['nama_kepala'],
            'Alamat': keluarga_data['alamat'],
            'Jumlah Anggota Keluarga': keluarga_data['jumlah_anggota'],
            'Jumlah Anggota Usia 15+': len(keluarga_data['all_members_data']),
            'Anggota Ke': 1,
            'Nama Anggota': keluarga_data['nama_kepala'],
            'Umur': '',
            'Hubungan dengan Kepala Keluarga': 'Kepala Keluarga',
            'Jenis Kelamin': '',
            'Status Perkawinan': '',
            'Pendidikan Terakhir': '',
            'Kegiatan Sehari-hari': '',
            'Apakah Memiliki Pekerjaan': '',
            'Status Pekerjaan yang Diinginkan': '',
            'Bidang Usaha yang Diminati': '',
            # Empty job fields for head
            'Bidang Pekerjaan': '',
            'Status Pekerjaan Utama': '',
            'Pemasaran Usaha Utama': '',
            'Penjualan Marketplace Utama': '',
            'Status Pekerjaan Diinginkan Utama': '',
            'Bidang Usaha Utama': '',
            'Bidang Pekerjaan Sampingan 1': '',
            'Status Pekerjaan Sampingan 1': '',
            'Pemasaran Usaha Sampingan 1': '',
            'Penjualan Marketplace Sampingan 1': '',
            'Status Pekerjaan Diinginkan Sampingan 1': '',
            'Bidang Usaha Sampingan 1': '',
            'Bidang Pekerjaan Sampingan 2': '',
            'Status Pekerjaan Sampingan 2': '',
            'Pemasaran Usaha Sampingan 2': '',
            'Penjualan Marketplace Sampingan 2': '',
            'Status Pekerjaan Diinginkan Sampingan 2': '',
            'Bidang Usaha Sampingan 2': '',
            'Memiliki Lebih dari Satu Pekerjaan': '',
            # Surveyor information
            'Nama Pencacah': nama_pencacah,
            'HP Pencacah': hp_pencacah,
            'Tanggal Pencacah': tanggal_pencacah,
            'TTD Pencacah': '',
            'Nama Pemberi Jawaban': nama_pemberi_jawaban,
            'HP Pemberi Jawaban': hp_pemberi_jawaban,
            'Tanggal Pemberi Jawaban': tanggal_pemberi_jawaban,
            'TTD Pemberi Jawaban': '',
            'Catatan': catatan or ''
        }
        all_rows.append(head_row)
        
        # Add all member rows
        for member_data in keluarga_data['all_members_data']:
            member_row = {
                'Timestamp': keluarga_data['timestamp'],
                'ID Keluarga': keluarga_data['keluarga_id'],
                'RT': keluarga_data['rt'],
                'RW': keluarga_data['rw'],
                'Dusun': keluarga_data['dusun'],
                'Nama Kepala Keluarga': keluarga_data['nama_kepala'],
                'Alamat': keluarga_data['alamat'],
                'Jumlah Anggota Keluarga': keluarga_data['jumlah_anggota'],
                'Jumlah Anggota Usia 15+': len(keluarga_data['all_members_data']),
                **member_data,
                # Surveyor information
                'Nama Pencacah': nama_pencacah,
                'HP Pencacah': hp_pencacah,
                'Tanggal Pencacah': tanggal_pencacah,
                'TTD Pencacah': '',
                'Nama Pemberi Jawaban': nama_pemberi_jawaban,
                'HP Pemberi Jawaban': hp_pemberi_jawaban,
                'Tanggal Pemberi Jawaban': tanggal_pemberi_jawaban,
                'TTD Pemberi Jawaban': '',
                'Catatan': catatan or ''
            }
            all_rows.append(member_row)
        
        # Save to Excel
        try:
            if os.path.exists(EXCEL_FILE):
                try:
                    df = pd.read_excel(EXCEL_FILE)
                    new_df = pd.DataFrame(all_rows)
                    df = pd.concat([df, new_df], ignore_index=True)
                except PermissionError:
                    return jsonify({
                        'success': False,
                        'message': 'File Excel sedang digunakan oleh program lain. Tutup file dan coba lagi.'
                    }), 500
            else:
                df = pd.DataFrame(all_rows)

            df.to_excel(EXCEL_FILE, index=False)

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error saving to Excel: {str(e)}'}), 500

        # Clear session
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)

        return jsonify({
            'success': True,
            'message': 'Semua data berhasil disimpan. Terima kasih!',
            'download_url': f'/download/{EXCEL_FILENAME}',
            'redirect': True,
            'redirect_url': url_for('index') + '?clear=true'
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
    
@app.route('/edit-keluarga', methods=['GET', 'POST'])
@login_required
def edit_keluarga():
    if request.method == 'POST':
        # Handle the form submission for editing family data
        try:
            if 'keluarga_data' not in session:
                return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

            keluarga_data = session['keluarga_data']

            # Get updated data from the form
            rt = request.form.get('rt')
            rw = request.form.get('rw')
            dusun = request.form.get('dusun')
            nama_kepala = request.form.get('nama_kepala')
            alamat = request.form.get('alamat')
            jumlah_anggota = request.form.get('jumlah_anggota')
            jumlah_anggota_15plus = request.form.get('jumlah_anggota_15plus')

            # Update keluarga_data with new values
            keluarga_data['rt'] = rt
            keluarga_data['rw'] = rw
            keluarga_data['dusun'] = dusun
            keluarga_data['nama_kepala'] = nama_kepala
            keluarga_data['alamat'] = alamat
            keluarga_data['jumlah_anggota'] = int(jumlah_anggota)
            keluarga_data['jumlah_anggota_15plus'] = int(jumlah_anggota_15plus)

            session['keluarga_data'] = keluarga_data

            return jsonify({'success': True, 'message': 'Data keluarga berhasil diperbarui.'}), 200

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

    # Render the edit form with existing family data
    if 'keluarga_data' not in session:
        return redirect(url_for('index'))

    keluarga_data = session['keluarga_data']
    return render_template('edit_keluarga.html', keluarga_data=keluarga_data)

@app.route('/edit-individu/<int:index>', methods=['GET', 'POST'])
@login_required
def edit_individu(index):
    if 'keluarga_data' not in session:
        return redirect(url_for('index'))

    keluarga_data = session['keluarga_data']
    members = keluarga_data.get('all_members_data', [])

    # Check valid index
    if index < 0 or index >= len(members):
        return "Data individu tidak ditemukan", 404

    if request.method == 'POST':
        try:
            # Get form data
            nama = request.form.get('nama')
            umur = request.form.get('umur')
            hubungan = request.form.get('hubungan')
            jenis_kelamin = request.form.get('jenis_kelamin')
            status_perkawinan = request.form.get('status_perkawinan')
            pendidikan = request.form.get('pendidikan')
            kegiatan = request.form.get('kegiatan')
            memiliki_pekerjaan = request.form.get('memiliki_pekerjaan')
            status_pekerjaan_diinginkan = request.form.get('status_pekerjaan_diinginkan')
            bidang_usaha_diminati = request.form.get('bidang_usaha')

            # Get job-related data
            bidang_pekerjaan = request.form.get('bidang_pekerjaan')
            status_pekerjaan_utama = request.form.get('status_pekerjaan_0')
            pemasaran_usaha_utama = request.form.get('pemasaran_usaha_0')
            penjualan_marketplace_utama = request.form.get('penjualan_marketplace_0')
            lebih_dari_satu_pekerjaan = request.form.get('lebih_dari_satu_pekerjaan')

            # Validate required fields
            required_fields = [nama, umur, hubungan, jenis_kelamin, status_perkawinan, pendidikan, kegiatan, memiliki_pekerjaan]
            if not all(required_fields):
                return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400

            try:
                umur_int = int(umur)
            except ValueError:
                return jsonify({'success': False, 'message': 'Usia harus berupa angka'}), 400

            if umur_int < 15:
                return jsonify({'success': False, 'message': 'Usia minimal 15 tahun'}), 400

            # Update the member data in session
            member_data = members[index]

            # Update basic individual data
            member_data['Nama Anggota'] = nama
            member_data['Umur'] = umur_int
            member_data['Hubungan dengan Kepala Keluarga'] = hubungan
            member_data['Jenis Kelamin'] = jenis_kelamin
            member_data['Status Perkawinan'] = status_perkawinan
            member_data['Pendidikan Terakhir'] = pendidikan
            member_data['Kegiatan Sehari-hari'] = kegiatan
            member_data['Apakah Memiliki Pekerjaan'] = memiliki_pekerjaan
            member_data['Status Pekerjaan yang Diinginkan'] = status_pekerjaan_diinginkan or ''
            member_data['Bidang Usaha yang Diminati'] = bidang_usaha_diminati or ''

            # Update job data if person has a job
            if memiliki_pekerjaan == 'Ya':
                member_data['Bidang Pekerjaan'] = bidang_pekerjaan or ''
                member_data['Status Pekerjaan Utama'] = status_pekerjaan_utama or ''
                member_data['Pemasaran Usaha Utama'] = pemasaran_usaha_utama or ''
                member_data['Penjualan Marketplace Utama'] = penjualan_marketplace_utama or ''
                member_data['Memiliki Lebih dari Satu Pekerjaan'] = lebih_dari_satu_pekerjaan or 'Tidak'

                # Process side jobs (up to 2 side jobs)
                for i in range(1, 3):  # Side jobs 1 and 2
                    member_data[f'Bidang Pekerjaan Sampingan {i}'] = request.form.get(f'bidang_pekerjaan_{i}', '')
                    member_data[f'Status Pekerjaan Sampingan {i}'] = request.form.get(f'status_pekerjaan_{i}', '')
                    member_data[f'Pemasaran Usaha Sampingan {i}'] = request.form.get(f'pemasaran_usaha_{i}', '')
                    member_data[f'Penjualan Marketplace Sampingan {i}'] = request.form.get(f'penjualan_marketplace_{i}', '')
            else:
                # Clear job data if person doesn't have a job
                member_data['Bidang Pekerjaan'] = ''
                member_data['Status Pekerjaan Utama'] = ''
                member_data['Pemasaran Usaha Utama'] = ''
                member_data['Penjualan Marketplace Utama'] = ''
                member_data['Memiliki Lebih dari Satu Pekerjaan'] = ''
                
                # Clear side job data
                for i in range(1, 3):
                    member_data[f'Bidang Pekerjaan Sampingan {i}'] = ''
                    member_data[f'Status Pekerjaan Sampingan {i}'] = ''
                    member_data[f'Pemasaran Usaha Sampingan {i}'] = ''
                    member_data[f'Penjualan Marketplace Sampingan {i}'] = ''

            # Save back to session
            keluarga_data['all_members_data'][index] = member_data
            session['keluarga_data'] = keluarga_data

            return jsonify({'success': True, 'message': 'Data individu dan pekerjaan berhasil diperbarui.'})

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

    # GET request: show edit form
    individu_data = members[index]
    return render_template('edit_individu.html', individu_data=individu_data, index=index)

@app.route('/download/<filename>')
@login_required
def download_file(filename):
    """Route to download Excel file"""
    try:
        # Make sure filename is the allowed one
        if filename != EXCEL_FILENAME:
            return "File tidak ditemukan", 404
        
        file_path = os.path.join(EXCEL_FOLDER, filename)
        
        # Make sure file exists
        if not os.path.exists(file_path):
            return "File tidak ditemukan", 404
        
        # Set download filename
        download_name = f"data_sensus_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return send_from_directory(
            directory=EXCEL_FOLDER, 
            path=filename,
            as_attachment=True,
            download_name=download_name
        )
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return f"Error: {str(e)}", 500

@app.route('/check-file')
@login_required
def check_file():
    """Check if Excel file exists"""
    exists = os.path.exists(EXCEL_FILE)
    return jsonify({'exists': exists})

@app.route('/get-form-data')
@login_required
def get_form_data():
    """Get saved form data from session"""
    # Only return form data if we're in the middle of editing
    # Don't return data for new entries
    if 'keluarga_data' in session and session['keluarga_data'].get('anggota_count', 0) > 0:
        # We're in the middle of processing a family, return the basic family data
        keluarga_data = session['keluarga_data']
        return jsonify({
            'form_data': {
                'rt': keluarga_data.get('rt', ''),
                'rw': keluarga_data.get('rw', ''),
                'dusun': keluarga_data.get('dusun', ''),
                'nama_kepala': keluarga_data.get('nama_kepala', ''),
                'alamat': keluarga_data.get('alamat', ''),
                'jumlah_anggota': keluarga_data.get('jumlah_anggota', ''),
                'jumlah_anggota_15plus': keluarga_data.get('original_jumlah_anggota_15plus', '')
            }
        })
    else:
        # Return empty data for new entries
        return jsonify({'form_data': None})

if __name__ == '__main__':
    app.run(debug=True)
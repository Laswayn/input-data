from flask import render_template, request, redirect, url_for, session, send_file, current_app
from app.main import bp
from app.models import Keluarga, Individu
from app import db
from datetime import datetime
from functools import wraps
import pandas as pd
import tempfile
import traceback

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('auth.login'))
        
        # Check session timeout
        if 'last_activity' in session:
            try:
                last_activity = datetime.fromisoformat(session['last_activity'])
                timeout = current_app.config['SESSION_TIMEOUT']
                if (datetime.now() - last_activity).total_seconds() > timeout:
                    session.clear()
                    return redirect(url_for('auth.login', message='Session expired'))
            except Exception as e:
                current_app.logger.error(f"Session timeout check error: {e}")
        
        # Update last activity
        session['last_activity'] = datetime.now().isoformat()
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            return redirect(url_for('main.dashboard', error='Admin access required'))
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/')
def home():
    return redirect(url_for('auth.login'))

@bp.route('/dashboard')
@login_required
def dashboard():
    success = request.args.get('success')
    error = request.args.get('error')
    return render_template('main/dashboard.html', success=success, error=error)

@bp.route('/index')
@login_required
def index():
    success = request.args.get('success')
    error = request.args.get('error')
    clear = request.args.get('clear')
    
    # Clear session if requested
    if clear:
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)
    
    return render_template('main/index.html', success=success, error=error)

@bp.route('/back-to-index')
@login_required
def back_to_index():
    """Route to go back to index and clear session data"""
    session.pop('keluarga_data', None)
    session.pop('individu_data', None)
    return redirect(url_for('main.index', clear='true'))

@bp.route('/edit-keluarga')
@login_required
def edit_keluarga():
    """Route to edit family data"""
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    success = request.args.get('success')
    error = request.args.get('error')
    return render_template('main/edit-keluarga.html', keluarga_data=keluarga_data, success=success, error=error)

@bp.route('/edit-anggota')
@login_required
def edit_anggota():
    """Route to edit member data"""
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    # Get member index from URL parameters
    member_index = request.args.get('memberIndex', type=int)
    if member_index is None:
        return redirect(url_for('main.final_page'))
    
    keluarga_data = session['keluarga_data']
    
    # Validate member index
    if member_index < 0 or member_index >= len(keluarga_data.get('all_members_data', [])):
        return redirect(url_for('main.final_page'))
    
    member_data = keluarga_data['all_members_data'][member_index]
    success = request.args.get('success')
    error = request.args.get('error')
    
    return render_template('main/edit-anggota.html', 
                         keluarga_data=keluarga_data, 
                         member_data=member_data,
                         member_index=member_index,
                         success=success,
                         error=error)

@bp.route('/submit', methods=['POST'])
@login_required
def submit():
    try:
        # Clear any existing session data when starting new family
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)
        
        # Get form data
        rt = request.form.get('rt', '').strip()
        rw = request.form.get('rw', '').strip()
        dusun = request.form.get('dusun', '').strip()
        nama_kepala = request.form.get('nama_kepala', '').strip()
        alamat = request.form.get('alamat', '').strip()
        jumlah_anggota = request.form.get('jumlah_anggota', '').strip()
        jumlah_anggota_15plus = request.form.get('jumlah_anggota_15plus', '').strip()
        
        # Server-side validation
        missing_fields = []
        if not rt:
            missing_fields.append('RT')
        if not rw:
            missing_fields.append('RW')
        if not dusun:
            missing_fields.append('Dusun')
        if not nama_kepala:
            missing_fields.append('Nama Kepala Keluarga')
        if not alamat:
            missing_fields.append('Alamat')
        if not jumlah_anggota:
            missing_fields.append('Jumlah Anggota')
        if not jumlah_anggota_15plus:
            missing_fields.append('Jumlah Anggota 15+')
            
        if missing_fields:
            error_msg = f"Field berikut harus diisi: {', '.join(missing_fields)}"
            return redirect(url_for('main.index', error=error_msg))
        
        # Convert to integers
        try:
            jumlah_anggota_int = int(jumlah_anggota)
            jumlah_anggota_15plus_int = int(jumlah_anggota_15plus)
        except ValueError:
            return redirect(url_for('main.index', error='Jumlah anggota harus berupa angka yang valid'))
        
        # Validate member counts
        if jumlah_anggota_int < 1:
            return redirect(url_for('main.index', error='Jumlah anggota keluarga minimal 1'))
        
        if jumlah_anggota_15plus_int < 0:
            return redirect(url_for('main.index', error='Jumlah anggota usia 15+ tidak boleh negatif'))
            
        if jumlah_anggota_15plus_int > jumlah_anggota_int:
            return redirect(url_for('main.index', error='Jumlah anggota usia 15+ tidak boleh lebih dari jumlah anggota keluarga'))

        # Generate timestamp and ID
        timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        keluarga_id = f"KEL-{rt}{rw}-{datetime.now().strftime('%d%m%Y%H%M%S')}"
        
        # Save basic family data to session
        keluarga_data = {
            'keluarga_id': keluarga_id,
            'rt': rt,
            'rw': rw,
            'dusun': dusun,
            'nama_kepala': nama_kepala,
            'alamat': alamat,
            'jumlah_anggota': jumlah_anggota_int,
            'jumlah_anggota_15plus': jumlah_anggota_15plus_int,
            'original_jumlah_anggota_15plus': jumlah_anggota_15plus_int,
            'anggota_count': 0,
            'timestamp': timestamp,
            'all_members_data': []
        }
        
        session['keluarga_data'] = keluarga_data
        session.permanent = True
        
        # Determine next step
        if jumlah_anggota_15plus_int > 0:
            return redirect(url_for('main.lanjutan', success='Data keluarga berhasil disimpan. Lanjutkan ke input anggota keluarga.'))
        else:
            return redirect(url_for('main.final_page', success='Data keluarga berhasil disimpan. Lanjutkan ke halaman akhir.'))
            
    except Exception as e:
        current_app.logger.error(f"Error in submit route: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.index', error=f'Terjadi kesalahan server: {str(e)}'))

@bp.route('/lanjutan')
@login_required
def lanjutan():
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    success = request.args.get('success')
    error = request.args.get('error')
    return render_template('main/lanjutan.html', keluarga_data=keluarga_data, success=success, error=error)

@bp.route('/pekerjaan')
@login_required
def pekerjaan():
    if 'keluarga_data' not in session or 'individu_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    individu_data = session['individu_data']
    success = request.args.get('success')
    error = request.args.get('error')
    return render_template('main/pekerjaan.html', keluarga_data=keluarga_data, individu_data=individu_data, success=success, error=error)

@bp.route('/final')
@login_required
def final_page():
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index', error='Data keluarga tidak ditemukan. Silakan mulai dari awal.'))
    
    keluarga_data = session['keluarga_data']
    success = request.args.get('success')
    error = request.args.get('error')
    
    # Log for debugging
    current_app.logger.info(f"Final page - keluarga_data: {keluarga_data}")
    current_app.logger.info(f"Final page - members count: {len(keluarga_data.get('all_members_data', []))}")
    
    return render_template('main/final.html', keluarga_data=keluarga_data, success=success, error=error)

@bp.route('/submit-individu', methods=['POST'])
@login_required
def submit_individu():
    try:
        if 'keluarga_data' not in session:
            return redirect(url_for('main.index', error='Data keluarga tidak ditemukan'))
        
        keluarga_data = session['keluarga_data']
        
        # Collect individual data from form
        nama_anggota = request.form.get('nama')
        umur = request.form.get('umur')
        hubungan_kepala = request.form.get('hubungan')
        jenis_kelamin = request.form.get('jenis_kelamin')
        status_perkawinan = request.form.get('status_perkawinan')
        pendidikan_terakhir = request.form.get('pendidikan')
        kegiatan_sehari = request.form.get('kegiatan')
        memiliki_pekerjaan = request.form.get('memiliki_pekerjaan')
        status_pekerjaan_diinginkan = request.form.get('status_pekerjaan_diinginkan')
        bidang_usaha_diminati = request.form.get('bidang_usaha')
        
        # Validate individual data
        required_fields = [nama_anggota, umur, hubungan_kepala, jenis_kelamin, status_perkawinan, pendidikan_terakhir, kegiatan_sehari, memiliki_pekerjaan]
        if not all(required_fields):
            return redirect(url_for('main.lanjutan', error='Semua field harus diisi'))
        
        try:
            umur_int = int(umur)
        except ValueError:
            return redirect(url_for('main.lanjutan', error='Usia harus berupa angka'))
        
        if umur_int < 15:
            return redirect(url_for('main.lanjutan', error='Usia minimal 15 tahun'))
        
        # Increment anggota_count
        keluarga_data['anggota_count'] = keluarga_data.get('anggota_count', 0) + 1
        
        # Create individu data
        individu_data = {
            'anggota_ke': keluarga_data['anggota_count'],
            'nama_anggota': nama_anggota,
            'umur': umur_int,
            'hubungan_kepala': hubungan_kepala,
            'jenis_kelamin': jenis_kelamin,
            'status_perkawinan': status_perkawinan,
            'pendidikan_terakhir': pendidikan_terakhir,
            'kegiatan_sehari': kegiatan_sehari,
            'memiliki_pekerjaan': memiliki_pekerjaan or '',
            'status_pekerjaan_diinginkan': status_pekerjaan_diinginkan or '',
            'bidang_usaha_diminati': bidang_usaha_diminati or '',
        }
        
        # If memiliki_pekerjaan is "Ya", redirect to pekerjaan page
        if memiliki_pekerjaan == "Ya":
            session['individu_data'] = individu_data
            return redirect(url_for('main.pekerjaan', success='Data berhasil disimpan. Lanjutkan ke input data pekerjaan.'))
        else:
            # Add empty job fields since we're skipping detailed job input
            individu_data.update({
                'bidang_pekerjaan': '',
                'status_pekerjaan_utama': '',
                'pemasaran_usaha_utama': '',
                'penjualan_marketplace_utama': '',
                'bidang_pekerjaan_sampingan1': '',
                'status_pekerjaan_sampingan1': '',
                'pemasaran_usaha_sampingan1': '',
                'penjualan_marketplace_sampingan1': '',
                'bidang_pekerjaan_sampingan2': '',
                'status_pekerjaan_sampingan2': '',
                'pemasaran_usaha_sampingan2': '',
                'penjualan_marketplace_sampingan2': '',
                'memiliki_lebih_satu_pekerjaan': '',
            })
            
            # Add to all_members_data
            keluarga_data['all_members_data'].append(individu_data)
            
            # Decrease remaining members count
            keluarga_data['jumlah_anggota_15plus'] -= 1
            session['keluarga_data'] = keluarga_data

            # Check if there are more members to process
            if keluarga_data['jumlah_anggota_15plus'] > 0:
                return redirect(url_for('main.lanjutan', success=f'Data berhasil disimpan. Sisa {keluarga_data["jumlah_anggota_15plus"]} anggota lagi.'))
            else:
                return redirect(url_for('main.final_page', success='Semua data anggota berhasil disimpan. Lanjutkan ke halaman akhir.'))
        
    except Exception as e:
        current_app.logger.error(f"ERROR in submit_individu: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.lanjutan', error=f'Error: {str(e)}'))

@bp.route('/submit-pekerjaan', methods=['POST'])
@login_required
def submit_pekerjaan():
    try:
        if 'keluarga_data' not in session:
            current_app.logger.error("No keluarga_data in session")
            return redirect(url_for('main.index', error='Data keluarga tidak ditemukan'))

        if 'individu_data' not in session:
            current_app.logger.error("No individu_data in session")
            return redirect(url_for('main.lanjutan', error='Data individu tidak ditemukan'))

        keluarga_data = session['keluarga_data']
        individu_data = session['individu_data']
        
        current_app.logger.info(f"Processing job data for: {individu_data.get('nama_anggota', 'Unknown')}")
        
        # Get form data
        bidang_pekerjaan = request.form.get('bidang_pekerjaan', '').strip()
        lebih_dari_satu_pekerjaan = request.form.get('lebih_dari_satu_pekerjaan', '').strip()
        status_pekerjaan_0 = request.form.get('status_pekerjaan_0', '').strip()
        
        # Validate required fields
        if not bidang_pekerjaan:
            return redirect(url_for('main.pekerjaan', error='Bidang pekerjaan harus dipilih'))
        
        if not status_pekerjaan_0:
            return redirect(url_for('main.pekerjaan', error='Status pekerjaan utama harus dipilih'))
        
        if not lebih_dari_satu_pekerjaan:
            return redirect(url_for('main.pekerjaan', error='Pertanyaan tentang memiliki lebih dari satu pekerjaan harus dijawab'))

        # Build member data with job information
        member_data = {
            'anggota_ke': individu_data['anggota_ke'],
            'nama_anggota': individu_data['nama_anggota'],
            'umur': individu_data['umur'],
            'hubungan_kepala': individu_data['hubungan_kepala'],
            'jenis_kelamin': individu_data['jenis_kelamin'],
            'status_perkawinan': individu_data['status_perkawinan'],
            'pendidikan_terakhir': individu_data['pendidikan_terakhir'],
            'kegiatan_sehari': individu_data['kegiatan_sehari'],
            'memiliki_pekerjaan': individu_data['memiliki_pekerjaan'],
            'status_pekerjaan_diinginkan': individu_data['status_pekerjaan_diinginkan'],
            'bidang_usaha_diminati': individu_data['bidang_usaha_diminati'],
        }

        # Add bidang pekerjaan
        member_data['bidang_pekerjaan'] = bidang_pekerjaan

        # Add multiple jobs info
        member_data['memiliki_lebih_satu_pekerjaan'] = lebih_dari_satu_pekerjaan

        # Process main job (index 0)
        member_data.update({
            'status_pekerjaan_utama': status_pekerjaan_0,
            'pemasaran_usaha_utama': request.form.get('pemasaran_usaha_0', ''),
            'penjualan_marketplace_utama': request.form.get('penjualan_marketplace_0', ''),
        })

        # Process side jobs (up to 2 side jobs) - only if user has multiple jobs
        if lebih_dari_satu_pekerjaan == 'Ya':
            for i in range(1, 3):  # Side jobs 1 and 2
                member_data.update({
                    f'bidang_pekerjaan_sampingan{i}': request.form.get(f'bidang_pekerjaan_{i}', ''),
                    f'status_pekerjaan_sampingan{i}': request.form.get(f'status_pekerjaan_{i}', ''),
                    f'pemasaran_usaha_sampingan{i}': request.form.get(f'pemasaran_usaha_{i}', ''),
                    f'penjualan_marketplace_sampingan{i}': request.form.get(f'penjualan_marketplace_{i}', ''),
                })
        else:
            # Clear side job fields if user doesn't have multiple jobs
            for i in range(1, 3):
                member_data.update({
                    f'bidang_pekerjaan_sampingan{i}': '',
                    f'status_pekerjaan_sampingan{i}': '',
                    f'pemasaran_usaha_sampingan{i}': '',
                    f'penjualan_marketplace_sampingan{i}': '',
                })

        # Log for debugging
        current_app.logger.info(f"Processing job data for member: {member_data['nama_anggota']}")
        current_app.logger.info(f"Main job: {bidang_pekerjaan} - {status_pekerjaan_0}")
        current_app.logger.info(f"Multiple jobs: {lebih_dari_satu_pekerjaan}")

        # Add to all_members_data
        if 'all_members_data' not in keluarga_data:
            keluarga_data['all_members_data'] = []
        
        keluarga_data['all_members_data'].append(member_data)
        
        # Decrease remaining members count
        keluarga_data['jumlah_anggota_15plus'] -= 1
        session['keluarga_data'] = keluarga_data

        # Remove individual data from session
        session.pop('individu_data', None)

        # Check if there are more members to process
        remaining_members = keluarga_data['jumlah_anggota_15plus']
        current_app.logger.info(f"Remaining members: {remaining_members}")
        
        if remaining_members > 0:
            success_msg = f'Data pekerjaan berhasil disimpan. Sisa {remaining_members} anggota lagi.'
            current_app.logger.info(f"Redirecting to lanjutan with message: {success_msg}")
            return redirect(url_for('main.lanjutan', success=success_msg))
        else:
            current_app.logger.info("All members processed, redirecting to final page")
            return redirect(url_for('main.final_page', success='Semua data berhasil disimpan. Lanjutkan ke halaman akhir.'))

    except Exception as e:
        current_app.logger.error(f"ERROR in submit_pekerjaan: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.pekerjaan', error=f'Terjadi kesalahan: {str(e)}'))

@bp.route('/edit-member', methods=['POST'])
@login_required
def edit_member():
    try:
        if 'keluarga_data' not in session:
            return redirect(url_for('main.final_page', error='Data keluarga tidak ditemukan'))

        keluarga_data = session['keluarga_data']
        
        # Debug: Log all form data
        current_app.logger.info(f"Form data received: {dict(request.form)}")
        
        # Get member index from form
        member_index = int(request.form.get('memberIndex'))
        
        current_app.logger.info(f"Editing member at index: {member_index}")
        
        if member_index < 0 or member_index >= len(keluarga_data['all_members_data']):
            return redirect(url_for('main.final_page', error='Index anggota tidak valid'))

        # Update member data
        member_data = keluarga_data['all_members_data'][member_index]
        
        current_app.logger.info(f"Original member data: {member_data}")
        
        # Update basic info
        member_data['nama_anggota'] = request.form.get('nama_anggota', '').strip()
        member_data['umur'] = int(request.form.get('umur', 0))
        member_data['jenis_kelamin'] = request.form.get('jenis_kelamin', '').strip()
        member_data['hubungan_kepala'] = request.form.get('hubungan_kepala', '').strip()
        member_data['status_perkawinan'] = request.form.get('status_perkawinan', '').strip()
        member_data['pendidikan_terakhir'] = request.form.get('pendidikan_terakhir', '').strip()
        member_data['kegiatan_sehari'] = request.form.get('kegiatan_sehari', '').strip()
        member_data['memiliki_pekerjaan'] = request.form.get('memiliki_pekerjaan', '').strip()

        # Update job-related fields based on memiliki_pekerjaan
        if member_data['memiliki_pekerjaan'] == 'Tidak':
            # Clear job fields and update no-job fields
            member_data.update({
                'status_pekerjaan_diinginkan': request.form.get('status_pekerjaan_diinginkan', '').strip(),
                'bidang_usaha_diminati': request.form.get('bidang_usaha_diminati', '').strip(),
                'bidang_pekerjaan': '',
                'memiliki_lebih_satu_pekerjaan': '',
                'status_pekerjaan_utama': '',
                'pemasaran_usaha_utama': '',
                'penjualan_marketplace_utama': '',
                'bidang_pekerjaan_sampingan1': '',
                'status_pekerjaan_sampingan1': '',
                'pemasaran_usaha_sampingan1': '',
                'penjualan_marketplace_sampingan1': '',
                'bidang_pekerjaan_sampingan2': '',
                'status_pekerjaan_sampingan2': '',
                'pemasaran_usaha_sampingan2': '',
                'penjualan_marketplace_sampingan2': '',
            })
        else:
            # Update job fields
            member_data.update({
                'status_pekerjaan_diinginkan': '',
                'bidang_usaha_diminati': '',
                'bidang_pekerjaan': request.form.get('bidang_pekerjaan', '').strip(),
                'memiliki_lebih_satu_pekerjaan': request.form.get('memiliki_lebih_satu_pekerjaan', 'Tidak').strip(),
                'status_pekerjaan_utama': request.form.get('status_pekerjaan_utama', '').strip(),
                'pemasaran_usaha_utama': request.form.get('pemasaran_usaha_utama', '').strip(),
                'penjualan_marketplace_utama': request.form.get('penjualan_marketplace_utama', '').strip(),
                'bidang_pekerjaan_sampingan1': request.form.get('bidang_pekerjaan_sampingan1', '').strip(),
                'status_pekerjaan_sampingan1': request.form.get('status_pekerjaan_sampingan1', '').strip(),
                'pemasaran_usaha_sampingan1': request.form.get('pemasaran_usaha_sampingan1', '').strip(),
                'penjualan_marketplace_sampingan1': request.form.get('penjualan_marketplace_sampingan1', '').strip(),
                'bidang_pekerjaan_sampingan2': request.form.get('bidang_pekerjaan_sampingan2', '').strip(),
                'status_pekerjaan_sampingan2': request.form.get('status_pekerjaan_sampingan2', '').strip(),
                'pemasaran_usaha_sampingan2': request.form.get('pemasaran_usaha_sampingan2', '').strip(),
                'penjualan_marketplace_sampingan2': request.form.get('penjualan_marketplace_sampingan2', '').strip(),
            })

        current_app.logger.info(f"Updated member data: {member_data}")

        # Update session with modified data
        keluarga_data['all_members_data'][member_index] = member_data
        session['keluarga_data'] = keluarga_data
        session.modified = True  # Force session update
        
        current_app.logger.info(f"Session updated successfully")

        return redirect(url_for('main.final_page', success='Data anggota berhasil diperbarui'))

    except Exception as e:
        current_app.logger.error(f"ERROR in edit_member: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.final_page', error=f'Error: {str(e)}'))

@bp.route('/edit-family', methods=['POST'])
@login_required
def edit_family():
    try:
        if 'keluarga_data' not in session:
            return redirect(url_for('main.index', error='Data keluarga tidak ditemukan'))

        keluarga_data = session['keluarga_data']
        
        # Debug: Log all form data
        current_app.logger.info(f"Form data received: {dict(request.form)}")
        current_app.logger.info(f"Original keluarga data: {keluarga_data}")
        
        # Get current member count
        current_member_count = len(keluarga_data.get('all_members_data', []))
        
        # Update family data
        keluarga_data['dusun'] = request.form.get('dusun', '').strip()
        keluarga_data['rt'] = request.form.get('rt', '').strip()
        keluarga_data['rw'] = request.form.get('rw', '').strip()
        keluarga_data['nama_kepala'] = request.form.get('nama_kepala', '').strip()
        keluarga_data['alamat'] = request.form.get('alamat', '').strip()
        keluarga_data['jumlah_anggota'] = int(request.form.get('jumlah_anggota', 0))
        
        # Handle member count changes
        new_member_count = int(request.form.get('jumlah_anggota_15plus', 0))
        
        current_app.logger.info(f"Current member count: {current_member_count}, New member count: {new_member_count}")
        
        if new_member_count < current_member_count:
            # Remove excess members
            keluarga_data['all_members_data'] = keluarga_data['all_members_data'][:new_member_count]
        elif new_member_count > current_member_count:
            # Set up for adding new members
            keluarga_data['jumlah_anggota_15plus'] = new_member_count - current_member_count
            keluarga_data['anggota_count'] = current_member_count
        
        # Update original count
        keluarga_data['original_jumlah_anggota_15plus'] = new_member_count

        current_app.logger.info(f"Updated keluarga data: {keluarga_data}")

        # Update session with modified data
        session['keluarga_data'] = keluarga_data
        session.modified = True  # Force session update
        
        current_app.logger.info(f"Session updated successfully")

        # Check if we need to redirect to add new members
        if new_member_count > current_member_count:
            return redirect(url_for('main.lanjutan', success='Data keluarga berhasil diperbarui. Silakan tambahkan anggota baru.'))
        else:
            return redirect(url_for('main.final_page', success='Data keluarga berhasil diperbarui'))

    except Exception as e:
        current_app.logger.error(f"ERROR in edit_family: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.edit_keluarga', error=f'Error: {str(e)}'))

@bp.route('/submit-final', methods=['POST'])
@login_required
def submit_final():
    try:
        if 'keluarga_data' not in session:
            return redirect(url_for('main.index', error='Data keluarga tidak ditemukan'))

        keluarga_data = session['keluarga_data']
        
        # Get surveyor and respondent information
        nama_pencacah = request.form.get('nama_pencacah')
        hp_pencacah = request.form.get('hp_pencacah')
        nama_pemberi_jawaban = request.form.get('nama_pemberi_jawaban')
        hp_pemberi_jawaban = request.form.get('hp_pemberi_jawaban')
        catatan = request.form.get('catatan')
        
        # Validate required fields
        if not all([nama_pencacah, hp_pencacah, nama_pemberi_jawaban, hp_pemberi_jawaban]):
            return redirect(url_for('main.final_page', error='Semua field harus diisi'))

        # Set current timestamp
        current_timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        
        # Check if keluarga already exists
        existing_keluarga = Keluarga.query.filter_by(keluarga_id=keluarga_data['keluarga_id']).first()
        if existing_keluarga:
            return redirect(url_for('main.final_page', error='Data keluarga sudah ada di database'))
        
        # Create Keluarga record
        keluarga = Keluarga(
            keluarga_id=keluarga_data['keluarga_id'],
            rt=keluarga_data['rt'],
            rw=keluarga_data['rw'],
            dusun=keluarga_data['dusun'],
            nama_kepala=keluarga_data['nama_kepala'],
            alamat=keluarga_data['alamat'],
            jumlah_anggota=keluarga_data['jumlah_anggota'],
            jumlah_anggota_15plus=len(keluarga_data.get('all_members_data', [])),
            nama_pencacah=nama_pencacah,
            hp_pencacah=hp_pencacah,
            tanggal_pencacah=current_timestamp,
            nama_pemberi_jawaban=nama_pemberi_jawaban,
            hp_pemberi_jawaban=hp_pemberi_jawaban,
            tanggal_pemberi_jawaban=current_timestamp,
            catatan=catatan or ''
        )
        
        db.session.add(keluarga)
        db.session.flush()  # Get the ID
        
        # Create Individu records
        members_created = 0
        for member_data in keluarga_data.get('all_members_data', []):
            individu = Individu(
                keluarga_id=keluarga.id,
                anggota_ke=member_data.get('anggota_ke', 1),
                nama_anggota=member_data.get('nama_anggota', ''),
                umur=member_data.get('umur', 0),
                hubungan_kepala=member_data.get('hubungan_kepala', ''),
                jenis_kelamin=member_data.get('jenis_kelamin', ''),
                status_perkawinan=member_data.get('status_perkawinan', ''),
                pendidikan_terakhir=member_data.get('pendidikan_terakhir', ''),
                kegiatan_sehari=member_data.get('kegiatan_sehari', ''),
                memiliki_pekerjaan=member_data.get('memiliki_pekerjaan', ''),
                status_pekerjaan_diinginkan=member_data.get('status_pekerjaan_diinginkan', ''),
                bidang_usaha_diminati=member_data.get('bidang_usaha_diminati', ''),
                bidang_pekerjaan=member_data.get('bidang_pekerjaan', ''),
                memiliki_lebih_satu_pekerjaan=member_data.get('memiliki_lebih_satu_pekerjaan', ''),
                status_pekerjaan_utama=member_data.get('status_pekerjaan_utama', ''),
                pemasaran_usaha_utama=member_data.get('pemasaran_usaha_utama', ''),
                penjualan_marketplace_utama=member_data.get('penjualan_marketplace_utama', ''),
                bidang_pekerjaan_sampingan1=member_data.get('bidang_pekerjaan_sampingan1', ''),
                status_pekerjaan_sampingan1=member_data.get('status_pekerjaan_sampingan1', ''),
                pemasaran_usaha_sampingan1=member_data.get('pemasaran_usaha_sampingan1', ''),
                penjualan_marketplace_sampingan1=member_data.get('penjualan_marketplace_sampingan1', ''),
                bidang_pekerjaan_sampingan2=member_data.get('bidang_pekerjaan_sampingan2', ''),
                status_pekerjaan_sampingan2=member_data.get('status_pekerjaan_sampingan2', ''),
                pemasaran_usaha_sampingan2=member_data.get('pemasaran_usaha_sampingan2', ''),
                penjualan_marketplace_sampingan2=member_data.get('penjualan_marketplace_sampingan2', '')
            )
            
            db.session.add(individu)
            members_created += 1
        
        # Commit all changes
        db.session.commit()

        # Clear session
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)

        return redirect(url_for('main.index', success=f'Semua data berhasil disimpan! Total {members_created} anggota keluarga tersimpan.', clear='true'))

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"ERROR in submit_final: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.final_page', error=f'Error: {str(e)}'))

@bp.route('/download-excel')
@login_required
@admin_required
def download_excel():
    try:
        keluarga_list = Keluarga.query.all()
        if not keluarga_list:
            return redirect(url_for('main.dashboard', error='No data found'))
        
        all_rows = []
        for keluarga in keluarga_list:
            head_row = {
                'Timestamp': keluarga.tanggal_pencacah or '',
                'ID Keluarga': keluarga.keluarga_id,
                'RT': keluarga.rt,
                'RW': keluarga.rw,
                'Dusun': keluarga.dusun,
                'Nama Kepala Keluarga': keluarga.nama_kepala,
                'Alamat': keluarga.alamat,
                'Jumlah Anggota Keluarga': keluarga.jumlah_anggota,
                'Jumlah Anggota Usia 15+': keluarga.jumlah_anggota_15plus,
                'Anggota Ke': 1,
                'Nama Anggota': keluarga.nama_kepala,
                'Umur': '',
                'Hubungan dengan Kepala Keluarga': 'Kepala Keluarga',
                'Jenis Kelamin': '',
                'Status Perkawinan': '',
                'Pendidikan Terakhir': '',
                'Kegiatan Sehari-hari': '',
                'Apakah Memiliki Pekerjaan': '',
                'Status Pekerjaan yang Diinginkan': '',
                'Bidang Usaha yang Diminati': '',
                'Bidang Pekerjaan': '',
                'Status Pekerjaan Utama': '',
                'Pemasaran Usaha Utama': '',
                'Penjualan Marketplace Utama': '',
                'Bidang Pekerjaan Sampingan 1': '',
                'Status Pekerjaan Sampingan 1': '',
                'Pemasaran Usaha Sampingan 1': '',
                'Penjualan Marketplace Sampingan 1': '',
                'Bidang Pekerjaan Sampingan 2': '',
                'Status Pekerjaan Sampingan 2': '',
                'Pemasaran Usaha Sampingan 2': '',
                'Penjualan Marketplace Sampingan 2': '',
                'Memiliki Lebih dari Satu Pekerjaan': '',
                'Nama Pencacah': keluarga.nama_pencacah,
                'HP Pencacah': keluarga.hp_pencacah,
                'Tanggal Pencacah': keluarga.tanggal_pencacah,
                'Nama Pemberi Jawaban': keluarga.nama_pemberi_jawaban,
                'HP Pemberi Jawaban': keluarga.hp_pemberi_jawaban,
                'Tanggal Pemberi Jawaban': keluarga.tanggal_pemberi_jawaban,
                'Catatan': keluarga.catatan or ''
            }
            all_rows.append(head_row)
            for individu in keluarga.anggota:
                member_row = {
                    'Timestamp': keluarga.tanggal_pencacah or '',
                    'ID Keluarga': keluarga.keluarga_id,
                    'RT': keluarga.rt,
                    'RW': keluarga.rw,
                    'Dusun': keluarga.dusun,
                    'Nama Kepala Keluarga': keluarga.nama_kepala,
                    'Alamat': keluarga.alamat,
                    'Jumlah Anggota Keluarga': keluarga.jumlah_anggota,
                    'Jumlah Anggota Usia 15+': keluarga.jumlah_anggota_15plus,
                    'Anggota Ke': individu.anggota_ke,
                    'Nama Anggota': individu.nama_anggota,
                    'Umur': individu.umur,
                    'Hubungan dengan Kepala Keluarga': individu.hubungan_kepala,
                    'Jenis Kelamin': individu.jenis_kelamin,
                    'Status Perkawinan': individu.status_perkawinan,
                    'Pendidikan Terakhir': individu.pendidikan_terakhir,
                    'Kegiatan Sehari-hari': individu.kegiatan_sehari,
                    'Apakah Memiliki Pekerjaan': individu.memiliki_pekerjaan,
                    'Status Pekerjaan yang Diinginkan': individu.status_pekerjaan_diinginkan or '',
                    'Bidang Usaha yang Diminati': individu.bidang_usaha_diminati or '',
                    'Bidang Pekerjaan': individu.bidang_pekerjaan or '',
                    'Status Pekerjaan Utama': individu.status_pekerjaan_utama or '',
                    'Pemasaran Usaha Utama': individu.pemasaran_usaha_utama or '',
                    'Penjualan Marketplace Utama': individu.penjualan_marketplace_utama or '',
                    'Bidang Pekerjaan Sampingan 1': individu.bidang_pekerjaan_sampingan1 or '',
                    'Status Pekerjaan Sampingan 1': individu.status_pekerjaan_sampingan1 or '',
                    'Pemasaran Usaha Sampingan 1': individu.pemasaran_usaha_sampingan1 or '',
                    'Penjualan Marketplace Sampingan 1': individu.penjualan_marketplace_sampingan1 or '',
                    'Bidang Pekerjaan Sampingan 2': individu.bidang_pekerjaan_sampingan2 or '',
                    'Status Pekerjaan Sampingan 2': individu.status_pekerjaan_sampingan2 or '',
                    'Pemasaran Usaha Sampingan 2': individu.pemasaran_usaha_sampingan2 or '',
                    'Penjualan Marketplace Sampingan 2': individu.penjualan_marketplace_sampingan2 or '',
                    'Memiliki Lebih dari Satu Pekerjaan': individu.memiliki_lebih_satu_pekerjaan or '',
                    'Nama Pencacah': keluarga.nama_pencacah,
                    'HP Pencacah': keluarga.hp_pencacah,
                    'Tanggal Pencacah': keluarga.tanggal_pencacah,
                    'Nama Pemberi Jawaban': keluarga.nama_pemberi_jawaban,
                    'HP Pemberi Jawaban': keluarga.hp_pemberi_jawaban,
                    'Tanggal Pemberi Jawaban': keluarga.tanggal_pemberi_jawaban,
                    'Catatan': keluarga.catatan or ''
                }
                all_rows.append(member_row)
        
        df = pd.DataFrame(all_rows)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            df.to_excel(tmp.name, index=False)
            tmp_path = tmp.name
        
        download_name = f"data_sensus_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return send_file(
            tmp_path,
            as_attachment=True,
            download_name=download_name,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        current_app.logger.error(f"ERROR in download_excel: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return redirect(url_for('main.dashboard', error=str(e)))


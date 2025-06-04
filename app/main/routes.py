from flask import render_template, request, jsonify, redirect, url_for, session, send_file, current_app
from app.main import bp
from app.models import Keluarga, Individu
from app import db
from datetime import datetime
from functools import wraps
from io import BytesIO
import pandas as pd
import os
import tempfile
import json

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('auth.login'))
        
        # Check session timeout
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            timeout = current_app.config['SESSION_TIMEOUT']
            if (datetime.now() - last_activity).total_seconds() > timeout:
                session.clear()
                return redirect(url_for('auth.login', message='Session expired'))
        
        # Update last activity
        session['last_activity'] = datetime.now().isoformat()
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


@bp.route('/')
def home():
    return redirect(url_for('auth.login'))

@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('main/dashboard.html')

@bp.route('/index')
@login_required
def index():
    return render_template('main/index.html')

@bp.route('/back-to-index')
@login_required
def back_to_index():
    """Route to go back to index and clear session data"""
    session.pop('keluarga_data', None)
    session.pop('individu_data', None)
    return redirect(url_for('main.index') + '?clear=true')

@bp.route('/edit-keluarga')
@login_required
def edit_keluarga():
    """Route to edit family data"""
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    return render_template('main/edit-keluarga.html', keluarga_data=keluarga_data)

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
    
    return render_template('main/edit-anggota.html', 
                         keluarga_data=keluarga_data, 
                         member_data=member_data,
                         member_index=member_index)

@bp.route('/submit', methods=['POST'])
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

        timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
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
            'original_jumlah_anggota_15plus': jumlah_anggota_15plus,
            'anggota_count': 0,
            'timestamp': timestamp,
            'all_members_data': []
        }
        
        # If there are members aged 15+, redirect to member input
        if jumlah_anggota_15plus > 0:
            return jsonify({
                'success': True,
                'message': 'Data keluarga berhasil disimpan. Lanjutkan ke input anggota keluarga.',
                'redirect': True,
                'redirect_url': url_for('main.lanjutan')
            })
        else:
            # No members 15+, go directly to final page
            return jsonify({
                'success': True,
                'message': 'Data keluarga berhasil disimpan. Lanjutkan ke halaman akhir.',
                'redirect': True,
                'redirect_url': url_for('main.final_page')
            })
            
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

@bp.route('/lanjutan')
@login_required
def lanjutan():
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    return render_template('main/lanjutan.html', keluarga_data=keluarga_data)

@bp.route('/pekerjaan')
@login_required
def pekerjaan():
    if 'keluarga_data' not in session or 'individu_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    individu_data = session['individu_data']
    return render_template('main/pekerjaan.html', keluarga_data=keluarga_data, individu_data=individu_data)

@bp.route('/final')
@login_required
def final_page():
    if 'keluarga_data' not in session:
        return redirect(url_for('main.index'))
    
    keluarga_data = session['keluarga_data']
    return render_template('main/final.html', keluarga_data=keluarga_data)

@bp.route('/submit-individu', methods=['POST'])
@login_required
def submit_individu():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400
        
        keluarga_data = session['keluarga_data']
        
        # Collect individual data from form - matching database field names
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
            return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400
        
        try:
            umur_int = int(umur)
        except ValueError:
            return jsonify({'success': False, 'message': 'Usia harus berupa angka'}), 400
        
        if umur_int < 15:
            return jsonify({'success': False, 'message': 'Usia minimal 15 tahun'}), 400
        
        # Increment anggota_count
        keluarga_data['anggota_count'] = keluarga_data.get('anggota_count', 0) + 1
        
        # Create individu data with database field names
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
            return jsonify({
                'success': True,
                'message': 'Data berhasil disimpan. Lanjutkan ke input data pekerjaan.',
                'redirect': True,
                'redirect_url': url_for('main.pekerjaan')
            })
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
                return jsonify({
                    'success': True,
                    'message': 'Data berhasil disimpan. Lanjutkan ke anggota berikutnya.',
                    'remaining': keluarga_data['jumlah_anggota_15plus'],
                    'continue_next_member': True
                })
            else:
                return jsonify({
                    'success': True,
                    'message': 'Semua data anggota berhasil disimpan. Lanjutkan ke halaman akhir.',
                    'redirect': True,
                    'redirect_url': url_for('main.final_page')
                })
        
    except Exception as e:
        print(f"ERROR in submit_individu: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@bp.route('/submit-pekerjaan', methods=['POST'])
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

        # Build member data with job information using database field names
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
        member_data['bidang_pekerjaan'] = form_data.get('bidang_pekerjaan', '')

        # Add multiple jobs info
        member_data['memiliki_lebih_satu_pekerjaan'] = form_data.get('lebih_dari_satu_pekerjaan', 'Tidak')

        # Process main job (index 0)
        main_job_status = form_data.get('status_pekerjaan_0', '')
        if not main_job_status:
            return jsonify({'success': False, 'message': 'Status pekerjaan utama harus diisi'}), 400
        
        member_data.update({
            'status_pekerjaan_utama': main_job_status,
            'pemasaran_usaha_utama': form_data.get('pemasaran_usaha_0', ''),
            'penjualan_marketplace_utama': form_data.get('penjualan_marketplace_0', ''),
        })

        # Process side jobs (up to 2 side jobs)
        for i in range(1, 3):  # Side jobs 1 and 2
            member_data.update({
                f'bidang_pekerjaan_sampingan{i}': form_data.get(f'bidang_pekerjaan_{i}', ''),
                f'status_pekerjaan_sampingan{i}': form_data.get(f'status_pekerjaan_{i}', ''),
                f'pemasaran_usaha_sampingan{i}': form_data.get(f'pemasaran_usaha_{i}', ''),
                f'penjualan_marketplace_sampingan{i}': form_data.get(f'penjualan_marketplace_{i}', ''),
            })

        # Add to all_members_data
        keluarga_data['all_members_data'].append(member_data)
        
        # Decrease remaining members count
        keluarga_data['jumlah_anggota_15plus'] -= 1
        session['keluarga_data'] = keluarga_data

        # Remove individual data from session
        session.pop('individu_data', None)

        # Check if there are more members to process
        if keluarga_data['jumlah_anggota_15plus'] > 0:
            return jsonify({
                'success': True,
                'message': 'Data pekerjaan berhasil disimpan. Lanjutkan ke anggota berikutnya.',
                'redirect': True,
                'redirect_url': url_for('main.lanjutan')
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Semua data berhasil disimpan. Lanjutkan ke halaman akhir.',
                'redirect': True,
                'redirect_url': url_for('main.final_page')
            })

    except Exception as e:
        print(f"ERROR in submit_pekerjaan: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@bp.route('/edit-member', methods=['POST'])
@login_required
def edit_member():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        keluarga_data = session['keluarga_data']
        
        # Get data from JSON request
        data = request.get_json()
        member_index = int(data.get('memberIndex'))
        
        if member_index < 0 or member_index >= len(keluarga_data['all_members_data']):
            return jsonify({'success': False, 'message': 'Index anggota tidak valid'}), 400

        # Update member data
        member_data = keluarga_data['all_members_data'][member_index]
        
        # Update basic info
        member_data['nama_anggota'] = data.get('nama_anggota', '')
        member_data['umur'] = int(data.get('umur', 0))
        member_data['jenis_kelamin'] = data.get('jenis_kelamin', '')
        member_data['hubungan_kepala'] = data.get('hubungan_kepala', '')
        member_data['status_perkawinan'] = data.get('status_perkawinan', '')
        member_data['pendidikan_terakhir'] = data.get('pendidikan_terakhir', '')
        member_data['kegiatan_sehari'] = data.get('kegiatan_sehari', '')
        member_data['memiliki_pekerjaan'] = data.get('memiliki_pekerjaan', '')

        # Update job-related fields based on memiliki_pekerjaan
        if member_data['memiliki_pekerjaan'] == 'Tidak':
            # Clear job fields and update no-job fields
            member_data.update({
                'status_pekerjaan_diinginkan': data.get('status_pekerjaan_diinginkan', ''),
                'bidang_usaha_diminati': data.get('bidang_usaha_diminati', ''),
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
                'bidang_pekerjaan': data.get('bidang_pekerjaan', ''),
                'memiliki_lebih_satu_pekerjaan': data.get('memiliki_lebih_satu_pekerjaan', 'Tidak'),
                'status_pekerjaan_utama': data.get('status_pekerjaan_utama', ''),
                'pemasaran_usaha_utama': data.get('pemasaran_usaha_utama', ''),
                'penjualan_marketplace_utama': data.get('penjualan_marketplace_utama', ''),
                'bidang_pekerjaan_sampingan1': data.get('bidang_pekerjaan_sampingan1', ''),
                'status_pekerjaan_sampingan1': data.get('status_pekerjaan_sampingan1', ''),
                'pemasaran_usaha_sampingan1': data.get('pemasaran_usaha_sampingan1', ''),
                'penjualan_marketplace_sampingan1': data.get('penjualan_marketplace_sampingan1', ''),
                'bidang_pekerjaan_sampingan2': data.get('bidang_pekerjaan_sampingan2', ''),
                'status_pekerjaan_sampingan2': data.get('status_pekerjaan_sampingan2', ''),
                'pemasaran_usaha_sampingan2': data.get('pemasaran_usaha_sampingan2', ''),
                'penjualan_marketplace_sampingan2': data.get('penjualan_marketplace_sampingan2', ''),
            })

        # Update session
        session['keluarga_data'] = keluarga_data

        return jsonify({'success': True, 'message': 'Data anggota berhasil diperbarui'})

    except Exception as e:
        print(f"ERROR in edit_member: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@bp.route('/edit-family', methods=['POST'])
@login_required
def edit_family():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        keluarga_data = session['keluarga_data']
        
        # Get current member count
        current_member_count = len(keluarga_data.get('all_members_data', []))
        
        # Update family data
        keluarga_data['dusun'] = request.form.get('dusun', '')
        keluarga_data['rt'] = request.form.get('rt', '')
        keluarga_data['rw'] = request.form.get('rw', '')
        keluarga_data['nama_kepala'] = request.form.get('nama_kepala', '')
        keluarga_data['alamat'] = request.form.get('alamat', '')
        keluarga_data['jumlah_anggota'] = int(request.form.get('jumlah_anggota', 0))
        
        # Handle member count changes
        new_member_count = int(request.form.get('jumlah_anggota_15plus', 0))
        
        if new_member_count < current_member_count:
            # Remove excess members
            keluarga_data['all_members_data'] = keluarga_data['all_members_data'][:new_member_count]
        elif new_member_count > current_member_count:
            # Set up for adding new members
            keluarga_data['jumlah_anggota_15plus'] = new_member_count - current_member_count
            keluarga_data['anggota_count'] = current_member_count
        
        # Update original count
        keluarga_data['original_jumlah_anggota_15plus'] = new_member_count

        # Update session
        session['keluarga_data'] = keluarga_data

        return jsonify({'success': True, 'message': 'Data keluarga berhasil diperbarui'})

    except Exception as e:
        print(f"ERROR in edit_family: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@bp.route('/submit-final', methods=['POST'])
@login_required
def submit_final():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        keluarga_data = session['keluarga_data']
        
        # Debug logging
        print(f"DEBUG: Keluarga data: {keluarga_data}")
        print(f"DEBUG: All members data: {keluarga_data.get('all_members_data', [])}")
        
        # Get surveyor and respondent information
        nama_pencacah = request.form.get('nama_pencacah')
        hp_pencacah = request.form.get('hp_pencacah')
        nama_pemberi_jawaban = request.form.get('nama_pemberi_jawaban')
        hp_pemberi_jawaban = request.form.get('hp_pemberi_jawaban')
        catatan = request.form.get('catatan')
        
        # Validate required fields
        if not all([nama_pencacah, hp_pencacah, nama_pemberi_jawaban, hp_pemberi_jawaban]):
            return jsonify({'success': False, 'message': 'Semua field harus diisi'}), 400

        # Set current timestamp
        current_timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        
        # Check if keluarga already exists
        existing_keluarga = Keluarga.query.filter_by(keluarga_id=keluarga_data['keluarga_id']).first()
        if existing_keluarga:
            return jsonify({'success': False, 'message': 'Data keluarga sudah ada di database'}), 400
        
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
        
        print(f"DEBUG: Creating Keluarga: {keluarga}")
        
        db.session.add(keluarga)
        db.session.flush()  # Get the ID
        
        print(f"DEBUG: Keluarga ID after flush: {keluarga.id}")
        
        # Create Individu records using database field names
        members_created = 0
        for member_data in keluarga_data.get('all_members_data', []):
            print(f"DEBUG: Processing member: {member_data}")
            
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
            
            print(f"DEBUG: Creating Individu: {individu}")
            db.session.add(individu)
            members_created += 1
        
        print(f"DEBUG: Total members created: {members_created}")
        
        # Commit all changes
        db.session.commit()
        print("DEBUG: Database commit successful")

        # Clear session
        session.pop('keluarga_data', None)
        session.pop('individu_data', None)

        return jsonify({
            'success': True,
            'message': f'Semua data berhasil disimpan! Total {members_created} anggota keluarga tersimpan.',
            'redirect': True,
            'redirect_url': url_for('main.index') + '?clear=true'
        })

    except Exception as e:
        db.session.rollback()
        print(f"ERROR in submit_final: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@bp.route('/download-excel')
@login_required
@admin_required
def download_excel():
    try:
        keluarga_list = Keluarga.query.all()
        if not keluarga_list:
            return jsonify({'error': 'No data found'}), 404
        
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
        return jsonify({'error': str(e)}), 500

@bp.route('/get-form-data')
@login_required
def get_form_data():
    """Get saved form data from session"""
    if 'keluarga_data' in session and session['keluarga_data'].get('anggota_count', 0) > 0:
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
        return jsonify({'form_data': None})

@bp.route('/debug-session')
@login_required
def debug_session():
    """Debug route to check session data"""
    return jsonify({
        'keluarga_data': session.get('keluarga_data'),
        'individu_data': session.get('individu_data'),
        'session_keys': list(session.keys())
    })

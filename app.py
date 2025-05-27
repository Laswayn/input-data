from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session
import pandas as pd
import os
from datetime import datetime
import secrets
import json

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Create static/Excel folder if it doesn't exist
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
EXCEL_FOLDER = os.path.join(STATIC_FOLDER, 'Excel')
SIGNATURES_FOLDER = os.path.join(STATIC_FOLDER, 'signatures')
os.makedirs(EXCEL_FOLDER, exist_ok=True)
os.makedirs(SIGNATURES_FOLDER, exist_ok=True)

EXCEL_FILENAME = 'data_sensus.xlsx'
EXCEL_FILE = os.path.join(EXCEL_FOLDER, EXCEL_FILENAME)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    try:
        # Get form data
        rt = request.form.get('rt')
        rw = request.form.get('rw')
        dusun = request.form.get('dusun')
        nama_kepala = request.form.get('nama_kepala')
        alamat = request.form.get('alamat')
        jumlah_anggota = request.form.get('jumlah_anggota')
        jumlah_anggota_15plus = request.form.get('jumlah_anggota_15plus')
        
        # Print received data for debugging
        print("Received data:", request.form)

        # Get surveyor information
        nama_pencacah = request.form.get('nama_pencacah')
        hp_pencacah = request.form.get('hp_pencacah')
        tanggal_pencacah = request.form.get('tanggal_pencacah')
        ttd_pencacah = request.files.get('ttd_pencacah')  # Tanda tangan tidak wajib
        
        nama_pemeriksa = request.form.get('nama_pemeriksa')
        hp_pemeriksa = request.form.get('hp_pemeriksa')
        tanggal_pemeriksa = request.form.get('tanggal_pemeriksa')
        ttd_pemeriksa = request.files.get('ttd_pemeriksa')  # Tanda tangan tidak wajib
        
        nama_pemberi_jawaban = request.form.get('nama_pemberi_jawaban')
        hp_pemberi_jawaban = request.form.get('hp_pemberi_jawaban')
        tanggal_pemberi_jawaban = request.form.get('tanggal_pemberi_jawaban')
        ttd_pemberi_jawaban = request.files.get('ttd_pemberi_jawaban')  # Tanda tangan tidak wajib
        
        catatan = request.form.get('catatan')
        
        # Server-side validation
        if not all([rt, rw, dusun, nama_kepala, alamat, jumlah_anggota, jumlah_anggota_15plus,
                     nama_pencacah, hp_pencacah, tanggal_pencacah,
                     nama_pemeriksa, hp_pemeriksa, tanggal_pemeriksa,
                     nama_pemberi_jawaban, hp_pemberi_jawaban, tanggal_pemberi_jawaban]):
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
        
        # ... (rest of the code)


        timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        keluarga_id = f"KEL-{rt}{rw}-{datetime.now().strftime('%d%m%Y%H%M%S')}"
        
        # Save signature images
        signature_paths = {}
        for role, file, nama in [
            ('pencacah', ttd_pencacah, nama_pencacah),
            ('pemeriksa', ttd_pemeriksa, nama_pemeriksa),
            ('pemberi_jawaban', ttd_pemberi_jawaban, nama_pemberi_jawaban)
        ]:
            if file:
                filename = f'ttd_{role}.jpg'
                filepath = os.path.join(SIGNATURES_FOLDER, filename)
                file.save(filepath)
                signature_paths[role] = filepath

        
        # Data for the head of family (first row)
        new_data = {
            'Timestamp': timestamp,
            'ID Keluarga': keluarga_id,
            'RT': rt,
            'RW': rw,
            'Dusun': dusun,
            'Nama Kepala Keluarga': nama_kepala,
            'Alamat': alamat,
            'Jumlah Anggota Keluarga': jumlah_anggota,
            'Jumlah Anggota Usia 15+': jumlah_anggota_15plus,
            'Anggota Ke': 1, 
            'Nama Anggota': nama_kepala,
            'Umur': '', 
            'Hubungan dengan Kepala Keluarga': 'Kepala Keluarga',
            'Jenis Kelamin': '', 
            'Status Perkawinan': '',  
            'Pendidikan Terakhir': '',  
            'Kegiatan Sehari-hari': '',
            'Apakah Memiliki Pekerjaan': '',
            'Status Pekerjaan yang Diinginkan': '',
            'Bidang Usaha yang Diminati': '',
            # Pekerjaan Utama
            'Status Pekerjaan Utama': '',
            'Pemasaran Usaha Utama': '',
            'Penjualan Marketplace Utama': '',
            'Status Pekerjaan Diinginkan Utama': '',
            'Bidang Usaha Utama': '',
            # Pekerjaan Sampingan 1
            'Status Pekerjaan Sampingan 1': '',
            'Pemasaran Usaha Sampingan 1': '',
            'Penjualan Marketplace Sampingan 1': '',
            'Status Pekerjaan Diinginkan Sampingan 1': '',
            'Bidang Usaha Sampingan 1': '',
            # Pekerjaan Sampingan 2
            'Status Pekerjaan Sampingan 2': '',
            'Pemasaran Usaha Sampingan 2': '',
            'Penjualan Marketplace Sampingan 2': '',
            'Status Pekerjaan Diinginkan Sampingan 2': '',
            'Bidang Usaha Sampingan 2': '',
            # Info tambahan
            'Memiliki Lebih dari Satu Pekerjaan': '',
            # Surveyor information
            'Nama Pencacah': nama_pencacah,
            'HP Pencacah': hp_pencacah,
            'Tanggal Pencacah': tanggal_pencacah,
            'TTD Pencacah': signature_paths.get('pencacah', ''),
            'Nama Pemeriksa': nama_pemeriksa,
            'HP Pemeriksa': hp_pemeriksa,
            'Tanggal Pemeriksa': tanggal_pemeriksa,
            'TTD Pemeriksa': signature_paths.get('pemeriksa', ''),
            'Nama Pemberi Jawaban': nama_pemberi_jawaban,
            'HP Pemberi Jawaban': hp_pemberi_jawaban,
            'Tanggal Pemberi Jawaban': tanggal_pemberi_jawaban,
            'TTD Pemberi Jawaban': signature_paths.get('pemberi_jawaban', ''),
            'Catatan': catatan or ''
        }
        
        try:
            if os.path.exists(EXCEL_FILE):
                try:
                    df = pd.read_excel(EXCEL_FILE)
                    df = pd.concat([df, pd.DataFrame([new_data])], ignore_index=True)
                except PermissionError:
                    return jsonify({
                        'success': False, 
                        'message': 'File Excel sedang digunakan oleh program lain. Tutup file dan coba lagi.'
                    }), 500
            else:
                # Create new DataFrame if file doesn't exist
                df = pd.DataFrame([new_data])
            
            # Save to Excel
            df.to_excel(EXCEL_FILE, index=False)
            
            # If there are members aged 15+, redirect to next form
            if jumlah_anggota_15plus > 0:
                # Save data to session
                session['keluarga_data'] = {
                    'keluarga_id': keluarga_id,
                    'rt': rt,
                    'rw': rw,
                    'dusun': dusun,
                    'nama_kepala': nama_kepala,
                    'alamat': alamat,
                    'jumlah_anggota': jumlah_anggota,
                    'jumlah_anggota_15plus': jumlah_anggota_15plus,
                    'anggota_count': 1,
                    # Add surveyor information to session
                    'nama_pencacah': nama_pencacah,
                    'hp_pencacah': hp_pencacah,
                    'tanggal_pencacah': tanggal_pencacah,
                    'ttd_pencacah': signature_paths.get('pencacah', ''),
                    'nama_pemeriksa': nama_pemeriksa,
                    'hp_pemeriksa': hp_pemeriksa,
                    'tanggal_pemeriksa': tanggal_pemeriksa,
                    'ttd_pemeriksa': signature_paths.get('pemeriksa', ''),
                    'nama_pemberi_jawaban': nama_pemberi_jawaban,
                    'hp_pemberi_jawaban': hp_pemberi_jawaban,
                    'tanggal_pemberi_jawaban': tanggal_pemberi_jawaban,
                    'ttd_pemberi_jawaban': signature_paths.get('pemberi_jawaban', ''),
                    'catatan': catatan
                }
                
                return jsonify({
                    'success': True,
                    'message' :("Validasi berhasil, melanjutkan ke penyimpanan..."),
                    'redirect': True,
                    'redirect_url': url_for('lanjutan')
                })
            
            # If no members aged 15+, return normal response
            return jsonify({
                'success': True, 
                'message': 'Data berhasil disimpan',
                'download_url': f'/download/{EXCEL_FILENAME}'
            })
            
        except PermissionError as pe:
            error_msg = f"Permission denied: {str(pe)}. Pastikan folder memiliki izin tulis dan file tidak sedang dibuka."
            print(error_msg)
            return jsonify({'success': False, 'message': error_msg}), 500
            
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

@app.route('/lanjutan')
def lanjutan():
    # Check if family data exists in session
    if 'keluarga_data' not in session:
        return redirect(url_for('index'))
    
    keluarga_data = session['keluarga_data']
    return render_template('lanjutan.html', keluarga_data=keluarga_data)

@app.route('/pekerjaan')
def pekerjaan():
    # Check if family and individual data exist in session
    if 'keluarga_data' not in session or 'individu_data' not in session:
        return redirect(url_for('index'))
    
    keluarga_data = session['keluarga_data']
    individu_data = session['individu_data']
    return render_template('pekerjaan.html', keluarga_data=keluarga_data, individu_data=individu_data)


@app.route('/submit-individu', methods=['POST'])
def submit_individu():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400
        
        keluarga_data = session['keluarga_data']
        
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
        session['keluarga_data'] = keluarga_data
        
        # Check if this person needs to go to pekerjaan page
        # Only if 5.10 = "Ya" (memiliki pekerjaan) or if any of 5.7, 5.8, 5.9 is "Ya"
        needs_pekerjaan_page = (
            memiliki_pekerjaan == 'Ya'
        )
        
        if needs_pekerjaan_page:
            # Store individual data temporarily in session for pekerjaan page
            session['individu_data'] = {
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
                'Anggota Ke': keluarga_data['anggota_count'],
                'Timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # Redirect to pekerjaan input
            return jsonify({
            'success': True,
            'message': 'Data individu berhasil disimpan di sesi. Silakan lanjutkan input pekerjaan.',
            'redirect_to_pekerjaan': True,
            'redirect_url': url_for('pekerjaan') 
        }) 

        else:
            # Save directly to Excel without going to pekerjaan page
            row_data = {
                'Timestamp': datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                'ID Keluarga': keluarga_data['keluarga_id'],
                'RT': keluarga_data['rt'],
                'RW': keluarga_data['rw'],
                'Dusun': keluarga_data['dusun'],
                'Nama Kepala Keluarga': keluarga_data['nama_kepala'],
                'Alamat': keluarga_data['alamat'],
                'Jumlah Anggota Keluarga': keluarga_data['jumlah_anggota'],
                'Jumlah Anggota Usia 15+': keluarga_data['jumlah_anggota_15plus'],
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
                # Empty pekerjaan fields since no job details needed
                'Status Pekerjaan Utama': '',
                'Pemasaran Usaha Utama': '',
                'Penjualan Marketplace Utama': '',
                'Status Pekerjaan Diinginkan Utama': '',
                'Bidang Usaha Utama': '',
                'Status Pekerjaan Sampingan 1': '',
                'Pemasaran Usaha Sampingan 1': '',
                'Penjualan Marketplace Sampingan 1': '',
                'Status Pekerjaan Diinginkan Sampingan 1': '',
                'Bidang Usaha Sampingan 1': '',
                'Status Pekerjaan Sampingan 2': '',
                'Pemasaran Usaha Sampingan 2': '',
                'Penjualan Marketplace Sampingan 2': '',
                'Status Pekerjaan Diinginkan Sampingan 2': '',
                'Bidang Usaha Sampingan 2': '',
                'Memiliki Lebih dari Satu Pekerjaan': '',
                # Add surveyor information
                'Nama Pencacah': keluarga_data['nama_pencacah'],
                'HP Pencacah': keluarga_data['hp_pencacah'],
                'Tanggal Pencacah': keluarga_data['tanggal_pencacah'],
                'TTD Pencacah': keluarga_data['ttd_pencacah'],
                'Nama Pemeriksa': keluarga_data['nama_pemeriksa'],
                'HP Pemeriksa': keluarga_data['hp_pemeriksa'],
                'Tanggal Pemeriksa': keluarga_data['tanggal_pemeriksa'],
                'TTD Pemeriksa': keluarga_data['ttd_pemeriksa'],
                'Nama Pemberi Jawaban': keluarga_data['nama_pemberi_jawaban'],
                'HP Pemberi Jawaban': keluarga_data['hp_pemberi_jawaban'],
                'Tanggal Pemberi Jawaban': keluarga_data['tanggal_pemberi_jawaban'],
                'TTD Pemberi Jawaban': keluarga_data['ttd_pemberi_jawaban'],
                'Catatan': keluarga_data['catatan']
            }
            
            # Save to Excel
            try:
                if os.path.exists(EXCEL_FILE):
                    try:
                        df = pd.read_excel(EXCEL_FILE)
                        df = pd.concat([df, pd.DataFrame([row_data])], ignore_index=True)
                    except PermissionError:
                        return jsonify({
                            'success': False,
                            'message': 'File Excel sedang digunakan oleh program lain. Tutup file dan coba lagi.'
                        }), 500
                else:
                    df = pd.DataFrame([row_data])

                df.to_excel(EXCEL_FILE, index=False)

            except Exception as e:
                return jsonify({'success': False, 'message': f'Error saving to Excel: {str(e)}'}), 500

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
                # All members processed, clear session
                session.pop('keluarga_data', None)
                return jsonify({
                    'success': True,
                    'message': 'Semua data berhasil disimpan. Terima kasih.',
                    'complete': True,
                    'redirect_url': url_for('index')
                })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/submit-pekerjaan', methods=['POST'])
def submit_pekerjaan():
    try:
        if 'keluarga_data' not in session:
            return jsonify({'success': False, 'message': 'Data keluarga tidak ditemukan'}), 400

        if 'individu_data' not in session:
            return jsonify({'success': False, 'message': 'Data individu tidak ditemukan, submit individu terlebih dahulu'}), 400

        keluarga_data = session['keluarga_data']
        individu_data = session['individu_data']
        form_data = request.form.to_dict()

        # Build single row with all job data
        row_data = {
            'Timestamp': datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            'ID Keluarga': keluarga_data['keluarga_id'],
            'RT': keluarga_data['rt'],
            'RW': keluarga_data['rw'],
            'Dusun': keluarga_data['dusun'],
            'Nama Kepala Keluarga': keluarga_data['nama_kepala'],
            'Alamat': keluarga_data['alamat'],
            'Jumlah Anggota Keluarga': keluarga_data['jumlah_anggota'],
            'Jumlah Anggota Usia 15+': keluarga_data['jumlah_anggota_15plus'],
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
            # Add surveyor information
            'Nama Pencacah': keluarga_data['nama_pencacah'],
            'HP Pencacah': keluarga_data['hp_pencacah'],
            'Tanggal Pencacah': keluarga_data['tanggal_pencacah'],
            'TTD Pencacah': keluarga_data['ttd_pencacah'],
            'Nama Pemeriksa': keluarga_data['nama_pemeriksa'],
            'HP Pemeriksa': keluarga_data['hp_pemeriksa'],
            'Tanggal Pemeriksa': keluarga_data['tanggal_pemeriksa'],
            'TTD Pemeriksa': keluarga_data['ttd_pemeriksa'],
            'Nama Pemberi Jawaban': keluarga_data['nama_pemberi_jawaban'],
            'HP Pemberi Jawaban': keluarga_data['hp_pemberi_jawaban'],
            'Tanggal Pemberi Jawaban': keluarga_data['tanggal_pemberi_jawaban'],
            'TTD Pemberi Jawaban': keluarga_data['ttd_pemberi_jawaban'],
            'Catatan': keluarga_data['catatan']
        }

        # Add multiple jobs info
        row_data['Memiliki Lebih dari Satu Pekerjaan'] = form_data.get('lebih_dari_satu_pekerjaan', 'Tidak')

        # Process main job (index 0)
        main_job_status = form_data.get('status_pekerjaan_0', '')
        if not main_job_status:
            return jsonify({'success': False, 'message': 'Status pekerjaan utama harus diisi'}), 400
        
        row_data.update({
            'Status Pekerjaan Utama': main_job_status,
            'Pemasaran Usaha Utama': form_data.get('pemasaran_usaha_0', ''),
            'Penjualan Marketplace Utama': form_data.get('penjualan_marketplace_0', ''),
            'Status Pekerjaan Diinginkan Utama': form_data.get('status_pekerjaan_diinginkan_0', ''),
            'Bidang Usaha Utama': form_data.get('bidang_usaha_0', ''),
        })

        # Process side jobs (up to 2 side jobs)
        for i in range(1, 3):  # Side jobs 1 and 2
            row_data.update({
                f'Status Pekerjaan Sampingan {i}': form_data.get(f'status_pekerjaan_{i}', ''),
                f'Pemasaran Usaha Sampingan {i}': form_data.get(f'pemasaran_usaha_{i}', ''),
                f'Penjualan Marketplace Sampingan {i}': form_data.get(f'penjualan_marketplace_{i}', ''),
                f'Status Pekerjaan Diinginkan Sampingan {i}': form_data.get(f'status_pekerjaan_diinginkan_{i}', ''),
                f'Bidang Usaha Sampingan {i}': form_data.get(f'bidang_usaha_{i}', ''),
            })

        # Save to Excel
        try:
            if os.path.exists(EXCEL_FILE):
                try:
                    df = pd.read_excel(EXCEL_FILE)
                    df = pd.concat([df, pd.DataFrame([row_data])], ignore_index=True)
                except PermissionError:
                    return jsonify({
                        'success': False,
                        'message': 'File Excel sedang digunakan oleh program lain. Tutup file dan coba lagi.'
                    }), 500
            else:
                df = pd.DataFrame([row_data])

            df.to_excel(EXCEL_FILE, index=False)

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error saving to Excel: {str(e)}'}), 500

        # Decrease remaining members count
        keluarga_data['jumlah_anggota_15plus'] -= 1
        session['keluarga_data'] = keluarga_data

        # Remove individual data from session
        session.pop('individu_data', None)

        # Count how many jobs were entered
        job_count = 1  # Main job
        for i in range(1, 3):
            if form_data.get(f'status_pekerjaan_{i}'):
                job_count += 1

        # Prepare success message
        if job_count == 1:
            message = 'Data pekerjaan utama berhasil disimpan.'
        else:
            message = f'Data pekerjaan utama dan {job_count - 1} pekerjaan sampingan berhasil disimpan.'

        # Check if there are more members to process
        if keluarga_data['jumlah_anggota_15plus'] > 0:
            return jsonify({
                'success': True,
                'message': f'{message} Lanjutkan ke anggota berikutnya.',
                'redirect': True,
                'redirect_url': url_for('lanjutan')
            })
        else:
            # All members processed, clear session
            session.pop('keluarga_data', None)
            return jsonify({
                'success': True,
                'message': f'{message} Semua data berhasil disimpan. Terima kasih.',
                'redirect': True,
                'redirect_url': url_for('index')
            })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/download/<filename>')
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
def check_file():
    """Check if Excel file exists"""
    exists = os.path.exists(EXCEL_FILE)
    return jsonify({'exists': exists})

if __name__ == '__main__':
    app.run(debug=True)
from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Keluarga(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    keluarga_id = db.Column(db.String(50), unique=True, nullable=False)
    rt = db.Column(db.String(10), nullable=False)
    rw = db.Column(db.String(10), nullable=False)
    dusun = db.Column(db.String(50), nullable=False)
    nama_kepala = db.Column(db.String(100), nullable=False)
    alamat = db.Column(db.Text, nullable=False)
    jumlah_anggota = db.Column(db.Integer, nullable=False)
    jumlah_anggota_15plus = db.Column(db.Integer, nullable=False)
    
    # Surveyor information
    nama_pencacah = db.Column(db.String(100))
    hp_pencacah = db.Column(db.String(20))
    tanggal_pencacah = db.Column(db.String(50))
    nama_pemberi_jawaban = db.Column(db.String(100))
    hp_pemberi_jawaban = db.Column(db.String(20))
    tanggal_pemberi_jawaban = db.Column(db.String(50))
    catatan = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    anggota = db.relationship('Individu', backref='keluarga', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Keluarga {self.keluarga_id}>'

class Individu(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    keluarga_id = db.Column(db.Integer, db.ForeignKey('keluarga.id'), nullable=False)
    anggota_ke = db.Column(db.Integer, nullable=False)
    
    # Personal information
    nama_anggota = db.Column(db.String(100), nullable=False)
    umur = db.Column(db.Integer, nullable=False)
    hubungan_kepala = db.Column(db.String(50), nullable=False)
    jenis_kelamin = db.Column(db.String(20), nullable=False)
    status_perkawinan = db.Column(db.String(30), nullable=False)
    pendidikan_terakhir = db.Column(db.String(100), nullable=False)
    kegiatan_sehari = db.Column(db.String(100), nullable=False)
    
    # Employment information
    memiliki_pekerjaan = db.Column(db.String(10), nullable=False)
    status_pekerjaan_diinginkan = db.Column(db.String(100))
    bidang_usaha_diminati = db.Column(db.String(100))
    
    # Job details
    bidang_pekerjaan = db.Column(db.String(200))
    memiliki_lebih_satu_pekerjaan = db.Column(db.String(10))
    
    # Main job
    status_pekerjaan_utama = db.Column(db.String(100))
    pemasaran_usaha_utama = db.Column(db.String(50))
    penjualan_marketplace_utama = db.Column(db.String(10))
    
    # Side job 1
    bidang_pekerjaan_sampingan1 = db.Column(db.String(200))
    status_pekerjaan_sampingan1 = db.Column(db.String(100))
    pemasaran_usaha_sampingan1 = db.Column(db.String(50))
    penjualan_marketplace_sampingan1 = db.Column(db.String(10))
    
    # Side job 2
    bidang_pekerjaan_sampingan2 = db.Column(db.String(200))
    status_pekerjaan_sampingan2 = db.Column(db.String(100))
    pemasaran_usaha_sampingan2 = db.Column(db.String(50))
    penjualan_marketplace_sampingan2 = db.Column(db.String(10))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Individu {self.nama_anggota}>'

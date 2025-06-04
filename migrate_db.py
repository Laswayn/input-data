#!/usr/bin/env python3
"""
Database migration script for updating existing data
"""

from app import create_app, db
from app.models import User, Keluarga, Individu
import json
from datetime import datetime

def backup_database():
    """Create a JSON backup of current database"""
    app = create_app('development')
    
    with app.app_context():
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'users': [],
            'families': [],
            'individuals': []
        }
        
        # Backup users
        for user in User.query.all():
            backup_data['users'].append({
                'username': user.username,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        
        # Backup families
        for family in Keluarga.query.all():
            backup_data['families'].append({
                'keluarga_id': family.keluarga_id,
                'rt': family.rt,
                'rw': family.rw,
                'dusun': family.dusun,
                'nama_kepala': family.nama_kepala,
                'alamat': family.alamat,
                'jumlah_anggota': family.jumlah_anggota,
                'jumlah_anggota_15plus': family.jumlah_anggota_15plus,
                'nama_pencacah': family.nama_pencacah,
                'hp_pencacah': family.hp_pencacah,
                'tanggal_pencacah': family.tanggal_pencacah,
                'nama_pemberi_jawaban': family.nama_pemberi_jawaban,
                'hp_pemberi_jawaban': family.hp_pemberi_jawaban,
                'tanggal_pemberi_jawaban': family.tanggal_pemberi_jawaban,
                'catatan': family.catatan,
                'created_at': family.created_at.isoformat() if family.created_at else None
            })
        
        # Backup individuals
        for individual in Individu.query.all():
            family = Keluarga.query.get(individual.keluarga_id)
            backup_data['individuals'].append({
                'keluarga_id_ref': family.keluarga_id if family else None,
                'anggota_ke': individual.anggota_ke,
                'nama_anggota': individual.nama_anggota,
                'umur': individual.umur,
                'hubungan_kepala': individual.hubungan_kepala,
                'jenis_kelamin': individual.jenis_kelamin,
                'status_perkawinan': individual.status_perkawinan,
                'pendidikan_terakhir': individual.pendidikan_terakhir,
                'kegiatan_sehari': individual.kegiatan_sehari,
                'memiliki_pekerjaan': individual.memiliki_pekerjaan,
                'status_pekerjaan_diinginkan': individual.status_pekerjaan_diinginkan,
                'bidang_usaha_diminati': individual.bidang_usaha_diminati,
                'bidang_pekerjaan': individual.bidang_pekerjaan,
                'memiliki_lebih_satu_pekerjaan': individual.memiliki_lebih_satu_pekerjaan,
                'status_pekerjaan_utama': individual.status_pekerjaan_utama,
                'pemasaran_usaha_utama': individual.pemasaran_usaha_utama,
                'penjualan_marketplace_utama': individual.penjualan_marketplace_utama,
                'created_at': individual.created_at.isoformat() if individual.created_at else None
            })
        
        # Save backup
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"database_backup_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Database backed up to: {filename}")
        return filename

def restore_database(backup_file):
    """Restore database from JSON backup"""
    app = create_app('development')
    
    with app.app_context():
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        print("🔄 Restoring database from backup...")
        
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Restore users
        for user_data in backup_data['users']:
            user = User(
                username=user_data['username'],
                role=user_data['role']
            )
            # Set default passwords
            if user_data['role'] == 'admin':
                user.set_password('pahlawan140')
            else:
                user.set_password('bps140')
            db.session.add(user)
        
        db.session.commit()
        
        # Restore families
        family_mapping = {}
        for family_data in backup_data['families']:
            family = Keluarga(**{k: v for k, v in family_data.items() if k != 'created_at'})
            db.session.add(family)
            db.session.flush()  # Get the ID
            family_mapping[family_data['keluarga_id']] = family.id
        
        db.session.commit()
        
        # Restore individuals
        for individual_data in backup_data['individuals']:
            keluarga_id_ref = individual_data.pop('keluarga_id_ref')
            individual_data['keluarga_id'] = family_mapping.get(keluarga_id_ref)
            
            if individual_data['keluarga_id']:
                individual_data = {k: v for k, v in individual_data.items() if k != 'created_at'}
                individual = Individu(**individual_data)
                db.session.add(individual)
        
        db.session.commit()
        print("✅ Database restored successfully!")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'backup':
            backup_database()
        elif sys.argv[1] == 'restore' and len(sys.argv) > 2:
            restore_database(sys.argv[2])
        else:
            print("Usage:")
            print("  python3 migrate_db.py backup")
            print("  python3 migrate_db.py restore <backup_file.json>")
    else:
        backup_database()

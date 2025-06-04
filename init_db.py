#!/usr/bin/env python3
"""
Database initialization script for the Census Data Collection Application
This script creates the database tables and adds sample users for testing
"""

import os
import sys
from app import create_app, db
from app.models import User, Keluarga, Individu

def init_database():
    """Initialize the database with tables and sample data"""
    
    # Create the Flask app
    app = create_app('development')
    
    with app.app_context():
        print("🔄 Initializing database...")
        
        # Drop all existing tables (for fresh start)
        db.drop_all()
        print("✅ Dropped existing tables")
        
        # Create all tables
        db.create_all()
        print("✅ Created database tables")
        
        # Add sample users
        admin_user = User(
            username='admin',
            role='admin'
        )
        admin_user.set_password('pahlawan140')
        
        regular_user = User(
            username='user',
            role='user'
        )
        regular_user.set_password('bps140')
        
        # Add users to database
        db.session.add(admin_user)
        db.session.add(regular_user)
        
        # Add sample family data for testing
        sample_family = Keluarga(
            keluarga_id='KEL001',
            rt='01',
            rw='02',
            dusun='Dusun Mawar',
            nama_kepala='admin',
            alamat='Jl. Merdeka No. 123',
            jumlah_anggota=4,
            jumlah_anggota_15plus=3,
            nama_pencacah='admin',
            hp_pencacah='081234567890',
            tanggal_pencacah='2024-01-15',
            nama_pemberi_jawaban='admin',
            hp_pemberi_jawaban='081234567891',
            tanggal_pemberi_jawaban='2024-01-15',
            catatan='Data lengkap'
        )
        
        db.session.add(sample_family)
        db.session.commit()
        
        # Add sample individual data
        sample_individuals = [
            Individu(
                keluarga_id=sample_family.id,
                anggota_ke=1,
                nama_anggota='admin1',
                umur=45,
                hubungan_kepala='Kepala Keluarga',
                jenis_kelamin='Laki-laki',
                status_perkawinan='Kawin',
                pendidikan_terakhir='SMA/SMK',
                kegiatan_sehari='Bekerja',
                memiliki_pekerjaan='Ya',
                bidang_pekerjaan='Perdagangan',
                status_pekerjaan_utama='Wiraswasta',
                pemasaran_usaha_utama='Lokal',
                penjualan_marketplace_utama='Tidak'
            ),
            Individu(
                keluarga_id=sample_family.id,
                anggota_ke=2,
                nama_anggota='admin2',
                umur=40,
                hubungan_kepala='Istri',
                jenis_kelamin='Perempuan',
                status_perkawinan='Kawin',
                pendidikan_terakhir='SMP',
                kegiatan_sehari='Mengurus Rumah Tangga',
                memiliki_pekerjaan='Tidak',
                status_pekerjaan_diinginkan='Wiraswasta',
                bidang_usaha_diminati='Kuliner'
            ),
            Individu(
                keluarga_id=sample_family.id,
                anggota_ke=3,
                nama_anggota='admin3',
                umur=20,
                hubungan_kepala='Anak',
                jenis_kelamin='Laki-laki',
                status_perkawinan='Belum Kawin',
                pendidikan_terakhir='SMA/SMK',
                kegiatan_sehari='Sekolah/Kuliah',
                memiliki_pekerjaan='Tidak',
                status_pekerjaan_diinginkan='Pegawai',
                bidang_usaha_diminati='Teknologi'
            ),

        ]
        
        for individual in sample_individuals:
            db.session.add(individual)
        
        db.session.commit()
        
        print("✅ Added sample users:")
        print("   - Admin: username='admin', password='pahlawan140'")
        print("   - User: username='user', password='bps140'")
        print("✅ Added sample family data (KEL001)")
        print("✅ Database initialization completed!")
        
        # Display database info
        print("\n📊 Database Summary:")
        print(f"   - Users: {User.query.count()}")
        print(f"   - Families: {Keluarga.query.count()}")
        print(f"   - Individuals: {Individu.query.count()}")
        print(f"   - Database file: {app.config['SQLALCHEMY_DATABASE_URI']}")

def reset_database():
    """Reset the database (drop and recreate)"""
    app = create_app('development')
    
    with app.app_context():
        print("🔄 Resetting database...")
        db.drop_all()
        db.create_all()
        print("✅ Database reset completed!")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'reset':
        reset_database()
    else:
        init_database()

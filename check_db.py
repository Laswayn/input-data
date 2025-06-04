#!/usr/bin/env python3
"""
Database checker script to view current data in the database
"""

from app import create_app, db
from app.models import User, Keluarga, Individu
from datetime import datetime

def check_database():
    """Check and display current database contents"""
    
    app = create_app('development')
    
    with app.app_context():
        print("📊 DATABASE CONTENTS")
        print("=" * 50)
        
        # Check Users
        users = User.query.all()
        print(f"\n👥 USERS ({len(users)} total):")
        for user in users:
            print(f"   - {user.username} ({user.role}) - Created: {user.created_at}")
        
        # Check Families
        families = Keluarga.query.all()
        print(f"\n🏠 FAMILIES ({len(families)} total):")
        for family in families:
            print(f"   - {family.keluarga_id}: {family.nama_kepala}")
            print(f"     📍 {family.dusun}, RT {family.rt}/RW {family.rw}")
            print(f"     👨‍👩‍👧‍👦 {family.jumlah_anggota} members ({family.jumlah_anggota_15plus} adults)")
            print(f"     📅 Created: {family.created_at}")
        
        # Check Individuals
        individuals = Individu.query.all()
        print(f"\n👤 INDIVIDUALS ({len(individuals)} total):")
        for individual in individuals:
            family = Keluarga.query.get(individual.keluarga_id)
            print(f"   - {individual.nama_anggota} ({individual.jenis_kelamin}, {individual.umur} years)")
            print(f"     🏠 Family: {family.keluarga_id if family else 'Unknown'}")
            print(f"     👨‍👩‍👧‍👦 Relation: {individual.hubungan_kepala}")
            print(f"     🎓 Education: {individual.pendidikan_terakhir}")
            print(f"     💼 Activity: {individual.kegiatan_sehari}")
            if individual.memiliki_pekerjaan == 'Ya':
                print(f"     💼 Job: {individual.bidang_pekerjaan}")
            print()

def export_to_excel():
    """Export database contents to Excel for review"""
    try:
        import pandas as pd
        
        app = create_app('development')
        
        with app.app_context():
            # Export families
            families = Keluarga.query.all()
            family_data = []
            for family in families:
                family_data.append({
                    'ID Keluarga': family.keluarga_id,
                    'Nama Kepala': family.nama_kepala,
                    'Dusun': family.dusun,
                    'RT': family.rt,
                    'RW': family.rw,
                    'Alamat': family.alamat,
                    'Jumlah Anggota': family.jumlah_anggota,
                    'Anggota 15+': family.jumlah_anggota_15plus,
                    'Pencacah': family.nama_pencacah,
                    'Tanggal Input': family.created_at
                })
            
            # Export individuals
            individuals = Individu.query.all()
            individual_data = []
            for individual in individuals:
                family = Keluarga.query.get(individual.keluarga_id)
                individual_data.append({
                    'ID Keluarga': family.keluarga_id if family else '',
                    'Anggota Ke': individual.anggota_ke,
                    'Nama': individual.nama_anggota,
                    'Umur': individual.umur,
                    'Jenis Kelamin': individual.jenis_kelamin,
                    'Hubungan': individual.hubungan_kepala,
                    'Status Kawin': individual.status_perkawinan,
                    'Pendidikan': individual.pendidikan_terakhir,
                    'Kegiatan': individual.kegiatan_sehari,
                    'Punya Kerja': individual.memiliki_pekerjaan,
                    'Bidang Kerja': individual.bidang_pekerjaan or '',
                    'Status Kerja': individual.status_pekerjaan_utama or ''
                })
            
            # Create Excel file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"database_export_{timestamp}.xlsx"
            
            with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                pd.DataFrame(family_data).to_excel(writer, sheet_name='Keluarga', index=False)
                pd.DataFrame(individual_data).to_excel(writer, sheet_name='Individu', index=False)
            
            print(f"✅ Database exported to: {filename}")
            
    except ImportError:
        print("❌ pandas not installed. Install with: pip install pandas openpyxl")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'export':
        export_to_excel()
    else:
        check_database()

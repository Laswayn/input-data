# Aplikasi Pendataan Desa Sidokepung

Aplikasi web untuk pendataan keluarga dan anggota keluarga di Desa Sidokepung menggunakan Flask.

## Fitur

- Login admin dengan session management
- Input data keluarga
- Input data individu anggota keluarga usia 15+
- Input data pekerjaan (utama dan sampingan)
- Export data ke Excel
- Edit data keluarga dan individu
- Responsive design

## Deployment ke Vercel

### Persiapan

1. Install Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Login ke Vercel:
\`\`\`bash
vercel login
\`\`\`

### Environment Variables

Set environment variables di Vercel dashboard atau menggunakan CLI:

\`\`\`bash
vercel env add SECRET_KEY
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
\`\`\`

Atau bisa menggunakan nilai default:
- `SECRET_KEY`: akan di-generate otomatis jika tidak diset
- `ADMIN_USERNAME`: default "admin"
- `ADMIN_PASSWORD`: default "pahlawan140"

### Deploy

1. Clone repository ini
2. Jalankan perintah deploy:
\`\`\`bash
vercel --prod
\`\`\`

### Struktur File untuk Vercel

\`\`\`
├── api/
│   └── index.py          # Main Flask application
├── static/               # CSS, JS, images
├── templates/            # HTML templates
├── app.py               # Local development entry point
├── vercel.json          # Vercel configuration
├── requirements.txt     # Python dependencies
└── README.md
\`\`\`

## Local Development

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Run aplikasi:
\`\`\`bash
python app.py
\`\`\`

3. Buka browser ke `http://localhost:5000`

## Login

- Username: `admin` (atau sesuai environment variable)
- Password: `pahlawan140` (atau sesuai environment variable)

## Catatan

- File Excel akan disimpan di temporary directory pada Vercel
- Session timeout: 1 jam
- Aplikasi menggunakan Flask session untuk menyimpan data sementara
- Responsive design menggunakan Tailwind CSS

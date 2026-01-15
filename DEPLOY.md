# 🚀 Panduan Deploy POS App ke Cloud (GRATIS)

Panduan ini akan membantu Anda mendeploy aplikasi POS secara **permanen dan gratis** menggunakan **Vercel** (frontend) dan **Railway** (backend + database).

---

## 📋 Persiapan

1. Buat akun gratis di:
   - [GitHub](https://github.com) - untuk hosting kode
   - [Vercel](https://vercel.com) - untuk frontend
   - [Railway](https://railway.app) - untuk backend + PostgreSQL

2. Install Git jika belum ada:
   ```bash
   winget install Git.Git
   ```

---

## 🔧 Langkah 1: Upload Kode ke GitHub

```bash
# Masuk ke folder project
cd d:/h/pos-app

# Inisialisasi Git
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Initial commit - POS Application"
```

Kemudian:
1. Buka **https://github.com/new**
2. Buat repository baru bernama `pos-app`
3. Ikuti perintah yang muncul untuk push:

```bash
git remote add origin https://github.com/USERNAME/pos-app.git
git branch -M main
git push -u origin main
```

---

## 🚂 Langkah 2: Deploy Backend ke Railway

### 2.1 Buat Project di Railway

1. Buka **https://railway.app/dashboard**
2. Klik **"New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Pilih repository `pos-app` Anda
5. Pilih folder: `/backend`

### 2.2 Tambah PostgreSQL Database

1. Di project Railway, klik **"+ New"**
2. Pilih **"Database" → "PostgreSQL"**
3. Tunggu database terbuat

### 2.3 Set Environment Variables

Klik service backend Anda, lalu:
1. Pergi ke tab **Variables**
2. Tambahkan variables berikut:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=pos-secret-key-super-aman-2024
JWT_EXPIRES_IN=7d
PORT=5000
```

> ⚠️ `${{Postgres.DATABASE_URL}}` akan otomatis terisi dari database

### 2.4 Deploy & Seed Database

1. Buka tab **Settings** → **Deploy**
2. Pastikan **Root Directory** = `/backend`
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Klik **Deploy**

Setelah deploy selesai, jalankan seed (opsional):
```bash
# Di terminal Railway atau lewat CLI
npm run db:seed
```

### 2.5 Catat URL Backend

Setelah deploy berhasil, catat URL backend Anda, contoh:
```
https://pos-app-backend-xxxxx.up.railway.app
```

---

## ▲ Langkah 3: Deploy Frontend ke Vercel

### 3.1 Import Project

1. Buka **https://vercel.com/new**
2. Pilih **"Import Git Repository"**
3. Pilih repository `pos-app`
4. Atur settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js

### 3.2 Set Environment Variables

Tambahkan variable:

```
NEXT_PUBLIC_API_URL=https://pos-app-backend-xxxxx.up.railway.app/api
```

> Ganti URL dengan URL Railway Anda dari langkah 2.5

### 3.3 Deploy

1. Klik **Deploy**
2. Tunggu proses build selesai (sekitar 2-3 menit)
3. Setelah selesai, Anda akan mendapat URL seperti:
   ```
   https://pos-app-xxxxx.vercel.app
   ```

---

## ✅ Selesai!

Aplikasi Anda sekarang online di:

| Service | URL |
|---------|-----|
| **Frontend** | `https://pos-app-xxxxx.vercel.app` |
| **Backend** | `https://pos-app-backend-xxxxx.up.railway.app` |

### Login:
- **Admin**: `admin` / `admin123`
- **Kasir**: `kasir1` / `kasir123`

---

## 💡 Tips

### Custom Domain (Opsional)
- Vercel: Settings → Domains → Add domain
- Railway: Settings → Networking → Add domain

### Batasan Free Tier

| Platform | Batasan |
|----------|---------|
| **Vercel** | 100GB bandwidth/bulan, unlimited deploys |
| **Railway** | $5 credit/bulan, ~500 jam runtime |

### Upgrade Database
Jika data bertambah banyak, pertimbangkan upgrade ke:
- [Supabase](https://supabase.com) - PostgreSQL gratis 500MB
- [PlanetScale](https://planetscale.com) - MySQL gratis 5GB

---

## 🔄 Update Aplikasi

Setiap kali Anda push ke GitHub, Vercel dan Railway akan **otomatis redeploy**!

```bash
git add .
git commit -m "Update fitur baru"
git push
```

---

## ❓ Troubleshooting

### Backend tidak bisa connect database
- Pastikan `DATABASE_URL` menggunakan `${{Postgres.DATABASE_URL}}`
- Cek tab Deployments untuk error logs

### Frontend 404 atau error API
- Pastikan `NEXT_PUBLIC_API_URL` benar (dengan `/api` di akhir)
- Pastikan backend sudah running

### CORS Error
Backend sudah dikonfigurasi untuk menerima semua origin. Jika masih error, tambahkan domain Vercel ke whitelist di `backend/src/index.js`.

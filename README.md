# 🏫 Sistem Presensi Guru (Face & GPS Recognition)

Sistem Presensi modern berbasis Web yang menggunakan teknologi **Face Recognition** dan **Geofencing (GPS)** untuk memastikan keakuratan kehadiran guru di lingkungan sekolah.

## 🚀 Fitur Utama

- **Presensi Wajah**: Menggunakan `face-api.js` untuk deteksi dan pengenalan wajah.
- **Geofencing**: Validasi radius lokasi guru menggunakan koordinat GPS sekolah.
- **Admin Dashboard**: Manajemen guru, pengaturan radius, dan pemantauan kehadiran.
- **Ekspor Laporan**: Cetak laporan individu & rekapitulasi (PDF & Excel).
- **Guru Portal**: Guru dapat melihat riwayat dan mencetak laporan mandiri.

---

## 💻 Panduan Setup Lokal

### 1. Prasyarat
- Node.js versi 18+
- Database PostgreSQL (Disarankan [Neon.tech](https://neon.tech))

### 2. Instalasi
```bash
git clone <url-repo>
cd presensi
npm install
```

### 3. Konfigurasi Database & Environment
Buat file `.env` di folder root:
```env
# Ambil Connection String dari Neon.tech
DATABASE_URL="postgresql://user:password@host-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### 4. Setup Database (Prisma)
Jalankan perintah ini untuk sinkronisasi tabel dan mengisi data awal (Admin):
```bash
# Membuat tabel di database
npx prisma db push

# Mengisi data awal (Admin & Settings)
npx prisma db seed
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```

---

## 💎 Panduan Database Neon.tech

### Cara Membuat Database Baru:
1. Daftar di [Neon.tech](https://neon.tech).
2. Buat **Project Baru**.
3. Di dashboard Neon, cari bagian **Connection Details**.
4. Pilih **Prisma** pada dropdown framework.
5. Salin URL yang diberikan ke file `.env` Anda.

---

## ☁️ Panduan Deploy ke Vercel (Auto-Migration)

Agar database terupdate otomatis saat deploy:
1. Masuk ke Dashboard Vercel > Project Anda.
2. Ke menu **Settings > Environment Variables**.
3. Tambahkan `DATABASE_URL` dengan URL dari Neon.
4. Ke menu **Settings > General**, cari **Build Command**.
5. Aktifkan **Override** dan isi dengan:
   ```bash
   npx prisma generate && npx prisma db push && next build
   ```

---

## 🔑 Akun Login Default (Setelah Seed)

- **Email**: `admin@gmail.com`
- **Password**: `admin`
- **Role**: Administrator

---
*Dikembangkan dengan ❤️ oleh Antigravity AI.*

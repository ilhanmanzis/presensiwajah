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

### 3. Tarik Konfigurasi Database ke Komputer Lokal Anda
Agar Anda bisa coding dan mengakses database Neon dari laptop Anda sendiri, Anda harus menarik (pull) environment variables dari Vercel ke project lokal Anda.
1. Buka terminal di folder project Next.js Anda.
2. Login ke Vercel CLI dengan menjalankan:
      ```
         npx vercel login
      ```   
3. Hubungkan folder lokal Anda dengan project di Vercel:
      ```
         npx vercel link
      ```
4. Pilih "Yes" untuk setup, pilih akun Anda, dan pilih project yang baru saja d  ibuat).
5. Tarik variabel koneksi database:
      ```
         npx vercel env pull .env.local
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

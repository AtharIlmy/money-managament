# Arus - Money Management App (React.js + Express + PostgreSQL)

Platform manajemen keuangan pribadi modern yang dibangun menggunakan **React.js**, **Express.js**, dan database **PostgreSQL**, dengan desain UI/UX sesuai referensi.

---

## 🚀 Fitur Utama

1. **Masuk & Daftar Akun (`/masuk`, `/daftar`)**:
   - Autentikasi aman berbasis JWT & bcrypt
   - Layout split modern (panel hijau Arus di kiri, formulir interaktif di kanan)
2. **Dasbor (`/dasbor`)**:
   - Total Saldo semua dompet, Pemasukan bulanan, Pengeluaran bulanan, dan Tabungan bersih
   - Grafik Area tren arus kas 6 bulan
   - Ringkasan progres anggaran kategori
   - Tabel transaksi terkini
3. **Transaksi (`/transaksi`)**:
   - Filter berdasarkan jenis (Pemasukan / Pengeluaran), Dompet, Kategori, serta pencarian teks
   - Tambah transaksi baru dengan modal interaktif
   - Hapus transaksi dengan sinkronisasi saldo otomatis
4. **Dompet & Rekening (`/dompet`)**:
   - Banner kekayaan bersih total
   - Manajemen kartu dompet (Rekening Bank, Dompet Digital, Tabungan, Tunai)
   - Tambah dompet baru dengan kustomisasi ikon & warna aksen
5. **Anggaran & Target Impian (`/anggaran`)**:
   - Batas pengeluaran per kategori dengan indikator progres bar real-time
   - Target tabungan finansial dengan persentase capaian dan tombol tambah tabungan
6. **Laporan (`/laporan`)**:
   - Grafik perbandingan pemasukan vs pengeluaran tahunan
   - Donut Chart distribusi pengeluaran per kategori
   - Rincian tabel persentase pengeluaran

---

## 🛠️ Tech Stack

- **Frontend**: React.js 19 + Vite (React Router v7, Recharts, Lucide)
- **Styling**: Vanilla CSS kustom dengan Design System modern (Inter font, dark green aesthetic `#1B4332`, soft cream background `#F5F4F0`)
- **Backend**: Express.js (Node.js REST API)
- **Database**: PostgreSQL (`pg` driver dengan auto table schema & seed)

---

## ⚙️ Konfigurasi Database PostgreSQL

Buka file [`.env`](./.env) dan sesuaikan URL koneksi PostgreSQL Anda:

```env
DATABASE_URL=postgresql://postgres:PASSWORD_POSTGRESQL_ANDA@localhost:5432/arus_db
JWT_SECRET=arus_secret_key_2024_money_management
PORT=5000
```

> **Catatan**: Jika database `arus_db` belum ada di PostgreSQL Anda, buat terlebih dahulu via `psql` atau pgAdmin:
> ```sql
> CREATE DATABASE arus_db;
> ```
> Skema tabel (`users`, `wallets`, `categories`, `transactions`, `budgets`, `goals`) akan digenerate otomatis saat server dijalankan!

---

## 💻 Menjalankan Aplikasi

1. **Jalankan Frontend & Backend sekaligus**:
   ```bash
   npm run dev
   ```
   - **Frontend (Vite + React)**: [http://localhost:3001](http://localhost:3001)
   - **Backend API (Express)**: [http://localhost:5000](http://localhost:5000)

2. **Atau jalankan terpisah**:
   - Frontend saja: `npm run client`
   - Backend API saja: `npm run server`

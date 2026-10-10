# SIMPEL-LAB | Sistem Peminjaman Barang Laboratorium Komputer

Aplikasi Web Interaktif, Modern, Responsif, dan Client-side Prototype untuk **Sistem Informasi Manajemen Peminjaman Barang Laboratorium Komputer** (HTML5, Tailwind CSS, dan JavaScript).

Sistem ini berjalan **100% di sisi klien (Client-side)** menggunakan **LocalStorage** untuk persistensi data tanpa memerlukan konfigurasi database server backend.

---

## 📁 Struktur Direktori Terpisah (Sesuai Permintaan)

Setiap hak akses role kini dipisahkan ke dalam folder mandiri agar rapi, modular, dan sangat mudah dicari:

```
c:\xampp4\htdocs\Perpustakaan-ibn/
│
├── index.html            # Portal Gateway / Beranda Utama yang mengarahkan ke semua folder
├── login.html            # Halaman Login interaktif (dengan 1-Klik Quick Login Demo)
├── register.html         # Halaman Registrasi akun siswa baru (tersimpan ke LocalStorage)
│
├── admin/                # FOLDER KHUSUS ADMINISTRATOR LAB
│   ├── index.html        # Dashboard Admin, Kelola Barang, Siswa, Petugas, Transaksi, Laporan
│   └── admin.js          # Controller logika khusus Administrator & Chart.js
│
├── petugas/              # FOLDER KHUSUS PETUGAS / TEKNISI LAB
│   ├── index.html        # Dashboard Petugas, Entri Pinjam, Verifikasi Kembali & Denda, Stok
│   └── petugas.js        # Controller logika operasional harian petugas lab
│
├── siswa/                # FOLDER KHUSUS SISWA (PEMINJAM MANDIRI)
│   ├── index.html        # Portal Siswa, Katalog Barang, Form Pinjam, Riwayat & Cetak Bukti
│   └── siswa.js          # Controller logika portal siswa & cetak bukti transaksi
│
├── css/
│   └── style.css         # Styling global, glassmorphism, scrollbar, dan layout cetak resmi
│
├── js/
│   ├── data.js           # Engine LocalStorage bersama (Sinkron antar semua folder)
│   └── auth.js           # Layanan autentikasi, manajemen sesi login, & route guard
│
└── README.md             # Dokumentasi sistem
```

---

## 🔐 Kredensial Login & Akses Cepat (Demo Akun)

Tersedia akun default untuk pengujian di halaman [login.html](login.html):

| Role            | Username / NIS | Password     | Nama Akun               | Folder Tujuan         |
| :-------------- | :------------- | :----------- | :---------------------- | :-------------------- |
| **Admin**       | `admin`        | `admin123`   | Budi Santoso, S.Kom     | `/admin/index.html`   |
| **Petugas Lab** | `petugas`      | `petugas123` | Dian Safitri, A.Md      | `/petugas/index.html` |
| **Siswa 1**     | `20241001`     | `siswa123`   | Naufal Martino Adistama | `/siswa/index.html`   |
| **Siswa 2**     | `20241002`     | `siswa123`   | Ahmad Fauzi             | `/siswa/index.html`   |
| **Siswa 3**     | `20241003`     | `siswa123`   | Siti Nurhaliza          | `/siswa/index.html`   |

> 💡 **Fitur 1-Klik Quick Demo**: Di halaman `login.html`, Anda dapat mengklik tombol instan **"1. Admin"**, **"2. Petugas"**, atau **"3. Siswa"** untuk langsung masuk tanpa perlu mengetik ulang password.

---

## 📝 Fitur Halaman Registrasi (`register.html`)

- Siswa dapat mendaftarkan akun secara mandiri.
- Formulir pendaftaran memuat:
  - Nomor Induk Siswa (NIS)
  - Nama Lengkap
  - Kelas & Kompetensi Keahlian (RPL, TKJ, DKV, SIJA)
  - Nomor WhatsApp / HP
  - Password & Konfirmasi Password
- Data yang didaftarkan langsung tersimpan otomatis ke `LocalStorage` siswa dan sistem autentikasi, lalu diarahkan ke halaman login.

---

## 👥 Rincian Fitur di Masing-Masing Folder Role

### 1. 📂 Folder `admin/` (Akses Penuh)

- **Dashboard Overview**: 4 card statistik, 2 grafik interaktif Chart.js (Tren bulanan & distribusi alat), log aktivitas, dan persetujuan cepat.
- **Kelola Barang (CRUD)**: Tambah, edit, hapus, dan cari barang (Kode, Kategori, Stok, Kondisi, Lokasi).
- **Kelola Siswa (CRUD)**: Manajemen akun siswa dan hak peminjaman.
- **Kelola Petugas (CRUD)**: Manajemen staf teknisi lab (NIP, Shift, Kontak).
- **Transaksi Peminjaman**: Persetujuan pengajuan permohonan siswa & entri pinjam langsung.
- **Transaksi Pengembalian**: Verifikasi kembali, cek kondisi barang (Bagus/Rusak/Hilang), dan kalkulasi denda otomatis.
- **Laporan & Cetak**: Filter transaksi, **Cetak Dokumen Berkop Surat Resmi**, serta **Export CSV/Excel**.

### 2. 📂 Folder `petugas/` (Operasional Harian Meja Lab)

- **Dashboard Petugas**: Fokus pada daftar permohonan yang perlu divalidasi dan barang jatuh tempo hari ini.
- **Entri Peminjaman Meja Lab**: Formulir pencatatan cepat saat siswa datang ke meja piket lab.
- **Verifikasi Pengembalian**: Pengecekan barang fisik dan kalkulasi denda keterlambatan (Rp 2.000 / hari).
- **Data Barang Lab**: Pemantauan ketersediaan stok fisik dengan fitur cepat **"Update Stok"**.
- **Data Siswa**: Direktori data siswa terdaftar.

### 3. 📂 Folder `siswa/` (Portal Peminjam Mandiri)

- **Dashboard Siswa**: Sambutan identitas siswa, ringkasan barang yang sedang dipinjam, dan banner peringatan jatuh tempo.
- **Katalog Barang Lab**: Grid kartu modern dengan foto gadget, status ketersediaan stok (_Tersedia_ / _Stok Habis_), spesifikasi, lokasi rak, dan tombol **"Ajukan Pinjam"**.
- **Ajukan Peminjaman Mandiri**: Mengisi tanggal pinjam, batas kembali, dan keperluan pemakaian.
- **Riwayat Peminjaman**: Memantau status pengajuan (_Menunggu Konfirmasi_, _Dipinjam_, _Dikembalikan_, _Ditolak_), opsi pembatalan, dan **Cetak Surat Bukti Peminjaman (Slip Peminjam)**.

---

## 🚀 Cara Menjalankan Aplikasi

1. **Buka Langsung di Browser**:
   - Buka file [index.html](file:///c:/xampp4/htdocs/Perpustakaan-ibn/index.html) di peramban (Google Chrome / Microsoft Edge).
2. **Melalui Web Server Apache XAMPP**:
   - Pastikan Apache berjalan di XAMPP Control Panel, lalu buka:
     ```
     http://localhost/Perpustakaan-ibn/
     ```
   - Untuk login: `http://localhost/Perpustakaan-ibn/login.html`
   - Untuk registrasi: `http://localhost/Perpustakaan-ibn/register.html`

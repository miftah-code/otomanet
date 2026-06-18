# OTOMANET & PIRO 🚀
### Network Automation Platform & Modern Subnet Calculator

OTOMANET adalah platform automasi dan manajemen inventori perangkat jaringan berbasis web (Flask, Celery, Redis). Aplikasi ini terintegrasi penuh dengan **PIRO**, sebuah kalkulator subnetting IP modern (React, TypeScript, Tailwind CSS v4) yang disajikan langsung di sub-route `/piro`.

---

## 📁 Struktur Repositori

Proyek ini menggunakan struktur monorepo:
*   **`/netautotool`**: Backend utama menggunakan Python Flask, Celery, SQLite, dan driver Netmiko/Paramiko untuk automasi SSH.
*   **`/PIRO`**: Frontend kalkulator subnetting yang dibangun menggunakan React, Vite, TypeScript, dan Tailwind CSS v4.

---

## 🌟 Fitur Utama

### 1. Panel Automasi Jaringan (OTOMANET)
*   **Inventori Perangkat Jaringan**: CRUD data perangkat (IP, Hostname, Port, Driver). Password dan credential rahasia dienkripsi aman dua arah di database menggunakan kunci kriptografi Fernet.
*   **Dukungan Multi-Vendor**: Kompatibel dengan berbagai tipe perangkat:
    *   Cisco IOS / XE
    *   MikroTik RouterOS (penanganan khusus screen-lines & auto-echo bypass)
    *   Juniper JunOS
    *   Fortinet FortiOS
    *   PaloAlto PAN-OS
    *   Huawei VRP
    *   Other / Generic SSH fallback
*   **Pemantauan Kesehatan Perangkat (Health Check & Latency)**: Pengecekan status online/offline otomatis setiap 1 menit via TCP port checking, lengkap dengan grafik/data latensi (ms).
*   **Bulk Configuration Push**: Mengirimkan rangkaian konfigurasi baris-per-baris secara massal ke banyak perangkat secara paralel menggunakan Celery worker.
*   **Backup Otomatis & Terjadwal**: Menarik berkas *running-config* dari semua perangkat dan menyimpannya sebagai file `.cfg` di direktori lokal server secara otomatis (dapat dijadwalkan per 6 jam, dll.).
*   **Pre & Post-Check Verification**: Menganalisis konfigurasi perangkat untuk memverifikasi kepatuhan terhadap standar tertentu, lalu menghasilkan laporan verifikasi dalam format teks (.txt).
*   **Akses Remote Ganda (SSH & Web GUI)**:
    *   **SSH Console**: Terminal SSH interaktif langsung di browser menggunakan xterm.js dan WebSocket.
    *   **Web GUI (HTTP/HTTPS)**: Integrasi dashboard web perangkat (seperti Fortigate, PaloAlto, Webfig Mikrotik) di dalam overlay web. Dilengkapi fitur **Minimize** (jendela melayang/floating di pojok bawah), **Maximize** (fullscreen), dan tombol buka di tab baru.
*   **Role-Based Access Control (RBAC)**: Login aman dengan pembagian hak akses pengguna (**Administrator**, **Operator**, dan **Viewer**).
*   **Audit Logs**: Log pencatatan aktivitas lengkap untuk melacak tindakan pengguna demi alasan keamanan.

### 2. Kalkulator Subnet Modern (PIRO)
*   **Kalkulator IPv4**: Penghitungan otomatis Subnet Mask, Wildcard Mask, IP Network, IP Broadcast, Range Host Usable, Total Host, dan Representasi Biner.
*   **Kalkulator IPv6**: Parsing, kompresi/ekspansi string alamat IPv6, dan subnetting IPv6.
*   **Smart Tips**: Sistem cerdas yang mendeteksi range IP khusus seperti RFC 1918 (Private), Link-Local, Loopback, Multicast, dll.
*   **Toolkit Jaringan**:
    *   *Cheat Sheets*: Referensi tabel CIDR subnetting, range RFC 1918, dan prefix standar IPv6.
    *   *IP ↔ Binary Converter*: Konversi dua arah alamat IPv4 desimal ke biner 32-bit.
    *   *Route Summarization Calculator*: Menghitung ringkasan rute (Supernetting) dari beberapa IP range secara otomatis.
*   **Riwayat & Bookmark (History Log)**: Menyimpan histori pencarian kalkulasi di browser menggunakan `LocalStorage`, lengkap dengan pin favorit.
*   **Share URL & QR Code**: Membagikan kalkulasi tertentu dengan parameter query URL instan dan generator QR code dinamis.
*   **Premium Glassmorphism UI**: Antarmuka modern dengan mode gelap (Dark Mode) bawaan dan dukungan dwi-bahasa (Bahasa Indonesia & Bahasa Inggris).

---

## 🛠️ Panduan Instalasi & Deployment

### Prasyarat Sistem
*   Ubuntu 22.04 LTS (atau OS Linux lainnya)
*   Python 3.10 atau versi di atasnya
*   Node.js (versi 16+) & npm
*   Redis Server (sebagai broker Celery)

---

### Langkah 1: Kloning & Persiapan Awal
```bash
git clone https://github.com/miftah-code/otomanet.git
cd otomanet
```

### Langkah 2: Build Frontend (PIRO)
Flask akan menyajikan frontend PIRO dari direktori `/PIRO/dist`. Anda harus mengkompilasinya terlebih dahulu:
```bash
cd PIRO
npm install
npm run build
cd ..
```

### Langkah 3: Setup Backend (netautotool)
1.  Masuk ke direktori backend, buat virtual environment Python, dan instal modul:
    ```bash
    cd netautotool
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    ```
2.  Salin file env template:
    ```bash
    cp .env.example .env
    ```
3.  Generate kunci enkripsi rahasia untuk dimasukkan ke file `.env`:
    *   **SECRET_KEY**:
        ```bash
        python3 -c "import os; print(os.urandom(24).hex())"
        ```
    *   **ENCRYPTION_KEY** (Fernet key):
        ```bash
        python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
        ```
    Buka berkas `.env` dan tempelkan kedua kunci di atas pada variabel masing-masing.

4.  Inisialisasi database lokal SQLite (`otomanet.db`):
    ```bash
    python3 -c "from app.database import init_db; init_db()"
    ```
5.  Buat akun Administrator awal:
    ```bash
    python3 init_admin.py
    ```

---

## 🚀 Cara Menjalankan Aplikasi

### A. Mode Development (Menggunakan 3 Terminal)
Pastikan Redis Server sudah berjalan (`sudo systemctl start redis-server`). Di dalam folder `netautotool`, buka 3 terminal dengan venv aktif (`source venv/bin/activate`):

1.  **Terminal 1 (Web Server)**:
    ```bash
    python3 run.py
    ```
    *Akses web di:* `http://localhost:8000` *(dan kalkulator PIRO di:* `http://localhost:8000/piro`*)*.
2.  **Terminal 2 (Celery Worker)**:
    ```bash
    celery -A celery_app worker --loglevel=info
    ```
3.  **Terminal 3 (Celery Beat Scheduler)**:
    ```bash
    celery -A celery_app beat --loglevel=info
    ```

### B. Mode Production (Deploy via Systemd & Script)
Anda dapat melakukan deployment secara otomatis ke sistem Ubuntu menggunakan script deploy yang sudah disediakan:
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```
Script ini akan otomatis menginstal dependensi sistem, membuat user linux khusus `otomanet`, memigrasi konfigurasi Nginx local proxy, dan mengaktifkan 3 background service systemd:
*   `otomanet.service` (Gunicorn Web Server di port 8000)
*   `otomanet-celery.service` (Celery Worker)
*   `otomanet-beat.service` (Celery Beat Scheduler)

Gunakan perintah di bawah ini untuk melihat status atau merestart layanan:
```bash
sudo systemctl restart otomanet otomanet-celery otomanet-beat
sudo journalctl -u otomanet -f
```

Untuk eksposur ke internet secara aman, silakan ikuti panduan **Cloudflare Tunnel Setup** yang ada di dalam berkas [DEPLOYMENT.md](netautotool/DEPLOYMENT.md).

---

## 📄 Lisensi
Proyek ini dikembangkan secara internal untuk kebutuhan automasi jaringan dan utilitas subnetting insinyur jaringan.

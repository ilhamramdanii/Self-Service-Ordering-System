# SelfOrder — Modern Digital Menu & Ordering System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**SelfOrder** adalah platform pemesanan mandiri (self-service) berbasis web yang dirancang untuk meningkatkan efisiensi operasional restoran. Aplikasi ini memungkinkan pelanggan memesan langsung dari meja menggunakan QR Code dan memberikan panel manajemen lengkap untuk admin, dapur, dan kasir secara real-time.

##  Fitur Utama

- **Customer Self-Ordering:** Antarmuka responsif untuk pelanggan memilih menu, kustomisasi pesanan, dan checkout langsung dari perangkat mereka.
- **Real-time Order Tracking:** Integrasi **Server-Sent Events (SSE)** untuk pembaruan status pesanan instan ke bagian dapur dan kasir.
- **Admin Dashboard:** Statistik penjualan, laporan pendapatan, dan manajemen inventaris menu yang komprehensif.
- **Kitchen Display System (KDS):** Panel khusus dapur untuk memproses pesanan masuk berdasarkan antrean.
- **Cashier Management:** Manajemen pembayaran yang terintegrasi dengan status meja.
- **Table Management:** Pengaturan tata letak meja dan pembuatan QR Code unik untuk setiap meja.
- **Dynamic Menu:** Kelola kategori, harga, ketersediaan stok, dan gambar menu secara dinamis.

##  Arsitektur Sistem

Project ini dibangun dengan fokus pada performa dan skalabilitas:

1.  **Full-stack Next.js:** Menggunakan **App Router** untuk performa routing yang optimal dan Server Components.
2.  **Type-safe Database:** Menggunakan **Prisma ORM** dengan PostgreSQL/Supabase untuk integritas data yang kuat.
3.  **State Management:** Menggunakan **Zustand** untuk pengelolaan cart pelanggan yang ringan dan cepat.
4.  **Real-time Communication:** Implementasi SSE (Server-Sent Events) untuk sinkronisasi data tanpa beban berlebih pada server.

##  Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase/Prisma)
- **Styling:** Tailwind CSS & Shadcn UI
- **State Management:** Zustand
- **Real-time:** Server-Sent Events (SSE)
- **Authentication:** NextAuth.js

##  Memulai

### Prasyarat
- Node.js (Versi Terbaru)
- PostgreSQL Database (Bisa menggunakan Supabase)

### Langkah Instalasi

1.  **Clone Repository:**
    ```bash
    https://github.com/ilhamramdanii/Self-Service-Ordering-System.git
    cd self-service-ordering
    ```

2.  **Instal Dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    Salin file `.env.example` menjadi `.env` dan isi dengan kredensial database Anda:
    ```bash
    DATABASE_URL="postgresql://..."
    NEXTAUTH_SECRET="your-secret"
    ```

4.  **Setup Database:**
    Jalankan migrasi Prisma untuk menyiapkan struktur tabel:
    ```bash
    npx prisma migrate dev
    ```

5.  **Jalankan Aplikasi:**
    ```bash
    npm run dev
    ```

##  Validasi

Jalankan linter untuk memastikan kualitas kode tetap terjaga:
```bash
npm run lint
```

##  Lisensi
Project ini dilisensikan di bawah MIT License - lihat file [LICENSE] untuk detailnya.

---
*Built with ❤️ by ilhamramdanii*

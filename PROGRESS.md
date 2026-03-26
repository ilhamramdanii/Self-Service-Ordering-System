# Self Service Ordering System — CODEEVOLUTION
## Progress Development

---

## Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (cart) |
| Database | PostgreSQL 15 (lokal) |
| ORM | Prisma 7 + @prisma/adapter-pg |
| Real-time | Server-Sent Events (SSE) |
| Auth Admin | NextAuth.js v5 (Credentials) |
| Payment | Midtrans (belum aktif, env placeholder) |
| Runtime | Node.js v25 / npm |

---

## Database
- **Host:** localhost:5432
- **DB:** self_service_ordering
- **User:** restoadmin / resto123
- **Migration:** `prisma/migrations/20260322143217_init`

---

## Akun Admin (Seed)
| Email | Password | Role |
|-------|----------|------|
| admin@codeevolution.id | admin123 | super_admin |
| kasir@codeevolution.id | admin123 | cashier |
| dapur@codeevolution.id | admin123 | kitchen |

---

## Status Fitur

### ✅ Setup & Infrastruktur
- [x] Next.js project init
- [x] Tailwind CSS + shadcn/ui
- [x] PostgreSQL database & user
- [x] Prisma schema + migration
- [x] Prisma 7 driver adapter (PrismaPg)
- [x] Seed data (restoran, 5 meja, 3 kategori, 5 menu, 3 admin)
- [x] SSE lib (`lib/sse.ts`) — pub/sub in-memory
- [x] NextAuth.js config (`lib/auth.ts`)
- [x] `.env.local` template
- [x] PWA manifest (`public/manifest.json`)

### ✅ Sisi Customer
- [x] Halaman menu `/order/[tableId]` — katalog + search + category tabs
- [x] MenuCard dengan badge qty
- [x] MenuOptionModal — add-ons, notes, quantity
- [x] CartBar sticky
- [x] Halaman checkout `/order/[tableId]/checkout` — hybrid payment
- [x] Halaman status `/order/[tableId]/status/[orderId]` — SSE real-time
- [x] Cart persistence (Zustand + localStorage)

### ✅ API Routes
- [x] `GET /api/menu/[tableId]` — ambil kategori + menu
- [x] `GET /api/menu/item/[menuId]` — detail menu + add-ons
- [x] `POST /api/orders` — buat order + trigger Midtrans
- [x] `GET /api/orders/[orderId]` — detail order
- [x] `POST /api/payment-callback` — webhook Midtrans
- [x] `GET /api/stream/kitchen` — SSE channel dapur
- [x] `GET /api/stream/order` — SSE channel customer
- [x] `POST /api/auth/[...nextauth]` — NextAuth handler

### ✅ Sisi Admin
- [x] Middleware proteksi route `/admin/*`
- [x] Layout admin + sidebar navigasi (role-based)
- [x] AdminShell (responsive desktop + mobile)
- [x] Halaman login `/admin/login`
- [x] Dashboard `/admin/dashboard` — stats + recent orders
- [x] Kitchen Display `/admin/kitchen` — SSE real-time, update status
- [x] Kasir `/admin/cashier` — konfirmasi bayar tunai, SSE real-time
- [x] API `GET /api/admin/orders` — filter by status
- [x] API `PATCH /api/admin/orders/[id]/status` — update status + SSE publish
- [x] API `GET /api/admin/dashboard` — stats hari ini
- [x] API `PATCH /api/admin/menus/[id]/availability` — toggle sold out
- [x] API `GET /api/stream/cashier` — SSE channel kasir

### ✅ Manajemen Menu
- [x] Halaman `/admin/menus` — list menu per kategori + search + filter
- [x] MenuCard — sold out badge, edit, delete, toggle available
- [x] MenuFormModal — tambah/edit menu lengkap dengan:
  - [x] Upload foto (JPEG/PNG/WebP, maks 5MB → `/public/uploads`)
  - [x] CRUD add-ons/options (nama, wajib/opsional, pilih satu/banyak)
  - [x] Harga tambahan per pilihan (additionalPrice)
- [x] API `GET/POST /api/admin/menus`
- [x] API `PUT/DELETE /api/admin/menus/[id]`
- [x] API `POST /api/admin/upload` — file upload ke /public/uploads
- [x] API `GET/POST /api/admin/categories`

### ✅ Bug Fixes & Improvements
- [x] Fix hydration error: `<p>` tidak boleh berisi `<div>` (Skeleton) → ganti ke `<span>`
- [x] Tambah tab "Semua" di CategoryTabs customer — tampil semua menu lintas kategori
- [x] Default tab saat buka menu sekarang "Semua"

### ✅ Manajemen Meja & QR Code
- [x] Halaman `/admin/tables` — list meja + status aktif/nonaktif
- [x] Tambah meja baru (validasi nomor duplikat)
- [x] Toggle aktif/nonaktif meja
- [x] Hapus meja
- [x] Generate QR Code per meja (library: `qrcode`)
- [x] Preview QR Code dalam modal + URL order
- [x] Download QR Code sebagai PNG
- [x] API `GET/POST /api/admin/tables`
- [x] API `PATCH/DELETE /api/admin/tables/[id]`

### ✅ Laporan Penjualan
- [x] Halaman `/admin/reports` — laporan harian & bulanan
- [x] Summary cards: total order, paid, revenue, cash vs online, unpaid
- [x] Top 5 menu terlaris (dengan progress bar visual)
- [x] Tabel riwayat order lengkap
- [x] Export CSV (download langsung dari browser)
- [x] Filter by tanggal (harian) atau bulan (bulanan)
- [x] API `GET /api/admin/reports`

### ✅ Manajemen Cabang
- [x] Halaman `/admin/restaurants` — list semua cabang (super_admin only)
- [x] Tambah cabang baru (nama + alamat opsional)
- [x] Edit inline nama & alamat cabang
- [x] Toggle aktif/nonaktif cabang
- [x] Hapus cabang (dengan konfirmasi)
- [x] Tampil stats per cabang: jumlah meja, admin, order
- [x] API `GET/POST /api/admin/restaurants`
- [x] API `PATCH/DELETE /api/admin/restaurants/[id]`
- [x] Guard: redirect ke dashboard jika role bukan super_admin

### ⏳ Belum Dimulai
- [ ] Integrasi Midtrans aktif (isi env key)
- [ ] PWA icons (icon-192.png, icon-512.png)
- [ ] Deploy ke VPS

---

## Struktur Folder Saat Ini
```
/self-service-ordering-codeevolution
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     ✅
│   │   ├── menu/[tableId]/route.ts         ✅
│   │   ├── menu/item/[menuId]/route.ts     ✅
│   │   ├── orders/route.ts                 ✅
│   │   ├── orders/[orderId]/route.ts       ✅
│   │   ├── payment-callback/route.ts       ✅
│   │   ├── stream/kitchen/route.ts         ✅
│   │   └── stream/order/route.ts           ✅
│   ├── admin/
│   │   ├── login/page.tsx                  ✅
│   │   ├── dashboard/                      ⏳
│   │   ├── kitchen/                        ⏳
│   │   ├── cashier/                        ⏳
│   │   ├── menus/                          ⏳
│   │   ├── tables/                         ⏳
│   │   ├── reports/                        ⏳
│   │   └── restaurants/                    ✅
│   ├── order/
│   │   └── [tableId]/
│   │       ├── page.tsx                    ✅
│   │       ├── checkout/page.tsx           ✅
│   │       └── status/[orderId]/page.tsx   ✅
│   ├── layout.tsx                          ✅
│   └── page.tsx                            ✅
├── components/
│   ├── customer/
│   │   ├── CartBar.tsx                     ✅
│   │   ├── CategoryTabs.tsx                ✅
│   │   ├── MenuCard.tsx                    ✅
│   │   └── MenuOptionModal.tsx             ✅
│   ├── admin/                              ⏳
│   └── ui/ (shadcn)                        ✅
├── hooks/                                  ⏳
├── lib/
│   ├── auth.ts                             ✅
│   ├── prisma.ts                           ✅
│   ├── sse.ts                              ✅
│   └── utils.ts                            ✅
├── prisma/
│   ├── schema.prisma                       ✅
│   ├── seed.ts                             ✅
│   └── migrations/                         ✅
├── store/
│   └── useCartStore.ts                     ✅
├── types/
│   └── database.types.ts                   ✅
├── prisma.config.ts                        ✅
├── .env / .env.local                       ✅
└── PROGRESS.md                             ✅
```

---

## Cara Jalankan Lokal
```bash
# Start dev server
npm run dev

# URL customer (scan QR)
http://localhost:3000/order/seed-table-01

# URL admin login
http://localhost:3000/admin/login

# Re-seed database
npx prisma db seed

# Buka Prisma Studio (GUI database)
npx prisma studio
```

---

## Catatan Penting
- Prisma 7 tidak support `url` di `schema.prisma` → pakai `prisma.config.ts` + `PrismaPg` adapter
- SSE menggunakan in-memory pub/sub → oke untuk single-instance VPS, perlu Redis jika multi-instance
- NextAuth session strategy: JWT (stateless, cocok untuk VPS)
- `NEXTAUTH_SECRET` harus diganti di production
- Midtrans belum aktif — perlu isi `MIDTRANS_SERVER_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`

---

*Terakhir diupdate: 23 Maret 2026*

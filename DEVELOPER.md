# Developer Documentation
## Self Service Ordering System — CODEEVOLUTION

---

## Daftar Isi
1. [Gambaran Umum](#1-gambaran-umum)
2. [Persyaratan Sistem](#2-persyaratan-sistem)
3. [Instalasi & Setup Lokal](#3-instalasi--setup-lokal)
4. [Struktur Project](#4-struktur-project)
5. [Database](#5-database)
6. [Autentikasi Admin](#6-autentikasi-admin)
7. [Real-time (SSE)](#7-real-time-sse)
8. [API Reference](#8-api-reference)
9. [State Management (Cart)](#9-state-management-cart)
10. [Alur Pembayaran](#10-alur-pembayaran)
11. [Environment Variables](#11-environment-variables)
12. [Panduan Deploy VPS](#12-panduan-deploy-vps)

---

## 1. Gambaran Umum

**Self Service Ordering System** adalah Progressive Web App (PWA) untuk sistem pemesanan mandiri di restoran. Pelanggan scan QR Code di meja → membuka web → memesan langsung dari HP tanpa download aplikasi.

### Arsitektur
```
Customer (HP)          Admin Panel
     │                      │
     │  scan QR             │  login
     ▼                      ▼
┌─────────────────────────────────────┐
│         Next.js 16 (App Router)     │
│                                     │
│  /order/[tableId]   /admin/*        │
│  /api/menu/*        /api/admin/*    │
│  /api/orders        /api/stream/*   │
└──────────────┬──────────────────────┘
               │
         ┌─────▼──────┐
         │ PostgreSQL  │
         │  (Prisma 7) │
         └────────────┘
```

### Tech Stack
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js | 16.2.1 |
| UI | Tailwind CSS + shadcn/ui | v4 |
| ORM | Prisma | 7.5.0 |
| DB Adapter | @prisma/adapter-pg | latest |
| Database | PostgreSQL | 15 |
| Real-time | Server-Sent Events (SSE) | Native |
| Auth | NextAuth.js | v5 beta |
| State | Zustand | v5 |
| Runtime | Node.js | v25+ |

---

## 2. Persyaratan Sistem

- **Node.js** v20+ (tested on v25)
- **PostgreSQL** 15+ (installer dari postgresql.org)
- **npm** v9+

---

## 3. Instalasi & Setup Lokal

### Langkah 1 — Clone & Install
```bash
cd /path/to/project
npm install
```

### Langkah 2 — Setup Database PostgreSQL
Buka psql sebagai superuser:
```bash
/Library/PostgreSQL/15/bin/psql -U postgres
```
Jalankan di dalam psql:
```sql
CREATE DATABASE self_service_ordering;
CREATE USER restoadmin WITH PASSWORD 'resto123';
GRANT ALL PRIVILEGES ON DATABASE self_service_ordering TO restoadmin;
ALTER USER restoadmin CREATEDB;
\c self_service_ordering
GRANT ALL ON SCHEMA public TO restoadmin;
\q
```

### Langkah 3 — Environment Variables
Buat/edit file `.env` dan `.env.local`:

**`.env`** (untuk Prisma CLI):
```env
DATABASE_URL="postgresql://restoadmin:resto123@localhost:5432/self_service_ordering"
```

**`.env.local`** (untuk Next.js runtime):
```env
DATABASE_URL="postgresql://restoadmin:resto123@localhost:5432/self_service_ordering"
NEXTAUTH_SECRET="ganti-dengan-string-random-panjang"
NEXTAUTH_URL="http://localhost:3000"
MIDTRANS_SERVER_KEY=your-midtrans-server-key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Langkah 4 — Migrasi & Seed
```bash
# Jalankan migrasi database
npx prisma migrate dev

# Isi data awal (restoran, meja, menu, admin)
npx prisma db seed
```

### Langkah 5 — Jalankan Dev Server
```bash
npm run dev
```

### URL Penting
| URL | Keterangan |
|-----|-----------|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/order/seed-table-01` | Simulasi customer meja 1 |
| `http://localhost:3000/admin/login` | Login admin |
| `http://localhost:3000/admin/dashboard` | Dashboard admin |

### Akun Admin Default (Seed)
| Email | Password | Role |
|-------|----------|------|
| admin@codeevolution.id | admin123 | super_admin |
| kasir@codeevolution.id | admin123 | cashier |
| dapur@codeevolution.id | admin123 | kitchen |

---

## 4. Struktur Project

```
/self-service-ordering-codeevolution
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── menu/
│   │   │   ├── [tableId]/        # GET: kategori + menu per meja
│   │   │   └── item/[menuId]/    # GET: detail menu + add-ons
│   │   ├── orders/
│   │   │   ├── route.ts          # POST: buat order baru
│   │   │   └── [orderId]/        # GET: detail order
│   │   ├── payment-callback/     # POST: webhook Midtrans
│   │   ├── stream/
│   │   │   ├── kitchen/          # GET: SSE dapur
│   │   │   ├── cashier/          # GET: SSE kasir
│   │   │   └── order/            # GET: SSE customer
│   │   └── admin/
│   │       ├── dashboard/        # GET: stats hari ini
│   │       ├── orders/           # GET: daftar order aktif
│   │       │   └── [orderId]/status/  # PATCH: update status
│   │       └── menus/
│   │           └── [menuId]/availability/  # PATCH: sold out toggle
│   │
│   ├── order/[tableId]/          # Halaman customer
│   │   ├── page.tsx              # Katalog menu
│   │   ├── checkout/             # Checkout + pilih pembayaran
│   │   └── status/[orderId]/     # Tracking status real-time
│   │
│   ├── admin/                    # Halaman admin
│   │   ├── layout.tsx            # Layout + auth check
│   │   ├── login/                # Login page
│   │   ├── dashboard/            # Overview & statistik
│   │   ├── kitchen/              # Kitchen Display System
│   │   ├── cashier/              # Kasir & konfirmasi bayar
│   │   ├── menus/                # Manajemen menu & add-ons
│   │   ├── tables/               # Manajemen meja & QR
│   │   ├── reports/              # Laporan penjualan
│   │   └── restaurants/          # Manajemen cabang
│   │
│   ├── layout.tsx                # Root layout (PWA meta, Midtrans script)
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── customer/                 # Komponen sisi pelanggan
│   │   ├── CartBar.tsx           # Bar keranjang sticky bawah
│   │   ├── CategoryTabs.tsx      # Tab kategori scroll horizontal
│   │   ├── MenuCard.tsx          # Kartu menu dengan badge qty
│   │   └── MenuOptionModal.tsx   # Modal pilih add-ons + qty
│   ├── admin/                    # Komponen sisi admin
│   │   ├── AdminShell.tsx        # Shell layout admin (responsive)
│   │   └── Sidebar.tsx           # Sidebar navigasi (role-based)
│   └── ui/                       # shadcn/ui components
│
├── lib/
│   ├── auth.ts                   # NextAuth config + callbacks
│   ├── prisma.ts                 # Prisma client singleton
│   ├── sse.ts                    # SSE pub/sub event bus
│   └── utils.ts                  # Helper (cn, dll)
│
├── store/
│   └── useCartStore.ts           # Zustand cart store + persist
│
├── types/
│   └── database.types.ts         # TypeScript types (DB + Cart)
│
├── prisma/
│   ├── schema.prisma             # Definisi semua model
│   ├── seed.ts                   # Data awal
│   └── migrations/               # Riwayat migrasi SQL
│
├── public/
│   ├── uploads/                  # Upload gambar menu (lokal)
│   └── manifest.json             # PWA manifest
│
├── middleware.ts                 # Proteksi route /admin/*
├── prisma.config.ts              # Konfigurasi Prisma 7
├── .env                          # DB URL untuk Prisma CLI
├── .env.local                    # Semua env untuk Next.js
├── PROGRESS.md                   # Catatan progres development
└── DEVELOPER.md                  # Dokumentasi ini
```

---

## 5. Database

### Schema Relasi
```
restaurants ──┬── tables
              ├── categories ── menus ── menu_options ── menu_option_items
              ├── orders ─────── order_items ── order_item_options
              └── admin_users
```

### Model Utama

#### `Order`
| Field | Type | Keterangan |
|-------|------|-----------|
| status | Enum | `draft` → `pending` → `preparing` → `served` → `completed` / `cancelled` |
| paymentMethod | Enum | `online` (Midtrans) atau `cashier` (bayar di kasir) |
| paymentStatus | Enum | `unpaid` / `paid` |
| transactionId | String? | ID transaksi dari Midtrans |

#### Status Flow
```
draft ──► pending ──► preparing ──► served ──► completed
                                          └──► (kasir mark selesai)
           └──► cancelled
```

### Prisma CLI Commands
```bash
# Generate client setelah ubah schema
npx prisma generate

# Buat migration baru
npx prisma migrate dev --name nama_perubahan

# Reset database (hapus semua data)
npx prisma migrate reset

# Buka GUI database
npx prisma studio

# Seed ulang
npx prisma db seed
```

### Catatan Penting Prisma 7
Prisma 7 tidak support `url` di `datasource` dalam `schema.prisma`.
Koneksi database dikonfigurasi di dua tempat:
- `prisma.config.ts` → untuk Prisma CLI (migrate, seed)
- `lib/prisma.ts` → untuk runtime Next.js (via `PrismaPg` adapter)

```typescript
// lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg'
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

---

## 6. Autentikasi Admin

Menggunakan **NextAuth.js v5** dengan strategi JWT.

### Provider
`Credentials` — email + password yang disimpan di tabel `admin_users` dengan bcrypt hash.

### Role System
| Role | Akses |
|------|-------|
| `super_admin` | Semua fitur |
| `cashier` | Dashboard, Kasir, Laporan |
| `kitchen` | KDS Dapur saja |

### Proteksi Route
`middleware.ts` mengecek session untuk semua route `/admin/*`. Login redirect ke `/admin/login`, setelah login redirect ke `/admin/dashboard`.

### Mengakses Session di Server Component
```typescript
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()
  const user = session!.user as { role: string; restaurantId: string }
}
```

### Mengakses Session di Client Component
```typescript
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session } = useSession()
}
```

---

## 7. Real-time (SSE)

### Cara Kerja
`lib/sse.ts` mengimplementasikan **in-memory pub/sub** sederhana. Cocok untuk single-instance VPS. Untuk multi-instance, ganti dengan Redis pub/sub.

### Channels
| Channel | Format Key | Siapa Subscribe | Event |
|---------|-----------|-----------------|-------|
| Kitchen | `kitchen:{restaurantId}` | KDS Dapur | `new_order`, `order_updated`, `order_paid`, `order_cancelled` |
| Cashier | `cashier:{restaurantId}` | Kasir | `new_order`, `order_updated`, `order_paid` |
| Order | `order:{orderId}` | Customer | `status_update` |

### Publish Event (dari API route)
```typescript
import { publish, channels } from '@/lib/sse'

publish(channels.kitchen(restaurantId), {
  type: 'new_order',
  order: { id, tableNumber, totalPrice, status }
})
```

### Subscribe di Client (React)
```typescript
useEffect(() => {
  const es = new EventSource(`/api/stream/kitchen?restaurantId=${id}`)
  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'new_order') loadOrders()
  }
  return () => es.close()
}, [])
```

### SSE Route Pattern
```typescript
// app/api/stream/[channel]/route.ts
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribe(channel, (data) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      })
      req.signal.addEventListener('abort', () => {
        unsubscribe()
        controller.close()
      })
    }
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', ... }
  })
}
```

---

## 8. API Reference

### Customer APIs

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/menu/[tableId]` | Ambil restoran, meja, dan semua kategori+menu |
| GET | `/api/menu/item/[menuId]` | Detail menu beserta add-ons |
| POST | `/api/orders` | Buat order baru |
| GET | `/api/orders/[orderId]` | Detail order + items |
| POST | `/api/payment-callback` | Webhook Midtrans (signature verified) |
| GET | `/api/stream/order?orderId=X` | SSE status update untuk customer |

### Admin APIs

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/dashboard?restaurantId=X` | Stats hari ini |
| GET | `/api/admin/orders?restaurantId=X&status=pending,preparing` | Daftar order |
| PATCH | `/api/admin/orders/[id]/status` | Update status/paymentStatus |
| GET | `/api/admin/menus?restaurantId=X` | Semua menu + kategori + options |
| POST | `/api/admin/menus` | Tambah menu baru |
| PUT | `/api/admin/menus/[id]` | Update menu + options |
| DELETE | `/api/admin/menus/[id]` | Hapus menu + foto |
| PATCH | `/api/admin/menus/[id]/availability` | Toggle isAvailable (sold out) |
| POST | `/api/admin/upload` | Upload foto menu ke /public/uploads |
| GET/POST | `/api/admin/categories` | Daftar / tambah kategori |
| GET | `/api/stream/kitchen?restaurantId=X` | SSE channel dapur |
| GET | `/api/stream/cashier?restaurantId=X` | SSE channel kasir |

### Contoh Request: Buat Order
```bash
POST /api/orders
Content-Type: application/json

{
  "tableId": "seed-table-01",
  "paymentMethod": "cashier",
  "totalPrice": 33000,
  "items": [
    {
      "menuId": "seed-menu-nasigoreng",
      "quantity": 1,
      "unitPrice": 25000,
      "notes": "tidak pedas",
      "subtotal": 25000,
      "options": [
        {
          "menu_option_item_id": "...",
          "label": "Tidak Pedas",
          "additional_price": 0
        }
      ]
    }
  ]
}
```

### Contoh Request: Update Status Order
```bash
PATCH /api/admin/orders/{orderId}/status
Content-Type: application/json

{ "status": "preparing" }
# atau
{ "paymentStatus": "paid", "status": "preparing" }
```

---

## 9. State Management (Cart)

Cart dikelola oleh **Zustand** dengan `persist` middleware ke `localStorage`.

### Store: `store/useCartStore.ts`

```typescript
const { items, addItem, removeItem, updateQuantity, clearCart,
        getTotalPrice, getTotalItems,
        tableId, setTableId,
        draftOrderId, setDraftOrderId } = useCartStore()
```

### Cart Item Structure
```typescript
interface CartItem {
  menu: Menu
  quantity: number
  notes: string
  selected_options: CartItemOption[]  // add-ons yang dipilih
  subtotal: number                    // (price + options) * qty
}
```

### Session Persistence
- Cart otomatis disimpan ke `localStorage` key: `cart-storage`
- Saat customer refresh/buka ulang, cart tetap ada
- Cart di-clear setelah `clearCart()` dipanggil (post-checkout)

---

## 10. Alur Pembayaran

### Model A — Bayar Online (Midtrans)
```
POST /api/orders
  └─► Prisma: INSERT order (status=pending)
  └─► Midtrans API: create transaction → dapat snapToken
  └─► Response: { orderId, snapToken }
        │
        └─► Frontend: window.snap.pay(snapToken)
              │
              ├─► User bayar QRIS/GoPay/OVO
              │
              └─► Midtrans Webhook → POST /api/payment-callback
                    └─► Verifikasi signature SHA-512
                    └─► Prisma: UPDATE order (paymentStatus=paid, status=preparing)
                    └─► SSE publish → dapur + customer notified
```

### Model B — Bayar di Kasir
```
POST /api/orders
  └─► Prisma: INSERT order (status=pending, paymentMethod=cashier)
  └─► SSE publish → dapur + kasir notified
  └─► Response: { orderId }

Kasir konfirmasi:
PATCH /api/admin/orders/{id}/status
  body: { paymentStatus: "paid", status: "preparing" }
  └─► SSE publish → dapur + customer notified
```

### Setup Midtrans
1. Daftar di https://dashboard.midtrans.com
2. Ambil **Server Key** dan **Client Key** dari Settings → Access Keys
3. Isi di `.env.local`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx   # Sandbox
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
   NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
   ```
4. Untuk production, ganti ke key production dan set `IS_PRODUCTION=true`
5. Daftarkan URL webhook di Midtrans Dashboard:
   `https://yourdomain.com/api/payment-callback`

---

## 11. Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random string min 32 karakter |
| `NEXTAUTH_URL` | ✅ | Base URL aplikasi |
| `MIDTRANS_SERVER_KEY` | ⚠️ | Wajib jika pakai online payment |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | ⚠️ | Wajib jika pakai online payment |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | - | `true` / `false` (default false) |
| `NEXT_PUBLIC_APP_URL` | - | Base URL untuk callback |

> Generate `NEXTAUTH_SECRET`:
> ```bash
> openssl rand -base64 32
> ```

---

## 12. Panduan Deploy VPS

### Persyaratan VPS
- Ubuntu 22.04+ / Debian 12+
- RAM min 1GB (rekomenasi 2GB)
- Node.js 20+
- PostgreSQL 15+
- Nginx (reverse proxy)

### Langkah Deploy

#### 1. Install Dependencies di VPS
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# PM2 (process manager)
npm install -g pm2
```

#### 2. Setup Database
```bash
sudo -u postgres psql
# Jalankan perintah CREATE DATABASE/USER sama seperti lokal
```

#### 3. Clone & Build
```bash
git clone <repo> /var/www/self-service-ordering
cd /var/www/self-service-ordering
npm install
npx prisma generate
npx prisma migrate deploy   # bukan migrate dev!
npx prisma db seed
npm run build
```

#### 4. Environment Production
Buat `.env.local` di server dengan nilai production:
```env
DATABASE_URL="postgresql://restoadmin:STRONG_PASSWORD@localhost:5432/self_service_ordering"
NEXTAUTH_SECRET="RANDOM_STRING_PANJANG"
NEXTAUTH_URL="https://yourdomain.com"
MIDTRANS_SERVER_KEY=Mid-server-PRODUCTION-KEY
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION-KEY
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### 5. Jalankan dengan PM2
```bash
pm2 start npm --name "self-service-ordering" -- start
pm2 save
pm2 startup
```

#### 6. Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Penting untuk SSE
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

#### 7. SSL dengan Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Catatan SSE di VPS
Pastikan konfigurasi Nginx menyertakan:
```nginx
proxy_buffering off;
proxy_read_timeout 86400s;  # 24 jam, agar SSE tidak timeout
```
Tanpa ini, SSE akan terputus setiap beberapa detik.

---

*Dokumentasi ini diperbarui seiring perkembangan project.*
*Terakhir diupdate: 22 Maret 2026*

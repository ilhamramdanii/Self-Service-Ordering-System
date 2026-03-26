import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Buat restoran
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'seed-restaurant-id' },
    update: { name: 'WARKOPOLIM' },
    create: {
      id: 'seed-restaurant-id',
      name: 'WARKOPOLIM',
      address: 'Jl. Teknologi No. 1, Jakarta',
    },
  })

  console.log('✅ Restaurant:', restaurant.name)

  // Buat meja
  const tables = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.table.upsert({
        where: { id: `seed-table-0${i + 1}` },
        update: {},
        create: {
          id: `seed-table-0${i + 1}`,
          restaurantId: restaurant.id,
          tableNumber: `0${i + 1}`,
          qrCodeUrl: null,
        },
      })
    )
  )
  console.log(`✅ ${tables.length} meja dibuat`)

  // Buat kategori
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'seed-cat-makanan' },
      update: {},
      create: { id: 'seed-cat-makanan', restaurantId: restaurant.id, name: 'Makanan Utama', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { id: 'seed-cat-minuman' },
      update: {},
      create: { id: 'seed-cat-minuman', restaurantId: restaurant.id, name: 'Minuman', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { id: 'seed-cat-snack' },
      update: {},
      create: { id: 'seed-cat-snack', restaurantId: restaurant.id, name: 'Snack', sortOrder: 3 },
    }),
  ])
  console.log(`✅ ${categories.length} kategori dibuat`)

  // Buat menu dengan add-ons
  const nasiGoreng = await prisma.menu.upsert({
    where: { id: 'seed-menu-nasigoreng' },
    update: {},
    create: {
      id: 'seed-menu-nasigoreng',
      categoryId: 'seed-cat-makanan',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
      price: 25000,
      sortOrder: 1,
      menuOptions: {
        create: [
          {
            name: 'Level Pedas',
            isRequired: true,
            isMultiple: false,
            items: {
              create: [
                { label: 'Tidak Pedas', additionalPrice: 0 },
                { label: 'Pedas Sedang', additionalPrice: 0 },
                { label: 'Pedas Banget', additionalPrice: 0 },
              ],
            },
          },
          {
            name: 'Tambahan',
            isRequired: false,
            isMultiple: true,
            items: {
              create: [
                { label: 'Extra Telur', additionalPrice: 5000 },
                { label: 'Extra Ayam', additionalPrice: 8000 },
                { label: 'Kerupuk', additionalPrice: 2000 },
              ],
            },
          },
        ],
      },
    },
  })

  // ── Makanan Utama ──────────────────────────────────────────
  await prisma.menu.upsert({
    where: { id: 'seed-menu-miegoreng' },
    update: {},
    create: {
      id: 'seed-menu-miegoreng',
      categoryId: 'seed-cat-makanan',
      name: 'Mie Goreng',
      description: 'Mie goreng dengan bumbu rahasia',
      price: 22000,
      sortOrder: 2,
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-ayambakar' },
    update: {},
    create: {
      id: 'seed-menu-ayambakar',
      categoryId: 'seed-cat-makanan',
      name: 'Ayam Bakar Madu',
      description: 'Ayam bakar dengan bumbu madu kecap yang harum dan manis',
      price: 32000,
      sortOrder: 3,
      menuOptions: {
        create: [
          {
            name: 'Bagian Ayam',
            isRequired: true,
            isMultiple: false,
            items: {
              create: [
                { label: 'Dada', additionalPrice: 0 },
                { label: 'Paha', additionalPrice: 0 },
                { label: 'Sayap', additionalPrice: -3000 },
              ],
            },
          },
          {
            name: 'Nasi',
            isRequired: false,
            isMultiple: false,
            items: {
              create: [
                { label: 'Tanpa Nasi', additionalPrice: -5000 },
                { label: 'Nasi Putih', additionalPrice: 0 },
                { label: 'Nasi Uduk', additionalPrice: 3000 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-sotoayam' },
    update: {},
    create: {
      id: 'seed-menu-sotoayam',
      categoryId: 'seed-cat-makanan',
      name: 'Soto Ayam',
      description: 'Soto kuah bening dengan suwiran ayam, telur, dan perkedel',
      price: 20000,
      sortOrder: 4,
      menuOptions: {
        create: [
          {
            name: 'Tambahan',
            isRequired: false,
            isMultiple: true,
            items: {
              create: [
                { label: 'Extra Suwiran Ayam', additionalPrice: 5000 },
                { label: 'Perkedel', additionalPrice: 3000 },
                { label: 'Emping', additionalPrice: 2000 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-bakso' },
    update: {},
    create: {
      id: 'seed-menu-bakso',
      categoryId: 'seed-cat-makanan',
      name: 'Bakso Kuah',
      description: 'Bakso sapi dengan kuah kaldu gurih, mie, dan tahu',
      price: 18000,
      sortOrder: 5,
      menuOptions: {
        create: [
          {
            name: 'Pilihan Isi',
            isRequired: false,
            isMultiple: true,
            items: {
              create: [
                { label: 'Bakso Urat', additionalPrice: 3000 },
                { label: 'Bakso Telur', additionalPrice: 4000 },
                { label: 'Tahu Goreng', additionalPrice: 2000 },
              ],
            },
          },
          {
            name: 'Level Pedas',
            isRequired: false,
            isMultiple: false,
            items: {
              create: [
                { label: 'Tidak Pedas', additionalPrice: 0 },
                { label: 'Pedas', additionalPrice: 0 },
                { label: 'Ekstra Pedas', additionalPrice: 0 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-nasiuduk' },
    update: {},
    create: {
      id: 'seed-menu-nasiuduk',
      categoryId: 'seed-cat-makanan',
      name: 'Nasi Uduk Komplit',
      description: 'Nasi uduk gurih dengan ayam goreng, tempe orek, dan sambal kacang',
      price: 28000,
      sortOrder: 6,
    },
  })

  // ── Minuman ────────────────────────────────────────────────
  await prisma.menu.upsert({
    where: { id: 'seed-menu-esteh' },
    update: {},
    create: {
      id: 'seed-menu-esteh',
      categoryId: 'seed-cat-minuman',
      name: 'Es Teh Manis',
      description: 'Teh manis dingin segar',
      price: 8000,
      sortOrder: 1,
      menuOptions: {
        create: [
          {
            name: 'Tingkat Kemanisan',
            isRequired: false,
            isMultiple: false,
            items: {
              create: [
                { label: 'Normal', additionalPrice: 0 },
                { label: 'Less Sugar', additionalPrice: 0 },
                { label: 'No Sugar', additionalPrice: 0 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-eskopi' },
    update: {},
    create: {
      id: 'seed-menu-eskopi',
      categoryId: 'seed-cat-minuman',
      name: 'Es Kopi Susu',
      description: 'Kopi susu dengan es batu',
      price: 15000,
      sortOrder: 2,
      menuOptions: {
        create: [
          {
            name: 'Tingkat Kemanisan',
            isRequired: false,
            isMultiple: false,
            items: {
              create: [
                { label: 'Normal', additionalPrice: 0 },
                { label: 'Less Sweet', additionalPrice: 0 },
                { label: 'No Sugar', additionalPrice: 0 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-jusalpukat' },
    update: {},
    create: {
      id: 'seed-menu-jusalpukat',
      categoryId: 'seed-cat-minuman',
      name: 'Jus Alpukat',
      description: 'Jus alpukat segar dengan susu kental manis coklat',
      price: 18000,
      sortOrder: 3,
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-esjeruk' },
    update: {},
    create: {
      id: 'seed-menu-esjeruk',
      categoryId: 'seed-cat-minuman',
      name: 'Es Jeruk Peras',
      description: 'Jeruk peras segar dengan es batu, menyegarkan',
      price: 10000,
      sortOrder: 4,
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-matcha' },
    update: {},
    create: {
      id: 'seed-menu-matcha',
      categoryId: 'seed-cat-minuman',
      name: 'Matcha Latte',
      description: 'Matcha premium dengan susu segar, bisa panas atau dingin',
      price: 22000,
      sortOrder: 5,
      menuOptions: {
        create: [
          {
            name: 'Suhu',
            isRequired: true,
            isMultiple: false,
            items: {
              create: [
                { label: 'Dingin (Es)', additionalPrice: 0 },
                { label: 'Panas', additionalPrice: 0 },
              ],
            },
          },
        ],
      },
    },
  })

  // ── Snack ──────────────────────────────────────────────────
  await prisma.menu.upsert({
    where: { id: 'seed-menu-kentang' },
    update: {},
    create: {
      id: 'seed-menu-kentang',
      categoryId: 'seed-cat-snack',
      name: 'Kentang Goreng',
      description: 'Kentang goreng crispy dengan saus pilihan',
      price: 15000,
      sortOrder: 1,
      menuOptions: {
        create: [
          {
            name: 'Pilihan Saus',
            isRequired: false,
            isMultiple: true,
            items: {
              create: [
                { label: 'Saus Tomat', additionalPrice: 0 },
                { label: 'Saus BBQ', additionalPrice: 0 },
                { label: 'Keju Leleh', additionalPrice: 5000 },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-cireng' },
    update: {},
    create: {
      id: 'seed-menu-cireng',
      categoryId: 'seed-cat-snack',
      name: 'Cireng Bumbu Rujak',
      description: 'Cireng crispy dengan bumbu rujak pedas manis khas',
      price: 12000,
      sortOrder: 2,
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-pisangkeju' },
    update: {},
    create: {
      id: 'seed-menu-pisangkeju',
      categoryId: 'seed-cat-snack',
      name: 'Pisang Goreng Keju',
      description: 'Pisang goreng tepung dengan taburan keju dan susu kental',
      price: 14000,
      sortOrder: 3,
    },
  })

  await prisma.menu.upsert({
    where: { id: 'seed-menu-tahucrispy' },
    update: {},
    create: {
      id: 'seed-menu-tahucrispy',
      categoryId: 'seed-cat-snack',
      name: 'Tahu Crispy',
      description: 'Tahu goreng crispy dengan bumbu tabur pedas',
      price: 10000,
      sortOrder: 4,
    },
  })

  console.log('✅ 15 menu dibuat, contoh ID nasiGoreng:', nasiGoreng.id)

  // Buat admin users
  const passwordHash = await bcrypt.hash('admin123', 10)

  await prisma.adminUser.upsert({
    where: { email: 'admin@codeevolution.id' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: 'admin@codeevolution.id',
      password: passwordHash,
      name: 'Super Admin',
      role: 'super_admin',
    },
  })

  await prisma.adminUser.upsert({
    where: { email: 'kasir@codeevolution.id' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: 'kasir@codeevolution.id',
      password: passwordHash,
      name: 'Kasir 1',
      role: 'cashier',
    },
  })

  await prisma.adminUser.upsert({
    where: { email: 'dapur@codeevolution.id' },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: 'dapur@codeevolution.id',
      password: passwordHash,
      name: 'Dapur 1',
      role: 'kitchen',
    },
  })

  console.log('✅ Admin users dibuat:')
  console.log('   admin@codeevolution.id / admin123 (super_admin)')
  console.log('   kasir@codeevolution.id / admin123 (cashier)')
  console.log('   dapur@codeevolution.id / admin123 (kitchen)')
  console.log('')
  console.log('🎉 Seed selesai!')
  console.log(`🔗 Coba akses: http://localhost:3000/order/seed-table-01`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

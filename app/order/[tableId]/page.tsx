'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import CategoryTabs from '@/components/customer/CategoryTabs'
import MenuCard from '@/components/customer/MenuCard'
import CartBar from '@/components/customer/CartBar'
import MenuOptionModal from '@/components/customer/MenuOptionModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, X, ClipboardList } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface MenuOptionItem {
  id: string
  label: string
  additionalPrice: number
}

interface MenuOption {
  id: string
  name: string
  isRequired: boolean
  isMultiple: boolean
  items: MenuOptionItem[]
}

interface Menu {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  menuOptions?: MenuOption[]
}

interface Category {
  id: string
  name: string
  menus: Menu[]
}

interface PageData {
  table: { id: string; tableNumber: string }
  restaurant: { id: string; name: string; logoUrl: string | null }
  categories: Category[]
}

export default function OrderPage() {
  const params = useParams()
  const tableId = params.tableId as string

  const [data, setData] = useState<PageData | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)

  const { setTableId, draftOrderId } = useCartStore()

  useEffect(() => {
    setTableId(tableId)
    fetch(`/api/menu/${tableId}`)
      .then((r) => r.json())
      .then((d: PageData) => {
        setData(d)
        setActiveCategory('all')
      })
      .finally(() => setLoading(false))
  }, [tableId, setTableId])

  async function openMenuDetail(menuId: string, isAvailable: boolean) {
    if (!isAvailable) return
    const res = await fetch(`/api/menu/item/${menuId}`)
    const menu = await res.json()
    setSelectedMenu(menu)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = data?.categories ?? []

  const filteredCategories = searchQuery
    ? categories
        .map((cat) => ({
          ...cat,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          menus: cat.menus.filter((m: any) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.menus.length > 0)
    : categories

  const displayCategories = searchQuery
    ? filteredCategories
    : activeCategory === 'all'
    ? categories
    : categories.filter((c) => c.id === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 shadow-sm">
        {/* Zona Branding — gradient oranye */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-4 pt-4 pb-5">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/40">
              {loading ? (
                <Skeleton className="w-12 h-12" />
              ) : data?.restaurant.logoUrl ? (
                <Image
                  src={data.restaurant.logoUrl}
                  alt={data.restaurant.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-lg">
                  {data?.restaurant.name?.[0] ?? 'W'}
                </span>
              )}
            </div>

            {/* Nama & Meja */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl leading-tight tracking-tight truncate">
                {loading ? <Skeleton className="h-6 w-36 bg-white/30" /> : data?.restaurant.name ?? 'Self Service'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {loading ? '...' : `Meja ${data?.table.tableNumber}`}
                </span>
              </div>
            </div>
          </div>

          {/* Banner status pesanan aktif */}
          {draftOrderId && (
            <Link
              href={`/order/${tableId}/status/${draftOrderId}`}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2 mt-3 text-sm font-medium text-white hover:bg-white/30 transition"
            >
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Lihat status pesanan terakhirmu</span>
              <span className="text-white/70 text-xs">→</span>
            </Link>
          )}
        </div>

        {/* Zona Search — putih dengan efek overlap */}
        <div className="bg-white px-4 pt-3 pb-2 -mt-2 rounded-t-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="bg-white">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
              loading={loading}
            />
          </div>
        )}
      </header>

      {/* Menu List */}
      <main className="px-4 pt-4">
        {loading ? (
          <MenuGridSkeleton />
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Menu tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          displayCategories.map((category) => (
            <section key={category.id} className="mb-6">
              {searchQuery && (
                <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  {category.name}
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {category.menus.map((menu: any) => (
                  <MenuCard
                    key={menu.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    menu={{ ...menu, image_url: menu.imageUrl, is_available: menu.isAvailable } as any}
                    onClick={() => openMenuDetail(menu.id, menu.isAvailable)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <CartBar tableId={tableId} />

      {selectedMenu && (
        <MenuOptionModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          menu={{
            ...selectedMenu,
            image_url: selectedMenu.imageUrl,
            is_available: selectedMenu.isAvailable,
            price: Number(selectedMenu.price),
            menu_options: (selectedMenu.menuOptions ?? []).map((opt) => ({
              ...opt,
              menu_id: selectedMenu.id,
              is_required: opt.isRequired,
              is_multiple: opt.isMultiple,
              menu_option_items: opt.items.map((item) => ({
                ...item,
                menu_option_id: opt.id,
                additional_price: Number(item.additionalPrice),
              })),
            })),
          } as any}
          onClose={() => setSelectedMenu(null)}
        />
      )}
    </div>
  )
}

function MenuGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <Skeleton className="w-full h-36" />
          <div className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, Search, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react'
import MenuFormModal from './MenuFormModal'

interface OptionItem { id: string; label: string; additionalPrice: number }
interface MenuOption { id: string; name: string; isRequired: boolean; isMultiple: boolean; items: OptionItem[] }

interface Menu {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  sortOrder: number
  menuOptions: MenuOption[]
}

interface Category {
  id: string
  name: string
  menus: Menu[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function MenusClient({ restaurantId }: { restaurantId: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/admin/menus?restaurantId=${restaurantId}`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  async function toggleAvailability(menu: Menu) {
    await fetch(`/api/admin/menus/${menu.id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !menu.isAvailable }),
    })
    load()
  }

  async function deleteMenu(menuId: string) {
    if (!confirm('Yakin ingin menghapus menu ini?')) return
    setDeletingId(menuId)
    await fetch(`/api/admin/menus/${menuId}`, { method: 'DELETE' })
    setDeletingId(null)
    load()
  }

  const allMenus = categories.flatMap((c) => c.menus)
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      menus: cat.menus.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = activeCategory === 'all' || cat.id === activeCategory
        return matchSearch && matchCat
      }),
    }))
    .filter((cat) => cat.menus.length > 0)

  const availableMenus = allMenus.filter((m) => m.isAvailable)
  const soldOutMenus   = allMenus.filter((m) => !m.isAvailable)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manajemen Menu</h1>
            <p className="text-xs text-gray-500">{allMenus.length} menu · {categories.length} kategori</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingMenu(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Menu
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Menu</p>
            <p className="text-2xl font-bold text-purple-600 leading-tight">{loading ? '—' : allMenus.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tersedia</p>
            <p className="text-2xl font-bold text-green-600 leading-tight">{loading ? '—' : availableMenus.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sold Out</p>
            <p className="text-2xl font-bold text-red-500 leading-tight">{loading ? '—' : soldOutMenus.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Kategori</p>
            <p className="text-2xl font-bold text-blue-600 leading-tight">{loading ? '—' : categories.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition ${
              activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition ${
                activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-5 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <UtensilsCrossed className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Menu tidak ditemukan</p>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {cat.name} <span className="text-gray-300 normal-case">({cat.menus.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cat.menus.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onEdit={() => { setEditingMenu(menu); setShowForm(true) }}
                  onDelete={() => deleteMenu(menu.id)}
                  onToggle={() => toggleAvailability(menu)}
                  deleting={deletingId === menu.id}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Form Modal */}
      {showForm && (
        <MenuFormModal
          restaurantId={restaurantId}
          categories={categories}
          menu={editingMenu}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}

function MenuCard({
  menu, onEdit, onDelete, onToggle, deleting,
}: {
  menu: Menu
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  deleting: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition ${!menu.isAvailable ? 'opacity-60' : ''}`}>
      {/* Foto */}
      <div className="relative h-40 bg-gray-100">
        {menu.imageUrl ? (
          <Image src={menu.imageUrl} alt={menu.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🍽️</div>
        )}
        {/* Sold Out Badge */}
        {!menu.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
          </div>
        )}
        {/* Options count */}
        {menu.menuOptions.length > 0 && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {menu.menuOptions.length} opsi
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{menu.name}</h3>
        {menu.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{menu.description}</p>
        )}
        <p className="text-base font-bold text-orange-500 mt-2">{formatRupiah(Number(menu.price))}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          {/* Toggle sold out */}
          <button
            onClick={onToggle}
            title={menu.isAvailable ? 'Tandai Sold Out' : 'Aktifkan kembali'}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition flex-1 justify-center ${
              menu.isAvailable
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            {menu.isAvailable
              ? <><ToggleRight className="w-3.5 h-3.5" /> Tersedia</>
              : <><ToggleLeft className="w-3.5 h-3.5" /> Sold Out</>
            }
          </button>

          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

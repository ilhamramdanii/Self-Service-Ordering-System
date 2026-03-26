'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Building2, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X, Check, CheckCircle2, QrCode, ShoppingBag, ImagePlus } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  address: string | null
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  _count: { tables: number; admins: number; orders: number }
}

async function uploadLogo(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  const { url } = await res.json()
  return url as string
}

export default function RestaurantsClient() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  // Add form
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newLogoUrl, setNewLogoUrl] = useState('')
  const [newLogoPreview, setNewLogoPreview] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const addLogoRef = useRef<HTMLInputElement>(null)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const [editLogoPreview, setEditLogoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const editLogoRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/restaurants')
      .then((r) => r.json())
      .then((data) => setRestaurants(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleNewLogo(file: File) {
    const url = await uploadLogo(file)
    if (url) {
      setNewLogoUrl(url)
      setNewLogoPreview(url)
    }
  }

  async function handleEditLogo(file: File) {
    const url = await uploadLogo(file)
    if (url) {
      setEditLogoUrl(url)
      setEditLogoPreview(url)
    }
  }

  async function addRestaurant() {
    if (!newName.trim()) return
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), address: newAddress.trim(), logoUrl: newLogoUrl || null }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setAddError(data.error ?? 'Gagal menambah cabang'); return }
    setNewName('')
    setNewAddress('')
    setNewLogoUrl('')
    setNewLogoPreview('')
    load()
  }

  function startEdit(r: Restaurant) {
    setEditId(r.id)
    setEditName(r.name)
    setEditAddress(r.address ?? '')
    setEditLogoUrl(r.logoUrl ?? '')
    setEditLogoPreview(r.logoUrl ?? '')
  }

  function cancelEdit() {
    setEditId(null)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    await fetch(`/api/admin/restaurants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), address: editAddress.trim(), logoUrl: editLogoUrl || null }),
    })
    setSaving(false)
    setEditId(null)
    load()
  }

  async function toggleActive(r: Restaurant) {
    await fetch(`/api/admin/restaurants/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    })
    load()
  }

  async function deleteRestaurant(id: string, name: string) {
    if (!confirm(`Yakin ingin menghapus cabang "${name}"? Semua data terkait akan ikut terhapus.`)) return
    await fetch(`/api/admin/restaurants/${id}`, { method: 'DELETE' })
    load()
  }

  const activeRestaurants   = restaurants.filter((r) => r.isActive)
  const inactiveRestaurants = restaurants.filter((r) => !r.isActive)
  const totalTables = restaurants.reduce((s, r) => s + r._count.tables, 0)
  const totalOrders = restaurants.reduce((s, r) => s + r._count.orders, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Cabang</h1>
          <p className="text-xs text-gray-500">{restaurants.length} cabang terdaftar</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Cabang</p>
            <p className="text-2xl font-bold text-indigo-600 leading-tight">{loading ? '—' : restaurants.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aktif / Nonaktif</p>
            <p className="text-2xl font-bold text-green-600 leading-tight">
              {loading ? '—' : <>{activeRestaurants.length}<span className="text-gray-300 font-normal mx-1">/</span><span className="text-gray-400">{inactiveRestaurants.length}</span></>}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Meja</p>
            <p className="text-2xl font-bold text-teal-600 leading-tight">{loading ? '—' : totalTables}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Order</p>
            <p className="text-2xl font-bold text-orange-600 leading-tight">{loading ? '—' : totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Tambah Cabang */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Tambah Cabang Baru</h2>
        <div className="space-y-3">
          {/* Upload Logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => addLogoRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 flex items-center justify-center overflow-hidden transition flex-shrink-0"
            >
              {newLogoPreview ? (
                <Image src={newLogoPreview} alt="logo" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-6 h-6 text-gray-400" />
              )}
            </button>
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700">Logo cabang</p>
              <p>Klik untuk upload (JPEG, PNG, WebP, maks 5MB)</p>
              {newLogoPreview && (
                <button
                  type="button"
                  onClick={() => { setNewLogoUrl(''); setNewLogoPreview('') }}
                  className="text-red-500 mt-1 hover:underline"
                >
                  Hapus logo
                </button>
              )}
            </div>
            <input
              ref={addLogoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleNewLogo(f) }}
            />
          </div>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRestaurant()}
            placeholder="Nama cabang (e.g. Cabang Utama, Cabang Selatan)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Alamat (opsional)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
            <button
              type="button"
              onClick={addRestaurant}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Menambah...' : 'Tambah'}
            </button>
          </div>
        </div>
        {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
      </div>

      {/* Daftar Cabang */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada cabang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition ${!r.isActive ? 'opacity-60' : ''}`}
            >
              {editId === r.id ? (
                /* Edit Mode */
                <div className="p-5 space-y-3">
                  {/* Upload Logo Edit */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => editLogoRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 flex items-center justify-center overflow-hidden transition flex-shrink-0"
                    >
                      {editLogoPreview ? (
                        <Image src={editLogoPreview} alt="logo" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <div className="text-xs text-gray-500">
                      <p className="font-medium text-gray-700">Logo cabang</p>
                      <p>Klik untuk ganti logo</p>
                      {editLogoPreview && (
                        <button
                          type="button"
                          onClick={() => { setEditLogoUrl(''); setEditLogoPreview('') }}
                          className="text-red-500 mt-1 hover:underline"
                        >
                          Hapus logo
                        </button>
                      )}
                    </div>
                    <input
                      ref={editLogoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditLogo(f) }}
                    />
                  </div>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Alamat (opsional)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(r.id)}
                      disabled={saving || !editName.trim()}
                      className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
                    >
                      <Check className="w-4 h-4" />
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 py-2 rounded-xl transition text-sm"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-100 flex items-center justify-center">
                    {r.logoUrl ? (
                      <Image src={r.logoUrl} alt={r.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{r.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {r.address && <p className="text-xs text-gray-500 truncate mt-0.5">{r.address}</p>}
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                      <span>{r._count.tables} meja</span>
                      <span>{r._count.admins} admin</span>
                      <span>{r._count.orders} order</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(r)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(r)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                        r.isActive
                          ? 'bg-green-50 hover:bg-green-100 text-green-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                      }`}
                      title={r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {r.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteRestaurant(r.id, r.name)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

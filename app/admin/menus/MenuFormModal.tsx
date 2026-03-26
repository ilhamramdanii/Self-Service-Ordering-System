'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, Upload, ImageIcon } from 'lucide-react'

interface OptionItem { label: string; additionalPrice: number }
interface MenuOptionDraft { name: string; isRequired: boolean; isMultiple: boolean; items: OptionItem[] }
interface Category { id: string; name: string }
interface MenuForEdit {
  id: string; name: string; description: string | null; price: number
  imageUrl: string | null; sortOrder: number; isAvailable: boolean
  menuOptions: { id: string; name: string; isRequired: boolean; isMultiple: boolean
    items: { id: string; label: string; additionalPrice: number }[] }[]
}

interface Props {
  restaurantId: string
  categories: Category[]
  menu: MenuForEdit | null
  onClose: () => void
  onSaved: () => void
}

export default function MenuFormModal({ restaurantId, categories, menu, onClose, onSaved }: Props) {
  const isEdit = !!menu

  const [name, setName] = useState(menu?.name ?? '')
  const [description, setDescription] = useState(menu?.description ?? '')
  const [price, setPrice] = useState(menu?.price.toString() ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [sortOrder, setSortOrder] = useState(menu?.sortOrder?.toString() ?? '0')
  const [imageUrl, setImageUrl] = useState(menu?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [options, setOptions] = useState<MenuOptionDraft[]>(
    menu?.menuOptions.map((opt) => ({
      name: opt.name,
      isRequired: opt.isRequired,
      isMultiple: opt.isMultiple,
      items: opt.items.map((item) => ({ label: item.label, additionalPrice: Number(item.additionalPrice) })),
    })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (data.url) setImageUrl(data.url)
    else setError(data.error ?? 'Upload gagal')
  }

  function addOption() {
    setOptions([...options, { name: '', isRequired: false, isMultiple: false, items: [{ label: '', additionalPrice: 0 }] }])
  }

  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx))
  }

  function updateOption(idx: number, field: keyof MenuOptionDraft, value: unknown) {
    setOptions(options.map((o, i) => i === idx ? { ...o, [field]: value } : o))
  }

  function addOptionItem(optIdx: number) {
    setOptions(options.map((o, i) =>
      i === optIdx ? { ...o, items: [...o.items, { label: '', additionalPrice: 0 }] } : o
    ))
  }

  function removeOptionItem(optIdx: number, itemIdx: number) {
    setOptions(options.map((o, i) =>
      i === optIdx ? { ...o, items: o.items.filter((_, j) => j !== itemIdx) } : o
    ))
  }

  function updateOptionItem(optIdx: number, itemIdx: number, field: keyof OptionItem, value: unknown) {
    setOptions(options.map((o, i) =>
      i === optIdx
        ? { ...o, items: o.items.map((item, j) => j === itemIdx ? { ...item, [field]: value } : item) }
        : o
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId && !isEdit) { setError('Pilih kategori'); return }
    if (!name.trim()) { setError('Nama menu wajib diisi'); return }
    if (!price || isNaN(Number(price))) { setError('Harga tidak valid'); return }

    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      imageUrl: imageUrl || null,
      sortOrder: Number(sortOrder),
      options: options.filter((o) => o.name.trim()),
      ...(!isEdit && { categoryId }),
    }

    const url = isEdit ? `/api/admin/menus/${menu!.id}` : '/api/admin/menus'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? payload : { ...payload, categoryId }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Gagal menyimpan'); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-lg">
            {isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Upload Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto Menu</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt="preview" fill className="object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    {uploading
                      ? <><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm">Mengupload...</p></>
                      : <><ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">Klik untuk upload foto</p><p className="text-xs mt-1">JPEG, PNG, WebP · Maks 5MB</p></>
                    }
                  </div>
                )}
                {imageUrl && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                        className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" /> Ganti
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImageUrl('') }}
                        className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
            </div>

            {/* Info Dasar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Menu <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="Nasi Goreng Spesial"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat menu..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp) <span className="text-red-500">*</span></label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0"
                  placeholder="25000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition" />
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori <span className="text-red-500">*</span></label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition bg-white">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Urutan Tampil</label>
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition" />
              </div>
            </div>

            {/* Add-ons / Options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Pilihan / Add-ons</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Contoh: Level Pedas, Extra Topping</p>
                </div>
                <button type="button" onClick={addOption}
                  className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition">
                  <Plus className="w-3.5 h-3.5" /> Tambah Opsi
                </button>
              </div>

              <div className="space-y-4">
                {options.map((opt, optIdx) => (
                  <div key={optIdx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start gap-3 mb-3">
                      <input type="text" value={opt.name} onChange={(e) => updateOption(optIdx, 'name', e.target.value)}
                        placeholder="Nama kelompok (e.g. Level Pedas)"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                      <button type="button" onClick={() => removeOption(optIdx)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={opt.isRequired} onChange={(e) => updateOption(optIdx, 'isRequired', e.target.checked)}
                          className="accent-orange-500" />
                        Wajib dipilih
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={opt.isMultiple} onChange={(e) => updateOption(optIdx, 'isMultiple', e.target.checked)}
                          className="accent-orange-500" />
                        Boleh pilih banyak
                      </label>
                    </div>

                    <div className="space-y-2">
                      {opt.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-2 items-center">
                          <input type="text" value={item.label} onChange={(e) => updateOptionItem(optIdx, itemIdx, 'label', e.target.value)}
                            placeholder="Nama pilihan (e.g. Pedas Level 1)"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">+Rp</span>
                            <input type="number" value={item.additionalPrice} min="0"
                              onChange={(e) => updateOptionItem(optIdx, itemIdx, 'additionalPrice', Number(e.target.value))}
                              className="w-24 pl-8 pr-2 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                          </div>
                          {opt.items.length > 1 && (
                            <button type="button" onClick={() => removeOptionItem(optIdx, itemIdx)}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addOptionItem(optIdx)}
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                        <Plus className="w-3 h-3" /> Tambah Pilihan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving || uploading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition">
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Menu'}
          </button>
        </div>
      </div>
    </div>
  )
}

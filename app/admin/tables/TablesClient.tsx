'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { QrCode, Plus, Trash2, Download, ToggleLeft, ToggleRight, X, CheckCircle2, MinusCircle } from 'lucide-react'

interface Table {
  id: string
  tableNumber: string
  qrCodeUrl: string | null
  isActive: boolean
}

export default function TablesClient({ restaurantId }: { restaurantId: string }) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [newNumber, setNewNumber] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [qrModal, setQrModal] = useState<{ table: Table; dataUrl: string } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const load = useCallback(() => {
    fetch(`/api/admin/tables?restaurantId=${restaurantId}`)
      .then((r) => r.json())
      .then((data) => setTables(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function generateQR(table: Table) {
    const url = `${appUrl}/order/${table.id}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
    setQrModal({ table, dataUrl })
  }

  function downloadQR(table: Table, dataUrl: string) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-meja-${table.tableNumber}.png`
    a.click()
  }

  async function addTable() {
    if (!newNumber.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/admin/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, tableNumber: newNumber.trim() }),
    })
    const data = await res.json()
    setAdding(false)
    if (!res.ok) { setError(data.error ?? 'Gagal menambah meja'); return }
    setNewNumber('')
    load()
  }

  async function toggleActive(table: Table) {
    await fetch(`/api/admin/tables/${table.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !table.isActive }),
    })
    load()
  }

  async function deleteTable(id: string) {
    if (!confirm('Yakin ingin menghapus meja ini?')) return
    await fetch(`/api/admin/tables/${id}`, { method: 'DELETE' })
    load()
  }

  const activeTables   = tables.filter((t) => t.isActive)
  const inactiveTables = tables.filter((t) => !t.isActive)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Meja & QR Code</h1>
          <p className="text-xs text-gray-500">{tables.length} meja terdaftar</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Meja</p>
            <p className="text-2xl font-bold text-teal-600 leading-tight">{loading ? '—' : tables.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aktif</p>
            <p className="text-2xl font-bold text-green-600 leading-tight">{loading ? '—' : activeTables.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <MinusCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Nonaktif</p>
            <p className="text-2xl font-bold text-gray-500 leading-tight">{loading ? '—' : inactiveTables.length}</p>
          </div>
        </div>
      </div>

      {/* Tambah Meja */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Tambah Meja Baru</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTable()}
            placeholder="Nomor meja (e.g. 01, VIP-1, Teras-2)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-400 transition"
          />
          <button
            type="button"
            onClick={addTable}
            disabled={adding || !newNumber.trim()}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Menambah...' : 'Tambah'}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Daftar Meja */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse h-40" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm text-gray-400">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada meja</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition ${
                !table.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* QR Preview area */}
              <button
                onClick={() => generateQR(table)}
                className="w-full bg-gray-50 hover:bg-teal-50 transition flex items-center justify-center py-6 group"
                title="Klik untuk lihat & download QR"
              >
                <div className="relative">
                  <QrCode className="w-14 h-14 text-gray-300 group-hover:text-teal-400 transition" />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-teal-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-medium">
                    Lihat QR
                  </span>
                </div>
              </button>

              <div className="px-3 pb-3 pt-4">
                <p className="font-bold text-gray-900 text-center text-lg">
                  Meja {table.tableNumber}
                </p>
                <p className={`text-xs text-center mt-0.5 ${table.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                  {table.isActive ? 'Aktif' : 'Nonaktif'}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleActive(table)}
                    title={table.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                      table.isActive
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {table.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {table.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">QR Code — Meja {qrModal.table.tableNumber}</h3>
              <button onClick={() => setQrModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {/* QR Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrModal.dataUrl} alt={`QR Meja ${qrModal.table.tableNumber}`} className="w-64 h-64 rounded-xl" />

              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">Meja {qrModal.table.tableNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5 break-all font-mono">
                  {appUrl}/order/{qrModal.table.id}
                </p>
              </div>

              <button
                onClick={() => downloadQR(qrModal.table, qrModal.dataUrl)}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, ChefHat, Clock, Bell, XCircle, ChevronLeft, Copy, Check, Utensils, CreditCard, Wallet } from 'lucide-react'

type OrderStatus = 'draft' | 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
  menu: { name: string }
  options: { id: string; label: string; additionalPrice: number }[]
}

interface Order {
  id: string
  status: OrderStatus
  paymentMethod: string | null
  paymentStatus: string
  totalPrice: number
  table: { tableNumber: string }
  orderItems: OrderItem[]
}

interface StatusInfo {
  label: string
  emoji: string
  description: string
  detail: string
  nextStep: string | null
  bgColor: string
  textColor: string
  iconBg: string
  icon: React.ReactNode
  step: number
}

const STATUS_CONFIG: Record<OrderStatus, StatusInfo> = {
  draft: {
    label: 'Menunggu Konfirmasi',
    emoji: '🕐',
    description: 'Pesanan kamu sedang menunggu konfirmasi sistem.',
    detail: 'Pesananmu sudah tercatat namun belum dikirim ke dapur. Harap tunggu sebentar.',
    nextStep: 'Pesanan akan segera masuk ke antrian dapur.',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
    icon: <Clock className="w-7 h-7 text-gray-400" />,
    step: 0,
  },
  pending: {
    label: 'Pesanan Diterima',
    emoji: '✅',
    description: 'Pesananmu sudah masuk ke dapur!',
    detail: 'Staff kami telah menerima pesananmu. Dapur akan segera mulai memproses pesananmu. Tetap di mejamu ya!',
    nextStep: 'Selanjutnya: dapur akan mulai memasak pesananmu.',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    icon: <CheckCircle2 className="w-7 h-7 text-blue-500" />,
    step: 1,
  },
  preparing: {
    label: 'Sedang Dimasak',
    emoji: '👨‍🍳',
    description: 'Dapur sedang menyiapkan pesananmu sekarang!',
    detail: 'Chef kami sedang memasak dengan penuh semangat. Mohon bersabar dan tetap di meja. Pesanan akan segera diantarkan.',
    nextStep: 'Selanjutnya: pesananmu akan segera diantarkan ke mejamu.',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    icon: <ChefHat className="w-7 h-7 text-orange-500" />,
    step: 2,
  },
  served: {
    label: 'Pesanan Tiba!',
    emoji: '🔔',
    description: 'Pesananmu sudah sampai di mejamu!',
    detail: 'Pesananmu telah diantarkan. Pastikan semua item sesuai dengan pesananmu. Jika ada yang kurang, segera hubungi staff kami.',
    nextStep: null,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
    icon: <Bell className="w-7 h-7 text-green-500" />,
    step: 3,
  },
  completed: {
    label: 'Selesai',
    emoji: '🎉',
    description: 'Terima kasih sudah makan di sini!',
    detail: 'Pesananmu telah selesai. Semoga kamu menikmati makanannya! Jangan lupa untuk melakukan pembayaran di kasir jika belum.',
    nextStep: null,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
    icon: <CheckCircle2 className="w-7 h-7 text-green-600" />,
    step: 4,
  },
  cancelled: {
    label: 'Pesanan Dibatalkan',
    emoji: '❌',
    description: 'Pesanan ini telah dibatalkan.',
    detail: 'Pesananmu tidak dapat diproses dan telah dibatalkan. Silakan hubungi staff kami di meja kasir untuk informasi lebih lanjut atau membuat pesanan baru.',
    nextStep: null,
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    iconBg: 'bg-red-100',
    icon: <XCircle className="w-7 h-7 text-red-500" />,
    step: -1,
  },
}

const PROGRESS_STEPS: OrderStatus[] = ['pending', 'preparing', 'served', 'completed']
const PROGRESS_LABELS = ['Diterima', 'Dimasak', 'Tiba', 'Selesai']

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  function copyOrderId() {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    // Load order awal
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d: Order) => setOrder(d))
      .finally(() => setLoading(false))

    // Subscribe ke SSE untuk update status real-time
    const es = new EventSource(`/api/stream/order?orderId=${orderId}`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'status_update') {
        setOrder((prev) => prev ? {
          ...prev,
          status: data.status,
          ...(data.paymentStatus ? { paymentStatus: data.paymentStatus } : {}),
        } : prev)
      }
    }

    return () => es.close()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat status pesanan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">Pesanan tidak ditemukan</p>
          <button onClick={() => router.push(`/order/${tableId}`)} className="mt-4 text-orange-500 font-semibold text-sm">
            Kembali ke Menu
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status]
  const currentStep = statusConfig.step
  const waitingPayment = order.paymentMethod === 'cashier' && order.paymentStatus !== 'paid'

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-30 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push(`/order/${tableId}`)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="font-bold text-gray-900">Status Pesanan</h1>
          <p className="text-xs text-gray-400">Meja {order.table?.tableNumber}</p>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-4">
        {/* Nomor Pesanan */}
        <div className="bg-orange-500 rounded-2xl p-4 shadow-sm">
          <p className="text-orange-100 text-xs font-medium mb-1">Nomor Pesanan</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-white font-mono font-bold text-2xl tracking-widest">
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
            <button
              type="button"
              onClick={copyOrderId}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
          <p className="text-orange-200 text-xs mt-2">
            Tunjukkan nomor ini ke kasir atau staff jika ada pertanyaan
          </p>
        </div>

        {/* Status Card — Menunggu Pembayaran (prioritas utama untuk kasir belum bayar) */}
        {waitingPayment ? (
          <div className="bg-yellow-50 rounded-2xl p-5 shadow-sm border border-yellow-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-7 h-7 text-yellow-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <h2 className="text-lg font-bold text-yellow-700">Menunggu Pembayaran</h2>
                </div>
                <p className="text-sm font-medium text-yellow-600">Pesananmu sudah tercatat!</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-white/80 rounded-xl px-4 py-3 leading-relaxed">
              Segera lakukan pembayaran di meja kasir. Tunjukkan <strong>nomor pesanan</strong> di atas kepada kasir. Pesanan akan mulai diproses setelah pembayaran dikonfirmasi.
            </p>
            <p className="text-xs mt-3 font-medium text-yellow-600">
              ⏭ Selanjutnya: kasir mengkonfirmasi pembayaranmu, lalu dapur mulai memasak.
            </p>
          </div>
        ) : (
          /* Status Card Normal */
          <div className={`rounded-2xl p-5 shadow-sm ${statusConfig.bgColor}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl ${statusConfig.iconBg} flex items-center justify-center flex-shrink-0`}>
                {statusConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{statusConfig.emoji}</span>
                  <h2 className={`text-lg font-bold ${statusConfig.textColor}`}>{statusConfig.label}</h2>
                </div>
                <p className={`text-sm font-medium ${statusConfig.textColor} opacity-80`}>{statusConfig.description}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-white/70 rounded-xl px-4 py-3 leading-relaxed">
              {statusConfig.detail}
            </p>
            {statusConfig.nextStep && (
              <p className={`text-xs mt-3 font-medium ${statusConfig.textColor} opacity-70`}>
                ⏭ {statusConfig.nextStep}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-4">Progress Pesanan</p>
            {order.paymentMethod === 'cashier' ? (
              /* Progress kasir: Bayar → Diterima → Dimasak → Tiba → Selesai */
              <div className="flex items-start justify-between">
                {(['payment', ...PROGRESS_STEPS] as const).map((step, idx) => {
                  const isPayment = step === 'payment'
                  const isPaid = order.paymentStatus === 'paid'
                  const sc = isPayment ? null : STATUS_CONFIG[step as OrderStatus]
                  const done = isPayment ? isPaid : (isPaid && currentStep > (sc?.step ?? 0))
                  const active = isPayment ? !isPaid : (isPaid && currentStep === (sc?.step ?? 0))
                  const labels = ['Bayar', 'Diterima', 'Dimasak', 'Tiba', 'Selesai']
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative">
                      {idx < PROGRESS_STEPS.length && (
                        <div className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors ${done ? 'bg-orange-400' : 'bg-gray-100'}`} />
                      )}
                      <div className={`w-7 h-7 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
                        done ? 'bg-orange-500 border-orange-500' : active ? 'bg-white border-yellow-400 ring-2 ring-yellow-200' : 'bg-white border-gray-200'
                      }`}>
                        {done && <Check className="w-3.5 h-3.5 text-white" />}
                        {active && <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isPayment ? 'bg-yellow-400' : 'bg-orange-500'}`} />}
                      </div>
                      <span className={`text-xs mt-2 text-center leading-tight font-medium ${
                        active ? (isPayment ? 'text-yellow-500' : 'text-orange-500') : done ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        {labels[idx]}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Progress online: Diterima → Dimasak → Tiba → Selesai */
              <div className="flex items-start justify-between">
                {PROGRESS_STEPS.map((step, idx) => {
                  const sc = STATUS_CONFIG[step]
                  const done = currentStep > sc.step
                  const active = currentStep === sc.step
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative">
                      {idx < PROGRESS_STEPS.length - 1 && (
                        <div className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors ${done ? 'bg-orange-400' : 'bg-gray-100'}`} />
                      )}
                      <div className={`w-7 h-7 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
                        done ? 'bg-orange-500 border-orange-500' : active ? 'bg-white border-orange-500 ring-2 ring-orange-200' : 'bg-white border-gray-200'
                      }`}>
                        {done && <Check className="w-3.5 h-3.5 text-white" />}
                        {active && <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />}
                      </div>
                      <span className={`text-xs mt-2 text-center leading-tight font-medium ${
                        active ? 'text-orange-500' : done ? 'text-gray-500' : 'text-gray-300'
                      }`}>
                        {PROGRESS_LABELS[idx]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail Pesanan */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Detail Pesanan</h3>
          <div className="space-y-2">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1 mr-2">
                  <p className="text-gray-800 font-medium">
                    {item.menu?.name} <span className="text-gray-400">x{item.quantity}</span>
                  </p>
                  {item.options?.length > 0 && (
                    <p className="text-xs text-gray-400">{item.options.map((o) => o.label).join(', ')}</p>
                  )}
                  {item.notes && <p className="text-xs text-orange-400 italic">&quot;{item.notes}&quot;</p>}
                </div>
                <span className="text-gray-600 flex-shrink-0">{formatRupiah(Number(item.subtotal))}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-500">{formatRupiah(Number(order.totalPrice))}</span>
            </div>
          </div>
        </div>

        {/* Info Bayar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <CreditCard className="w-4 h-4" />
              <span>Metode Pembayaran</span>
            </div>
            <span className="font-semibold text-gray-900">
              {order.paymentMethod === 'online' ? '💳 Online (QRIS / E-Wallet)' : '🏧 Bayar di Kasir'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Utensils className="w-4 h-4" />
              <span>Status Pembayaran</span>
            </div>
            <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
              order.paymentStatus === 'paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-600'
            }`}>
              {order.paymentStatus === 'paid' ? '✓ Sudah Dibayar' : 'Belum Dibayar'}
            </span>
          </div>
          {order.paymentStatus !== 'paid' && order.paymentMethod === 'cashier' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-700">
              💡 Silakan lakukan pembayaran di meja kasir dengan menunjukkan <strong>nomor pesanan</strong> di atas.
            </div>
          )}
        </div>

        {(order.status === 'completed' || order.status === 'served') && (
          <button onClick={() => router.push(`/order/${tableId}`)} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 transition">
            Pesan Lagi
          </button>
        )}
      </main>
    </div>
  )
}

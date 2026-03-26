import Link from 'next/link'
import { QrCode, Utensils } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
          <Utensils className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Self Service Ordering
        </h1>
        <p className="text-sm text-orange-500 font-medium mb-2">CODEEVOLUTION</p>
        <p className="text-gray-500 text-sm mb-8">
          Scan QR Code di meja Anda untuk mulai memesan
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
          <QrCode className="w-12 h-12 text-orange-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Halaman ini diakses melalui QR Code di meja restoran.
            <br />
            <span className="text-gray-400 text-xs mt-1 block">
              Format: /order/[nomor-meja]
            </span>
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/admin/dashboard"
            className="text-xs text-gray-400 hover:text-orange-500 transition"
          >
            Masuk sebagai Admin →
          </Link>
        </div>
      </div>
    </div>
  )
}

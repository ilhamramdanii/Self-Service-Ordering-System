import { NextRequest } from 'next/server'
import { subscribe, channels } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')

  if (!restaurantId) {
    return new Response('restaurantId required', { status: 400 })
  }

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Kirim heartbeat awal
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      // Subscribe ke channel dapur
      unsubscribe = subscribe(channels.kitchen(restaurantId), (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // Client disconnected
        }
      })

      // Heartbeat setiap 30 detik agar koneksi tidak terputus
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe?.()
        controller.close()
      })
    },
    cancel() {
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

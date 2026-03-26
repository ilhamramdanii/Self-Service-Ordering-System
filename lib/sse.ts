// SSE Event Bus — in-memory pub/sub untuk development lokal
// Di VPS bisa diganti Redis pub/sub untuk multi-instance

type Listener = (data: string) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribe(channel: string, listener: Listener): () => void {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set())
  }
  listeners.get(channel)!.add(listener)

  // Return unsubscribe function
  return () => {
    listeners.get(channel)?.delete(listener)
    if (listeners.get(channel)?.size === 0) {
      listeners.delete(channel)
    }
  }
}

export function publish(channel: string, data: object) {
  const channelListeners = listeners.get(channel)
  if (!channelListeners) return

  const payload = JSON.stringify(data)
  channelListeners.forEach((listener) => listener(payload))
}

// Channel naming helpers
export const channels = {
  kitchen: (restaurantId: string) => `kitchen:${restaurantId}`,
  order: (orderId: string) => `order:${orderId}`,
  cashier: (restaurantId: string) => `cashier:${restaurantId}`,
}

'use client'

import { useRef, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/types/database.types'

const ALL_ID = 'all'

interface Props {
  categories: Category[]
  activeCategory: string
  onSelect: (id: string) => void
  loading?: boolean
}

export default function CategoryTabs({ categories, activeCategory, onSelect, loading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeCategory])

  if (loading) {
    return (
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>
    )
  }

  const tabs = [{ id: ALL_ID, name: 'Semua' }, ...categories]

  return (
    <div ref={scrollRef} className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
      {tabs.map((cat) => {
        const isActive = cat.id === activeCategory
        return (
          <button
            key={cat.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelect(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}

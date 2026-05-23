'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { MenuCard } from '@/components/menu/menu-card'
import { useLanguageStore } from '@/store/language-store'
import { useMenu } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const { t, language } = useLanguageStore()
  const { items, categories, isLoading } = useMenu()

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' ||
        categories.find((c) => c.id === item.categoryId)?.slug === activeCategory
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nameTe.includes(q) ||
        item.description.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory, items, categories])

  const allCategories = [
    { id: 'all', name: t.menu.categories.all, nameTe: t.menu.categories.all, slug: 'all', icon: '🍽️' },
    ...categories,
  ]

  return (
    <div className="section py-8 md:py-12">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-10"
      >
        <h1 className={cn('text-3xl md:text-4xl font-bold text-foreground mb-2', language === 'te' ? 'font-telugu' : 'font-display')}>
          {t.menu.title}
        </h1>
        <p className={cn('text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
          {t.menu.subtitle}
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md mx-auto mb-6"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.menu.searchPlaceholder}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-card text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent',
            'placeholder:text-muted-foreground transition-all duration-200 shadow-sm',
            language === 'te' ? 'font-telugu' : ''
          )}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* Category filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide"
      >
        {allCategories.map((cat) => (
          <motion.button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border',
              activeCategory === cat.slug
                ? 'bg-brand-red text-white border-brand-red shadow-brand-sm'
                : 'bg-card text-muted-foreground border-border hover:border-brand-red/40 hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            <span className={language === 'te' ? 'font-telugu' : ''}>
              {language === 'te' ? cat.nameTe : cat.name}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Results count */}
      {search && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-4"
        >
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </motion.p>
      )}

      {/* Menu grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-48 sm:h-52 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
          >
            {filtered.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No dishes found</h3>
            <p className="text-muted-foreground text-sm">
              Try a different search or category
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all') }}
              className="mt-4 btn-outline text-sm px-4 py-2"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </div>
  )
}

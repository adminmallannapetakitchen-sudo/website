'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { Heart, RotateCcw } from 'lucide-react'
import { DishRow } from '@/components/menu/dish-row'
import { OffersBanner } from '@/components/shared/offers-banner'
import { SearchIcon, CloseIcon, BowlIcon } from '@/components/icons'
import { useLanguageStore } from '@/store/language-store'
import { useFavourites } from '@/store/favourites-store'
import { useMenu } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function MenuClient() {
  const { t, language } = useLanguageStore()
  const { items, categories, isLoading, error } = useMenu()
  const { mutate } = useSWRConfig()
  const favIds = useFavourites((s) => s.ids)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')

  const q = query.trim().toLowerCase()
  const filtering = q.length > 0 || cat !== 'all'

  const list = useMemo(() => {
    const out = items
      .filter((i) => {
        if (cat === 'all') return true
        if (cat === 'fav') return favIds.includes(i.id)
        return i.categoryId === cat
      })
      .filter((i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        (i.nameTe ?? '').includes(query.trim()) ||
        (i.description ?? '').toLowerCase().includes(q),
      )
    return [...out].sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller))
  }, [items, cat, q, query, favIds])

  const heading = q
    ? (language === 'te' ? 'ఫలితాలు' : 'Results')
    : cat === 'all'
      ? (language === 'te' ? 'అన్ని వంటకాలు' : 'All dishes')
      : (() => { const c = categories.find((x) => x.id === cat); return c ? (language === 'te' ? c.nameTe : c.name) : '' })()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="px-5 pt-6 pb-1">
        <h1 className={cn('text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
          {t.menu.title}
        </h1>
        <p className={cn('text-sm text-muted-foreground mt-1', language === 'te' ? 'font-telugu' : '')}>
          {t.menu.subtitle}
        </p>
      </header>

      <OffersBanner />

      {/* sticky search + categories */}
      <div className="sticky top-16 md:top-[72px] z-30 bg-background/95 backdrop-blur-md px-5 pt-3 pb-3 border-b border-border/60">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.menu.searchPlaceholder}
            className={cn('w-full h-12 pl-11 pr-10 rounded-2xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-transparent', language === 'te' ? 'font-telugu' : '')}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground" aria-label="Clear search">
              <CloseIcon size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
          <button
            onClick={() => setCat('all')}
            className={cn('shrink-0 px-4 h-10 rounded-full text-[13px] font-medium border transition-colors', cat === 'all' ? 'bg-brand-red text-white border-brand-red' : 'bg-card text-foreground/70 border-border', language === 'te' ? 'font-telugu' : '')}
          >
            {t.menu.categories.all}
          </button>
          {mounted && favIds.length > 0 && (
            <button
              onClick={() => setCat('fav')}
              className={cn('shrink-0 px-4 h-10 rounded-full text-[13px] font-medium border transition-colors inline-flex items-center gap-1.5', cat === 'fav' ? 'bg-brand-red text-white border-brand-red' : 'bg-card text-foreground/70 border-border', language === 'te' ? 'font-telugu' : '')}
            >
              <Heart className={cn('w-3.5 h-3.5', cat === 'fav' ? 'fill-white' : 'fill-brand-red text-brand-red')} />
              {language === 'te' ? 'ఇష్టమైనవి' : 'Favourites'}
            </button>
          )}
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn('shrink-0 px-4 h-10 rounded-full text-[13px] font-medium border transition-colors', cat === c.id ? 'bg-brand-red text-white border-brand-red' : 'bg-card text-foreground/70 border-border', language === 'te' ? 'font-telugu' : '')}
            >
              {language === 'te' ? c.nameTe : c.name}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="px-5 pt-5 pb-6">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className={cn('text-base font-semibold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>{heading}</h2>
          {!isLoading && <span className="text-xs text-muted-foreground">{list.length} {language === 'te' ? 'వంటకాలు' : 'items'}</span>}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex gap-3.5 py-4">
                <div className="skeleton w-[88px] h-[88px] rounded-2xl" />
                <div className="flex-1 space-y-2 py-1"><div className="skeleton h-4 w-1/2" /><div className="skeleton h-3 w-3/4" /><div className="skeleton h-7 w-24 mt-3" /></div>
              </div>
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="py-16 text-center">
            <BowlIcon size={40} className="mx-auto text-muted-foreground/40" />
            <p className={cn('mt-3 text-sm text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? 'మెను లోడ్ కాలేదు' : 'Couldn’t load the menu'}
            </p>
            <button
              onClick={() => { mutate('/menu/items'); mutate('/categories') }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red"
            >
              <RotateCcw className="w-4 h-4" /> {language === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Try again'}
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <BowlIcon size={40} className="mx-auto text-muted-foreground/40" />
            <p className={cn('mt-3 text-sm text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>{language === 'te' ? 'ఏ వంటకం దొరకలేదు' : 'No dishes found'}</p>
            {filtering && <button onClick={() => { setQuery(''); setCat('all') }} className="mt-3 text-sm font-semibold text-brand-red">{language === 'te' ? 'క్లియర్ చేయండి' : 'Clear filters'}</button>}
          </div>
        ) : (
          <div className="divide-y divide-border/60">{list.map((item) => <DishRow key={item.id} item={item} />)}</div>
        )}
      </div>
    </div>
  )
}

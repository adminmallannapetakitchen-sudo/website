'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { PlusIcon, MinusIcon, StarIcon } from '@/components/icons'
import { DishQuickView } from '@/components/menu/dish-quick-view'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { useFavourites } from '@/store/favourites-store'
import { formatCurrency, cn } from '@/lib/utils'
import { cardImage } from '@/lib/food-images'
import { toast } from 'sonner'
import type { UiMenuItem } from '@/lib/hooks'

export function DishRow({ item }: { item: UiMenuItem }) {
  const { language } = useLanguageStore()
  const { addItem, items, updateQty } = useCartStore()
  // Subscribe to `ids` (not the `has` fn) so the heart re-renders on toggle.
  const favIds = useFavourites((s) => s.ids)
  const favToggle = useFavourites((s) => s.toggle)
  const [selectedId, setSelectedId] = useState(item.variants[0]?.id)
  // localStorage favourites are client-only — guard against hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isFav = mounted && favIds.includes(item.id)
  const [quickView, setQuickView] = useState(false)

  const variant = item.variants.find((v) => v.id === selectedId) ?? item.variants[0]
  const cartKey = `${item.id}-${selectedId}`
  const cartItem = items.find((i) => i.id === cartKey)

  const name = language === 'te' ? item.nameTe : item.name
  const desc = language === 'te' ? item.descriptionTe : item.description
  const img = item.image || cardImage(item.id)
  // If the stored image URL fails to load (e.g. a stale /uploads path from
  // before Cloudinary was configured), fall back to the curated dish photo
  // instead of showing a broken-image icon.
  const [imgBroken, setImgBroken] = useState(false)
  const displaySrc = imgBroken ? cardImage(item.id) : img

  const add = () => {
    if (!item.isAvailable || !variant) return
    addItem({
      id: cartKey,
      menuItemId: item.id,
      name: item.name,
      nameTe: item.nameTe,
      variantId: variant.id,
      variantLabel: variant.label,
      price: variant.price,
      image: img,
      isVeg: item.isVeg,
    })
    toast.success(language === 'te' ? `${item.nameTe} జోడించారు` : `${item.name} added`, { duration: 1500 })
  }

  return (
    <>
    <div className={cn('flex gap-3.5 py-4', !item.isAvailable && 'opacity-60')}>
      {/* photo (tap to quick-view) */}
      <div onClick={() => setQuickView(true)} className="relative w-[96px] h-[96px] rounded-2xl overflow-hidden shrink-0 bg-muted self-start cursor-pointer">
        <Image src={displaySrc} alt={item.name} fill sizes="96px" className="object-cover" onError={() => setImgBroken(true)} />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-foreground/55 flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-semibold text-center leading-tight">{language === 'te' ? 'అందుబాటులో లేదు' : 'Unavailable'}</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); favToggle(item.id) }}
          aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
          className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <Heart className={cn('w-4 h-4 transition-colors', isFav ? 'fill-brand-red text-brand-red' : 'text-white')} />
        </button>
      </div>

      {/* info — price + action pinned to the bottom so every row reads uniform */}
      <div className="flex-1 min-w-0 flex flex-col min-h-[96px]">
        <div className="flex items-center gap-2">
          <span className={cn('w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0', item.isVeg ? 'border-green-600' : 'border-red-700')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', item.isVeg ? 'bg-green-600' : 'bg-red-700')} />
          </span>
          {item.isBestseller && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-red">
              <StarIcon filled size={11} className="text-brand-gold" /> {language === 'te' ? 'పాపులర్' : 'Popular'}
            </span>
          )}
        </div>

        <h3 onClick={() => setQuickView(true)} className={cn('mt-1 text-[15px] font-semibold text-foreground leading-snug line-clamp-2 cursor-pointer', language === 'te' ? 'font-telugu' : 'font-display')}>
          {name}
        </h3>
        {desc && (
          <p className={cn('text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-0.5', language === 'te' ? 'font-telugu' : '')}>
            {desc}
          </p>
        )}

        {/* variant chips (only when there's more than one size) */}
        {item.variants.length > 1 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {item.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  'text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                  selectedId === v.id ? 'border-brand-red text-brand-red bg-brand-red/5' : 'border-border text-muted-foreground',
                )}
              >
                <span className={language === 'te' ? 'font-telugu' : ''}>{language === 'te' ? v.labelTe : v.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* price + add — pinned bottom, aligned with the photo */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-foreground font-display tabular-nums">
            {formatCurrency(variant?.price ?? 0)}
          </span>

          {!item.isAvailable ? (
            <span className="h-10 px-4 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center bg-muted text-muted-foreground">
              {language === 'te' ? 'అందుబాటులో లేదు' : 'Unavailable'}
            </span>
          ) : (
          <AnimatePresence mode="wait" initial={false}>
            {cartItem ? (
              <motion.div
                key="qty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14 }}
                className="flex items-center bg-brand-red rounded-full text-white h-10 shadow-brand-sm"
              >
                <button onClick={() => updateQty(cartKey, cartItem.qty - 1)} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform" aria-label="Decrease">
                  <MinusIcon size={16} />
                </button>
                <span className="w-5 text-center text-sm font-bold tabular-nums">{cartItem.qty}</span>
                <button onClick={() => updateQty(cartKey, cartItem.qty + 1)} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform" aria-label="Increase">
                  <PlusIcon size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14 }}
                onClick={add}
                className="h-10 px-6 rounded-full text-sm font-bold uppercase tracking-wide inline-flex items-center gap-1.5 transition-transform active:scale-95 bg-brand-red text-white shadow-brand-sm"
              >
                {language === 'te' ? 'జోడించు' : 'Add'} <PlusIcon size={15} />
              </motion.button>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>

    <DishQuickView
      item={item}
      image={displaySrc}
      open={quickView}
      onClose={() => setQuickView(false)}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onAdd={() => { add(); setQuickView(false) }}
    />
    </>
  )
}

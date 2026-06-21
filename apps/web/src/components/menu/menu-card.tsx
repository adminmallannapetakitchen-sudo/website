'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Check, Star, Zap } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { formatCurrency, cn } from '@/lib/utils'
import { cardImage } from '@/lib/food-images'
import { toast } from 'sonner'

interface Variant {
  id: string
  label: string
  labelTe: string
  price: number
}

interface MenuCardProps {
  id: string
  name: string
  nameTe: string
  description: string
  descriptionTe: string
  isVeg: boolean
  isAvailable: boolean
  isBestseller: boolean
  isSundaySpecial: boolean
  image?: string
  variants: Variant[]
}

export function MenuCard({
  id, name, nameTe, description, descriptionTe,
  isVeg, isAvailable, isBestseller, isSundaySpecial, image, variants,
}: MenuCardProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id)
  const [justAdded,  setJustAdded]  = useState(false)
  const { addItem, items, updateQty } = useCartStore()
  const { language } = useLanguageStore()

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? variants[0]
  const cartKey  = `${id}-${selectedId}`
  const cartItem = items.find((i) => i.id === cartKey)
  const inCart   = !!cartItem

  const displayName  = language === 'te' ? nameTe       : name
  const displayDesc  = language === 'te' ? descriptionTe: description
  const variantLabel = (v: Variant) => language === 'te' ? v.labelTe : v.label

  const placeholderImg = cardImage(id)
  const [imgBroken, setImgBroken] = useState(false)
  const displaySrc = imgBroken ? placeholderImg : (image || placeholderImg)

  const handleAdd = () => {
    if (!isAvailable) return
    addItem({
      id: cartKey,
      menuItemId: id,
      name, nameTe,
      variantId: selectedId,
      variantLabel: selectedVariant.label,
      price: selectedVariant.price,
      image: image || placeholderImg,
      isVeg,
    })
    setJustAdded(true)
    toast.success(
      language === 'te' ? `${nameTe} కార్ట్‌కి జోడించారు!` : `${name} added to cart!`,
      { duration: 1800 }
    )
    setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={isAvailable ? { y: -4 } : {}}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'card overflow-hidden flex flex-col group hover:shadow-card-hover',
        !isAvailable && 'opacity-60'
      )}
    >
      {/* ── Image ── */}
      <div className="relative h-52 sm:h-56 overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={displaySrc}
          alt={name}
          fill
          onError={() => setImgBroken(true)}
          className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* gradient for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-foreground/5" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isBestseller && (
            <span className="inline-flex items-center gap-1 bg-card/95 backdrop-blur-sm text-brand-red text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full shadow-sm">
              <Star className="w-2.5 h-2.5 fill-brand-gold text-brand-gold" /> Bestseller
            </span>
          )}
          {isSundaySpecial && (
            <span className="inline-flex items-center gap-1 bg-brand-red text-white text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full shadow-sm">
              <Zap className="w-2.5 h-2.5 fill-current" /> Sunday
            </span>
          )}
        </div>

        {/* Top-right veg indicator */}
        <div className="absolute top-3 right-3">
          <div className={cn(
            'w-5 h-5 bg-white rounded-[5px] border-2 flex items-center justify-center shadow-sm',
            isVeg ? 'border-green-600' : 'border-red-700'
          )}>
            <div className={cn('w-2 h-2 rounded-full', isVeg ? 'bg-green-600' : 'bg-red-700')} />
          </div>
        </div>

        {/* Unavailable overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-foreground/45 flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-foreground/60 px-4 py-1.5 rounded-full tracking-wide">
              {language === 'te' ? <span className="font-telugu">అందుబాటులో లేదు</span> : 'Sold out'}
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 md:p-5 gap-3">

        {/* Name + desc */}
        <div className="flex-1">
          <h3 className={cn(
            'text-foreground text-lg leading-snug font-semibold',
            language === 'te' ? 'font-telugu' : 'font-display'
          )}>
            {displayName}
          </h3>
          <p className={cn(
            'text-[12.5px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed',
            language === 'te' ? 'font-telugu' : ''
          )}>
            {displayDesc}
          </p>
        </div>

        {/* Variant pills */}
        {variants.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  'text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors duration-150',
                  selectedId === v.id
                    ? 'bg-brand-red text-white border-brand-red'
                    : 'border-border text-muted-foreground hover:border-brand-red/40 hover:text-foreground bg-card'
                )}
              >
                <span className={language === 'te' ? 'font-telugu' : ''}>{variantLabel(v)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Price + action row */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 -mx-4 md:-mx-5 px-4 md:px-5 pt-3.5 mt-1">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground leading-none font-display">
              {formatCurrency(selectedVariant?.price ?? 0)}
            </span>
            {variants.length > 1 && (
              <span className={cn('text-[10px] text-muted-foreground mt-1', language === 'te' ? 'font-telugu' : '')}>
                {variantLabel(selectedVariant)}
              </span>
            )}
          </div>

          {/* Cart control */}
          <AnimatePresence mode="wait">
            {inCart && cartItem ? (
              <motion.div
                key="qty"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-0 bg-brand-red rounded-2xl overflow-hidden shadow-brand-sm"
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateQty(cartKey, cartItem.qty - 1)}
                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-brand-red-dark transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={cartItem.qty}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="w-8 text-center text-sm font-extrabold text-white"
                  >
                    {cartItem.qty}
                  </motion.span>
                </AnimatePresence>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateQty(cartKey, cartItem.qty + 1)}
                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-brand-red-dark transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleAdd}
                disabled={!isAvailable}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200',
                  isAvailable
                    ? 'bg-brand-red text-white shadow-brand-sm hover:bg-brand-red-dark hover:shadow-brand hover:-translate-y-0.5'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      {language === 'te' ? <span className="font-telugu">జోడించారు</span> : 'Added'}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add-btn"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'te' ? <span className="font-telugu">జోడించు</span> : 'Add'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  )
}

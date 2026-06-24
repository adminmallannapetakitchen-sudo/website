'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PlusIcon } from '@/components/icons'
import { useLanguageStore } from '@/store/language-store'
import { formatCurrency, cn } from '@/lib/utils'
import type { UiMenuItem } from '@/lib/hooks'

/** Tap-to-expand: full photo + description + variant choice before adding. */
export function DishQuickView({
  item,
  image,
  open,
  onClose,
  selectedId,
  onSelect,
  onAdd,
}: {
  item: UiMenuItem
  image: string
  open: boolean
  onClose: () => void
  selectedId?: string
  onSelect: (id: string) => void
  onAdd: () => void
}) {
  const { language } = useLanguageStore()
  const variant = item.variants.find((v) => v.id === selectedId) ?? item.variants[0]
  const name = language === 'te' ? item.nameTe : item.name
  const desc = language === 'te' ? item.descriptionTe : item.description

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-lg rounded-t-3xl bg-card shadow-float md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl overflow-hidden"
          >
            <div className="relative h-52 w-full bg-muted">
              <Image src={image} alt={item.name} fill sizes="(max-width:768px) 100vw, 512px" className="object-cover" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2">
                <span className={cn('w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center', item.isVeg ? 'border-green-600' : 'border-red-700')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', item.isVeg ? 'bg-green-600' : 'bg-red-700')} />
                </span>
                <h2 className={cn('text-lg font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>{name}</h2>
              </div>
              {desc && (
                <p className={cn('text-sm text-muted-foreground leading-relaxed mt-2', language === 'te' ? 'font-telugu' : '')}>
                  {desc}
                </p>
              )}

              {item.variants.length > 1 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {item.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onSelect(v.id)}
                      className={cn(
                        'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                        selectedId === v.id ? 'border-brand-red text-brand-red bg-brand-red/5' : 'border-border text-muted-foreground',
                        language === 'te' ? 'font-telugu' : '',
                      )}
                    >
                      {language === 'te' ? v.labelTe : v.label} · {formatCurrency(v.price)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mt-5">
                <span className="text-xl font-bold text-foreground font-display tabular-nums">{formatCurrency(variant?.price ?? 0)}</span>
                {item.isAvailable ? (
                  <button
                    onClick={onAdd}
                    className="h-11 px-7 rounded-full text-sm font-bold uppercase tracking-wide inline-flex items-center gap-1.5 bg-brand-red text-white shadow-brand-sm active:scale-95 transition-transform"
                  >
                    {language === 'te' ? 'జోడించు' : 'Add to cart'} <PlusIcon size={16} />
                  </button>
                ) : (
                  <span className="h-11 px-5 rounded-full text-xs font-bold uppercase inline-flex items-center bg-muted text-muted-foreground">
                    {language === 'te' ? 'అందుబాటులో లేదు' : 'Unavailable'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

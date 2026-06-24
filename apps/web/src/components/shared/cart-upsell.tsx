'use client'

import Image from 'next/image'
import { useMenu } from '@/lib/hooks'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { cardImage } from '@/lib/food-images'
import { formatCurrency, cn } from '@/lib/utils'
import { PlusIcon } from '@/components/icons'
import { toast } from 'sonner'
import type { UiMenuItem } from '@/lib/hooks'

/** "You might also like" — a few available bestsellers not already in the cart. */
export function CartUpsell() {
  const { items: menu } = useMenu()
  const { items: cart, addItem } = useCartStore()
  const { language } = useLanguageStore()

  const inCart = new Set(cart.map((c) => c.menuItemId))
  const suggestions = menu
    .filter((m) => m.isAvailable && m.variants.length > 0 && !inCart.has(m.id))
    .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller))
    .slice(0, 6)

  if (suggestions.length === 0) return null

  const add = (m: UiMenuItem) => {
    const v = m.variants[0]
    addItem({
      id: `${m.id}-${v.id}`,
      menuItemId: m.id,
      name: m.name,
      nameTe: m.nameTe,
      variantId: v.id,
      variantLabel: v.label,
      price: v.price,
      image: m.image || cardImage(m.id),
      isVeg: m.isVeg,
    })
    toast.success(language === 'te' ? `${m.nameTe} జోడించారు` : `${m.name} added`, { duration: 1400 })
  }

  return (
    <div className="card p-4">
      <h3 className={cn('font-semibold text-foreground mb-3', language === 'te' ? 'font-telugu' : '')}>
        {language === 'te' ? 'ఇవి కూడా నచ్చవచ్చు' : 'You might also like'}
      </h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {suggestions.map((m) => (
          <div key={m.id} className="shrink-0 w-32">
            <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-muted">
              <Image src={m.image || cardImage(m.id)} alt={m.name} fill sizes="128px" className="object-cover" />
            </div>
            <p className={cn('text-xs font-medium text-foreground mt-1.5 line-clamp-1', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? m.nameTe : m.name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-foreground tabular-nums">{formatCurrency(m.variants[0].price)}</span>
              <button
                onClick={() => add(m)}
                aria-label="Add"
                className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center active:scale-90 transition-transform"
              >
                <PlusIcon size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

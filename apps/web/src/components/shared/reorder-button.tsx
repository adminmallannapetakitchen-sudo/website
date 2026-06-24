'use client'

import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderItemLike {
  qty: number
  itemSnapshot?: any
  variantSnapshot?: any
}

/**
 * One-tap reorder: re-adds a past order's items (from their snapshots) to the
 * cart and sends the customer to /cart. Prices are re-validated server-side at
 * checkout, so a stale snapshot price is only an estimate.
 */
export function ReorderButton({
  items,
  className,
  full,
}: {
  items: OrderItemLike[]
  className?: string
  full?: boolean
}) {
  const router = useRouter()
  const addItemQty = useCartStore((s) => s.addItemQty)
  const { language } = useLanguageStore()

  const reorder = (e: React.MouseEvent) => {
    // The orders-list card is wrapped in a Link — don't navigate to detail.
    e.preventDefault()
    e.stopPropagation()

    let added = 0
    for (const it of items ?? []) {
      const snap = it.itemSnapshot ?? {}
      const vsnap = it.variantSnapshot ?? {}
      if (!snap.id || !vsnap.id) continue
      addItemQty(
        {
          menuItemId: snap.id,
          variantId: vsnap.id,
          name: snap.name ?? 'Item',
          nameTe: snap.nameTe ?? snap.name ?? 'Item',
          variantLabel: vsnap.label ?? '',
          price: Number(vsnap.price ?? 0),
          image: snap.imageUrl ?? undefined,
          isVeg: !!snap.isVeg,
        },
        it.qty ?? 1,
      )
      added++
    }

    if (added === 0) {
      toast.error(language === 'te' ? 'మళ్లీ ఆర్డర్ చేయలేకపోయాం' : 'Could not reorder these items')
      return
    }
    toast.success(language === 'te' ? 'కార్ట్‌కి జోడించారు' : 'Items added to cart')
    router.push('/cart')
  }

  return (
    <button
      onClick={reorder}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors',
        full ? 'w-full px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
        'bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white',
        className,
      )}
    >
      <RotateCcw className={full ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span className={language === 'te' ? 'font-telugu' : ''}>
        {language === 'te' ? 'మళ్లీ ఆర్డర్' : 'Order again'}
      </span>
    </button>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { formatCurrency, cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function FloatingCartBar() {
  const { total, itemCount }        = useCartStore()
  const { language }                = useLanguageStore()
  const pathname                    = usePathname()

  // The cart store rehydrates from localStorage on the client's first render,
  // so gate on mount to keep SSR and first client render identical (no mismatch).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const count     = itemCount()
  const totalAmt  = total()
  const hideOn    = ['/cart', '/checkout'].some((p) => pathname.startsWith(p))

  return (
    <AnimatePresence>
      {mounted && count > 0 && !hideOn && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          /* Sits above the bottom nav on mobile, hidden on desktop (they use the header cart) */
          className="fixed bottom-[88px] left-3 right-3 z-40 md:hidden"
        >
          <Link href="/cart">
            <div className="flex items-center justify-between bg-brand-gradient rounded-2xl px-4 py-3.5 shadow-brand-lg">
              {/* Left — count badge + label */}
              <div className="flex items-center gap-3">
                <div className="relative bg-white/20 rounded-xl p-2">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-gold text-amber-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                </div>
                <div>
                  <p className="text-white text-xs font-medium opacity-80">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                  <p className={cn('text-white font-bold text-sm', language === 'te' ? 'font-telugu' : '')}>
                    {language === 'te' ? 'కార్ట్ చూడండి' : 'View Cart'}
                  </p>
                </div>
              </div>

              {/* Right — total */}
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-base">
                  {formatCurrency(totalAmt)}
                </span>
                <div className="bg-white/25 rounded-xl p-1.5">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

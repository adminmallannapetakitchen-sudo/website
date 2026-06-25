'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { PlusIcon, MinusIcon, ArrowRightIcon, BagIcon, BowlIcon } from '@/components/icons'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useKitchenSettings } from '@/lib/hooks'
import { CartUpsell } from '@/components/shared/cart-upsell'
import { CouponBox } from '@/components/shared/coupon-box'

export default function CartPage() {
  const { t, language } = useLanguageStore()
  const { items, updateQty, removeItem, subtotal, couponDiscount } = useCartStore()
  const { settings } = useKitchenSettings()

  // Delivery fee comes from the real kitchen settings (was hardcoded ₹40,
  // which disagreed with the live ₹60 and the checkout total).
  const deliveryFee = settings ? Number(settings.deliveryFee) : null
  const sub = subtotal()
  // The coupon is now validated instantly when applied (CouponBox), so the
  // discount is a real, server-checked value — safe to reflect in the cart.
  const discount = sub > 0 ? Math.min(couponDiscount, sub) : 0
  const total = Math.max(0, sub - discount) + (sub > 0 && deliveryFee !== null ? deliveryFee : 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16 pb-nav flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-6 w-20 h-20 rounded-full bg-muted flex items-center justify-center"
            >
              <BagIcon size={36} className="text-brand-red" />
            </motion.div>
            <h2 className={cn('text-2xl font-bold text-foreground mb-2', language === 'te' ? 'font-telugu' : '')}>
              {t.cart.empty}
            </h2>
            <p className={cn('text-muted-foreground mb-6', language === 'te' ? 'font-telugu' : '')}>
              {t.cart.emptySubtitle}
            </p>
            <Link href="/menu">
              <Button size="lg" icon={<BowlIcon size={18} />}>
                <span className={language === 'te' ? 'font-telugu' : ''}>{t.cart.browseMenu}</span>
              </Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 pb-nav">
        <div className="section py-8 md:py-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('text-2xl md:text-3xl font-bold text-foreground mb-8', language === 'te' ? 'font-telugu' : 'font-display')}
          >
            {t.cart.title}
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="card p-4 flex gap-4"
                  >
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><BowlIcon size={28} /></div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn('font-semibold text-foreground truncate', language === 'te' ? 'font-telugu' : '')}>
                        {language === 'te' ? item.nameTe : item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>
                      <div className="flex items-center justify-between mt-3">
                        {/* Qty */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-brand-red hover:text-white transition-colors"
                          >
                            <MinusIcon size={12} />
                          </motion.button>
                          <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-red text-white hover:bg-brand-red-dark transition-colors"
                          >
                            <PlusIcon size={12} />
                          </motion.button>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    </div>

                    {/* Remove */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <CartUpsell />
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              {/* Coupons & offers — instant validation */}
              <CouponBox subtotal={sub} />

              {/* Price breakdown */}
              <div className="card p-4 space-y-3">
                <h3 className={cn('font-semibold text-foreground', language === 'te' ? 'font-telugu' : '')}>
                  {t.checkout.orderSummary}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.cart.subtotal}</span>
                    <span>{formatCurrency(sub)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{language === 'te' ? 'కూపన్ తగ్గింపు' : 'Coupon discount'}</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.cart.delivery}</span>
                    <span>
                      {sub === 0
                        ? t.cart.free
                        : deliveryFee === null
                          ? '—'
                          : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>{t.cart.total}</span>
                  <span className="text-brand-red">{formatCurrency(total)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {language === 'te' ? 'తుది మొత్తం చెక్‌అవుట్‌లో నిర్ధారించబడుతుంది.' : 'Final total is confirmed at checkout.'}
                </p>
                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg" iconRight={<ArrowRightIcon size={18} />}>
                    <span className={language === 'te' ? 'font-telugu' : ''}>{t.cart.checkout}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

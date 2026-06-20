'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HomeIcon, BowlIcon, BagIcon, ReceiptIcon, UserIcon } from '@/components/icons'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',               icon: HomeIcon,    labelEn: 'Home',   labelTe: 'హోమ్',   exact: true  },
  { href: '/menu',           icon: BowlIcon,    labelEn: 'Menu',   labelTe: 'మెను',   exact: false },
  { href: '/cart',           icon: BagIcon,     labelEn: 'Cart',   labelTe: 'కార్ట్', exact: false, isCart: true },
  { href: '/account/orders', icon: ReceiptIcon, labelEn: 'Orders', labelTe: 'ఆర్డర్లు',exact: false },
  { href: '/login',          icon: UserIcon,    labelEn: 'Account',labelTe: 'అకౌంట్', exact: false },
]

export function BottomNav() {
  const pathname  = usePathname()
  const itemCount = useCartStore((s) => s.itemCount())
  const { language } = useLanguageStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Frosted glass background — edge-to-edge on mobile, floating dock on desktop */}
      <div className="mx-3 mb-3 md:mx-auto md:mb-5 md:max-w-[520px] rounded-3xl glass shadow-nav border border-white/60 overflow-hidden">
        <div className="flex items-center justify-around px-1 py-1.5 md:px-2 md:py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            const label  = language === 'te' ? item.labelTe : item.labelEn

            if (item.isCart) {
              /* ── Centre cart pill ── */
              return (
                <Link key={item.href} href={item.href} className="relative flex-1 flex justify-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300',
                      active
                        ? 'bg-brand-gradient shadow-brand text-white'
                        : 'bg-brand-red/10 text-brand-red'
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />

                    {/* Cart count badge */}
                    <AnimatePresence>
                      {mounted && itemCount > 0 && (
                        <motion.span
                          key={itemCount}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-saffron text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-warm-sm"
                        >
                          {itemCount > 9 ? '9+' : itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors duration-200 group"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 transition-all duration-200',
                    active ? 'text-brand-red' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {/* Active background pill */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-x-1 inset-y-0.5 bg-brand-red/8 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}

                  <item.icon
                    className="w-5 h-5 transition-all duration-200"
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium leading-none transition-all duration-200',
                      active ? 'text-brand-red' : 'text-muted-foreground',
                      language === 'te' ? 'font-telugu text-[9px]' : ''
                    )}
                  >
                    {label}
                  </span>

                  {/* Active dot */}
                  {active && (
                    <motion.span
                      layoutId="nav-dot"
                      className="w-1 h-1 rounded-full bg-brand-red mt-0.5"
                      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

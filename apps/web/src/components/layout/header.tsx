'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Menu, X, User, ChevronDown,
  LogOut, Package, Settings, Home, UtensilsCrossed, Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { useAuthStore } from '@/store/auth-store'
import { useKitchenSettings } from '@/lib/hooks'
import { logout } from '@/lib/auth-actions'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { cn } from '@/lib/utils'
import { kitchenInfo } from '@/lib/mock-data'

export function Header() {
  const [scrolled, setScrolled]       = useState(false)
  const [atTop, setAtTop]             = useState(true)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted]         = useState(false)
  const { t, language }               = useLanguageStore()
  const itemCount                     = useCartStore((s) => s.itemCount())
  const router                        = useRouter()
  const { user, hasHydrated }         = useAuthStore()
  const { settings }                  = useKitchenSettings()

  // settings is undefined on the server + first client render → consistent.
  // Default to open until the live value loads.
  const kitchenOpen = settings ? !!settings.isOpen : true

  const loggedIn = hasHydrated && !!user
  const isStaff  = !!user && user.role !== 'CUSTOMER'
  const displayName = user?.name || user?.email?.split('@')[0] || user?.phone || 'Account'

  useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    await logout()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      setAtTop(window.scrollY < 4)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('no-scroll', mobileOpen)
    return () => document.body.classList.remove('no-scroll')
  }, [mobileOpen])

  const desktopLinks = [
    { href: '/',              label: t.nav.home },
    { href: '/menu',          label: t.nav.menu },
    { href: '/sunday-special',label: t.nav.sundaySpecial },
  ]

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'header-blur shadow-sm' : 'bg-transparent'
        )}
      >
        <div className="section">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* ── Logo ── */}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-brand-red/20 group-hover:ring-brand-red/50 transition-all shadow-brand-sm"
              >
                <Image
                  src="/logo.jpeg"
                  alt="Mallannapeta Kitchen"
                  fill className="object-cover"
                  sizes="40px" priority
                />
              </motion.div>
              <div className="hidden sm:block leading-tight">
                <p className={cn(
                  'font-bold text-foreground text-sm md:text-base',
                  language === 'te' ? 'font-telugu' : 'font-display'
                )}>
                  {language === 'te' ? 'మల్లన్నపేట కిచెన్' : 'Mallannapeta Kitchen'}
                </p>
                <div className="flex items-center gap-1.5">
                  {kitchenOpen ? (
                    <>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      <span className="text-[10px] text-green-700 font-medium">
                        {language === 'te' ? 'తెరిచి ఉంది' : 'Open now'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-red-600 font-medium">
                      {language === 'te' ? 'మూసివేయబడింది' : 'Closed'}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1">
              {desktopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                    'text-foreground/70 hover:text-foreground hover:bg-muted',
                    language === 'te' ? 'font-telugu' : ''
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <LanguageToggle compact className="hidden sm:flex" />

              {/* Cart — desktop only (mobile uses bottom nav) */}
              <Link
                href="/cart"
                className="relative hidden md:flex p-2.5 rounded-xl hover:bg-muted transition-colors group"
              >
                <ShoppingCart className="w-5 h-5 text-foreground/70 group-hover:text-foreground" />
                <AnimatePresence>
                  {mounted && itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* User menu — desktop */}
              <div className="relative hidden md:block">
                {loggedIn ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold shadow-brand-sm uppercase">
                        {displayName[0]}
                      </div>
                      <span className="max-w-[100px] truncate text-foreground/80">{displayName.split(' ')[0]}</span>
                      <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 card p-1.5 shadow-float"
                        >
                          <div className="px-3 py-2 border-b border-border mb-1">
                            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email ?? user?.phone}</p>
                          </div>
                          {[
                            { href: '/account/orders',  icon: Package,  label: t.account.orders  },
                            { href: '/admin',            icon: Settings, label: t.nav.admin, staffOnly: true },
                          ].filter((i) => !i.staffOnly || isStaff).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                            >
                              <item.icon className="w-4 h-4 text-muted-foreground" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-border mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors w-full text-red-600"
                            >
                              <LogOut className="w-4 h-4" />
                              {t.nav.logout}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-3.5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-xl hover:bg-muted">
                      {t.nav.login}
                    </Link>
                    <Link href="/register" className="btn-brand !px-4 !py-2 !text-xs">
                      {t.auth.signUp}
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile — language + hamburger */}
              <LanguageToggle compact className="flex sm:hidden" />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ──
           Wrapped in a fixed, overflow-hidden layer so the panel's off-screen
           slide (x:100%) is CLIPPED rather than creating page-level horizontal
           scroll. A position:fixed panel escapes html/body overflow-x:clip
           (its containing block is the viewport); an absolute child, however,
           is clipped by this fixed layer. */}
      <div className="md:hidden pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="pointer-events-auto absolute top-0 right-0 bottom-0 w-72 bg-background shadow-float flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-red/20">
                    <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="36px" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {language === 'te' ? 'మల్లన్నపేట' : 'Mallannapeta'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {language === 'te' ? 'కిచెన్' : 'Kitchen'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Kitchen status pill */}
              <div className="px-4 pt-4">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium',
                  kitchenOpen
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                )}>
                  <span className={cn('w-2 h-2 rounded-full', kitchenOpen ? 'bg-green-500' : 'bg-red-500')} />
                  <span className={language === 'te' ? 'font-telugu' : ''}>
                    {kitchenOpen
                      ? (language === 'te' ? 'తెరిచి ఉంది · ' : 'Open · ')
                      : (language === 'te' ? 'మూసివేయబడింది' : 'Closed')}
                  </span>
                  {kitchenOpen && (
                    <span className="text-green-600/80 text-xs">
                      {language === 'te'
                        ? (settings?.openingHoursTe ?? kitchenInfo.openingHoursTe)
                        : (settings?.openingHours ?? kitchenInfo.openingHours)}
                    </span>
                  )}
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 pt-3 space-y-0.5">
                {[
                  { href: '/',              icon: Home,             label: t.nav.home },
                  { href: '/menu',          icon: UtensilsCrossed,  label: t.nav.menu },
                  { href: '/sunday-special',icon: Sparkles,         label: t.nav.sundaySpecial },
                  { href: '/account/orders',icon: Package,          label: t.account.orders },
                  { href: '/account',       icon: User,             label: t.account.profile },
                ].map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors hover:bg-muted',
                        language === 'te' ? 'font-telugu' : ''
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Auth + support */}
              <div className="p-3 border-t border-border space-y-2">
                {loggedIn ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-muted">
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold uppercase flex-shrink-0">
                        {displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? user?.phone}</p>
                      </div>
                    </div>
                    {isStaff && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="btn-outline !py-2.5 text-center text-sm w-full block">
                        {t.nav.admin}
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl text-sm bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-colors">
                      <LogOut className="w-4 h-4" />
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-outline !py-2.5 text-center text-sm">
                      {t.nav.login}
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-brand !py-2.5 text-center text-sm">
                      {t.auth.signUp}
                    </Link>
                  </div>
                )}
                <a
                  href={kitchenInfo.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl text-sm bg-green-50 text-green-700 border border-green-200 font-medium hover:bg-green-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp Support
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'
import { useCartStore } from '@/store/cart-store'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'mk-pwa-dismissed'

/**
 * "Add to Home Screen" nudge. Only renders if the browser fires
 * `beforeinstallprompt` (Android/desktop Chrome with PWA criteria met) and the
 * user hasn't dismissed it. iOS Safari doesn't fire it, so nothing shows there.
 */
export function InstallPrompt() {
  const { language } = useLanguageStore()
  const cartCount = useCartStore((s) => s.itemCount())
  const [deferred, setDeferred] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || !deferred) return null

  const install = async () => {
    try {
      deferred.prompt()
      await deferred.userChoice
    } catch {
      /* user dismissed the native sheet */
    }
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
    setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  return (
    <div
      className={cn(
        // Stack above the floating cart bar (bottom-[88px]) when the cart has
        // items, otherwise just above the bottom nav. Bottom-right card on desktop.
        'fixed inset-x-3 z-40 md:inset-x-auto md:bottom-6 md:right-6 md:w-80',
        cartCount > 0 ? 'bottom-[156px] md:bottom-6' : 'bottom-24',
      )}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-float">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
          <Image src="/logo.jpeg" alt="Mallannapeta Kitchen" fill className="object-cover" sizes="40px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-semibold text-foreground leading-tight truncate ${language === 'te' ? 'font-telugu' : ''}`}>
            {language === 'te' ? 'యాప్‌లా ఇన్‌స్టాల్ చేయండి' : 'Install the app'}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
            {language === 'te' ? 'హోమ్ స్క్రీన్ నుండి త్వరగా' : 'Faster from your home screen'}
          </p>
        </div>
        <button
          onClick={install}
          aria-label="Install app"
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-red px-3 h-9 text-xs font-bold text-white active:scale-95 transition-transform"
        >
          <Download className="h-3.5 w-3.5" />
          {language === 'te' ? 'ఇన్‌స్టాల్' : 'Install'}
        </button>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

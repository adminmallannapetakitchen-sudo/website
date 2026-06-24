'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'

const DISMISS_KEY = 'mk-pwa-dismissed'

/**
 * "Add to Home Screen" nudge. Only renders if the browser fires
 * `beforeinstallprompt` (Android/desktop Chrome with PWA criteria met) and the
 * user hasn't dismissed it. iOS Safari doesn't fire it, so nothing shows there.
 */
export function InstallPrompt() {
  const { language } = useLanguageStore()
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
    <div className="fixed inset-x-3 bottom-24 z-40 md:inset-x-auto md:bottom-6 md:right-6 md:w-80">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-float">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
          <Image src="/logo.jpeg" alt="Mallannapeta Kitchen" fill className="object-cover" sizes="40px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold text-foreground leading-tight ${language === 'te' ? 'font-telugu' : ''}`}>
            {language === 'te' ? 'యాప్‌లా ఇన్‌స్టాల్ చేయండి' : 'Install the app'}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {language === 'te' ? 'హోమ్ స్క్రీన్ నుండి త్వరగా ఆర్డర్ చేయండి' : 'Order faster from your home screen'}
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-red px-3.5 py-2 text-xs font-bold text-white"
        >
          <Download className="h-3.5 w-3.5" />
          {language === 'te' ? 'ఇన్‌స్టాల్' : 'Install'}
        </button>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

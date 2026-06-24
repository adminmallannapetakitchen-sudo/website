'use client'

import { useEffect, useState } from 'react'
import { X, Tag, Check } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'mk-offer-first50-dismissed'
const CODE = 'FIRST50'

/**
 * Slim, dismissible promo for the first-order coupon. Tapping copies the code.
 * Dismissal is remembered in localStorage so it isn't nagging on every visit.
 */
export function OffersBanner() {
  const { language } = useLanguageStore()
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setShow(localStorage.getItem(DISMISS_KEY) !== '1')
  }, [])

  if (!show) return null

  const copy = () => {
    navigator.clipboard?.writeText(CODE).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  return (
    <div className="mx-5 mt-3 flex items-center gap-2.5 rounded-2xl bg-brand-red/8 border border-brand-red/15 px-3.5 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red/15 text-brand-red">
        <Tag className="h-3.5 w-3.5" />
      </span>
      <button onClick={copy} className="flex-1 text-left">
        <p className={cn('text-[13px] font-semibold text-foreground leading-tight', language === 'te' ? 'font-telugu' : '')}>
          {language === 'te' ? 'మొదటి ఆర్డర్‌పై ₹50 తగ్గింపు' : '₹50 off your first order'}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 inline-flex items-center gap-1">
          {language === 'te' ? 'కోడ్' : 'Use code'}{' '}
          <span className="font-bold tracking-wide text-brand-red">{CODE}</span>
          {copied && <span className="inline-flex items-center gap-0.5 text-green-600"><Check className="h-3 w-3" /> copied</span>}
        </p>
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-brand-red/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

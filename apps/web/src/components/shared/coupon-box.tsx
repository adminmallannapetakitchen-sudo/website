'use client'

import { useState } from 'react'
import { Tag, X, Check, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { usePublicCoupons, type PublicCoupon } from '@/lib/hooks'
import { validateCoupon } from '@/lib/checkout-actions'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

function terms(c: PublicCoupon, te: boolean): string {
  const parts: string[] = []
  if (c.minOrderValue > 0) parts.push(te ? `కనీసం ₹${c.minOrderValue}` : `Min ₹${c.minOrderValue}`)
  parts.push(
    c.perUserLimit >= 999
      ? te ? 'అనేకసార్లు' : 'Multiple uses'
      : c.perUserLimit === 1
        ? te ? 'ఒక్కసారే' : 'Once per customer'
        : te ? `${c.perUserLimit}×` : `${c.perUserLimit}× per customer`,
  )
  if (c.maxDiscount) parts.push(te ? `గరిష్టం ₹${c.maxDiscount}` : `Up to ₹${c.maxDiscount}`)
  parts.push(
    (te ? 'గడువు ' : 'Till ') +
      new Date(c.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  )
  return parts.join(' · ')
}

const offerValue = (c: PublicCoupon) => (c.type === 'FLAT' ? formatCurrency(c.value) : `${c.value}%`)

/**
 * Reusable coupon experience for cart + checkout: a tappable offers list with
 * terms, a type-a-code box, and INSTANT validation on apply (so a bad code can
 * never silently reach checkout). The applied coupon is stored in the cart.
 */
export function CouponBox({ subtotal }: { subtotal: number }) {
  const { couponCode, couponDiscount, applyCoupon, removeCoupon } = useCartStore()
  const { offers } = usePublicCoupons()
  const { language } = useLanguageStore()
  const te = language === 'te'
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const apply = async (raw: string) => {
    const code = raw.trim().toUpperCase()
    if (!code) return
    setBusy(code)
    try {
      const res = await validateCoupon(code, subtotal)
      applyCoupon(code, res.discount)
      setInput('')
      toast.success(te ? `₹${res.discount} తగ్గింపు వర్తించింది` : `₹${res.discount} off applied`)
    } catch (e: any) {
      const msg =
        e?.status === 401
          ? te ? 'కూపన్ వాడటానికి లాగిన్ అవ్వండి' : 'Please log in to use a coupon'
          : (e?.message ?? (te ? 'చెల్లని కూపన్' : 'Invalid coupon'))
      toast.error(msg)
    } finally {
      setBusy(null)
    }
  }

  // ── Applied ──
  if (couponCode) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-800 truncate">
                {couponCode} {te ? 'వర్తించింది' : 'applied'}
              </p>
              {couponDiscount > 0 && (
                <p className="text-xs text-green-700">{te ? 'మీరు ఆదా చేశారు ' : 'You save '}{formatCurrency(couponDiscount)}</p>
              )}
            </div>
          </div>
          <button onClick={removeCoupon} className="shrink-0 text-green-700 hover:text-red-600 text-xs font-medium">
            {te ? 'తీసివేయి' : 'Remove'}
          </button>
        </div>
      </div>
    )
  }

  // ── Pick / enter ──
  return (
    <div className="card p-4 space-y-3">
      <h3 className={cn('font-semibold text-foreground flex items-center gap-2', te ? 'font-telugu' : '')}>
        <Tag className="w-4 h-4 text-brand-saffron" />
        {te ? 'కూపన్‌లు & ఆఫర్‌లు' : 'Coupons & offers'}
      </h3>

      {offers.length > 0 && (
        <div className="space-y-2">
          {offers.map((c) => (
            <button
              key={c.code}
              onClick={() => apply(c.code)}
              disabled={busy === c.code}
              className="w-full text-left rounded-xl border border-dashed border-brand-red/30 bg-brand-red/[0.03] px-3 py-2.5 flex items-center gap-3 hover:bg-brand-red/[0.06] transition-colors disabled:opacity-60"
            >
              <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-brand-red/10 text-brand-red font-bold text-xs">
                {offerValue(c)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
                {c.description && (
                  <span className={cn('block text-xs text-foreground/70 truncate', te ? 'font-telugu' : '')}>{c.description}</span>
                )}
                <span className="block text-[11px] text-muted-foreground truncate">{terms(c, te)}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-brand-red shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && apply(input)}
          placeholder={te ? 'కూపన్ కోడ్ నమోదు చేయండి' : 'Enter coupon code'}
          className="flex-1 min-w-0 input text-sm"
        />
        <button
          onClick={() => apply(input)}
          disabled={!input.trim() || busy === input.trim().toUpperCase()}
          className="shrink-0 px-4 h-10 rounded-xl bg-brand-red text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy === input.trim().toUpperCase() ? '…' : (te ? 'వర్తించు' : 'Apply')}
        </button>
      </div>
    </div>
  )
}

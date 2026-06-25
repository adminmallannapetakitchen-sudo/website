'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, CreditCard, Banknote, ChevronRight, Plus, LogIn, Phone } from 'lucide-react'
import { LockIcon, BagIcon } from '@/components/icons'
import Link from 'next/link'
import { useCartStore } from '@/store/cart-store'
import { useLanguageStore } from '@/store/language-store'
import { useAuthStore } from '@/store/auth-store'
import { useAddresses } from '@/lib/hooks'
import {
  syncCartToServer,
  getQuote,
  placeOrder,
  verifyPayment,
  createAddress,
  type QuoteBreakdown,
} from '@/lib/checkout-actions'
import { requestAttachPhoneOtp, verifyAttachPhoneOtp } from '@/lib/auth-actions'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type PaymentMethod = 'RAZORPAY' | 'COD'

export default function CheckoutPage() {
  const { t, language } = useLanguageStore()
  const { items, couponCode, clearCart } = useCartStore()
  const isAuthed = useAuthStore((s) => !!s.accessToken && !!s.user)
  const userPhone = useAuthStore((s) => s.user?.phone ?? null)
  const { addresses, isLoading: addrLoading, mutate: mutateAddresses } = useAddresses()
  const router = useRouter()

  // C1: one stable idempotency key per checkout attempt. Double-clicks /
  // retries reuse it, so the server returns the original order instead of
  // creating (and charging) a second one.
  const idemKeyRef = useRef<string>('')
  if (!idemKeyRef.current) {
    idemKeyRef.current =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  // H-2: phone verification gate for email/Google users with no phone.
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneBusy, setPhoneBusy] = useState(false)

  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY')
  const [placing, setPlacing] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [tip, setTip] = useState(0)
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', city: 'Jagtial', pincode: '505327' })

  const refreshQuote = useCallback(async () => {
    if (!isAuthed || items.length === 0) return
    setQuoteLoading(true)
    try {
      await syncCartToServer()
      const q = await getQuote(couponCode || undefined)
      setQuote(q)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not load order summary')
    } finally {
      setQuoteLoading(false)
    }
  }, [isAuthed, items, couponCode])

  useEffect(() => {
    refreshQuote()
  }, [refreshQuote])

  useEffect(() => {
    if (addresses.length && !selectedAddress) {
      const def = addresses.find((a: any) => a.isDefault) ?? addresses[0]
      setSelectedAddress(def.id)
    }
  }, [addresses, selectedAddress])

  if (!isAuthed) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16 pb-nav flex items-center justify-center">
          <div className="text-center space-y-4 py-20">
            <LockIcon size={44} className="mx-auto text-brand-red" />
            <h1 className="text-2xl font-bold text-foreground">Please log in to checkout</h1>
            <p className="text-muted-foreground">Your cart is saved — log in to place your order.</p>
            <Link href="/login">
              <Button size="lg" icon={<LogIn className="w-5 h-5" />}>Log in</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16 pb-nav flex items-center justify-center">
          <div className="text-center space-y-4 py-20">
            <BagIcon size={44} className="mx-auto text-brand-red" />
            <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
            <Link href="/menu"><Button size="lg">Browse Menu</Button></Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    )
  }

  // The server quote is authoritative. Before it loads we show estimates and
  // the Place Order button is disabled (quoteLoading), so we no longer
  // hardcode a (wrong) ₹40 delivery fee.
  const sub = quote?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = quote?.discount ?? 0
  const deliveryFee = quote?.deliveryFee ?? null
  const total = quote?.total ?? null
  // Tip is added locally for display; the server re-validates it on place-order
  // (pricing.quote receives the tip), so the charged total matches exactly.
  const grandTotal = total !== null ? +(total + tip).toFixed(2) : null
  const needsPhone = !userPhone

  const handleSendOtp = async () => {
    if (!/^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''))) {
      return toast.error('Enter a valid 10-digit Indian mobile number')
    }
    setPhoneBusy(true)
    try {
      await requestAttachPhoneOtp(phone.replace(/[\s-]/g, ''))
      setOtpSent(true)
      toast.success('OTP sent to your phone')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send OTP')
    } finally {
      setPhoneBusy(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return toast.error('Enter the OTP')
    setPhoneBusy(true)
    try {
      await verifyAttachPhoneOtp(phone.replace(/[\s-]/g, ''), otp.trim())
      toast.success('Phone verified — you can place your order now')
      setOtp('')
      setOtpSent(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Invalid OTP')
    } finally {
      setPhoneBusy(false)
    }
  }

  const handleAddAddress = async () => {
    if (!newAddr.line1 || !newAddr.pincode) return toast.error('Fill address line and pincode')
    try {
      const created: any = await createAddress(newAddr)
      await mutateAddresses()
      setSelectedAddress(created.id)
      setShowAddrForm(false)
      toast.success('Address added')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error('Select a delivery address')
    if (needsPhone) return toast.error('Please verify your phone number first')
    if (quote && !quote.kitchenIsOpen) return toast.error('Kitchen is currently closed')
    setPlacing(true)
    setPaymentFailed(false)
    try {
      const res = await placeOrder({
        addressId: selectedAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
        tip: tip > 0 ? tip : undefined,
        idempotencyKey: idemKeyRef.current,
      })

      if (paymentMethod === 'RAZORPAY' && res.cashfree) {
        if (res.cashfree.paymentSessionId.startsWith('mock_session')) {
          // Local/dev mock gateway — there's no real Cashfree session, auto-confirm.
          await verifyPayment({ internalOrderId: res.order.id })
        } else {
          try {
            await payWithCashfree(res.cashfree)
            // Cashfree has no client signature — the server confirms by fetching
            // the order status. Retry briefly to absorb status-propagation lag.
            await verifyWithRetry(res.order.id)
          } catch (payErr: any) {
            // The order exists (PENDING_PAYMENT) but payment didn't complete.
            // Keep the cart + same idempotency key so "Retry payment" resumes
            // the very same order instead of creating a new one.
            setPaymentFailed(true)
            const cancelled = /cancel|dropped|closed/i.test(payErr?.message ?? '')
            toast.error(
              cancelled
                ? 'Payment cancelled — your items are saved. Tap "Retry payment".'
                : 'Payment did not complete — tap "Retry payment" to try again.',
            )
            return
          }
        }
      }

      clearCart()
      toast.success('Order placed successfully!')
      router.push(`/checkout/success?orderId=${res.order.id}&orderNumber=${res.order.orderNumber}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not place order')
    } finally {
      setPlacing(false)
    }
  }

  // Open Cashfree checkout in a secure modal on our own site.
  const payWithCashfree = async (cf: { paymentSessionId: string; mode: 'sandbox' | 'production' }) => {
    const { load } = await import('@cashfreepayments/cashfree-js')
    const cashfree = await load({ mode: cf.mode })
    const result: any = await cashfree.checkout({
      paymentSessionId: cf.paymentSessionId,
      redirectTarget: '_modal',
    })
    if (result?.error) {
      throw new Error(result.error.message || 'Payment was cancelled')
    }
    // success (or ambiguous) — the backend order-status check is the source of truth.
  }

  // Cashfree can take a moment to mark the order PAID after the modal closes.
  const verifyWithRetry = async (orderId: string) => {
    let lastErr: unknown
    for (let i = 0; i < 3; i++) {
      try {
        await verifyPayment({ internalOrderId: orderId })
        return
      } catch (e) {
        lastErr = e
        if (i < 2) await new Promise((r) => setTimeout(r, 1500))
      }
    }
    throw lastErr
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
            {t.checkout.title}
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery address */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <h2 className={cn('font-semibold text-foreground mb-4 flex items-center gap-2', language === 'te' ? 'font-telugu' : '')}>
                  <MapPin className="w-5 h-5 text-brand-red" />
                  {t.checkout.deliveryAddress}
                </h2>
                <div className="space-y-3">
                  {addrLoading && <p className="text-sm text-muted-foreground">Loading addresses…</p>}
                  {addresses.map((addr: any) => (
                    <motion.button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                        selectedAddress === addr.id ? 'border-brand-red bg-brand-red/5' : 'border-border hover:border-brand-red/40'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-sm text-foreground">{addr.label}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">{addr.line1}</p>
                          <p className="text-sm text-muted-foreground">{addr.city}, {addr.pincode}</p>
                        </div>
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', selectedAddress === addr.id ? 'border-brand-red bg-brand-red' : 'border-border')}>
                          {selectedAddress === addr.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {showAddrForm ? (
                    <div className="border-2 border-dashed border-border rounded-xl p-4 space-y-2">
                      <input className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-card" placeholder="Label (Home/Work)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
                      <input className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-card" placeholder="Address line" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
                      <div className="flex gap-2">
                        <input className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-card" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                        <input className="w-28 text-sm border border-input rounded-lg px-3 py-2 bg-card" placeholder="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddAddress}>Save address</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddrForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddrForm(true)} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-brand-red/40 hover:text-brand-red transition-colors">
                      <Plus className="w-4 h-4" />
                      {t.checkout.addAddress}
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Payment method */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
                <h2 className={cn('font-semibold text-foreground mb-4 flex items-center gap-2', language === 'te' ? 'font-telugu' : '')}>
                  <CreditCard className="w-5 h-5 text-brand-red" />
                  {t.checkout.paymentMethod}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    { id: 'RAZORPAY' as PaymentMethod, icon: CreditCard, title: language === 'te' ? 'ఆన్‌లైన్ చెల్లింపు' : 'Pay Online', desc: 'UPI · Cards · Netbanking · Wallets' },
                    { id: 'COD' as PaymentMethod, icon: Banknote, title: t.checkout.cod, desc: t.checkout.codNote },
                  ]).map((pm) => (
                    <motion.button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      whileTap={{ scale: 0.98 }}
                      className={cn('p-4 rounded-xl border-2 text-left transition-all duration-200', paymentMethod === pm.id ? 'border-brand-red bg-brand-red/5' : 'border-border hover:border-brand-red/40')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <pm.icon className={cn('w-5 h-5', paymentMethod === pm.id ? 'text-brand-red' : 'text-muted-foreground')} />
                        <div className={cn('w-4 h-4 rounded-full border-2 transition-all', paymentMethod === pm.id ? 'border-brand-red bg-brand-red' : 'border-border')} />
                      </div>
                      <p className={cn('font-semibold text-sm text-foreground', language === 'te' ? 'font-telugu' : '')}>{pm.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pm.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Order summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 space-y-4 h-fit">
              <h2 className={cn('font-semibold text-foreground', language === 'te' ? 'font-telugu' : '')}>{t.checkout.orderSummary}</h2>

              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className={cn('text-muted-foreground truncate mr-2', language === 'te' ? 'font-telugu' : '')}>
                      {language === 'te' ? item.nameTe : item.name} × {item.qty}
                    </span>
                    <span className="font-medium flex-shrink-0">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.cart.subtotal}</span>
                  <span>{formatCurrency(sub)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.cart.delivery}</span>
                  <span>{deliveryFee === null ? '—' : formatCurrency(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon {quote?.couponCode ? `(${quote.couponCode})` : ''}</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'te' ? 'చిట్కా' : 'Tip'}</span>
                    <span>{formatCurrency(tip)}</span>
                  </div>
                )}
              </div>

              {/* Tip the kitchen */}
              <div className="border-t border-border pt-3">
                <p className={cn('text-xs font-semibold text-foreground mb-2', language === 'te' ? 'font-telugu' : '')}>
                  {language === 'te' ? 'వంటవారికి చిట్కా (ఐచ్ఛికం)' : 'Tip the kitchen (optional)'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[0, 10, 20, 30].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTip(amt)}
                      className={cn(
                        'px-3 h-9 rounded-full text-sm font-medium border transition-colors',
                        tip === amt ? 'bg-brand-red text-white border-brand-red' : 'bg-card text-foreground/70 border-border',
                      )}
                    >
                      {amt === 0 ? (language === 'te' ? 'వద్దు' : 'No tip') : formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                <span>{t.cart.total}</span>
                <span className="text-brand-red">{grandTotal === null ? '—' : formatCurrency(grandTotal)}</span>
              </div>

              {/* H-2: phone verification gate */}
              {needsPhone && (
                <div className="border-2 border-dashed border-brand-red/40 rounded-xl p-4 space-y-2 bg-brand-red/5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Phone className="w-4 h-4 text-brand-red" />
                    Verify your phone to order
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The kitchen calls this number for every delivery.
                  </p>
                  {!otpSent ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-card"
                        placeholder="10-digit mobile number"
                        value={phone}
                        inputMode="numeric"
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <Button size="sm" loading={phoneBusy} onClick={handleSendOtp}>
                        Send OTP
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-card"
                        placeholder="Enter OTP"
                        value={otp}
                        inputMode="numeric"
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <Button size="sm" loading={phoneBusy} onClick={handleVerifyOtp}>
                        Verify
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {paymentFailed && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {language === 'te'
                    ? 'చెల్లింపు పూర్తి కాలేదు. మీ వస్తువులు భద్రంగా ఉన్నాయి — మళ్లీ ప్రయత్నించండి.'
                    : 'Payment didn’t go through. Your items are saved — tap below to retry.'}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={needsPhone}
                loading={placing || quoteLoading}
                onClick={handlePlaceOrder}
                iconRight={!placing ? <ChevronRight className="w-5 h-5" /> : undefined}
              >
                <span className={language === 'te' ? 'font-telugu' : ''}>
                  {paymentFailed
                    ? language === 'te' ? 'మళ్లీ చెల్లించండి' : 'Retry payment'
                    : t.checkout.placeOrder}
                </span>
              </Button>

              <p className="text-xs text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
                <LockIcon size={13} /> Your order &amp; payment information is secure
              </p>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

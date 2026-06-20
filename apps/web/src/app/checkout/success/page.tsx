'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckIcon, ReceiptIcon, ArrowRightIcon, HomeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useLanguageStore } from '@/store/language-store'
import { verifyPayment } from '@/lib/checkout-actions'
import { cn } from '@/lib/utils'

const STEPS = [
  { en: 'Confirmed', te: 'నిర్ధారణ' },
  { en: 'Preparing', te: 'తయారీ' },
  { en: 'Picked up', te: 'బయలుదేరింది' },
  { en: 'Delivered', te: 'డెలివరీ' },
]

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('orderId') || ''
  const orderNumber = params.get('orderNumber') || orderId || 'MK-000'
  const { language } = useLanguageStore()

  // If the customer was redirected back from Cashfree (mobile UPI), the modal's
  // verify never ran — confirm here on load. Best-effort; the webhook is backup.
  const verified = useRef(false)
  useEffect(() => {
    if (!orderId || verified.current) return
    verified.current = true
    verifyPayment({ internalOrderId: orderId }).catch(() => {})
  }, [orderId])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 pb-nav flex items-center justify-center">
        <div className="section py-16 text-center max-w-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 11, stiffness: 200 }}
            className="relative mx-auto w-24 h-24 mb-6"
          >
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
            <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
              <CheckIcon size={44} className="text-green-600" strokeWidth={2} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
            <h1 className={cn('text-2xl md:text-3xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
              {language === 'te' ? 'ఆర్డర్ విజయవంతంగా నమోదు అయింది!' : 'Order placed successfully'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'te' ? 'ఆర్డర్ ID: ' : 'Order ID: '}
              <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
            </p>
            <p className={cn('text-muted-foreground text-sm', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te'
                ? 'మేము మీ ఆర్డర్ అందుకున్నాం, త్వరలో తయారు చేస్తాం. నిర్ధారణ ఇమెయిల్ పంపబడింది.'
                : 'We have received your order and will start preparing it shortly. A confirmation email is on its way.'}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 grid grid-cols-4 gap-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border',
                  i === 0 ? 'bg-brand-red text-white border-brand-red' : 'bg-muted text-muted-foreground border-border')}>
                  {i === 0 ? <CheckIcon size={18} strokeWidth={2.2} /> : i + 1}
                </div>
                <span className={cn('text-xs text-muted-foreground text-center', language === 'te' ? 'font-telugu' : '')}>
                  {language === 'te' ? step.te : step.en}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'}>
              <Button icon={<ReceiptIcon size={18} />} iconRight={<ArrowRightIcon size={16} />}>
                <span className={language === 'te' ? 'font-telugu' : ''}>{language === 'te' ? 'ఆర్డర్ ట్రాక్ చేయండి' : 'Track order'}</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" icon={<HomeIcon size={18} />}>
                <span className={language === 'te' ? 'font-telugu' : ''}>{language === 'te' ? 'హోమ్‌కి వెళ్ళు' : 'Back to home'}</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}

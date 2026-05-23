'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('orderId') || ''
  const orderNumber = params.get('orderNumber') || orderId || 'MK-000'
  const { language } = useLanguageStore()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center">
        <div className="section py-16 text-center max-w-lg">
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="relative mx-auto w-24 h-24 mb-6"
          >
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
            <div className="relative w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h1 className={cn('text-2xl md:text-3xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
              {language === 'te' ? 'ఆర్డర్ విజయవంతంగా నమోదు అయింది!' : 'Order Placed Successfully!'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'te' ? `ఆర్డర్ ID: ` : `Order ID: `}
              <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
            </p>
            <p className={cn('text-muted-foreground text-sm', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te'
                ? 'మేము మీ ఆర్డర్ అందుకున్నాం మరియు త్వరలో తయారు చేస్తాం. నిర్ధారణ ఇమెయిల్ పంపబడింది.'
                : 'We have received your order and will start preparing it shortly. A confirmation email has been sent.'}
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-4 gap-2"
          >
            {['Confirmed', 'Preparing', 'Picked Up', 'Delivered'].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2',
                  i === 0 ? 'bg-brand-red text-white border-brand-red' : 'bg-muted text-muted-foreground border-border')}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className="text-xs text-muted-foreground text-center">{step}</span>
                {i < 3 && <div className="absolute" />}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
          >
            <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'}>
              <Button icon={<Package className="w-4 h-4" />} iconRight={<ArrowRight className="w-4 h-4" />}>
                <span className={language === 'te' ? 'font-telugu' : ''}>
                  {language === 'te' ? 'ఆర్డర్ ట్రాక్ చేయండి' : 'Track Order'}
                </span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" icon={<Home className="w-4 h-4" />}>
                <span className={language === 'te' ? 'font-telugu' : ''}>
                  {language === 'te' ? 'హోమ్‌కి వెళ్ళు' : 'Back to Home'}
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
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

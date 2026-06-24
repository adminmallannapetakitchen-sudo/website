'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, CheckCircle, Package, Truck, Home } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLanguageStore } from '@/store/language-store'
import { useOrder } from '@/lib/hooks'
import { useOrderTracking } from '@/lib/realtime-hooks'
import { formatDate, formatCurrency, getOrderStatusStep, ORDER_STATUS_STEPS, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReorderButton } from '@/components/shared/reorder-button'
import { RateOrder } from '@/components/shared/rate-order'

const STATUS_ICONS = {
  CONFIRMED: CheckCircle,
  PREPARING: Package,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Home,
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLanguageStore()
  const { order, isLoading, mutate } = useOrder(id)

  // Live updates via Socket.IO (falls back to the 15s SWR poll if socket is down)
  useOrderTracking(id, (status) => {
    mutate()
    if (status) toast.success(`Order update: ${String(status).replace(/_/g, ' ')}`)
  })

  if (isLoading || !order) {
    return (
      <div className="section py-20 max-w-2xl text-center text-muted-foreground">
        <Package className="w-11 h-11 mx-auto mb-4 text-brand-red animate-pulse" strokeWidth={1.5} />
        {isLoading ? 'Loading order…' : 'Order not found'}
      </div>
    )
  }

  const currentStep = getOrderStatusStep(order.status)
  const num = (v: any) => Number(v ?? 0)

  // Live-ish ETA: confirmedAt + estimated prep/delivery minutes. Refreshes with
  // the 15s SWR poll, so the "~X min" stays roughly current.
  const isActiveOrder = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)
  const etaDate =
    order.confirmedAt && order.estimatedDeliveryMinutes
      ? new Date(new Date(order.confirmedAt).getTime() + order.estimatedDeliveryMinutes * 60000)
      : null
  const minsLeft = etaDate ? Math.round((etaDate.getTime() - Date.now()) / 60000) : null

  return (
    <div className="section py-8 md:py-12 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Link href="/account/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className={cn('text-xl md:text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
            {t.order.title}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{order.orderNumber}</p>
        </div>
      </motion.div>

      {/* Live status tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5 mb-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            {order.status !== 'DELIVERED' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-saffron opacity-75" />
            )}
            <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5',
              order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-brand-saffron'
            )} />
          </span>
          <h2 className={cn('font-semibold text-foreground', language === 'te' ? 'font-telugu' : '')}>
            {t.order.liveTracking}
          </h2>
        </div>

        {/* Live ETA */}
        {isActiveOrder && etaDate && (
          <div className="flex items-center justify-center gap-2 mb-5 bg-brand-saffron/10 text-amber-700 rounded-xl px-3 py-2.5 text-sm font-semibold">
            <Clock className="w-4 h-4" />
            <span className={language === 'te' ? 'font-telugu' : ''}>
              {minsLeft !== null && minsLeft > 1
                ? language === 'te'
                  ? `సుమారు ${minsLeft} నిమిషాల్లో వస్తుంది`
                  : `Arriving in ~${minsLeft} min`
                : language === 'te'
                  ? 'త్వరలో వస్తుంది'
                  : 'Arriving any moment'}
            </span>
          </div>
        )}

        {/* Step tracker */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-brand-red transition-all duration-1000"
            style={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
          />

          <div className="relative grid grid-cols-4 gap-1">
            {ORDER_STATUS_STEPS.map((step, i) => {
              const Icon = STATUS_ICONS[step]
              const isDone = i <= currentStep
              const isCurrent = i === currentStep
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                    className={cn(
                      'w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-background transition-all duration-500',
                      isDone ? 'border-brand-red bg-brand-red text-white' : 'border-border text-muted-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                  <span className={cn(
                    'text-[10px] text-center leading-tight',
                    isDone ? 'text-brand-red font-medium' : 'text-muted-foreground',
                    language === 'te' ? 'font-telugu' : ''
                  )}>
                    {t.order.status[step as keyof typeof t.order.status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        {t.order.statusDesc[order.status as keyof typeof t.order.statusDesc] && (
          <motion.p
            key={order.status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('text-sm text-muted-foreground text-center mt-4 bg-muted rounded-lg px-3 py-2', language === 'te' ? 'font-telugu' : '')}
          >
            {t.order.statusDesc[order.status as keyof typeof t.order.statusDesc]}
          </motion.p>
        )}
      </motion.div>

      {/* Order details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5 mb-5"
      >
        <h3 className={cn('font-semibold text-foreground mb-4', language === 'te' ? 'font-telugu' : '')}>
          {t.order.items}
        </h3>
        <div className="space-y-3">
          {order.items.map((item: any, i: number) => {
            const snap = item.itemSnapshot ?? {}
            const vsnap = item.variantSnapshot ?? {}
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className={cn('text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
                  {language === 'te' ? snap.nameTe ?? snap.name : snap.name}
                  {vsnap.label ? ` · ${vsnap.label}` : ''} ×{item.qty}
                </span>
                <span className="font-medium">{formatCurrency(num(item.lineTotal))}</span>
              </div>
            )
          })}
        </div>
        <div className="border-t border-border mt-4 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t.cart.subtotal}</span>
            <span>{formatCurrency(num(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t.cart.delivery}</span>
            <span>{formatCurrency(num(order.deliveryFee))}</span>
          </div>
          {num(order.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon</span>
              <span>-{formatCurrency(num(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1">
            <span>{t.cart.total}</span>
            <span className="text-brand-red">{formatCurrency(num(order.total))}</span>
          </div>
        </div>
      </motion.div>

      {/* Delivery address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-5"
      >
        <h3 className={cn('font-semibold text-foreground mb-3 flex items-center gap-2', language === 'te' ? 'font-telugu' : '')}>
          <MapPin className="w-4 h-4 text-brand-red" />
          {t.checkout.deliveryAddress}
        </h3>
        <p className="text-sm text-muted-foreground">
          {[
            order.addressSnapshot?.line1,
            order.addressSnapshot?.line2,
            order.addressSnapshot?.city,
            order.addressSnapshot?.pincode,
          ]
            .filter(Boolean)
            .join(', ')}
        </p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t.order.placedAt}: {formatDate(order.placedAt)}
        </p>
      </motion.div>

      {/* Rate (delivered orders) */}
      {order.status === 'DELIVERED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5"
        >
          <RateOrder
            orderId={order.id}
            existingRating={order.rating}
            existingComment={order.ratingComment}
            onRated={mutate}
          />
        </motion.div>
      )}

      {/* Reorder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5"
      >
        <ReorderButton items={order.items} full />
      </motion.div>
    </div>
  )
}

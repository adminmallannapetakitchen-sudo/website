'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'
import { useOrders } from '@/lib/hooks'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ReorderButton } from '@/components/shared/reorder-button'

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  DELIVERED: 'success',
  PREPARING: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  CONFIRMED: 'default',
  CANCELLED: 'error',
}

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']

export default function OrdersPage() {
  const { t, language } = useLanguageStore()
  const { orders, isLoading } = useOrders()
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all')

  const filtered = (orders as any[]).filter((o) =>
    filter === 'all' ? true : filter === 'active' ? ACTIVE_STATUSES.includes(o.status) : !ACTIVE_STATUSES.includes(o.status),
  )

  const tabs: { id: 'all' | 'active' | 'past'; label: string; labelTe: string }[] = [
    { id: 'all', label: 'All', labelTe: 'అన్నీ' },
    { id: 'active', label: 'Active', labelTe: 'ప్రస్తుతం' },
    { id: 'past', label: 'Past', labelTe: 'గతం' },
  ]

  return (
    <div className="section py-8 md:py-12">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('text-2xl md:text-3xl font-bold text-foreground mb-8', language === 'te' ? 'font-telugu' : 'font-display')}
      >
        {t.account.orders}
      </motion.h1>

      {!isLoading && orders.length > 0 && (
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-4 h-9 rounded-full text-sm font-medium border transition-colors',
                filter === tab.id ? 'bg-brand-red text-white border-brand-red' : 'bg-card text-foreground/70 border-border',
                language === 'te' ? 'font-telugu' : '',
              )}
            >
              {language === 'te' ? tab.labelTe : tab.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-11 h-11 mx-auto mb-4 text-brand-red" strokeWidth={1.5} />
          <p className={cn('text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
            {orders.length === 0 ? t.account.noOrders : (language === 'te' ? 'ఈ విభాగంలో ఆర్డర్లు లేవు' : 'No orders here')}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {filtered.map((order: any, i: number) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/account/orders/${order.id}`}>
                <div className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-brand-red" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground font-mono text-sm">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.placedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.items
                            .map((i: any) => {
                              const snap = i.itemSnapshot ?? {}
                              return `${language === 'te' ? snap.nameTe ?? snap.name : snap.name} ×${i.qty}`
                            })
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <Badge variant={STATUS_COLOR[order.status] || 'default'}>
                        {t.order.status[order.status as keyof typeof t.order.status] || order.status}
                      </Badge>
                      <p className="font-bold text-foreground">{formatCurrency(order.total)}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <ReorderButton items={order.items} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

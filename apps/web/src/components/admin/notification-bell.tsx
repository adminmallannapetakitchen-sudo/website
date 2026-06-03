'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle, Package, Truck, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminOrders } from '@/lib/hooks'
import { useAdminOrderAlerts } from '@/lib/realtime-hooks'
import { formatCurrency } from '@/lib/utils'

const SEEN_KEY = 'mk-admin-bell-seen'

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', color: 'text-amber-600 bg-amber-50', icon: Clock },
  CONFIRMED: { label: 'New', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  PREPARING: { label: 'Preparing', color: 'text-amber-600 bg-amber-50', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', color: 'text-purple-600 bg-purple-50', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-600 bg-green-50', icon: CheckCircle },
}

export function NotificationBell() {
  const { orders, mutate } = useAdminOrders()
  const [open, setOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState<number>(0)
  const ref = useRef<HTMLDivElement>(null)

  // Live alerts: ring + refresh on new order / status change (falls back to the
  // 15s poll already baked into useAdminOrders when the socket is down).
  useAdminOrderAlerts(
    () => mutate(),
    () => mutate(),
  )

  useEffect(() => {
    const stored = Number(localStorage.getItem(SEEN_KEY) ?? 0)
    setLastSeen(stored)
  }, [])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const recent = useMemo(
    () =>
      [...(orders as any[])]
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
        .slice(0, 8),
    [orders],
  )

  const unread = useMemo(
    () => recent.filter((o) => new Date(o.placedAt).getTime() > lastSeen).length,
    [recent, lastSeen],
  )

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      const now = Date.now()
      localStorage.setItem(SEEN_KEY, String(now))
      setLastSeen(now)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-brand-red text-white text-[10px] font-bold rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-semibold text-sm text-foreground">Notifications</p>
              <span className="text-xs text-muted-foreground">{recent.length} recent</span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No orders yet.
                </p>
              ) : (
                recent.map((o) => {
                  const meta = STATUS_META[o.status] ?? STATUS_META.CONFIRMED
                  const Icon = meta.icon
                  const isNew = new Date(o.placedAt).getTime() > lastSeen
                  return (
                    <Link
                      key={o.id}
                      href="/admin/orders"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {o.customerNameSnapshot ?? 'Customer'}
                          </p>
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {o.orderNumber} · {meta.label} · {formatCurrency(Number(o.total))}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>

            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="block text-center px-4 py-3 text-sm font-medium text-brand-red hover:bg-muted/40 border-t border-border"
            >
              View all orders →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

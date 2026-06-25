'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ChevronDown, Clock, CheckCircle, Package, Truck, Home, X, Phone } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAdminOrders } from '@/lib/hooks'
import { useAdminOrderAlerts } from '@/lib/realtime-hooks'
import { api } from '@/lib/api-client'

const STATUS_FLOW = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const
const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50', icon: CheckCircle, next: 'PREPARING', nextLabel: 'Start Preparing' },
  PREPARING: { label: 'Preparing', color: 'text-amber-600 bg-amber-50', icon: Package, next: 'OUT_FOR_DELIVERY', nextLabel: 'Mark Out for Delivery' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-600 bg-purple-50', icon: Truck, next: 'DELIVERED', nextLabel: 'Mark Delivered' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600 bg-green-50', icon: Home, next: null, nextLabel: '' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600 bg-red-50', icon: X, next: null, nextLabel: '' },
  REFUNDED: { label: 'Refunded', color: 'text-gray-600 bg-gray-100', icon: Clock, next: null, nextLabel: '' },
}

// Open statuses an order can be "running late" in.
const OPEN_STATUSES = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
const minutesAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
const agoLabel = (iso: string) => {
  const m = minutesAgo(iso)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ${m % 60}m ago`
}
const isLate = (status: string, iso: string) => OPEN_STATUSES.includes(status) && minutesAgo(iso) >= 20

export default function AdminOrdersPage() {
  const { orders: apiOrders, mutate } = useAdminOrders()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<string | null>(null)

  // Live: ring + refresh on new orders / status changes
  useAdminOrderAlerts(
    () => {
      mutate()
      toast.success('New order received')
    },
    () => mutate(),
  )

  const orders = useMemo(
    () =>
      (apiOrders as any[]).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customerNameSnapshot,
        phone: o.customerPhoneSnapshot,
        items: (o.items ?? []).map((it: any) => ({
          name: it.itemSnapshot?.name ?? 'Item',
          variant: it.variantSnapshot?.label ?? '',
          qty: it.qty,
          price: Number(it.unitPrice),
        })),
        total: Number(o.total),
        status: o.status,
        address: [
          o.addressSnapshot?.line1,
          o.addressSnapshot?.city,
          o.addressSnapshot?.pincode,
        ]
          .filter(Boolean)
          .join(', '),
        time: o.placedAt,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.payment?.status as string | undefined,
        specialInstructions: o.specialInstructions as string | undefined,
      })),
    [apiOrders]
  )

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      await mutate()
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update status')
    }
  }

  const selectedOrder = orders.find((o) => o.id === selected)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <div className="text-sm text-muted-foreground">{filtered.length} orders</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red bg-card"
          />
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-brand-red text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Orders list */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {filtered.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
              const isSelected = selected === order.id
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(isSelected ? null : order.id)}
                  className={cn(
                    'card p-4 cursor-pointer transition-all duration-200 border-l-4',
                    isSelected && 'ring-2 ring-brand-red',
                    isLate(order.status, order.time) ? 'border-l-red-500' : 'border-l-transparent'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg?.color)}>
                          {cfg?.label}
                        </span>
                        {isLate(order.status, order.time) && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Late</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground font-medium mt-1">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {agoLabel(order.time)} · {order.paymentMethod === 'COD' ? 'COD' : 'Online'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(order.total)}</p>
                      {cfg?.next && (
                        <Button
                          size="sm"
                          variant="brand"
                          className="mt-2 text-xs px-2 py-1.5"
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, cfg.next!) }}
                        >
                          {cfg.nextLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Order detail panel */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="card p-4 h-fit space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Order Details</h3>
                <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Customer</p>
                  <p className="font-medium">{selectedOrder.customer}</p>
                  {selectedOrder.phone && (
                    <a
                      href={`tel:${selectedOrder.phone}`}
                      className="inline-flex items-center gap-1.5 mt-1 text-brand-red font-medium hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" /> {selectedOrder.phone}
                    </a>
                  )}
                </div>

                {/* Special instructions — the cook needs to see these */}
                {selectedOrder.specialInstructions && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                    <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wide mb-0.5">Note from customer</p>
                    <p className="text-amber-900 text-sm">{selectedOrder.specialInstructions}</p>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground text-xs">Delivery Address</p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Placed</p>
                  <p className="font-medium">{agoLabel(selectedOrder.time)} · {formatDate(selectedOrder.time)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Items</p>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.name} · {item.variant} ×{item.qty}</span>
                      <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-brand-red">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment</p>
                  <p className="font-medium flex items-center gap-2">
                    {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Cashfree)'}
                    {selectedOrder.paymentMethod !== 'COD' && selectedOrder.paymentStatus && (
                      <span className={cn(
                        'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                        selectedOrder.paymentStatus === 'CAPTURED'
                          ? 'text-green-700 bg-green-50'
                          : 'text-amber-700 bg-amber-50',
                      )}>
                        {selectedOrder.paymentStatus === 'CAPTURED' ? 'Paid' : 'Awaiting'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

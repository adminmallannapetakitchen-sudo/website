'use client'

import { motion } from 'framer-motion'
import {
  ShoppingBag,
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  CheckCircle,
  Package,
  Truck,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAdminDashboard, useAdminOrders } from '@/lib/hooks'

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  PREPARING: { label: 'Preparing', color: 'text-amber-600 bg-amber-50', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-600 bg-purple-50', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-600 bg-green-50', icon: CheckCircle },
}

export default function AdminDashboard() {
  const { stats: s } = useAdminDashboard()
  const { orders: recent } = useAdminOrders()

  const stats = [
    {
      title: "Today's Orders",
      value: String(s?.today?.count ?? 0),
      change: `${s?.week?.count ?? 0} this week`,
      icon: ShoppingBag,
      color: 'bg-brand-red/10 text-brand-red',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(s?.today?.revenue ?? 0),
      change: `${formatCurrency(s?.month?.revenue ?? 0)} this month`,
      icon: IndianRupee,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Total Customers',
      value: String(s?.totalCustomers ?? 0),
      change: 'registered',
      icon: Users,
      color: 'bg-brand-saffron/10 text-brand-saffron',
    },
    {
      title: 'Active Orders',
      value: String(s?.activeOrders ?? 0),
      change: 'in progress',
      icon: TrendingUp,
      color: 'bg-brand-gold/10 text-amber-600',
    },
  ]

  const recentOrders = (recent as any[]).slice(0, 6).map((o) => ({
    id: o.orderNumber,
    customer: o.customerNameSnapshot,
    items: (o.items ?? [])
      .map((it: any) => `${it.itemSnapshot?.name ?? 'Item'} ×${it.qty}`)
      .join(', '),
    total: Number(o.total),
    status: o.status,
    time: new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Live overview</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.title}</p>
            <p className="text-xs text-green-600 mt-0.5">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Latest order alert */}
      {recentOrders[0] && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 bg-brand-red/10 border border-brand-red/20 rounded-xl p-4"
        >
          <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center text-white flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-brand-red text-sm">Latest Order — {recentOrders[0].id}</p>
            <p className="text-xs text-muted-foreground truncate">
              {recentOrders[0].items} · {formatCurrency(recentOrders[0].total)}
            </p>
          </div>
          <a href="/admin/orders" className="btn-brand text-xs px-3 py-1.5">View</a>
        </motion.div>
      )}

      {/* Recent orders table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <a href="/admin/orders" className="text-xs text-brand-red hover:underline">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => {
                const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.id}</td>
                    <td className="px-4 py-3 font-medium">{order.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-40 truncate">{order.items}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg?.color}`}>
                        {statusCfg?.label || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      <Clock className="w-3 h-3 inline mr-1" />{order.time}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

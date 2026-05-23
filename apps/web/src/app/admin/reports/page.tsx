'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, IndianRupee, ShoppingBag, Calendar } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useAdminSales, useAdminTopItems } from '@/lib/hooks'

const iso = (d: Date) => d.toISOString().slice(0, 10)

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  const { from, to } = useMemo(() => {
    const t = new Date()
    const f = new Date()
    f.setDate(f.getDate() - (period === 'week' ? 7 : 30))
    return { from: iso(f), to: iso(t) }
  }, [period])

  const { sales, isLoading } = useAdminSales(from, to)
  const { items: topItems } = useAdminTopItems(from, to)

  const daily: { date: string; orders: number; revenue: number }[] = sales?.daily ?? []
  const totalRevenue = sales?.totalRevenue ?? 0
  const totalOrders = sales?.totalOrders ?? 0
  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenue))
  const maxItemQty = Math.max(1, ...topItems.map((t: any) => t.qty))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <div className="flex gap-2">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                period === p ? 'bg-brand-red text-white border-brand-red' : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: IndianRupee, title: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-green-600 bg-green-50' },
          { icon: ShoppingBag, title: 'Total Orders', value: String(totalOrders), color: 'text-brand-red bg-brand-red/10' },
          { icon: TrendingUp, title: 'Avg Order Value', value: formatCurrency(totalOrders ? Math.round(totalRevenue / totalOrders) : 0), color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', stat.color)}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-red" />
          Daily Revenue
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : daily.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No delivered orders in this period yet.</p>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {daily.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  className="w-full rounded-t-lg bg-brand-red/20 hover:bg-brand-red/40 transition-colors relative group"
                  style={{ minHeight: 4 }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(day.revenue)}
                  </div>
                </motion.div>
                <span className="text-[10px] text-muted-foreground">{day.date.slice(5)}</span>
                <span className="text-[10px] text-muted-foreground">{day.orders}x</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
        <h2 className="font-semibold text-foreground mb-4">Top Selling Items</h2>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-4">
            {topItems.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">{item.qty} sold · {formatCurrency(item.revenue)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.qty / maxItemQty) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                    className="h-full bg-brand-gradient rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

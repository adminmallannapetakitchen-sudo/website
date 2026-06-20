'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCoupons } from '@/lib/hooks'
import { createCoupon, updateCoupon, deleteCoupon } from '@/lib/admin-actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const todayISO = () => new Date().toISOString().slice(0, 10)
const plusDaysISO = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

export default function AdminCouponsPage() {
  const { coupons, isLoading, mutate } = useAdminCoupons()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'FLAT',
    value: '',
    minOrderValue: '',
    validFrom: todayISO(),
    validTo: plusDaysISO(30),
  })

  const add = async () => {
    if (!form.code || !form.value) return toast.error('Code and value are required')
    try {
      await createCoupon({
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue || 0),
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
      })
      setAdding(false)
      setForm({ code: '', type: 'FLAT', value: '', minOrderValue: '', validFrom: todayISO(), validTo: plusDaysISO(30) })
      mutate()
      toast.success('Coupon created')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create coupon')
    }
  }

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await updateCoupon(id, { isActive: !isActive })
      mutate()
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteCoupon(id)
      mutate()
      toast.success('Coupon deleted')
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">Promo codes for discounts</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)} icon={<Plus className="w-4 h-4" />}>
          New Coupon
        </Button>
      </div>

      {adding && (
        <div className="card p-4 grid sm:grid-cols-3 gap-3 items-end">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="FIRST50" />
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="FLAT">Flat ₹ off</option>
              <option value="PERCENT">Percent %</option>
            </select>
          </div>
          <Input label={form.type === 'FLAT' ? 'Amount (₹)' : 'Percent (%)'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Input label="Min order (₹)" type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
          <Input label="Valid from" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
          <Input label="Valid to" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
          <div className="sm:col-span-3">
            <Button onClick={add}>Create Coupon</Button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Min order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-brand-red" />
                    {c.code}
                  </td>
                  <td className="px-4 py-3">
                    {c.type === 'FLAT' ? `₹${Number(c.value)}` : `${Number(c.value)}%`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">₹{Number(c.minOrderValue)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.currentUsageCount}×</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(c.id, c.isActive)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        c.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </motion.div>
  )
}

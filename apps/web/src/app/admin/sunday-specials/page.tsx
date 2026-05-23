'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminSundaySpecials, useMenu } from '@/lib/hooks'
import { createSundaySpecial, deleteSundaySpecial } from '@/lib/admin-actions'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

// nearest upcoming Sunday (yyyy-mm-dd)
function nextSunday() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return d.toISOString().slice(0, 10)
}

export default function AdminSundaySpecialsPage() {
  const { specials, isLoading, mutate } = useAdminSundaySpecials()
  const { items } = useMenu()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    menuItemId: '',
    weekStarting: nextSunday(),
    specialPrice: '',
    bannerHeadline: '',
  })

  const add = async () => {
    if (!form.menuItemId || !form.specialPrice) return toast.error('Pick a dish and set a price')
    try {
      await createSundaySpecial({
        menuItemId: form.menuItemId,
        weekStarting: new Date(form.weekStarting).toISOString(),
        specialPrice: Number(form.specialPrice),
        bannerHeadline: form.bannerHeadline || undefined,
      })
      setAdding(false)
      setForm({ menuItemId: '', weekStarting: nextSunday(), specialPrice: '', bannerHeadline: '' })
      mutate()
      toast.success('Sunday Special scheduled')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not schedule')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteSundaySpecial(id)
      mutate()
      toast.success('Removed')
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sunday Specials</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule the weekly featured dish</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)} icon={<Plus className="w-4 h-4" />}>
          Schedule Special
        </Button>
      </div>

      {adding && (
        <div className="card p-4 grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1.5">Dish</label>
            <select
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card"
              value={form.menuItemId}
              onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}
            >
              <option value="">Select a dish…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>
          <Input label="Week starting (Sunday)" type="date" value={form.weekStarting} onChange={(e) => setForm({ ...form, weekStarting: e.target.value })} />
          <Input label="Special price (₹)" type="number" value={form.specialPrice} onChange={(e) => setForm({ ...form, specialPrice: e.target.value })} />
          <Input label="Banner headline" value={form.bannerHeadline} onChange={(e) => setForm({ ...form, bannerHeadline: e.target.value })} placeholder="This Sunday Only!" />
          <div className="sm:col-span-2">
            <Button onClick={add}>Schedule</Button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : specials.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No Sunday Specials scheduled.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dish</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Week</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {specials.map((s: any) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-saffron" />
                    {s.menuItem?.name ?? 'Item'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.weekStarting).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-red">{formatCurrency(Number(s.specialPrice))}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}

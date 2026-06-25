'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Tag, Pencil, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCoupons } from '@/lib/hooks'
import { createCoupon, updateCoupon, deleteCoupon } from '@/lib/admin-actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const todayISO = () => new Date().toISOString().slice(0, 10)
const plusDaysISO = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

type Form = {
  code: string
  description: string
  type: string
  value: string
  minOrderValue: string
  maxDiscount: string
  perUserLimit: string
  totalUsageLimit: string
  validFrom: string
  validTo: string
  isPublic: boolean
  isActive: boolean
}

const EMPTY: Form = {
  code: '',
  description: '',
  type: 'FLAT',
  value: '',
  minOrderValue: '',
  maxDiscount: '',
  perUserLimit: '1',
  totalUsageLimit: '',
  validFrom: todayISO(),
  validTo: plusDaysISO(30),
  isPublic: true,
  isActive: true,
}

const perUserLabel = (n: number) => (n >= 999 ? 'Unlimited' : n === 1 ? 'Once per customer' : `${n}× per customer`)

export default function AdminCouponsPage() {
  const { coupons, isLoading, mutate } = useAdminCoupons()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const startEdit = (c: any) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      description: c.description ?? '',
      type: c.type,
      value: String(Number(c.value)),
      minOrderValue: String(Number(c.minOrderValue)),
      maxDiscount: c.maxDiscount != null ? String(Number(c.maxDiscount)) : '',
      perUserLimit: String(c.perUserLimit ?? 1),
      totalUsageLimit: c.totalUsageLimit != null ? String(c.totalUsageLimit) : '',
      validFrom: String(c.validFrom).slice(0, 10),
      validTo: String(c.validTo).slice(0, 10),
      isPublic: !!c.isPublic,
      isActive: !!c.isActive,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.code || !form.value) return toast.error('Code and value are required')
    setSaving(true)
    try {
      const base = {
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.type === 'PERCENT' && form.maxDiscount ? Number(form.maxDiscount) : undefined,
        perUserLimit: Number(form.perUserLimit || 1),
        totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : undefined,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
        isPublic: form.isPublic,
        isActive: form.isActive,
      }
      if (editingId) {
        await updateCoupon(editingId, base)
        toast.success('Coupon updated')
      } else {
        await createCoupon({ code: form.code.toUpperCase(), ...base })
        toast.success('Coupon created')
      }
      setOpen(false)
      setEditingId(null)
      setForm(EMPTY)
      mutate()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save coupon')
    } finally {
      setSaving(false)
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

  const togglePublic = async (id: string, isPublic: boolean) => {
    try {
      await updateCoupon(id, { isPublic: !isPublic })
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
          <p className="text-muted-foreground text-sm mt-1">Promo codes & customer offers</p>
        </div>
        <Button size="sm" onClick={startCreate} icon={<Plus className="w-4 h-4" />}>
          New Coupon
        </Button>
      </div>

      {open && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{editingId ? 'Edit coupon' : 'New coupon'}</h2>
            <button onClick={() => { setOpen(false); setEditingId(null) }} className="p-1 rounded hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              label="Code"
              value={form.code}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="FIRST50"
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="FLAT">Flat ₹ off</option>
                <option value="PERCENT">Percent %</option>
              </select>
            </div>
            <Input label={form.type === 'FLAT' ? 'Amount (₹)' : 'Percent (%)'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />

            <Input label="Min order (₹)" type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="0" />
            {form.type === 'PERCENT' && (
              <Input label="Max discount cap (₹)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="No cap" />
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Uses per customer</label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}>
                <option value="1">Once per customer</option>
                <option value="2">2× per customer</option>
                <option value="3">3× per customer</option>
                <option value="5">5× per customer</option>
                <option value="999">Unlimited</option>
              </select>
            </div>

            <Input label="Total uses limit (blank = unlimited)" type="number" value={form.totalUsageLimit} onChange={(e) => setForm({ ...form, totalUsageLimit: e.target.value })} placeholder="Unlimited" />
            <Input label="Valid from" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            <Input label="Valid to" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />

            <div className="sm:col-span-2 lg:col-span-3">
              <Input label="Terms / description (shown to customers)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. ₹50 off your first order" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="w-4 h-4 accent-brand-red" />
              Show in customer offers list
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-brand-red" />
              Active
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} loading={saving}>{editingId ? 'Save changes' : 'Create coupon'}</Button>
            <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null) }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Min order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Per customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Visible</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">
                    <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-brand-red" />{c.code}</span>
                    {c.description && <span className="block text-[11px] font-sans font-normal text-muted-foreground mt-0.5 max-w-[180px] truncate">{c.description}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.type === 'FLAT' ? `₹${Number(c.value)}` : `${Number(c.value)}%`}
                    {c.maxDiscount != null && <span className="text-[11px] text-muted-foreground"> (max ₹{Number(c.maxDiscount)})</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">₹{Number(c.minOrderValue)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{perUserLabel(Number(c.perUserLimit ?? 1))}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {c.currentUsageCount}{c.totalUsageLimit != null ? ` / ${c.totalUsageLimit}` : '×'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublic(c.id, c.isPublic)}
                      title={c.isPublic ? 'Shown in customer offers' : 'Hidden (code-only)'}
                      className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', c.isPublic ? 'bg-blue-50 text-blue-600' : 'bg-muted text-muted-foreground')}
                    >
                      {c.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {c.isPublic ? 'Public' : 'Private'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(c.id, c.isActive)}
                      className={cn('px-2.5 py-1 rounded-full text-xs font-medium', c.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground')}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

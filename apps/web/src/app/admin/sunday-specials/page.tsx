'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Sparkles, Save, X, Pencil, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/admin/image-upload'
import { useAdminSundaySpecials } from '@/lib/hooks'
import {
  createSundaySpecial,
  updateSundaySpecial,
  deleteSundaySpecial,
} from '@/lib/admin-actions'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

// nearest upcoming Sunday (yyyy-mm-dd)
function nextSunday() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return d.toISOString().slice(0, 10)
}

interface Variant {
  id?: string
  key: string
  label: string
  labelTe: string
  price: string
}

interface FormState {
  name: string
  nameTe: string
  description: string
  descriptionTe: string
  imageUrl: string
  weekStarting: string
  bannerHeadline: string
  isActive: boolean
  availableAnyDay: boolean
  variants: Variant[]
}

const emptyForm = (): FormState => ({
  name: '',
  nameTe: '',
  description: '',
  descriptionTe: '',
  imageUrl: '',
  weekStarting: nextSunday(),
  bannerHeadline: '',
  isActive: true,
  availableAnyDay: false,
  variants: [{ key: '1', label: '1 Person', labelTe: '1 వ్యక్తి', price: '' }],
})

export default function AdminSundaySpecialsPage() {
  const { specials, isLoading, mutate } = useAdminSundaySpecials()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const addVariant = () =>
    set('variants', [...form.variants, { key: Date.now().toString(), label: '', labelTe: '', price: '' }])
  const removeVariant = (key: string) =>
    set('variants', form.variants.filter((v) => v.key !== key))
  const updateVariant = (key: string, field: keyof Variant, value: string) =>
    set('variants', form.variants.map((v) => (v.key === key ? { ...v, [field]: value } : v)))

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setOpen(true)
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setForm({
      name: s.menuItem?.name ?? '',
      nameTe: s.menuItem?.nameTe ?? '',
      description: s.menuItem?.description ?? '',
      descriptionTe: s.menuItem?.descriptionTe ?? '',
      imageUrl: s.menuItem?.imageUrl ?? '',
      weekStarting: new Date(s.weekStarting).toISOString().slice(0, 10),
      bannerHeadline: s.bannerHeadline ?? '',
      isActive: !!s.isActive,
      availableAnyDay: !!s.availableAnyDay,
      variants: (s.menuItem?.variants ?? []).length
        ? s.menuItem.variants.map((v: any, i: number) => ({
            id: v.id,
            key: v.id ?? String(i),
            label: v.label,
            labelTe: v.labelTe ?? '',
            price: String(v.price),
          }))
        : [{ key: '1', label: '1 Person', labelTe: '', price: '' }],
    })
    setOpen(true)
  }

  const cancel = () => {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const save = async () => {
    const variants = form.variants.filter((v) => v.label.trim() && v.price !== '')
    if (!form.name.trim()) return toast.error('Dish name is required')
    if (variants.length === 0) return toast.error('Add at least one variant with a label and price')

    const payload = {
      name: form.name.trim(),
      nameTe: form.nameTe || undefined,
      description: form.description || undefined,
      descriptionTe: form.descriptionTe || undefined,
      imageUrl: form.imageUrl || undefined,
      weekStarting: new Date(form.weekStarting).toISOString(),
      bannerHeadline: form.bannerHeadline || undefined,
      isActive: form.isActive,
      availableAnyDay: form.availableAnyDay,
      variants: variants.map((v) => ({
        id: v.id,
        label: v.label.trim(),
        labelTe: v.labelTe || undefined,
        price: Number(v.price),
      })),
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateSundaySpecial(editingId, payload)
        toast.success('Sunday Special updated')
      } else {
        await createSundaySpecial(payload)
        toast.success('Sunday Special created')
      }
      cancel()
      mutate()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s: any, field: 'isActive' | 'availableAnyDay') => {
    try {
      await updateSundaySpecial(s.id, { [field]: !s[field] })
      mutate()
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed')
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sunday Specials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Each special is its own dish — name, photo, description and prices, scheduled for a Sunday.
          </p>
        </div>
        {!open && (
          <Button size="sm" onClick={startCreate} icon={<Plus className="w-4 h-4" />}>
            New Special
          </Button>
        )}
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                {editingId ? 'Edit Sunday Special' : 'New Sunday Special'}
              </h2>
              <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Basic info */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Dish Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Dish Name (English)" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Sunday Mutton Pulao" required />
                <Input label="Dish Name (Telugu)" value={form.nameTe} onChange={(e) => set('nameTe', e.target.value)} placeholder="మటన్ పులావ్" className="font-telugu" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description (English)</label>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input min-h-20 resize-none" placeholder="Slow-cooked Sunday-only mutton pulao…" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description (Telugu)</label>
                  <textarea value={form.descriptionTe} onChange={(e) => set('descriptionTe', e.target.value)} className="input min-h-20 resize-none font-telugu" placeholder="ఆదివారం మాత్రమే…" />
                </div>
              </div>
              <Input label="Banner headline (optional)" value={form.bannerHeadline} onChange={(e) => set('bannerHeadline', e.target.value)} placeholder="This Sunday Only!" />
            </div>

            {/* Photo */}
            <div className="card p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">Photo</h3>
              <ImageUpload value={form.imageUrl || undefined} onChange={(url) => set('imageUrl', url ?? '')} />
            </div>

            {/* Variants */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Variants &amp; Special Pricing</h3>
                <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />} onClick={addVariant}>
                  Add Variant
                </Button>
              </div>
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div key={v.key} className="grid grid-cols-3 gap-3 items-end">
                    <Input label={i === 0 ? 'Variant (English)' : undefined} value={v.label} onChange={(e) => updateVariant(v.key, 'label', e.target.value)} placeholder="1 Person" />
                    <Input label={i === 0 ? 'Variant (Telugu)' : undefined} value={v.labelTe} onChange={(e) => updateVariant(v.key, 'labelTe', e.target.value)} placeholder="1 వ్యక్తి" className="font-telugu" />
                    <div className="flex gap-2 items-end">
                      <Input label={i === 0 ? 'Price (₹)' : undefined} type="number" value={v.price} onChange={(e) => updateVariant(v.key, 'price', e.target.value)} placeholder="199" />
                      {form.variants.length > 1 && (
                        <button onClick={() => removeVariant(v.key)} className="p-2.5 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0 mb-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling & toggles */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Scheduling</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Sunday date" type="date" value={form.weekStarting} onChange={(e) => set('weekStarting', e.target.value)} />
                <div className="space-y-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-brand-red" />
                    <span className="text-sm">Active (visible &amp; orderable)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.availableAnyDay} onChange={(e) => set('availableAnyDay', e.target.checked)} className="w-4 h-4 accent-brand-red" />
                    <span className="text-sm">Available on any day (not just Sunday)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={save} loading={saving} icon={<Save className="w-4 h-4" />} size="lg">
                {editingId ? 'Save Changes' : 'Create Special'}
              </Button>
              <Button variant="outline" size="lg" onClick={cancel}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {!open && (
        <div className="card overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : specials.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No Sunday Specials yet.</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dish</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Sunday</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {specials.map((s: any) => {
                  const prices = (s.menuItem?.variants ?? []).map((v: any) => Number(v.price))
                  const minPrice = prices.length ? Math.min(...prices) : Number(s.specialPrice ?? 0)
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          {s.menuItem?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.menuItem.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-brand-saffron" />
                            </div>
                          )}
                          <div>
                            <p className="text-foreground">{s.menuItem?.name ?? 'Item'}</p>
                            <p className="text-xs text-muted-foreground">{prices.length} variant{prices.length === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(s.weekStarting).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-red">{formatCurrency(minPrice)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => toggle(s, 'isActive')}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                              s.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground',
                            )}
                            title="Toggle active"
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => toggle(s, 'availableAnyDay')}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                              s.availableAnyDay ? 'bg-brand-saffron/15 text-brand-saffron' : 'bg-muted text-muted-foreground',
                            )}
                            title="Make orderable on any day"
                          >
                            <Zap className="w-3 h-3" />
                            {s.availableAnyDay ? 'Any day' : 'Sunday only'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>
          )}
        </div>
      )}
    </motion.div>
  )
}

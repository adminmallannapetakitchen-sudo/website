'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/admin/image-upload'
import { useAdminMenu, useAdminCategories } from '@/lib/hooks'
import { updateMenuItem } from '@/lib/admin-actions'
import { toast } from 'sonner'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface Variant {
  id?: string
  label: string
  labelTe: string
  price: string
}

export default function EditMenuItemPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { items, isLoading, mutate } = useAdminMenu()
  const { categories } = useAdminCategories()
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({
    name: '', nameTe: '', description: '', descriptionTe: '',
    categoryId: '', imageUrl: '', isVeg: false, isBestseller: false, isSundaySpecial: false, isAvailable: true,
  })
  const [variants, setVariants] = useState<Variant[]>([])

  useEffect(() => {
    if (loaded) return
    const item = (items as any[]).find((i) => i.id === id)
    if (item) {
      setForm({
        name: item.name ?? '',
        nameTe: item.nameTe ?? '',
        description: item.description ?? '',
        descriptionTe: item.descriptionTe ?? '',
        categoryId: item.categoryId ?? '',
        imageUrl: item.image ?? item.imageUrl ?? '',
        isVeg: !!item.isVeg,
        isBestseller: !!item.isBestseller,
        isSundaySpecial: !!item.isSundaySpecialCandidate,
        isAvailable: !!item.isAvailable,
      })
      setVariants(
        (item.variants ?? []).map((v: any) => ({
          id: v.id,
          label: v.label,
          labelTe: v.labelTe ?? '',
          price: String(Number(v.price)),
        })),
      )
      setLoaded(true)
    }
  }, [items, id, loaded])

  const addVariant = () => setVariants((v) => [...v, { label: '', labelTe: '', price: '' }])
  const removeVariant = (i: number) => setVariants((v) => v.filter((_, idx) => idx !== i))
  const updateVariant = (i: number, field: keyof Variant, value: string) =>
    setVariants((v) => v.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)))

  const handleSave = async () => {
    if (!form.name || !variants[0]?.price) return toast.error('Name and at least one variant price required')
    if (!form.categoryId) return toast.error('Select a category')
    setSaving(true)
    try {
      await updateMenuItem(id, {
        categoryId: form.categoryId,
        name: form.name,
        nameTe: form.nameTe || undefined,
        slug: slugify(form.name),
        description: form.description || undefined,
        descriptionTe: form.descriptionTe || undefined,
        imageUrl: form.imageUrl || undefined,
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        isBestseller: form.isBestseller,
        isSundaySpecialCandidate: form.isSundaySpecial,
        variants: variants
          .filter((v) => v.label && v.price)
          .map((v, i) => ({
            id: v.id,
            label: v.label,
            labelTe: v.labelTe || undefined,
            price: Number(v.price),
            displayOrder: i,
          })),
      })
      await mutate()
      toast.success('Menu item updated')
      router.push('/admin/menu')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update item')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && !loaded) {
    return <p className="text-muted-foreground text-sm">Loading item…</p>
  }
  if (!isLoading && !(items as any[]).find((i) => i.id === id)) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Item not found.</p>
        <Link href="/admin/menu"><Button variant="outline">Back to Menu</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/menu">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Menu Item</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Item Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Item Name (Telugu)" value={form.nameTe} onChange={(e) => setForm({ ...form, nameTe: e.target.value })} className="font-telugu" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (English)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-20 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (Telugu)</label>
            <textarea value={form.descriptionTe} onChange={(e) => setForm({ ...form, descriptionTe: e.target.value })} className="input min-h-20 resize-none font-telugu" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
              <option value="">Select a category…</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3 pt-6">
            {[
              { field: 'isAvailable', label: '✅ Available to order' },
              { field: 'isVeg', label: '🌿 Vegetarian' },
              { field: 'isBestseller', label: '⭐ Bestseller' },
              { field: 'isSundaySpecial', label: '⚡ Sunday Special candidate' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[field as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
                  className="w-4 h-4 accent-brand-red"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Photo — same as the Add form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
        <h2 className="font-semibold text-foreground mb-4">Photo</h2>
        <ImageUpload
          value={form.imageUrl || undefined}
          onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Variants & Pricing</h2>
          <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />} onClick={addVariant}>Add Variant</Button>
        </div>
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-end">
              <Input label={i === 0 ? 'Variant (English)' : undefined} value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} placeholder="1 Person" />
              <Input label={i === 0 ? 'Variant (Telugu)' : undefined} value={v.labelTe} onChange={(e) => updateVariant(i, 'labelTe', e.target.value)} className="font-telugu" />
              <div className="flex gap-2 items-end">
                <Input label={i === 0 ? 'Price (₹)' : undefined} type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} placeholder="199" />
                {variants.length > 1 && (
                  <button onClick={() => removeVariant(i)} className="p-2.5 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0 mb-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />} size="lg">Save Changes</Button>
        <Link href="/admin/menu"><Button variant="outline" size="lg">Cancel</Button></Link>
      </div>
    </div>
  )
}

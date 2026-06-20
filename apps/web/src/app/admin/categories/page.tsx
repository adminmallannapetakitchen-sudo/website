'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCategories } from '@/lib/hooks'
import { createCategory, deleteCategory } from '@/lib/admin-actions'
import { toast } from 'sonner'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AdminCategoriesPage() {
  const { categories, isLoading, mutate } = useAdminCategories()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', nameTe: '', icon: '' })

  const add = async () => {
    if (!form.name) return toast.error('Name is required')
    try {
      await createCategory({
        name: form.name,
        nameTe: form.nameTe || undefined,
        slug: slugify(form.name),
        icon: form.icon || undefined,
      })
      setForm({ name: '', nameTe: '', icon: '' })
      setAdding(false)
      mutate()
      toast.success('Category added')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not add category')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteCategory(id)
      mutate()
      toast.success('Category deleted')
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">Menu groupings</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)} icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {adding && (
        <div className="card p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Biryani" />
          <Input label="Telugu name" value={form.nameTe} onChange={(e) => setForm({ ...form, nameTe: e.target.value })} placeholder="బిర్యానీ" />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🍛" />
          <Button onClick={add}>Save</Button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No categories yet.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Items</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <span className="mr-2">{c.icon}</span>
                    {c.name}
                    {c.nameTe && <span className="text-muted-foreground font-telugu ml-2">{c.nameTe}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {c._count?.menuItems ?? 0}
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

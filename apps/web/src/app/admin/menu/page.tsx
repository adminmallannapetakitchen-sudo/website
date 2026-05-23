'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAdminMenu, useMenu } from '@/lib/hooks'
import { toggleMenuItem, deleteMenuItem } from '@/lib/admin-actions'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminMenuPage() {
  const { items: rawItems, isLoading, mutate } = useAdminMenu()
  const { categories } = useMenu()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const items = (rawItems as any[]).map((it) => ({
    id: it.id,
    name: it.name,
    nameTe: it.nameTe ?? it.name,
    categoryId: it.categoryId,
    isBestseller: !!it.isBestseller,
    isSundaySpecial: !!it.isSundaySpecialCandidate,
    isAvailable: !!it.isAvailable,
    variants: (it.variants ?? []).map((v: any) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
    })),
  }))

  const filtered = items.filter((item) => {
    const matchCat = categoryFilter === 'all' || item.categoryId === categoryFilter
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await toggleMenuItem(id, !current)
      await mutate()
      toast.success(`Item is now ${!current ? 'available' : 'unavailable'}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update')
    }
  }

  const removeItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This hides it from the menu.`)) return
    try {
      await deleteMenuItem(id)
      await mutate()
      toast.success(`"${name}" deleted`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
        <Link href="/admin/menu/new">
          <Button size="sm" icon={<Plus className="w-4 h-4" />}>
            Add Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red bg-card"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
              categoryFilter === 'all' ? 'bg-brand-red text-white border-brand-red' : 'bg-card border-border text-muted-foreground hover:text-foreground')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                categoryFilter === cat.id ? 'bg-brand-red text-white border-brand-red' : 'bg-card border-border text-muted-foreground hover:text-foreground')}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Variants</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item, i) => {
                  const cat = categories.find((c) => c.id === item.categoryId)
                  return (
                    <motion.tr
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{item.name}</p>
                            {item.isBestseller && (
                              <Badge variant="bestseller">
                                <Star className="w-2.5 h-2.5 fill-current" /> Best
                              </Badge>
                            )}
                            {item.isSundaySpecial && (
                              <Badge variant="sunday">
                                <Zap className="w-2.5 h-2.5" /> Sunday
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-telugu">{item.nameTe}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{cat?.icon} {cat?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {item.variants.map((v) => (
                            <span key={v.id} className="text-xs text-muted-foreground">
                              {v.label} — <span className="font-medium text-foreground">{formatCurrency(v.price)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleAvailability(item.id, item.isAvailable)}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium transition-colors',
                            item.isAvailable ? 'text-green-600' : 'text-red-500'
                          )}
                        >
                          {item.isAvailable ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/menu/${item.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-brand-red/10 text-brand-red transition-colors inline-flex"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => removeItem(item.id, item.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

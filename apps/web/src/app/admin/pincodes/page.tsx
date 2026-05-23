'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminPincodes } from '@/lib/hooks'
import { createPincode, updatePincode, deletePincode } from '@/lib/admin-actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminPincodesPage() {
  const { pincodes, isLoading, mutate } = useAdminPincodes()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ pincode: '', areaName: '' })

  const add = async () => {
    if (!/^\d{6}$/.test(form.pincode)) return toast.error('Enter a valid 6-digit pincode')
    try {
      await createPincode({ pincode: form.pincode, areaName: form.areaName || undefined })
      setForm({ pincode: '', areaName: '' })
      setAdding(false)
      mutate()
      toast.success('Pincode added')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not add pincode')
    }
  }

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await updatePincode(id, { isActive: !isActive })
      mutate()
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed')
    }
  }

  const remove = async (id: string) => {
    try {
      await deletePincode(id)
      mutate()
      toast.success('Pincode removed')
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviceable Pincodes</h1>
          <p className="text-muted-foreground text-sm mt-1">Only these areas can place orders</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)} icon={<Plus className="w-4 h-4" />}>
          Add Pincode
        </Button>
      </div>

      {adding && (
        <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="505327" />
          </div>
          <div className="flex-1 w-full">
            <Input label="Area name (optional)" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="Jagtial Town" />
          </div>
          <Button onClick={add}>Save</Button>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : pincodes.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No pincodes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pincode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Area</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pincodes.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-red" />
                    {p.pincode}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.areaName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(p.id, p.isActive)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        p.isActive ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
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

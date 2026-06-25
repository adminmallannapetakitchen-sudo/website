'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, ToggleLeft, ToggleRight, Clock, Phone, Mail, Instagram, IndianRupee, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getKitchenSettings, updateKitchenSettings } from '@/lib/admin-actions'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [codEnabled, setCodEnabled] = useState(true)
  const [form, setForm] = useState({
    contactPhone: '',
    contactEmail: '',
    instagramUrl: '',
    openingHours: '',
    minOrderValue: '',
    deliveryFee: '',
    estimatedPrepMinutes: '',
    closedMessage: '',
  })

  useEffect(() => {
    getKitchenSettings()
      .then((s: any) => {
        setIsOpen(s.isOpen)
        setCodEnabled(s.codEnabled ?? true)
        setForm({
          contactPhone: s.contactPhone ?? '',
          contactEmail: s.contactEmail ?? '',
          instagramUrl: s.instagramUrl ?? '',
          openingHours: s.openingHours ?? '',
          minOrderValue: String(Number(s.minOrderValue ?? 0)),
          deliveryFee: String(Number(s.deliveryFee ?? 0)),
          estimatedPrepMinutes: String(s.estimatedPrepMinutes ?? 45),
          closedMessage: s.closedMessage ?? '',
        })
      })
      .catch((e) => toast.error(e?.message ?? 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updateKitchenSettings({
        isOpen,
        codEnabled,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        instagramUrl: form.instagramUrl,
        openingHours: form.openingHours,
        minOrderValue: Number(form.minOrderValue),
        deliveryFee: Number(form.deliveryFee),
        estimatedPrepMinutes: Number(form.estimatedPrepMinutes),
        closedMessage: form.closedMessage || undefined,
      })
      toast.success('Settings saved')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading settings…</p>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kitchen Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Control availability, delivery fee and contact info</p>
      </div>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Kitchen Status</p>
          <p className="text-sm text-muted-foreground">
            {isOpen ? 'Accepting orders' : 'Closed — customers cannot place orders'}
          </p>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle kitchen open">
          {isOpen ? (
            <ToggleRight className="w-12 h-12 text-green-500" />
          ) : (
            <ToggleLeft className="w-12 h-12 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Orders & Delivery</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Delivery fee (₹)" type="number" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} icon={<Truck className="w-4 h-4" />} />
          <Input label="Minimum order value (₹)" type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} icon={<IndianRupee className="w-4 h-4" />} />
          <Input label="Est. prep time (minutes)" type="number" value={form.estimatedPrepMinutes} onChange={(e) => setForm({ ...form, estimatedPrepMinutes: e.target.value })} icon={<Clock className="w-4 h-4" />} />
          <Input label="Opening hours" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} icon={<Clock className="w-4 h-4" />} />
        </div>
        <Input label="Closed message (shown when kitchen is off)" value={form.closedMessage} onChange={(e) => setForm({ ...form, closedMessage: e.target.value })} placeholder="We're closed for the day — back tomorrow at 10 AM" />

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-medium text-foreground text-sm">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground">
              {codEnabled
                ? 'Customers can choose to pay cash at delivery'
                : 'Off — customers must pay online'}
            </p>
          </div>
          <button onClick={() => setCodEnabled(!codEnabled)} aria-label="Toggle cash on delivery" type="button">
            {codEnabled ? (
              <ToggleRight className="w-12 h-12 text-green-500" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} icon={<Phone className="w-4 h-4" />} />
          <Input label="Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} icon={<Mail className="w-4 h-4" />} />
        </div>
        <Input label="Instagram URL" value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} icon={<Instagram className="w-4 h-4" />} />
      </div>

      <Button onClick={save} loading={saving} size="lg" icon={<Save className="w-4 h-4" />}>
        Save Settings
      </Button>
    </motion.div>
  )
}

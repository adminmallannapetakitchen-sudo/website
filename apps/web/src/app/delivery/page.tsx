'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Package, CheckCircle2, LogOut, Bike, RefreshCw } from 'lucide-react'
import { api, swrFetcher } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { logout } from '@/lib/auth-actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function DeliveryPage() {
  const router = useRouter()
  const { user, accessToken, hasHydrated, isDelivery, isAdmin } = useAuthStore()
  const allowed = !!accessToken && !!user && isDelivery()

  useEffect(() => {
    if (!hasHydrated || allowed) return
    if (accessToken && user && isAdmin()) router.replace('/admin')
    else router.replace('/login')
  }, [hasHydrated, allowed, accessToken, user, isAdmin, router])

  // Keep the queue fresh — a delivery person leaves the screen open while working.
  const { data: orders, isLoading, mutate, isValidating } = useSWR<any[]>(
    allowed ? '/delivery/orders' : null,
    swrFetcher,
    { refreshInterval: 20000 },
  )

  const markDelivered = async (id: string) => {
    try {
      await api.patch(`/delivery/orders/${id}/delivered`)
      await mutate()
      toast.success('Marked delivered ✓')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update')
    }
  }

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!allowed) return null

  const list = orders ?? []

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-foreground text-white">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-brand-red/40">
            <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="32px" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight flex items-center gap-1.5">
              <Bike className="w-4 h-4" /> My Deliveries
            </p>
            <p className="text-white/50 text-xs truncate">{user?.name ?? user?.phone ?? 'Delivery'}</p>
          </div>
          <button
            onClick={() => mutate()}
            className="p-2 rounded-lg hover:bg-white/10"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={async () => { await logout(); router.replace('/login') }}
            className="p-2 rounded-lg hover:bg-white/10"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" strokeWidth={1.5} />
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No deliveries assigned to you right now.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {list.map((o: any) => {
              const addr = [o.addressSnapshot?.line1, o.addressSnapshot?.city, o.addressSnapshot?.pincode]
                .filter(Boolean)
                .join(', ')
              const isCod = o.paymentMethod === 'COD'
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0 }}
                  className="card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">#{o.orderNumber}</p>
                      <p className="text-sm text-foreground">{o.customerNameSnapshot}</p>
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-1 rounded-lg ${
                        isCod ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {isCod ? `Collect ${formatCurrency(Number(o.total))}` : 'Prepaid'}
                    </span>
                  </div>

                  <a
                    href={`tel:${o.customerPhoneSnapshot}`}
                    className="flex items-center gap-2 text-brand-red text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" /> {o.customerPhoneSnapshot}
                  </a>

                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span>{addr}</span>
                  </div>

                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> Items
                    </p>
                    <ul className="text-sm space-y-0.5">
                      {(o.items ?? []).map((it: any, i: number) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>
                            {(it.itemSnapshot?.name ?? 'Item')}
                            {it.variantSnapshot?.label ? ` · ${it.variantSnapshot.label}` : ''} ×{it.qty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {o.specialInstructions && (
                    <p className="text-xs bg-amber-50 text-amber-900 rounded-lg p-2">
                      Note: {o.specialInstructions}
                    </p>
                  )}

                  <Button
                    onClick={() => markDelivered(o.id)}
                    className="w-full"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Mark Delivered
                  </Button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}

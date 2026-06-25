'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, ShoppingBag, X } from 'lucide-react'
import { useAdminOrders } from '@/lib/hooks'
import { useAdminOrderAlerts } from '@/lib/realtime-hooks'
import { formatCurrency, cn } from '@/lib/utils'

const SOUND_KEY = 'mk-admin-sound'

/**
 * New-order alerting for staff:
 *  - LOUD, CONTINUOUS two-tone alarm that keeps ringing until acknowledged
 *  - Autoplay-safe: the AudioContext is unlocked on the first interaction and
 *    resumed before every beep (browsers suspend it otherwise)
 *  - Desktop/system notification (so a backgrounded tab still gets noticed)
 *  - A prominent banner with View / Stop
 *  - A sound on/off toggle (persisted) for quiet hours
 */
export function AdminAlerts() {
  const router = useRouter()
  const { orders, mutate } = useAdminOrders()
  const [soundOn, setSoundOn] = useState(true)
  const [pending, setPending] = useState(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const soundOnRef = useRef(true)
  const ordersRef = useRef<any[]>([])
  soundOnRef.current = soundOn
  ordersRef.current = (orders as any[]) ?? []

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_KEY) !== '0')
  }, [])

  const getCtx = useCallback(() => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        ctxRef.current = new AC()
      }
      if (ctxRef.current!.state === 'suspended') ctxRef.current!.resume()
      return ctxRef.current
    } catch {
      return null
    }
  }, [])

  // Unlock audio + request notification permission on the first interaction
  // anywhere in the admin (browsers block both without a user gesture).
  useEffect(() => {
    const unlock = () => {
      getCtx()
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {})
        }
      } catch {}
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [getCtx])

  const beep = useCallback(() => {
    if (!soundOnRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    // Two harsh square-wave tones — carries over kitchen noise.
    ;[0, 0.28].forEach((t, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.type = 'square'
      o.frequency.value = i === 0 ? 1000 : 760
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.55, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22)
      o.start(now + t)
      o.stop(now + t + 0.24)
    })
  }, [getCtx])

  const stopAlarm = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
    if (capRef.current) {
      clearTimeout(capRef.current)
      capRef.current = null
    }
  }, [])

  const startAlarm = useCallback(() => {
    if (loopRef.current) return // already ringing
    beep()
    loopRef.current = setInterval(beep, 1800) // continuous until acknowledged
    capRef.current = setTimeout(stopAlarm, 3 * 60 * 1000) // safety stop after 3 min
  }, [beep, stopAlarm])

  const acknowledge = useCallback(() => {
    stopAlarm()
    setPending(0)
  }, [stopAlarm])

  const notify = useCallback(
    (orderId?: string) => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const list = ordersRef.current
          const o = list.find((x) => x.id === orderId) ?? list[0]
          const n = new Notification('🔔 New order — Mallannapeta Kitchen', {
            body: o
              ? `${o.customerNameSnapshot ?? 'Customer'} · ${o.orderNumber} · ${formatCurrency(Number(o.total))}`
              : 'A new order just came in',
            tag: 'mk-new-order',
            requireInteraction: true,
          })
          n.onclick = () => {
            window.focus()
            router.push('/admin/orders')
            n.close()
          }
        }
      } catch {}
    },
    [router],
  )

  useAdminOrderAlerts(
    (payload) => {
      mutate()
      setPending((p) => p + 1)
      startAlarm()
      notify(payload?.orderId)
    },
    () => mutate(),
  )

  useEffect(() => () => stopAlarm(), [stopAlarm])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    localStorage.setItem(SOUND_KEY, next ? '1' : '0')
    if (next) {
      getCtx()
      beep() // confirm it's audible
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {})
        }
      } catch {}
    } else {
      stopAlarm()
    }
  }

  const goToOrders = () => {
    acknowledge()
    router.push('/admin/orders')
  }

  const latest = ordersRef.current[0]

  return (
    <>
      <button
        onClick={toggleSound}
        title={soundOn ? 'Sound alerts ON — tap to mute' : 'Sound alerts OFF — tap to enable'}
        aria-label="Toggle sound alerts"
        className={cn(
          'relative p-2 rounded-lg hover:bg-muted transition-colors',
          !soundOn && 'text-muted-foreground',
        )}
      >
        {soundOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {pending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] w-[calc(100vw-1.5rem)] max-w-md"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-brand-red text-white px-4 py-3 shadow-float ring-4 ring-brand-red/30">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-brand-gold text-amber-900 text-[11px] font-extrabold">
                  {pending}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">
                  {pending} new order{pending > 1 ? 's' : ''}!
                </p>
                {latest && (
                  <p className="text-xs text-white/85 truncate">
                    {latest.customerNameSnapshot ?? 'Customer'} · {formatCurrency(Number(latest.total))}
                  </p>
                )}
              </div>
              <button
                onClick={goToOrders}
                className="shrink-0 rounded-full bg-white text-brand-red text-xs font-bold px-3 h-9"
              >
                View
              </button>
              <button
                onClick={acknowledge}
                aria-label="Stop alert"
                className="shrink-0 rounded-full w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

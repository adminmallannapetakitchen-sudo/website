'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from './socket'
import { useAuthStore } from '@/store/auth-store'

/** Customer: live-track a single order. Calls onChange whenever its status changes. */
export function useOrderTracking(orderId: string | null, onChange: (status?: string) => void) {
  const token = useAuthStore((s) => s.accessToken)
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    if (!orderId || !token) return
    const socket = getSocket()
    if (!socket) return

    const join = () => socket.emit('order:subscribe', { orderId })
    if (socket.connected) join()
    socket.on('connect', join)

    const handler = (payload: { orderId: string; status: string }) => {
      if (payload.orderId === orderId) cb.current(payload.status)
    }
    socket.on('order:status_changed', handler)

    return () => {
      socket.emit('order:unsubscribe', { orderId })
      socket.off('order:status_changed', handler)
      socket.off('connect', join)
    }
  }, [orderId, token])
}

/** Admin: ring + refresh on any new order or status change. */
export function useAdminOrderAlerts(onNewOrder: () => void, onStatusChange: () => void) {
  const token = useAuthStore((s) => s.accessToken)
  const onNew = useRef(onNewOrder)
  const onStatus = useRef(onStatusChange)
  onNew.current = onNewOrder
  onStatus.current = onStatusChange

  useEffect(() => {
    if (!token) return
    const socket = getSocket()
    if (!socket) return

    let audioCtx: AudioContext | null = null
    const beep = () => {
      try {
        audioCtx = audioCtx ?? new (window.AudioContext || (window as any).webkitAudioContext)()
        const o = audioCtx.createOscillator()
        const g = audioCtx.createGain()
        o.connect(g)
        g.connect(audioCtx.destination)
        o.frequency.value = 880
        o.type = 'sine'
        g.gain.setValueAtTime(0.001, audioCtx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
        o.start()
        o.stop(audioCtx.currentTime + 0.5)
      } catch {
        /* audio not available */
      }
    }

    const newHandler = () => {
      beep()
      onNew.current()
    }
    const statusHandler = () => onStatus.current()

    socket.on('order:new', newHandler)
    socket.on('order:status_changed', statusHandler)

    return () => {
      socket.off('order:new', newHandler)
      socket.off('order:status_changed', statusHandler)
    }
  }, [token])
}

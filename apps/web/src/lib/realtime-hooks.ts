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

/**
 * Admin: refresh on any new order or status change. The loud/continuous alarm,
 * desktop notification and banner live in <AdminAlerts/> so they aren't
 * duplicated; this hook just forwards the events (new order passes its payload).
 */
export function useAdminOrderAlerts(
  onNewOrder: (payload?: { orderId?: string }) => void,
  onStatusChange: () => void,
) {
  const token = useAuthStore((s) => s.accessToken)
  const onNew = useRef(onNewOrder)
  const onStatus = useRef(onStatusChange)
  onNew.current = onNewOrder
  onStatus.current = onStatusChange

  useEffect(() => {
    if (!token) return
    const socket = getSocket()
    if (!socket) return

    const newHandler = (payload: { orderId?: string }) => onNew.current(payload)
    const statusHandler = () => onStatus.current()

    socket.on('order:new', newHandler)
    socket.on('order:status_changed', statusHandler)

    return () => {
      socket.off('order:new', newHandler)
      socket.off('order:status_changed', statusHandler)
    }
  }, [token])
}

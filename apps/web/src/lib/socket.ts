'use client'

import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth-store'

// API base is http://host/api/v1 — socket namespace lives at the server root /realtime
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'
const SOCKET_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')

let socket: Socket | null = null

export function getSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken
  if (!token) return null

  if (socket && socket.connected) return socket

  if (!socket) {
    socket = io(`${SOCKET_ORIGIN}/realtime`, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
  } else {
    socket.auth = { token }
    socket.connect()
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

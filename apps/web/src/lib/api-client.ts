import { useAuthStore } from '@/store/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, message: string, body?: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean // attach bearer token (default true)
  _retry?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, logout, user } = useAuthStore.getState()
  if (!refreshToken) return false

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          logout()
          return false
        }
        const data = await res.json()
        setAuth({
          user: user!,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        return true
      } catch {
        logout()
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export async function apiFetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, _retry, ...rest } = options
  const token = useAuthStore.getState().accessToken

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh once on 401
  if (res.status === 401 && auth && !_retry) {
    const ok = await tryRefresh()
    if (ok) return apiFetch<T>(path, { ...options, _retry: true })
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      data?.message ?? (Array.isArray(data?.message) ? data.message.join(', ') : 'Request failed')
    throw new ApiError(res.status, message, data)
  }

  return data as T
}

export const api = {
  get: <T = any>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE', body }),
}

export const swrFetcher = <T = any>(path: string) => apiFetch<T>(path)

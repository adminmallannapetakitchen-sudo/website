import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ADMIN_PERMS, PERM, fallbackPermissions } from '@/lib/permissions'

export interface AuthUser {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  role: 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF' | 'CUSTOMER'
  staffRoleName?: string | null
  permissions?: string[]
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  hasHydrated: boolean
  isAuthenticated: () => boolean
  permissions: () => string[]
  hasPermission: (perm: string) => boolean
  isAdmin: () => boolean
  isDelivery: () => boolean
  setAuth: (data: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  setAccessToken: (token: string) => void
  setHasHydrated: (v: boolean) => void
  updateUser: (partial: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,

      isAuthenticated: () => !!get().accessToken && !!get().user,

      // Effective permissions — from the server when present, otherwise derived
      // from the enum role so pre-existing sessions keep working until re-login.
      permissions: () => {
        const u = get().user
        if (!u) return []
        return u.permissions ?? fallbackPermissions(u.role)
      },

      hasPermission: (perm) => get().permissions().includes(perm),

      // Can reach the admin panel = has any non-delivery permission.
      isAdmin: () => get().permissions().some((p) => ADMIN_PERMS.includes(p)),

      // Delivery staff = has the delivery permission.
      isDelivery: () => get().permissions().includes(PERM.DELIVERY_OWN),

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateUser: (partial) =>
        set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'mk-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

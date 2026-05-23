import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  role: 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF' | 'CUSTOMER'
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  hasHydrated: boolean
  isAuthenticated: () => boolean
  isAdmin: () => boolean
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
      isAdmin: () => {
        const role = get().user?.role
        return role === 'OWNER' || role === 'MANAGER' || role === 'KITCHEN_STAFF'
      },

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

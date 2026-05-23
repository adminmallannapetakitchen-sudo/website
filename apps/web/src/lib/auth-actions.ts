import { api } from './api-client'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

interface AuthResponse {
  user: {
    id: string
    email: string | null
    phone: string | null
    name: string | null
    role: 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF' | 'CUSTOMER'
  }
  accessToken: string
  refreshToken: string
}

/** After auth, push the guest cart to the server so checkout works. */
async function mergeGuestCart() {
  const items = useCartStore.getState().items
  if (!items.length) return
  try {
    // L4: `/cart/merge` is now an atomic server-side *replace*, so the local
    // guest cart becomes the server cart in one request — no separate DELETE
    // (the old delete-then-merge pair raced and doubled quantities).
    await api.post('/cart/merge', {
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        variantId: i.variantId,
        qty: i.qty,
      })),
    })
  } catch {
    /* non-fatal */
  }
}

function persist(res: AuthResponse) {
  useAuthStore.getState().setAuth({
    user: res.user,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  })
}

export async function loginWithEmail(email: string, password: string) {
  const res = await api.post<AuthResponse>('/auth/login', { email, password }, { auth: false })
  persist(res)
  await mergeGuestCart()
  return res
}

export async function registerWithEmail(
  email: string,
  password: string,
  name?: string,
  phone?: string,
) {
  const res = await api.post<AuthResponse>(
    '/auth/register',
    { email, password, name, phone },
    { auth: false },
  )
  persist(res)
  await mergeGuestCart()
  return res
}

/** H-2: attach + verify a phone for the currently-authenticated user. */
export async function requestAttachPhoneOtp(phone: string) {
  return api.post<{ sent: boolean; phone: string; expiresInSeconds: number }>(
    '/auth/phone/attach/request-otp',
    { phone },
  )
}

export async function verifyAttachPhoneOtp(phone: string, otp: string) {
  const res = await api.post<{ ok: boolean; user: AuthResponse['user'] }>(
    '/auth/phone/attach/verify-otp',
    { phone, otp },
  )
  if (res?.user) {
    useAuthStore.getState().updateUser({ phone: res.user.phone })
  }
  return res
}

export async function loginWithGoogle(idToken: string) {
  const res = await api.post<AuthResponse>('/auth/google', { idToken }, { auth: false })
  persist(res)
  await mergeGuestCart()
  return res
}

export async function requestPhoneOtp(phone: string) {
  return api.post<{ sent: boolean; phone: string; expiresInSeconds: number }>(
    '/auth/phone/request-otp',
    { phone },
    { auth: false }
  )
}

export async function verifyPhoneOtp(phone: string, otp: string, name?: string) {
  const res = await api.post<AuthResponse>(
    '/auth/phone/verify-otp',
    { phone, otp, name },
    { auth: false }
  )
  persist(res)
  await mergeGuestCart()
  return res
}

export async function forgotPassword(email: string) {
  return api.post<{ ok: boolean; _devToken?: string }>(
    '/auth/forgot-password',
    { email },
    { auth: false }
  )
}

export async function resetPassword(token: string, password: string) {
  return api.post('/auth/reset-password', { token, password }, { auth: false })
}

export async function logout() {
  const rt = useAuthStore.getState().refreshToken
  try {
    if (rt) await api.post('/auth/logout', { refreshToken: rt }, { auth: false })
  } catch {
    /* ignore */
  }
  useAuthStore.getState().logout()
}

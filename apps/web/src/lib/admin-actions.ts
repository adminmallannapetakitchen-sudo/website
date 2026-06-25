import { api } from './api-client'
import { useAuthStore } from '@/store/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

// ─── Media (multipart — bypasses the JSON api-client) ───
export async function uploadMenuImage(file: File): Promise<{ url: string }> {
  const token = useAuthStore.getState().accessToken
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_URL}/admin/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.message ?? 'Image upload failed')
  return data
}

// ─── Orders ───
export const updateOrderStatus = (orderId: string, status: string, notes?: string) =>
  api.patch(`/admin/orders/${orderId}/status`, { status, notes })

export const refundOrder = (orderId: string, amount?: number, reason?: string) =>
  api.post(`/admin/payments/orders/${orderId}/refund`, { amount, reason })

// Staff that can be assigned deliveries + assigning a delivery person.
export const getDeliveryPeople = () => api.get('/admin/orders/delivery-people')
export const assignOrderDelivery = (orderId: string, deliveryUserId: string | null) =>
  api.patch(`/admin/orders/${orderId}/delivery`, { deliveryUserId })

// ─── Menu ───
export const createMenuItem = (body: unknown) => api.post('/admin/menu/items', body)
export const updateMenuItem = (id: string, body: unknown) => api.patch(`/admin/menu/items/${id}`, body)
export const deleteMenuItem = (id: string) => api.delete(`/admin/menu/items/${id}`)
export const toggleMenuItem = (id: string, isAvailable: boolean) =>
  api.patch(`/admin/menu/items/${id}/availability`, { isAvailable })

// ─── Categories ───
export const createCategory = (body: unknown) => api.post('/admin/categories', body)
export const updateCategory = (id: string, body: unknown) => api.patch(`/admin/categories/${id}`, body)
export const deleteCategory = (id: string) => api.delete(`/admin/categories/${id}`)

// ─── Coupons ───
export const createCoupon = (body: unknown) => api.post('/admin/coupons', body)
export const updateCoupon = (id: string, body: unknown) => api.patch(`/admin/coupons/${id}`, body)
export const deleteCoupon = (id: string) => api.delete(`/admin/coupons/${id}`)

// ─── Pincodes ───
export const createPincode = (body: unknown) => api.post('/admin/pincodes', body)
export const updatePincode = (id: string, body: unknown) => api.patch(`/admin/pincodes/${id}`, body)
export const deletePincode = (id: string) => api.delete(`/admin/pincodes/${id}`)

// ─── Sunday Specials ───
export const createSundaySpecial = (body: unknown) => api.post('/admin/sunday-specials', body)
export const updateSundaySpecial = (id: string, body: unknown) =>
  api.patch(`/admin/sunday-specials/${id}`, body)
export const deleteSundaySpecial = (id: string) => api.delete(`/admin/sunday-specials/${id}`)

// ─── Staff / Users ───
export const updateUserRole = (id: string, role: string) =>
  api.patch(`/admin/users/${id}/role`, { role })

export const assignUserStaffRole = (id: string, staffRoleId: string | null) =>
  api.patch(`/admin/users/${id}/staff-role`, { staffRoleId })

// ─── Roles (custom permission roles) ───
export const getPermissionCatalog = () => api.get('/admin/roles/catalog')
export const getStaffRoles = () => api.get('/admin/roles')
export const createStaffRole = (body: { name: string; permissions: string[] }) =>
  api.post('/admin/roles', body)
export const updateStaffRole = (id: string, body: { name?: string; permissions?: string[] }) =>
  api.patch(`/admin/roles/${id}`, body)
export const deleteStaffRole = (id: string) => api.delete(`/admin/roles/${id}`)

// ─── Kitchen Settings ───
export const getKitchenSettings = () => api.get('/admin/kitchen-settings')
export const updateKitchenSettings = (body: unknown) => api.patch('/admin/kitchen-settings', body)

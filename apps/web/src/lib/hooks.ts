'use client'

import useSWR from 'swr'
import { swrFetcher } from './api-client'

// ─── Normalizers: API shape → UI shape (matches old mock-data) ───

export interface UiCategory {
  id: string
  name: string
  nameTe: string
  slug: string
  icon: string
}

export interface UiVariant {
  id: string
  label: string
  labelTe: string
  price: number
}

export interface UiMenuItem {
  id: string
  categoryId: string
  name: string
  nameTe: string
  description: string
  descriptionTe: string
  isVeg: boolean
  isAvailable: boolean
  isBestseller: boolean
  isSundaySpecial: boolean
  image?: string
  slug: string
  variants: UiVariant[]
}

function normalizeItem(it: any): UiMenuItem {
  return {
    id: it.id,
    categoryId: it.categoryId,
    name: it.name,
    nameTe: it.nameTe ?? it.name,
    description: it.description ?? '',
    descriptionTe: it.descriptionTe ?? it.description ?? '',
    isVeg: !!it.isVeg,
    isAvailable: !!it.isAvailable,
    isBestseller: !!it.isBestseller,
    isSundaySpecial: !!it.isSundaySpecialCandidate,
    image: it.imageUrl ?? undefined,
    slug: it.slug,
    variants: (it.variants ?? []).map((v: any) => ({
      id: v.id,
      label: v.label,
      labelTe: v.labelTe ?? v.label,
      price: Number(v.price),
    })),
  }
}

// ─── Public hooks ───

export function useMenu() {
  const { data: items, isLoading: li, error: ei } = useSWR<any>('/menu/items', swrFetcher)
  const { data: categories, isLoading: lc, error: ec } = useSWR<any>('/categories', swrFetcher)
  return {
    items: ((items ?? []) as any[]).map(normalizeItem) as UiMenuItem[],
    categories: ((categories ?? []) as any[]).map(
      (c: any): UiCategory => ({
        id: c.id,
        name: c.name,
        nameTe: c.nameTe ?? c.name,
        slug: c.slug,
        icon: c.icon ?? '🍽️',
      })
    ) as UiCategory[],
    isLoading: li || lc,
    error: ei || ec,
  }
}

export function useKitchenSettings() {
  const { data, isLoading, error } = useSWR<any>('/kitchen-settings/public', swrFetcher)
  return { settings: data, isLoading, error }
}

export function useSundaySpecial() {
  const { data, isLoading, error } = useSWR<any>('/sunday-special/current', swrFetcher)
  const norm = (s: any) => ({
    ...s,
    specialPrice: Number(s.specialPrice),
    menuItem: normalizeItem(s.menuItem),
  })
  const specials: any[] = Array.isArray(data?.specials)
    ? data.specials.map(norm)
    : data?.special
      ? [norm(data.special)]
      : []
  return {
    special: specials[0] ?? null,
    specials,
    isActive: !!data?.isActive,
    isOrderable: !!data?.isOrderable,
    orderOpensAt: data?.orderOpensAt ?? null,
    isLoading,
    error,
  }
}

// ─── Customer hooks ───

export function useOrders() {
  const { data, isLoading, error, mutate } = useSWR<any>('/orders', swrFetcher)
  return { orders: data?.orders ?? [], total: data?.total ?? 0, isLoading, error, mutate }
}

export function useOrder(id: string | null) {
  const { data, isLoading, error, mutate } = useSWR<any>(id ? `/orders/${id}` : null, swrFetcher, {
    refreshInterval: 15000,
  })
  return { order: data, isLoading, error, mutate }
}

export function useAddresses() {
  const { data, isLoading, error, mutate } = useSWR<any>('/me/addresses', swrFetcher)
  return { addresses: data ?? [], isLoading, error, mutate }
}

export function useProfile() {
  const { data, isLoading, error, mutate } = useSWR<any>('/me', swrFetcher)
  return { profile: data, isLoading, error, mutate }
}

// ─── Admin hooks ───

export function useAdminDashboard() {
  const { data, isLoading, error } = useSWR<any>('/admin/reports/dashboard', swrFetcher, {
    refreshInterval: 30000,
  })
  return { stats: data, isLoading, error }
}

export function useAdminOrders(status?: string) {
  const q = status && status !== 'ALL' ? `?status=${status}` : ''
  const { data, isLoading, error, mutate } = useSWR<any>(`/admin/orders${q}`, swrFetcher, {
    refreshInterval: 15000,
  })
  return { orders: data?.orders ?? [], total: data?.total ?? 0, isLoading, error, mutate }
}

export function useAdminMenu() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/menu/items', swrFetcher)
  return { items: data ?? [], isLoading, error, mutate }
}

export function useAdminCoupons() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/coupons', swrFetcher)
  return { coupons: data ?? [], isLoading, error, mutate }
}

export function useAdminCustomers() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/reports/customers', swrFetcher)
  return { customers: data?.customers ?? [], total: data?.total ?? 0, isLoading, error, mutate }
}

export function useAdminPincodes() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/pincodes', swrFetcher)
  return { pincodes: data ?? [], isLoading, error, mutate }
}

export function useAdminCategories() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/categories', swrFetcher)
  return { categories: data ?? [], isLoading, error, mutate }
}

export function useAdminUsers(search?: string, role?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role && role !== 'ALL') params.set('role', role)
  const qs = params.toString()
  const { data, isLoading, error, mutate } = useSWR<any>(
    `/admin/users${qs ? `?${qs}` : ''}`,
    swrFetcher,
  )
  return { users: data?.users ?? [], isLoading, error, mutate }
}

export function useAdminSundaySpecials() {
  const { data, isLoading, error, mutate } = useSWR<any>('/admin/sunday-specials', swrFetcher)
  return { specials: data ?? [], isLoading, error, mutate }
}

export function useAdminSales(from: string, to: string) {
  const { data, isLoading, error } = useSWR<any>(
    `/admin/reports/sales?from=${from}&to=${to}`,
    swrFetcher,
  )
  return { sales: data, isLoading, error }
}

export function useAdminTopItems(from: string, to: string) {
  const { data, isLoading, error } = useSWR<any>(
    `/admin/reports/top-items?from=${from}&to=${to}`,
    swrFetcher,
  )
  return { items: data ?? [], isLoading, error }
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartVariant {
  id: string
  label: string
  price: number
}

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  nameTe: string
  variantId: string
  variantLabel: string
  price: number
  qty: number
  image?: string
  isVeg: boolean
}

interface CartState {
  items: CartItem[]
  couponCode: string
  couponDiscount: number
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  subtotal: () => number
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: '',
      couponDiscount: 0,

      addItem: (item) =>
        set((state) => {
          const key = `${item.menuItemId}-${item.variantId}`
          const existing = state.items.find((i) => i.id === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === key ? { ...i, qty: i.qty + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, id: key, qty: 1 }] }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      // L5: this is an items-only estimate for the floating bar. It does NOT
      // include delivery fee or server-validated coupon discount — the
      // /checkout/quote response is the single source of truth for the real
      // payable total. couponDiscount is always 0 now (coupons are no longer
      // applied client-side); kept for store-shape backward compatibility.
      total: () => {
        const state = get()
        return Math.max(0, state.subtotal() - state.couponDiscount)
      },
      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'mk-cart' }
  )
)

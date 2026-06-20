import { api } from './api-client'
import { useCartStore } from '@/store/cart-store'

export interface QuoteBreakdown {
  items: any[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  couponCode: string | null
  estimatedDeliveryMinutes: number
  kitchenIsOpen: boolean
  minOrderValue: number
}

/**
 * Push the local Zustand cart to the server. `/cart/merge` is now an atomic
 * server-side *replace*, so a single call makes the server authoritative —
 * no separate DELETE (the old delete-then-merge pair raced and double-counted
 * quantities).
 */
export async function syncCartToServer() {
  const items = useCartStore.getState().items
  await api.post('/cart/merge', {
    items: items.map((i) => ({
      menuItemId: i.menuItemId,
      variantId: i.variantId,
      qty: i.qty,
    })),
  })
}

export async function getQuote(couponCode?: string): Promise<QuoteBreakdown> {
  return api.post<QuoteBreakdown>('/checkout/quote', { couponCode })
}

interface PlaceOrderResult {
  order: { id: string; orderNumber: string; status: string; total: number; paymentMethod: string }
  cashfree: { paymentSessionId: string; orderRef: string; mode: 'sandbox' | 'production' } | null
}

export async function placeOrder(input: {
  addressId: string
  paymentMethod: 'RAZORPAY' | 'COD'
  couponCode?: string
  specialInstructions?: string
  // C1: stable per checkout attempt — duplicate submits return the same order.
  idempotencyKey?: string
}): Promise<PlaceOrderResult & { idempotentReplay?: boolean }> {
  return api.post<PlaceOrderResult & { idempotentReplay?: boolean }>(
    '/checkout/place-order',
    input,
  )
}

export async function verifyPayment(input: { internalOrderId: string }) {
  return api.post('/payments/verify', input)
}

export async function createAddress(input: {
  label: string
  line1: string
  line2?: string
  city: string
  pincode: string
}) {
  return api.post('/me/addresses', { ...input, isDefault: true })
}

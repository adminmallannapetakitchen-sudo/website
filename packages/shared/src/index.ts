// Shared types, enums, and constants

export type Role = 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF' | 'CUSTOMER'

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentMethod = 'RAZORPAY' | 'COD'
export type PaymentStatus = 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED'
export type CouponType = 'FLAT' | 'PERCENT'

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

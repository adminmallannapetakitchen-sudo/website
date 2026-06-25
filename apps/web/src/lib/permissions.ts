// Permission keys mirror the API catalog (apps/api/src/common/permissions.ts).
// Used purely for UI gating — the API always enforces access on its own.
export const PERM = {
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  MENU_MANAGE: 'menu.manage',
  COUPONS_MANAGE: 'coupons.manage',
  CUSTOMERS_VIEW: 'customers.view',
  PINCODES_MANAGE: 'pincodes.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',
  STAFF_MANAGE: 'staff.manage',
  DELIVERY_OWN: 'delivery.own',
} as const

export type Perm = (typeof PERM)[keyof typeof PERM]

export const ALL_PERMS: string[] = Object.values(PERM)

// Everything that grants access to the admin panel (i.e. not delivery-only).
export const ADMIN_PERMS: string[] = ALL_PERMS.filter((p) => p !== PERM.DELIVERY_OWN)

/**
 * Permissions for the built-in enum roles. Used as a fallback for sessions that
 * were created before the server started sending a `permissions` array (so a
 * logged-in owner/manager isn't locked out until they re-login).
 */
export function fallbackPermissions(role: string | undefined | null): string[] {
  switch (role) {
    case 'OWNER':
      return [...ALL_PERMS]
    case 'MANAGER':
      return ADMIN_PERMS.filter((p) => p !== PERM.STAFF_MANAGE)
    case 'KITCHEN_STAFF':
      return [PERM.ORDERS_VIEW, PERM.ORDERS_MANAGE]
    default:
      return []
  }
}

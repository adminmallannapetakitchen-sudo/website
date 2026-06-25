import { Role } from '@prisma/client';

/**
 * Permission catalog — the fine-grained capabilities a staff role can be
 * granted. Each admin section / sensitive action maps to one of these keys.
 * The Owner always has every permission (super-admin) and cannot be limited.
 */
export const PERMISSIONS = {
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
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Human-friendly metadata for the admin "Roles" UI. */
export const PERMISSION_META: { key: Permission; label: string; description: string; group: string }[] = [
  { key: PERMISSIONS.ORDERS_VIEW, label: 'View orders', description: 'See the orders list and order details.', group: 'Orders' },
  { key: PERMISSIONS.ORDERS_MANAGE, label: 'Manage orders', description: 'Change order status, assign delivery, cancel/refund.', group: 'Orders' },
  { key: PERMISSIONS.MENU_MANAGE, label: 'Manage menu', description: 'Menu items, categories and Sunday specials.', group: 'Catalog' },
  { key: PERMISSIONS.COUPONS_MANAGE, label: 'Manage coupons', description: 'Create and edit coupons & offers.', group: 'Catalog' },
  { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'View customers', description: 'Browse the customer list.', group: 'People' },
  { key: PERMISSIONS.PINCODES_MANAGE, label: 'Manage pincodes', description: 'Add/remove serviceable delivery pincodes.', group: 'Settings' },
  { key: PERMISSIONS.REPORTS_VIEW, label: 'View reports', description: 'Sales reports, analytics and audit log.', group: 'Insights' },
  { key: PERMISSIONS.SETTINGS_MANAGE, label: 'Manage settings', description: 'Open/close kitchen, fees, COD and contact details.', group: 'Settings' },
  { key: PERMISSIONS.STAFF_MANAGE, label: 'Manage staff & roles', description: 'Create roles and assign them to people.', group: 'People' },
  { key: PERMISSIONS.DELIVERY_OWN, label: 'Delivery (own orders)', description: 'See own assigned out-for-delivery orders and mark them delivered.', group: 'Delivery' },
];

/**
 * Default permission presets for the built-in enum roles. These preserve the
 * exact access each role had before custom roles existed, so nothing changes
 * for existing staff who have no custom role assigned.
 */
const MANAGER_PRESET: Permission[] = [
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.ORDERS_MANAGE,
  PERMISSIONS.MENU_MANAGE,
  PERMISSIONS.COUPONS_MANAGE,
  PERMISSIONS.CUSTOMERS_VIEW,
  PERMISSIONS.PINCODES_MANAGE,
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.SETTINGS_MANAGE,
];

const KITCHEN_STAFF_PRESET: Permission[] = [
  PERMISSIONS.ORDERS_VIEW,
  PERMISSIONS.ORDERS_MANAGE,
];

export function presetForRole(role: Role): Permission[] {
  switch (role) {
    case Role.OWNER:
      return [...ALL_PERMISSIONS];
    case Role.MANAGER:
      return [...MANAGER_PRESET];
    case Role.KITCHEN_STAFF:
      return [...KITCHEN_STAFF_PRESET];
    default:
      return [];
  }
}

/**
 * Resolve a user's effective permissions. Owner is always all-powerful. A user
 * with a custom staff role uses that role's permissions; otherwise the built-in
 * preset for their enum role applies.
 */
export function effectivePermissions(
  role: Role,
  staffRolePermissions?: string[] | null,
): Permission[] {
  if (role === Role.OWNER) return [...ALL_PERMISSIONS];
  if (staffRolePermissions != null) {
    // A custom role is assigned — it fully governs access (may be empty).
    return staffRolePermissions.filter((p): p is Permission =>
      (ALL_PERMISSIONS as string[]).includes(p),
    );
  }
  return presetForRole(role);
}

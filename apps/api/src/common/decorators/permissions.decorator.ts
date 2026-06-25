import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restrict a route/controller to users whose effective permissions include
 * ALL of the listed keys. Owner always passes. Used by the global
 * PermissionsGuard.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

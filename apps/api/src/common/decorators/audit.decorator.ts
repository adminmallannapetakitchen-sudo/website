import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  entityType: string;
  entityIdParam?: string; // path param name that holds the entity ID
}

export const Audit = (meta: AuditMetadata) => SetMetadata(AUDIT_KEY, meta);

/**
 * @dbTable audit_log
 * @dbIndex idx_audit_entity (entity_type, entity_id)
 */
export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  timestamp: Date
  userId?: string
  ipAddress?: string
  userAgent?: string
}

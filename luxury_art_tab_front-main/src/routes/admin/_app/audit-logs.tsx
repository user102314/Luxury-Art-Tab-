import { createFileRoute } from '@tanstack/react-router'
import { AdminAuditLogsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/audit-logs')({
  component: AdminAuditLogsPage,
})

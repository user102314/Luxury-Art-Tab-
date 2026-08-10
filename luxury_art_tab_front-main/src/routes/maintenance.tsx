import { createFileRoute } from '@tanstack/react-router'
import { MaintenancePage } from '@/components/MaintenancePage'
import { buildSeoHead, SITE } from '@/lib/seo'

export const Route = createFileRoute('/maintenance')({
  head: () =>
    buildSeoHead({
      title: `Maintenance — ${SITE.name}`,
      description: SITE.defaultDescription,
      path: '/maintenance',
      robots: 'noindex, nofollow',
    }),
  component: MaintenancePage,
})

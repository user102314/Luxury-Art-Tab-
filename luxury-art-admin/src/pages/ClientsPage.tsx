import { useMemo, useState } from 'react'
import { RefreshCw, Search, Users } from 'lucide-react'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useClients, useInvalidateAdmin } from '../hooks/useAdminQueries'
import { formatCurrency, formatDate, ORDER_CANAL_LABELS } from '../lib/api'
import type { OrderCanal } from '../types'

export default function ClientsPage() {
  const { data: clients = [], isLoading, isFetching } = useClients()
  const invalidate = useInvalidateAdmin()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clients
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.telephone ?? '').toLowerCase().includes(term),
    )
  }, [clients, q])

  if (isLoading && clients.length === 0) return <PageSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Users className="h-6 w-6 text-gold-400" />
            Clients
          </h2>
          <p className="text-sm text-zinc-500">
            Liste CRM — {clients.length} client(s) enregistré(s)
          </p>
        </div>
        <button type="button" onClick={() => invalidate.clients()} className="btn-ghost">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="input pl-10"
          placeholder="Rechercher nom, email, téléphone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucun client trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Canaux</th>
                  <th className="px-6 py-4">Commandes</th>
                  <th className="px-6 py-4">CA livré</th>
                  <th className="px-6 py-4">Dernière commande</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.userId} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{c.nom}</p>
                      <p className="text-xs text-zinc-500">#{c.userId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-zinc-300">{c.email}</p>
                      <p className="text-xs text-zinc-500">{c.telephone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(c.canaux?.length ? c.canaux : ['SITE_WEB']).map((canal) => (
                          <span
                            key={canal}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400"
                          >
                            {ORDER_CANAL_LABELS[canal as OrderCanal] ?? canal}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {c.nombreCommandes}
                      <span className="text-xs text-zinc-500"> ({c.commandesLivrees} livrées)</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gold-400">
                      {formatCurrency(Number(c.totalDepense) || 0)}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {c.derniereCommande ? formatDate(c.derniereCommande) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

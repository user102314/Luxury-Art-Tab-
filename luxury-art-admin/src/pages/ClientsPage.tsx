import { useMemo, useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { ListToolbar } from '../components/ListToolbar'
import { useClients, useInvalidateAdmin } from '../hooks/useAdminQueries'
import { formatCurrency, formatDate, ORDER_CANAL_LABELS } from '../lib/api'
import { compareDates, compareNumbers, compareStrings, matchesSearch, type SortDir } from '../lib/listUtils'
import type { OrderCanal } from '../types'

type ClientSortKey = 'nom' | 'commandes' | 'ca' | 'date'

export default function ClientsPage() {
  const { data: clients = [], isLoading, isFetching } = useClients()
  const invalidate = useInvalidateAdmin()
  const [search, setSearch] = useState('')
  const [canalFilter, setCanalFilter] = useState('ALL')
  const [sort, setSort] = useState<ClientSortKey>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    let list = clients.filter((c) => {
      if (
        !matchesSearch(search, [c.nom, c.email, c.telephone, c.userId])
      ) {
        return false
      }
      if (canalFilter !== 'ALL') {
        const canaux = c.canaux?.length ? c.canaux : ['SITE_WEB']
        if (!canaux.includes(canalFilter as OrderCanal)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'commandes':
          return compareNumbers(a.nombreCommandes, b.nombreCommandes, sortDir)
        case 'ca':
          return compareNumbers(Number(a.totalDepense) || 0, Number(b.totalDepense) || 0, sortDir)
        case 'date':
          return compareDates(a.derniereCommande, b.derniereCommande, sortDir)
        case 'nom':
        default:
          return compareStrings(a.nom, b.nom, sortDir)
      }
    })

    return list
  }, [clients, search, canalFilter, sort, sortDir])

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

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher nom, email, téléphone…"
        sort={sort}
        onSortChange={(v) => setSort(v as ClientSortKey)}
        sortOptions={[
          { value: 'nom', label: 'Nom' },
          { value: 'commandes', label: 'Commandes' },
          { value: 'ca', label: 'CA livré' },
          { value: 'date', label: 'Dernière commande' },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        resultCount={filtered.length}
        totalCount={clients.length}
        onReset={() => {
          setSearch('')
          setCanalFilter('ALL')
          setSort('nom')
          setSortDir('asc')
        }}
        filters={[
          {
            id: 'canal',
            label: 'Canal',
            value: canalFilter,
            onChange: setCanalFilter,
            options: [
              { value: 'ALL', label: 'Tous canaux' },
              { value: 'SITE_WEB', label: 'Site web' },
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'INSTAGRAM', label: 'Instagram' },
              { value: 'WHATSAPP', label: 'WhatsApp' },
            ],
          },
        ]}
      />

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

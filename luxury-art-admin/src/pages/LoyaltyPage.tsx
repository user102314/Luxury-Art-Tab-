import { useState } from 'react'
import { Gift, Plus, RefreshCw, Star, Users } from 'lucide-react'
import StatCard, { formatCurrency } from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useInvalidateAdmin,
  useLoyaltyClients,
  useLoyaltyPrograms,
  useLoyaltyRewards,
  useLoyaltyStats,
} from '../hooks/useAdminQueries'
import { api, formatDate } from '../lib/api'
import type { LoyaltyProgram, LoyaltyRewardType } from '../types'

const emptyProgram = {
  nom: '',
  description: '',
  commandesRequises: 3,
  typeRecompense: 'FREE_TABLEAU' as LoyaltyRewardType,
  valeurRecompense: 1,
  actif: false,
}

export default function LoyaltyPage() {
  const { data: stats, isLoading: loadingStats, isFetching: fetchingStats } = useLoyaltyStats()
  const { data: programs = [], isFetching: fetchingPrograms } = useLoyaltyPrograms()
  const { data: clients = [] } = useLoyaltyClients()
  const { data: rewards = [] } = useLoyaltyRewards()
  const invalidate = useInvalidateAdmin()
  const [form, setForm] = useState(emptyProgram)
  const [saving, setSaving] = useState(false)

  const isLoading = loadingStats && !stats
  const isFetching = fetchingStats || fetchingPrograms

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createLoyaltyProgram(form)
      setForm(emptyProgram)
      await invalidate.loyaltyPrograms()
      await invalidate.loyaltyStats()
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: number) => {
    await api.activateLoyaltyProgram(id)
    await invalidate.loyaltyPrograms()
    await invalidate.loyaltyStats()
  }

  if (isLoading) return <PageSkeleton rows={8} />

  const active = stats?.programmeActif

  return (
    <div className="space-y-8">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Programme de fidélité</h2>
          <p className="text-sm text-zinc-500">Gérez les forfaits et suivez vos clients fidèles</p>
        </div>
        <button
          type="button"
          onClick={() => {
            invalidate.loyaltyStats()
            invalidate.loyaltyPrograms()
            invalidate.loyaltyClients()
            invalidate.loyaltyRewards()
          }}
          className="btn-ghost"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {active && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Forfait actif : <strong>{active.nom}</strong> — {active.commandesRequises} commandes livrées →{' '}
          {active.typeRecompense === 'FREE_TABLEAU'
            ? `${active.valeurRecompense} tableau(x) gratuit(s)`
            : `${active.valeurRecompense} DH de réduction`}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Clients inscrits" value={String(stats?.totalClients ?? 0)} icon={Users} accent="gold" />
        <StatCard title="Récompenses" value={String(stats?.totalRecompenses ?? 0)} icon={Gift} accent="emerald" />
        <StatCard title="Commandes livrées" value={String(stats?.totalCommandesLivreesClients ?? 0)} icon={Star} accent="blue" />
        <StatCard
          title="Tableaux offerts"
          value={String(stats?.tableauxGratuitsAccordes ?? 0)}
          subtitle={`${formatCurrency(Number(stats?.totalReductionsAccordees) || 0)} réductions`}
          icon={Gift}
          accent="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="card space-y-4 p-6">
          <h3 className="font-semibold text-white">Nouveau forfait</h3>
          <div>
            <label className="label">Nom</label>
            <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Commandes requises</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.commandesRequises}
                onChange={(e) => setForm({ ...form, commandesRequises: parseInt(e.target.value, 10) })}
                required
              />
            </div>
            <div>
              <label className="label">Type récompense</label>
              <select
                className="input"
                value={form.typeRecompense}
                onChange={(e) => setForm({ ...form, typeRecompense: e.target.value as LoyaltyRewardType })}
              >
                <option value="FREE_TABLEAU">Tableau gratuit</option>
                <option value="DISCOUNT_DH">Réduction (DH)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Valeur (nb tableaux ou montant DH)</label>
            <input
              type="number"
              min={1}
              className="input"
              value={form.valeurRecompense}
              onChange={(e) => setForm({ ...form, valeurRecompense: parseFloat(e.target.value) })}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
            Activer immédiatement
          </label>
          <button type="submit" disabled={saving} className="btn-primary">
            <Plus className="h-4 w-4" />
            {saving ? 'Création...' : 'Créer le forfait'}
          </button>
        </form>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-white">Forfaits</h3>
          <div className="space-y-3">
            {programs.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun forfait</p>
            ) : (
              programs.map((p: LoyaltyProgram) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-ink-800/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{p.nom}</p>
                    <p className="text-xs text-zinc-500">
                      {p.commandesRequises} cmd. →{' '}
                      {p.typeRecompense === 'FREE_TABLEAU' ? 'tableau' : `${p.valeurRecompense} DH`}
                    </p>
                  </div>
                  {p.actif ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">Actif</span>
                  ) : (
                    <button type="button" onClick={() => handleActivate(p.id)} className="btn-ghost text-xs">
                      Activer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Clients fidélité</h3>
        </div>
        {clients.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucun client inscrit</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Cycle</th>
                <th className="px-6 py-3">Livrées</th>
                <th className="px-6 py-3">Récompenses</th>
                <th className="px-6 py-3">Tableaux</th>
                <th className="px-6 py-3">Réduction</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-6 py-3">
                    <p className="text-white">{c.nom}</p>
                    <p className="text-xs text-zinc-500">{c.email}</p>
                  </td>
                  <td className="px-6 py-3">
                    {c.commandesCycle}/{c.commandesRequises ?? '—'}
                  </td>
                  <td className="px-6 py-3">{c.totalCommandesLivrees}</td>
                  <td className="px-6 py-3">{c.totalRecompenses}</td>
                  <td className="px-6 py-3 text-gold-400">{c.tableauxGratuits}</td>
                  <td className="px-6 py-3 text-emerald-400">{formatCurrency(Number(c.reductionDisponible) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Dernières récompenses</h3>
        </div>
        {rewards.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucune récompense encore</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Programme</th>
                <th className="px-6 py-3">Récompense</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-6 py-3 text-white">{r.clientNom}</td>
                  <td className="px-6 py-3 text-zinc-400">{r.programmeNom}</td>
                  <td className="px-6 py-3 text-gold-300">{r.message}</td>
                  <td className="px-6 py-3 text-zinc-500">{formatDate(r.earnedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

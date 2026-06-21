import { useMemo, useState } from 'react'
import { Facebook, Plus, RefreshCw, Trash2 } from 'lucide-react'
import StatCard, { formatCurrency, TrendingUp } from '../components/StatCard'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import {
  useInvalidateAdmin,
  useOrderChannelStats,
  useOrders,
  useProducts,
} from '../hooks/useAdminQueries'
import {
  api,
  formatDate,
  ORDER_CANAL_COLORS,
  ORDER_CANAL_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '../lib/api'
import type { FacebookOrderLine, OrderStatut } from '../types'

const STATUTS: OrderStatut[] = ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE']

const emptyLine = (): FacebookOrderLine => ({ productId: 0, quantite: 1 })

export default function FacebookOrdersPage() {
  const { data: orders = [], isLoading, isFetching } = useOrders()
  const { data: products = [] } = useProducts()
  const { data: channelStats } = useOrderChannelStats()
  const invalidate = useInvalidateAdmin()

  const [clientNom, setClientNom] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientTelephone, setClientTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [referenceFacebook, setReferenceFacebook] = useState('')
  const [statut, setStatut] = useState<OrderStatut>('EN_ATTENTE')
  const [lines, setLines] = useState<FacebookOrderLine[]>([emptyLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const facebookOrders = useMemo(
    () => orders.filter((o) => o.canal === 'FACEBOOK').sort(
      (a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime(),
    ),
    [orders],
  )

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  )

  const addLine = () => setLines((l) => [...l, emptyLine()])

  const updateLine = (index: number, patch: Partial<FacebookOrderLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const removeLine = (index: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const estimatedTotal = lines.reduce((sum, line) => {
    const p = productMap[line.productId]
    if (!p || !line.quantite) return sum
    const unit = line.prixUnitaire ?? p.prix
    return sum + unit * line.quantite
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const validLines = lines.filter((l) => l.productId > 0 && l.quantite > 0)
    if (validLines.length === 0) {
      setError('Ajoutez au moins un produit')
      return
    }
    for (const line of validLines) {
      const p = productMap[line.productId]
      if (p && p.stock < line.quantite) {
        setError(`Stock insuffisant pour « ${p.nom} » (reste: ${p.stock})`)
        return
      }
    }

    setSaving(true)
    try {
      await api.createFacebookOrder({
        clientNom,
        clientEmail: clientEmail || undefined,
        clientTelephone: clientTelephone || undefined,
        adresseLivraison: adresse,
        referenceFacebook: referenceFacebook || undefined,
        statut,
        items: validLines.map((l) => ({
          productId: l.productId,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        })),
      })
      setClientNom('')
      setClientEmail('')
      setClientTelephone('')
      setAdresse('')
      setReferenceFacebook('')
      setStatut('EN_ATTENTE')
      setLines([emptyLine()])
      await invalidate.orders()
      await invalidate.orderChannelStats()
      await invalidate.products()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const updateStatut = async (id: number, newStatut: OrderStatut) => {
    const order = orders.find((o) => o.id === id)
    if (!order) return
    await api.updateOrder(id, { ...order, statut: newStatut })
    await invalidate.orders()
    await invalidate.orderChannelStats()
    if (newStatut === 'ANNULEE') await invalidate.products()
  }

  if (isLoading && orders.length === 0) return <PageSkeleton rows={8} />

  return (
    <div className="space-y-8">
      <QueryStatusBar fetching={isFetching} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Facebook className="h-6 w-6 text-indigo-400" />
            Commandes Facebook
          </h2>
          <p className="text-sm text-zinc-500">
            Saisie manuelle des ventes Facebook — stock et revenus mis à jour automatiquement
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            invalidate.orders()
            invalidate.orderChannelStats()
            invalidate.products()
          }}
          className="btn-ghost"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Commandes Facebook"
          value={String(channelStats?.totalFacebook ?? facebookOrders.length)}
          subtitle={`${channelStats?.facebookLivrees ?? 0} livrées (CA)`}
          icon={Facebook}
          accent="purple"
        />
        <StatCard
          title="CA Facebook"
          value={formatCurrency(Number(channelStats?.caFacebook) || 0)}
          subtitle="Commandes livrées uniquement"
          icon={Facebook}
          accent="gold"
        />
        <StatCard
          title="Commandes site web"
          value={String(channelStats?.totalSiteWeb ?? '—')}
          subtitle={`${channelStats?.siteWebLivrees ?? 0} livrées`}
          icon={TrendingUp}
          accent="blue"
        />
        <StatCard
          title="CA total (livré)"
          value={formatCurrency(Number(channelStats?.caTotal) || 0)}
          subtitle="Facebook + site web"
          icon={TrendingUp}
          accent="emerald"
        />
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <h3 className="font-semibold text-white">Nouvelle commande Facebook</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Nom client Facebook *</label>
            <input className="input" value={clientNom} onChange={(e) => setClientNom(e.target.value)} required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} placeholder="06..." />
          </div>
          <div>
            <label className="label">Email (si compte fidélité)</label>
            <input type="email" className="input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Réf. conversation Facebook</label>
            <input className="input" value={referenceFacebook} onChange={(e) => setReferenceFacebook(e.target.value)} placeholder="Lien ou n° message" />
          </div>
        </div>

        <div>
          <label className="label">Adresse de livraison *</label>
          <textarea className="input min-h-[80px]" value={adresse} onChange={(e) => setAdresse(e.target.value)} required />
        </div>

        <div>
          <label className="label">Statut initial</label>
          <select className="input w-auto" value={statut} onChange={(e) => setStatut(e.target.value as OrderStatut)}>
            {STATUTS.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Produits commandés</label>
            <button type="button" onClick={addLine} className="btn-ghost text-xs">
              <Plus className="h-3 w-3" />
              Ajouter une ligne
            </button>
          </div>
          {lines.map((line, index) => {
            const product = productMap[line.productId]
            return (
              <div key={index} className="flex flex-wrap items-end gap-3 rounded-xl bg-ink-800/50 p-4">
                <div className="min-w-[200px] flex-1">
                  <label className="label text-xs">Produit</label>
                  <select
                    className="input"
                    value={line.productId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      const p = productMap[id]
                      updateLine(index, {
                        productId: id,
                        prixUnitaire: p ? p.prix : undefined,
                      })
                    }}
                    required
                  >
                    <option value="">Choisir…</option>
                    {products.filter((p) => p.statut !== 'ARCHIVE').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} — stock: {p.stock} — {p.prix} DH
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="label text-xs">Qté</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={line.quantite}
                    onChange={(e) => updateLine(index, { quantite: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="label text-xs">Prix unit.</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    value={line.prixUnitaire ?? product?.prix ?? ''}
                    onChange={(e) => updateLine(index, { prixUnitaire: parseFloat(e.target.value) })}
                  />
                </div>
                {product && (
                  <p className="pb-2 text-xs text-zinc-500">
                    Reste après cmd: <strong className={product.stock - line.quantite < 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {product.stock - line.quantite}
                    </strong>
                  </p>
                )}
                <button type="button" onClick={() => removeLine(index)} className="rounded-lg p-2 text-zinc-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
          <p className="text-lg font-semibold text-gold-400">Total estimé : {formatCurrency(estimatedTotal)}</p>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement…' : 'Enregistrer la commande Facebook'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Historique Facebook ({facebookOrders.length})</h3>
        </div>
        {facebookOrders.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">Aucune commande Facebook enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Produits</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Réf. FB</th>
                </tr>
              </thead>
              <tbody>
                {facebookOrders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5">
                    <td className="px-6 py-3 text-white">{o.id}</td>
                    <td className="px-6 py-3 text-zinc-400">{formatDate(o.dateCommande)}</td>
                    <td className="px-6 py-3">
                      <p className="text-white">{o.clientNom ?? o.userNom}</p>
                      {o.clientTelephone && <p className="text-xs text-zinc-500">{o.clientTelephone}</p>}
                    </td>
                    <td className="max-w-xs px-6 py-3 text-zinc-400">
                      {o.items?.map((i) => `${i.productNom ?? 'Produit'} ×${i.quantite}`).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gold-400">{formatCurrency(Number(o.total) || 0)}</td>
                    <td className="px-6 py-3">
                      <select
                        value={o.statut}
                        onChange={(e) => updateStatut(o.id, e.target.value as OrderStatut)}
                        className={`rounded-lg border-0 px-2 py-1 text-xs ${ORDER_STATUS_COLORS[o.statut]}`}
                      >
                        {STATUTS.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-[120px] truncate px-6 py-3 text-xs text-zinc-500">{o.referenceFacebook ?? '—'}</td>
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

import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  User,
  X,
} from 'lucide-react'
import { api, formatCurrency, formatDate, ORDER_CANAL_LABELS, ORDER_STATUS_LABELS } from '../lib/api'
import type { ColissimoTracking } from '../types'

interface Props {
  orderId: number
  onClose: () => void
  onRefreshed?: () => void
}

export default function OrderTrackingDetail({ orderId, onClose, onRefreshed }: Props) {
  const [tracking, setTracking] = useState<ColissimoTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = async (refresh: boolean) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const data = await api.getColissimoTracking(orderId, refresh)
      setTracking(data)
      if (refresh) onRefreshed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le suivi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Truck className="h-5 w-5 text-sky-400" />
              Suivi livraison — Commande #{orderId}
            </h3>
            {tracking?.liveFromApi && (
              <p className="mt-1 text-xs text-emerald-400">Données mises à jour depuis Colissimo</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="btn-ghost"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading && !tracking && (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-800" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {tracking && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={Package}
                label="Code colis"
                value={tracking.codeBarre}
                accent="text-sky-300"
              />
              <InfoCard
                icon={Clock}
                label="État Colissimo"
                value={tracking.etatLabel ?? tracking.etat ?? '—'}
                accent="text-amber-300"
              />
              <InfoCard
                icon={Truck}
                label="Transporteur"
                value={tracking.transporteur ?? 'Colissimo'}
                accent="text-emerald-300"
              />
              <InfoCard
                icon={Building2}
                label="Agence / Point Colissimo"
                value={tracking.agenceActuelle ?? '—'}
                accent="text-violet-300"
              />
            </div>

            <section className="rounded-xl border border-white/10 bg-ink-900/50 p-5">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Progression de la livraison
              </h4>
              <TrackingTimeline steps={tracking.timeline} />
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-white/10 bg-ink-900/50 p-5">
                <h4 className="mb-3 text-sm font-semibold text-white">Destinataire</h4>
                <div className="space-y-2 text-sm">
                  <Row icon={User} label="Client" value={tracking.clientNom} />
                  <Row icon={Phone} label="Téléphone" value={tracking.tel1 ?? tracking.clientTelephone} />
                  <Row icon={MapPin} label="Adresse" value={tracking.adresse} />
                  {(tracking.ville || tracking.gouvernorat) && (
                    <Row
                      icon={MapPin}
                      label="Ville / Gouvernorat"
                      value={[tracking.ville, tracking.gouvernorat].filter(Boolean).join(', ')}
                    />
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-ink-900/50 p-5">
                <h4 className="mb-3 text-sm font-semibold text-white">Détails transport</h4>
                <div className="space-y-2 text-sm">
                  <Row label="Référence" value={tracking.reference} />
                  <Row label="N° manifeste (tournée)" value={tracking.numManifeste} />
                  <Row label="N° paiement" value={tracking.numPaiement} />
                  <Row label="Article" value={tracking.designation} />
                  <Row label="Pièces" value={tracking.nbPieces != null ? String(tracking.nbPieces) : undefined} />
                  <Row
                    label="Montant colis"
                    value={tracking.prix != null ? formatCurrency(Number(tracking.prix)) : undefined}
                  />
                  <Row label="Date création colis" value={tracking.dateCreation} />
                  <Row
                    label="Statut commande"
                    value={ORDER_STATUS_LABELS[tracking.orderStatut]}
                  />
                  <Row
                    label="Canal"
                    value={tracking.canal ? ORDER_CANAL_LABELS[tracking.canal] : undefined}
                  />
                  <Row label="Commande du" value={formatDate(tracking.dateCommande)} />
                </div>
              </section>
            </div>

            {tracking.commentaire && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
                <span className="font-medium">Note Colissimo :</span> {tracking.commentaire}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TrackingTimeline({ steps }: { steps: ColissimoTracking['timeline'] }) {
  return (
    <div className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'

        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div
                className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 ${
                  isCompleted ? 'bg-emerald-500/60' : 'bg-white/10'
                }`}
              />
            )}
            <div className="relative z-10 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : isCurrent ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-500/20">
                  <Truck className="h-4 w-4 text-sky-300" />
                </div>
              ) : (
                <Circle className="h-8 w-8 text-zinc-600" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`font-medium ${
                  isCurrent ? 'text-sky-200' : isCompleted ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl bg-ink-800/60 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 truncate text-sm font-semibold ${accent ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />}
      <div className="min-w-0">
        <span className="text-zinc-500">{label} : </span>
        <span className="text-zinc-200">{value}</span>
      </div>
    </div>
  )
}

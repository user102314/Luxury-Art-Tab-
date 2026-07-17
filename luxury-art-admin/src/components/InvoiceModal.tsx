import { Download, FileText, Package, X } from 'lucide-react'
import { formatCurrency, formatDate, ORDER_CANAL_LABELS } from '../lib/api'
import { downloadInvoicePdf, invoiceFileName, INVOICE_SELLER } from '../lib/invoice'
import type { Order } from '../types'

interface InvoiceModalProps {
  order: Order
  onClose: () => void
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const clientNom = order.clientNom ?? order.userNom ?? `Client #${order.userId}`
  const itemCount = order.items?.reduce((n, i) => n + i.quantite, 0) ?? 0

  const handleDownload = () => {
    downloadInvoicePdf(order)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="card w-full max-w-md p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/20">
              <FileText className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Créer une facture</h3>
              <p className="text-sm text-zinc-500">Commande #{order.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 space-y-3 rounded-xl bg-ink-800/60 p-4 text-sm">
          <Row label="Client" value={clientNom} />
          <Row label="Date" value={formatDate(order.dateCommande)} />
          <Row label="Canal" value={ORDER_CANAL_LABELS[order.canal ?? 'SITE_WEB']} />
          <Row label="Articles" value={`${itemCount || (order.items?.length ?? 0)} produit(s)`} />
          <Row label="N° colis" value={order.numeroColis || 'Généré à la confirmation'} />
          <Row label="Total" value={formatCurrency(Number(order.total) || 0)} />
          <Row label="Fichier" value={invoiceFileName(order)} />
        </div>

        <div className="mb-5 flex gap-3 rounded-xl border border-gold-500/20 bg-gold-500/5 p-3 text-xs text-zinc-400">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
          <p>
            Facture professionnelle <strong className="text-zinc-300">{INVOICE_SELLER.nom}</strong> —
            à glisser dans le colis du client (détail produits, prix, date, adresse).
          </p>
        </div>

        <p className="mb-4 text-sm text-zinc-400">
          Voulez-vous télécharger la facture maintenant ?
        </p>

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger la facture
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value}</span>
    </div>
  )
}

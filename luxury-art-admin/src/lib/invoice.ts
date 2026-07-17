import { jsPDF } from 'jspdf'
import type { Order } from '../types'
import { ORDER_CANAL_LABELS, ORDER_STATUS_LABELS } from './api'

/** Infos vendeur affichées sur la facture (colis client). */
export const INVOICE_SELLER = {
  nom: 'Luxury Art',
  slogan: 'Art & Décoration',
  email: 'contact@luxart.com',
  telephone: '+212 600 000 000',
  adresse: 'Maroc',
}

function money(n: number): string {
  return `${n.toFixed(2)} DH`
}

function formatInvoiceDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function invoiceFileName(order: Order): string {
  return `facture-commande-${order.id}.pdf`
}

/**
 * Génère une facture PDF A4 professionnelle destinée au colis client.
 */
export function generateInvoicePdf(order: Order): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = 18

  const items = order.items ?? []
  const clientNom = order.clientNom ?? order.userNom ?? `Client #${order.userId}`
  const canal = ORDER_CANAL_LABELS[order.canal ?? 'SITE_WEB']
  const statut = ORDER_STATUS_LABELS[order.statut] ?? order.statut

  // En-tête bande
  doc.setFillColor(26, 26, 31)
  doc.rect(0, 0, pageW, 42, 'F')
  doc.setFillColor(184, 135, 58)
  doc.rect(0, 42, pageW, 1.2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(INVOICE_SELLER.nom, margin, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 200, 205)
  doc.text(INVOICE_SELLER.slogan, margin, 27)
  doc.text(`${INVOICE_SELLER.telephone}  ·  ${INVOICE_SELLER.email}`, margin, 33)
  doc.text(INVOICE_SELLER.adresse, margin, 38)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('FACTURE', pageW - margin, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(230, 210, 170)
  doc.text(`N° FAC-${String(order.id).padStart(5, '0')}`, pageW - margin, 28, { align: 'right' })
  doc.setTextColor(180, 180, 185)
  doc.text(`Commande #${order.id}`, pageW - margin, 34, { align: 'right' })

  y = 54

  // Méta commande
  doc.setTextColor(40, 40, 45)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Date de commande', margin, y)
  doc.text('Canal', margin + 55, y)
  doc.text('Statut', margin + 95, y)
  doc.text('N° colis', margin + 135, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(formatInvoiceDate(order.dateCommande), margin, y)
  doc.text(canal, margin + 55, y)
  doc.text(statut, margin + 95, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(184, 135, 58)
  doc.text(order.numeroColis || '—', margin + 135, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 45)

  y += 12

  // Encadrés client / livraison
  const boxH = 32
  const boxW = (contentW - 6) / 2

  doc.setDrawColor(220, 220, 225)
  doc.setFillColor(250, 249, 246)
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'FD')
  doc.roundedRect(margin + boxW + 6, y, boxW, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 145)
  doc.text('FACTURÉ À', margin + 4, y + 6)
  doc.text('LIVRAISON', margin + boxW + 10, y + 6)

  doc.setTextColor(30, 30, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(clientNom, margin + 4, y + 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const leftLines: string[] = []
  if (order.clientTelephone) leftLines.push(`Tél. ${order.clientTelephone}`)
  if (order.referenceFacebook) leftLines.push(`Réf. FB : ${order.referenceFacebook}`)
  if (order.referenceInstagram) leftLines.push(`Réf. IG : ${order.referenceInstagram}`)
  if (leftLines.length === 0) leftLines.push('—')
  doc.text(leftLines.join('\n'), margin + 4, y + 19)

  const adresseLines = doc.splitTextToSize(order.adresseLivraison || '—', boxW - 8)
  doc.text(adresseLines.slice(0, 3), margin + boxW + 10, y + 13)

  y += boxH + 12

  // Tableau articles
  const colProduit = margin
  const colQte = margin + contentW * 0.52
  const colPrix = margin + contentW * 0.68
  const colTotal = margin + contentW

  doc.setFillColor(26, 26, 31)
  doc.roundedRect(margin, y, contentW, 9, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('PRODUIT', colProduit + 3, y + 6)
  doc.text('QTÉ', colQte, y + 6, { align: 'right' })
  doc.text('PRIX UNIT.', colPrix, y + 6, { align: 'right' })
  doc.text('TOTAL', colTotal - 3, y + 6, { align: 'right' })

  y += 11
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let computed = 0

  if (items.length === 0) {
    doc.setTextColor(120, 120, 125)
    doc.text('Aucun article détaillé', margin + 3, y + 4)
    y += 10
  } else {
    items.forEach((item, index) => {
      if (y > 260) {
        doc.addPage()
        y = 20
      }
      const nom = item.productNom ?? `Produit #${item.productId}`
      const qte = item.quantite
      const unit = Number(item.prixUnitaire) || 0
      const line = unit * qte
      computed += line

      if (index % 2 === 0) {
        doc.setFillColor(248, 247, 244)
        doc.rect(margin, y - 1, contentW, 9, 'F')
      }

      doc.setTextColor(35, 35, 40)
      const nameLines = doc.splitTextToSize(nom, contentW * 0.48)
      doc.text(nameLines[0], colProduit + 3, y + 5)
      doc.text(String(qte), colQte, y + 5, { align: 'right' })
      doc.text(money(unit), colPrix, y + 5, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(money(line), colTotal - 3, y + 5, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 9
    })
  }

  y += 4
  doc.setDrawColor(184, 135, 58)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  const totalOrder = Number(order.total)
  const total = Number.isFinite(totalOrder) && totalOrder > 0 ? totalOrder : computed

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 95)
  doc.text('Sous-total', pageW - margin - 45, y, { align: 'right' })
  doc.setTextColor(40, 40, 45)
  doc.text(money(computed || total), pageW - margin, y, { align: 'right' })
  y += 8

  doc.setFillColor(184, 135, 58)
  doc.roundedRect(pageW - margin - 70, y - 5, 70, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL', pageW - margin - 40, y + 3, { align: 'right' })
  doc.text(money(total), pageW - margin - 4, y + 3, { align: 'right' })

  y += 22

  // Note colis
  doc.setDrawColor(230, 230, 235)
  doc.setFillColor(252, 251, 248)
  doc.roundedRect(margin, y, contentW, 28, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(184, 135, 58)
  doc.text('Document destiné au colis client', margin + 4, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 95)
  const trackingLine = order.numeroColis
    ? `N° de colis / suivi : ${order.numeroColis}. `
    : ''
  const note = doc.splitTextToSize(
    trackingLine +
      'Merci pour votre confiance. Cette facture récapitule les articles livrés. ' +
      'Pour toute question, contactez Luxury Art avec le numéro de facture ou de colis.',
    contentW - 8,
  )
  doc.text(note, margin + 4, y + 14)

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 12
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 155)
  doc.text(
    `${INVOICE_SELLER.nom} — Facture FAC-${String(order.id).padStart(5, '0')} — Générée le ${formatInvoiceDate(new Date().toISOString())}`,
    pageW / 2,
    footerY,
    { align: 'center' },
  )

  return doc
}

export function downloadInvoicePdf(order: Order): void {
  const doc = generateInvoicePdf(order)
  doc.save(invoiceFileName(order))
}

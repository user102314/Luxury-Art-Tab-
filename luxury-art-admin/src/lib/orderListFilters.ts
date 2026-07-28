import type { Order, OrderStatut } from '../types'
import { compareDates, compareNumbers, compareStrings, inDateRange, matchesSearch, type SortDir } from './listUtils'

export type OrderSortKey = 'date' | 'total' | 'client' | 'statut'

export interface OrderListControls {
  search?: string
  statut?: string
  sort?: OrderSortKey
  sortDir?: SortDir
  dateFrom?: string
  dateTo?: string
}

export function filterSortOrders(orders: Order[], controls: OrderListControls) {
  const {
    search = '',
    statut = 'ALL',
    sort = 'date',
    sortDir = 'desc',
    dateFrom = '',
    dateTo = '',
  } = controls

  let list = orders.filter((o) => {
    if (statut !== 'ALL' && o.statut !== statut) return false
    if (!inDateRange(o.dateCommande, dateFrom, dateTo)) return false
    if (
      !matchesSearch(search, [
        o.id,
        o.clientNom,
        o.userNom,
        o.clientTelephone,
        o.numeroColis,
        o.colissimoCodeBarre,
        o.adresseLivraison,
        o.referenceFacebook,
        o.referenceInstagram,
        o.referenceWhatsapp,
      ])
    ) {
      return false
    }
    return true
  })

  list = [...list].sort((a, b) => {
    switch (sort) {
      case 'total':
        return compareNumbers(Number(a.total) || 0, Number(b.total) || 0, sortDir)
      case 'client':
        return compareStrings(
          a.clientNom ?? a.userNom ?? '',
          b.clientNom ?? b.userNom ?? '',
          sortDir,
        )
      case 'statut':
        return compareStrings(a.statut, b.statut, sortDir)
      case 'date':
      default:
        return compareDates(a.dateCommande, b.dateCommande, sortDir)
    }
  })

  return list
}

export const ORDER_SORT_OPTIONS: { value: OrderSortKey; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'total', label: 'Montant' },
  { value: 'client', label: 'Client' },
  { value: 'statut', label: 'Statut' },
]

export const ORDER_STATUT_FILTER: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tous statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRMEE', label: 'Confirmée' },
  { value: 'EXPEDIEE', label: 'Expédiée' },
  { value: 'LIVREE', label: 'Livrée' },
  { value: 'ANNULEE', label: 'Annulée' },
]

export const ORDER_STATUTS: OrderStatut[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
]

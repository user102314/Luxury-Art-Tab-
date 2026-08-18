import type {
  Cadre,
  CatalogPricing,
  DimensionCadrePrix,
  Product,
  TableauDimension,
} from '@/types/api'

export function formatPrice(amount: number): string {
  return `${Number(amount).toLocaleString('fr-TN')} TND`
}

export function formatStartingPrice(amount?: number | null): string {
  if (amount == null || Number.isNaN(Number(amount))) return 'Prix selon format'
  return `À partir de ${formatPrice(Number(amount))}`
}

export function displayDimension(label: string): string {
  return `${label.replaceAll('/', '×')} cm`
}

export function cartLineKey(item: {
  productId: number
  taille: string
  encadrement: string
  couleur?: string
}): string {
  return `${item.productId}::${item.taille}::${item.encadrement}::${item.couleur ?? ''}`
}

export function findTarif(
  tarifs: DimensionCadrePrix[],
  dimensionId?: number | null,
  cadreId?: number | null,
): DimensionCadrePrix | undefined {
  if (!dimensionId || !cadreId) return undefined
  return tarifs.find((t) => t.dimensionId === dimensionId && t.cadreId === cadreId)
}

export function resolveCatalogPrice(
  catalog: CatalogPricing,
  dimensionId?: number | null,
  cadreId?: number | null,
): number | null {
  const tarif = findTarif(catalog.tarifs, dimensionId, cadreId)
  return tarif?.prix != null ? Number(tarif.prix) : null
}

export function productDimensions(product: Product, catalog?: CatalogPricing | null): TableauDimension[] {
  if (product.dimensions?.length) {
    return [...product.dimensions].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || a.id - b.id)
  }
  const ids = new Set(product.dimensionIds ?? [])
  return (catalog?.dimensions ?? []).filter((d) => ids.has(d.id))
}

export function availableCadres(catalog: CatalogPricing, dimensionId?: number | null): Cadre[] {
  if (!dimensionId) return []
  const priced = new Set(
    catalog.tarifs
      .filter((t) => t.dimensionId === dimensionId && t.prix != null)
      .map((t) => t.cadreId),
  )
  return catalog.cadres.filter((c) => priced.has(c.id))
}

export function pricedDimensions(product: Product, catalog?: CatalogPricing | null): TableauDimension[] {
  const dims = productDimensions(product, catalog)
  if (!catalog) return dims
  return dims.filter((d) => availableCadres(catalog, d.id).length > 0)
}

/** Conservé pour compatibilité — le prix est désormais lu dans le catalogue. */
export function getPrice(basePrice: number, _size?: string): number {
  return Number(basePrice) || 0
}

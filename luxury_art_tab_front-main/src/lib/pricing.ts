export const dimensionOptions = [
  { label: '20×30 cm', value: '20×30', multiplier: 1 },
  { label: '30×40 cm', value: '30×40', multiplier: 1.3 },
  { label: '40×60 cm', value: '40×60', multiplier: 1.6 },
  { label: '50×70 cm', value: '50×70', multiplier: 2 },
  { label: '60×90 cm', value: '60×90', multiplier: 2.5 },
  { label: '80×120 cm', value: '80×120', multiplier: 3.2 },
  { label: '100×150 cm', value: '100×150', multiplier: 4 },
] as const

export const frameOptions = [
  'Toile sans cadre exterieur',
  'Toile avec cadre exterieur dore',
  'Toile avec cadre exterieur argente',
  'Toile avec cadre exterieur noir',
  'Toile avec cadre exterieur blanc',
] as const

export function getPrice(basePrice: number, size: string): number {
  const dim = dimensionOptions.find((d) => d.value === size)
  return Math.round(basePrice * (dim?.multiplier ?? 1))
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} DH`
}

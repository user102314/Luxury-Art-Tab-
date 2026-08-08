export type SortDir = 'asc' | 'desc'

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

export function compareStrings(a: string, b: string, dir: SortDir) {
  const cmp = a.localeCompare(b, 'fr', { sensitivity: 'base' })
  return dir === 'asc' ? cmp : -cmp
}

export function compareNumbers(a: number, b: number, dir: SortDir) {
  return dir === 'asc' ? a - b : b - a
}

export function compareDates(
  a?: string | null,
  b?: string | null,
  dir: SortDir = 'desc',
) {
  const ta = a ? new Date(a).getTime() : 0
  const tb = b ? new Date(b).getTime() : 0
  return dir === 'asc' ? ta - tb : tb - ta
}

export function inDateRange(iso?: string | null, from?: string, to?: string) {
  if (!from && !to) return true
  if (!iso) return false
  const time = new Date(iso).getTime()
  if (from) {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    if (time < start.getTime()) return false
  }
  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    if (time > end.getTime()) return false
  }
  return true
}

export function matchesSearch(term: string, values: Array<string | number | null | undefined>) {
  const t = normalizeSearch(term)
  if (!t) return true
  return values.some((v) => String(v ?? '').toLowerCase().includes(t))
}

/** Normalise une référence pour détecter les variantes (ex. B 109 / B 109'). */
export function normalizeProductRef(ref: string): string {
  return ref
    .trim()
    .replace(/[''`]+$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/**
 * Numéro principal de la référence (ex. « B 1046 » → 1046, « B 104 » → 104).
 */
export function extractPrimaryRefNumber(ref: string): number | null {
  const normalized = normalizeProductRef(ref)
  const prefixed = normalized.match(/^[A-Z]+\s*(\d+)/)
  if (prefixed) return Number.parseInt(prefixed[1], 10)
  const any = normalized.match(/(\d+)/)
  return any ? Number.parseInt(any[1], 10) : null
}

/**
 * Filtre recherche par référence :
 * - « 104 » → B 104 uniquement (pas B 1046)
 * - « B 105 » → B 105 exact
 * - texte libre → sous-chaîne classique
 */
export function refMatchesSearch(ref: string, search: string): boolean {
  const term = search.trim()
  if (!term) return true

  const termLower = term.toLowerCase()
  const refLower = ref.trim().toLowerCase()

  const exactNum = term.match(/^(\d+)([''`])?$/)
  if (exactNum) {
    const n = extractPrimaryRefNumber(ref)
    if (n === null || String(n) !== exactNum[1]) return false
    const wantsVariant = Boolean(exactNum[2])
    return wantsVariant ? isVariantRef(ref) : !isVariantRef(ref)
  }

  const letterNum = term.match(/^([a-zA-Z]+)\s*(\d+)([''`])?$/i)
  if (letterNum) {
    const refParts = ref.trim().match(/^([a-zA-Z]+)\s*(\d+)/i)
    if (!refParts) return refLower.includes(termLower)
    const prefixOk =
      refParts[1].toLowerCase() === letterNum[1].toLowerCase() &&
      refParts[2] === letterNum[2]
    if (!prefixOk) return false
    const wantsVariant = Boolean(letterNum[3])
    return wantsVariant ? isVariantRef(ref) : !isVariantRef(ref)
  }

  return refLower.includes(termLower)
}

/** Tri par numéro principal ; à égalité B 101 avant B 101'. */
export function compareProductRefs(a: string, b: string): number {
  const numA = extractPrimaryRefNumber(a)
  const numB = extractPrimaryRefNumber(b)
  if (numA !== null && numB !== null && numA !== numB) {
    return numA - numB
  }
  if (numA !== null && numB === null) return -1
  if (numA === null && numB !== null) return 1

  const varA = isVariantRef(a) ? 1 : 0
  const varB = isVariantRef(b) ? 1 : 0
  if (varA !== varB) return varA - varB

  return a.trim().localeCompare(b.trim(), 'fr', { sensitivity: 'base', numeric: true })
}

/** Variante catalogue du type B 109' (apostrophe en suffixe). */
export function isVariantRef(ref: string): boolean {
  return /[''`]\s*$/.test(ref.trim())
}

function pickCanonicalProduct<T extends { ref: string; id: number }>(group: T[]): T {
  return group.reduce((best, p) => {
    if (isVariantRef(best.ref) && !isVariantRef(p.ref)) return p
    if (!isVariantRef(best.ref) && isVariantRef(p.ref)) return best
    return p.id < best.id ? p : best
  })
}

/**
 * Sur « Toutes les catégories », ne garder qu'un produit par référence de base.
 * Ex. B 109 (AFFRO) masque B 109' (FEMMES) sur la galerie globale.
 */
export function dedupeCatalogVariants<T extends { ref: string; id: number }>(sorted: T[]): T[] {
  if (sorted.length <= 1) return sorted

  const canonicalByKey = new Map<string, T>()
  for (const p of sorted) {
    const key = normalizeProductRef(p.ref)
    const prev = canonicalByKey.get(key)
    canonicalByKey.set(key, prev ? pickCanonicalProduct([prev, p]) : p)
  }

  const keepIds = new Set([...canonicalByKey.values()].map((p) => p.id))
  return sorted.filter((p) => keepIds.has(p.id))
}

/** 1 = premier. 0 / absent = après les produits priorisés. */
export function compareDisplayOrder<T extends { displayOrder?: number | null; id: number; ref: string }>(
  a: T,
  b: T,
) {
  const rank = (p: T) => {
    const order = p.displayOrder ?? 0
    return order > 0 ? order : Number.MAX_SAFE_INTEGER
  }
  const diff = rank(a) - rank(b)
  if (diff !== 0) return diff
  return compareProductRefs(a.ref, b.ref) || a.id - b.id
}

/**
 * @deprecated Préférer dedupeCatalogVariants sur la galerie globale.
 */
export function spreadSimilarProducts<T extends { ref: string }>(sorted: T[]): T[] {
  if (sorted.length <= 1) return sorted

  const result = [...sorted]

  for (let i = 1; i < result.length; i++) {
    const prevKey = normalizeProductRef(result[i - 1].ref)
    const currKey = normalizeProductRef(result[i].ref)
    if (prevKey === currKey) {
      let swapIdx = -1
      for (let j = i + 1; j < result.length; j++) {
        if (normalizeProductRef(result[j].ref) !== prevKey) {
          swapIdx = j
          break
        }
      }
      if (swapIdx !== -1) {
        const [item] = result.splice(i, 1)
        result.splice(swapIdx, 0, item)
      }
    }
  }

  return result
}

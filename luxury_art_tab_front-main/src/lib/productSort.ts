/** Normalise une référence pour détecter les variantes (ex. B 109 / B 109'). */
export function normalizeProductRef(ref: string): string {
  return ref
    .trim()
    .replace(/[''`]+$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
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

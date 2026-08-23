/** Normalise une référence pour détecter les variantes (ex. B 109 / B 109'). */
export function normalizeProductRef(ref: string): string {
  return ref
    .trim()
    .replace(/[''`]+$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/**
 * Évite d'afficher côte à côte des produits quasi-identiques
 * (même référence de base dans des catégories différentes).
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

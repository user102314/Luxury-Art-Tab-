import type { Category } from '@/types/api'
import { heroCategories } from '@/data/heroCategories'

/** Normalise un libellé en slug URL. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Alias hero marketing → libellés / slugs API possibles.
 * Les pages hero sans catégorie API réelle restent noindex.
 */
const SLUG_ALIASES: Record<string, string[]> = {
  enfants: ['enfant', 'enfants'],
  femmes: ['femme', 'femmes'],
  cuisine: ['cuisine'],
  animaux: ['animal', 'animaux'],
  'moderne-abstrait': ['moderne', 'abstrait', 'moderne-abstrait'],
  florale: ['florale', 'floral', 'fleurs'],
  'calligraphie-et-islamique': ['calligraphie', 'islamique'],
  'traditionnel-orientale-mediterraneenne': [
    'traditionnel',
    'orientale',
    'mediterraneenne',
    'méditerranéenne',
  ],
}

export function categorySlug(category: Category): string {
  return slugify(category.nom)
}

/** Trouve une catégorie API à partir d’un slug URL. */
export function resolveCategoryBySlug(
  slug: string,
  categories: Category[],
): Category | null {
  const normalized = slugify(slug)
  if (!normalized) return null

  const exact = categories.find((c) => categorySlug(c) === normalized)
  if (exact) return exact

  const aliases = SLUG_ALIASES[normalized] ?? [normalized]
  for (const cat of categories) {
    const catSlug = categorySlug(cat)
    const catName = slugify(cat.nom)
    if (aliases.some((a) => catSlug === a || catName === a || catSlug.includes(a) || a.includes(catSlug))) {
      return cat
    }
  }

  return null
}

/** Slug SEO préféré pour une catégorie API (pour canonical / liens). */
export function preferredCategorySlug(category: Category): string {
  const apiSlug = categorySlug(category)
  const hero = heroCategories.find((h) => {
    const aliases = SLUG_ALIASES[h.slug] ?? [h.slug]
    return aliases.some((a) => a === apiSlug || apiSlug.includes(a) || a.includes(apiSlug))
  })
  return hero?.slug ?? apiSlug
}

export function isHeroOnlySlug(slug: string): boolean {
  return heroCategories.some((h) => h.slug === slug)
}

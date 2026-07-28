import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArViewer } from '@/components/ArViewer'
import { CategoryShowcaseCarousel } from '@/components/CategoryShowcaseCarousel'
import { ProductCard } from '@/components/ProductCard'
import { useCategories, useProducts } from '@/hooks/useStorefrontQueries'

export function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [arImage, setArImage] = useState<string | null>(null)

  const { data: products = [], isLoading } = useProducts()
  const { data: categories = [] } = useCategories()

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.nom])),
    [categories],
  )

  const available = useMemo(
    () => products.filter((p) => p.statut !== 'ARCHIVE'),
    [products],
  )

  const filtered = useMemo(() => {
    let list = available
    if (activeCategory !== 'all') {
      list = list.filter((p) => p.categoryId === Number(activeCategory))
    }
    return list.slice(0, 8)
  }, [available, activeCategory])

  return (
    <section id="galerie" className="relative bg-background px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-end">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.25em] text-brand-red">
              La Galerie
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Tableaux <em className="text-accent-orange">muraux</em>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Une sélection d&apos;œuvres encadrées pour habiller vos murs — catalogue dynamique
              connecté à notre atelier.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeCategory === 'all'
                  ? 'border-accent-green bg-accent-green text-white shadow-md'
                  : 'border-border bg-background/60 hover:border-accent-green/40'
              }`}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(String(cat.id))}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === String(cat.id)
                    ? 'border-brand-red bg-brand-red text-white shadow-md'
                    : 'border-border bg-background/60 hover:border-brand-red/40'
                }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={categoryMap[p.categoryId]}
                index={i}
                onAr={setArImage}
                compact
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-red bg-brand-red px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-red/90 hover:shadow-xl"
          >
            Voir tous les produits
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="relative mt-4">
          <CategoryShowcaseCarousel />
        </div>
      </div>

      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </section>
  )
}

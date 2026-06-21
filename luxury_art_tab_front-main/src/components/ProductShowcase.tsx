import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArViewer } from '@/components/ArViewer'
import { ProductCard } from '@/components/ProductCard'
import { useCategories, useProducts } from '@/hooks/useStorefrontQueries'
import collection1 from '@/assets/collections/81887183-9b18-4264-a5ba-4b9a8f37c27b.jpg'
import collection2 from '@/assets/collections/be538121-a7e5-44ab-8c1e-0ff8efdc9151.jpg'
import collection3 from '@/assets/collections/c2251ece-b473-4122-9dae-8c610588eb63.jpg'

const collections = [collection1, collection2, collection3]

export function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [arImage, setArImage] = useState<string | null>(null)
  const [collectionIndex, setCollectionIndex] = useState(0)

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
    return list.slice(0, 6)
  }, [available, activeCategory])

  useEffect(() => {
    const id = window.setInterval(() => {
      setCollectionIndex((i) => (i + 1) % collections.length)
    }, 3200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section id="galerie" className="relative bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.25em] text-brand-red">
              La Galerie
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Tableaux <em className="text-accent-orange">muraux</em>
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Une sélection d&apos;œuvres encadrées pour habiller vos murs — catalogue dynamique
              connecté à notre atelier.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
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
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
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
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={categoryMap[p.categoryId]}
                index={i}
                onAr={setArImage}
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-red bg-brand-red px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-red/90 hover:shadow-xl"
          >
            Voir tous les produits
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Collections carousel */}
        <div className="mt-24">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-accent-green/20 bg-gradient-to-br from-[#f9f1df] via-[#fcf8ef] to-[#f4e3c7] p-3 shadow-[0_30px_80px_-35px_rgba(80,30,10,0.55)] md:p-5">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    'radial-gradient(circle at 20% 20%, rgba(236, 90, 60, 0.12), transparent 24%), radial-gradient(circle at 80% 30%, rgba(244, 162, 97, 0.15), transparent 28%), radial-gradient(circle at 50% 80%, rgba(126, 151, 107, 0.12), transparent 30%)',
                }}
              />
              <div className="relative overflow-hidden rounded-[2rem] bg-white/35 backdrop-blur-sm">
                {collections.map((item, i) => (
                  <div
                    key={item}
                    className={`absolute inset-0 transition-all duration-700 ease-out ${
                      i === collectionIndex
                        ? 'translate-x-0 scale-100 opacity-100'
                        : i < collectionIndex
                          ? '-translate-x-8 scale-[0.985] opacity-0'
                          : 'translate-x-8 scale-[0.985] opacity-0'
                    }`}
                    aria-hidden={i !== collectionIndex}
                  >
                    <div className="relative min-h-[520px] md:min-h-[720px]">
                      <img src={item} alt={`Collection ${i + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                  </div>
                ))}
                <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center">
                  <div className="rounded-full border border-white/50 bg-black/20 px-4 py-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      {collections.map((_, dotIndex) => (
                        <button
                          key={dotIndex}
                          type="button"
                          onClick={() => setCollectionIndex(dotIndex)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            dotIndex === collectionIndex ? 'w-10 bg-accent-green' : 'w-2 bg-white/45'
                          }`}
                          aria-label={`Collection ${dotIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="invisible min-h-[520px] md:min-h-[720px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </section>
  )
}

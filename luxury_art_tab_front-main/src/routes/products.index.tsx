import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ProductCard } from '@/components/ProductCard'
import { ArViewer } from '@/components/ArViewer'
import { useCategories, useProducts } from '@/hooks/useStorefrontQueries'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/products/')({
  component: ProductsPage,
})

type SortOption = 'price-asc' | 'price-desc' | 'name' | 'stock'

function ProductsPage() {
  const [categoryId, setCategoryId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [arImage, setArImage] = useState<string | null>(null)

  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: categories = [] } = useCategories()

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.nom])),
    [categories],
  )

  const available = useMemo(
    () => products.filter((p) => p.statut !== 'ARCHIVE'),
    [products],
  )

  const priceBounds = useMemo(() => {
    if (available.length === 0) return [0, 1000] as [number, number]
    const prices = available.map((p) => Number(p.prix))
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number]
  }, [available])

  useEffect(() => {
    setPriceRange(priceBounds)
  }, [priceBounds[0], priceBounds[1]])

  const filtered = useMemo(() => {
    let list = available.filter((p) => {
      const price = Number(p.prix)
      if (price < priceRange[0] || price > priceRange[1]) return false
      if (categoryId !== 'all' && p.categoryId !== Number(categoryId)) return false
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return Number(a.prix) - Number(b.prix)
        case 'price-desc':
          return Number(b.prix) - Number(a.prix)
        case 'stock':
          return b.stock - a.stock
        default:
          return a.nom.localeCompare(b.nom, 'fr')
      }
    })
    return list
  }, [available, categoryId, search, sort, priceRange])

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />

      <div className="border-b border-border/40 bg-gradient-to-r from-[#3b2418] to-[#2f1b12] px-6 py-16 text-[#f7efe2] md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-accent-green">
            Catalogue complet
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            Tous nos <em className="text-[#f4a15d]">tableaux</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[#f7efe2]/80">
            Explorez notre collection, filtrez par catégorie et prix pour trouver la pièce parfaite.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="mb-10 grid gap-6 rounded-3xl border border-border/60 bg-white/70 p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recherche
              </label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom du tableau..."
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Catégorie
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl bg-white">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trier par
              </label>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom A-Z</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="stock">Disponibilité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-w-[240px]">
            <label className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Prix (DH)</span>
              <span className="text-brand-red">
                {priceRange[0]} – {priceRange[1]} DH
              </span>
            </label>
            <Slider
              min={priceBounds[0]}
              max={priceBounds[1]}
              step={10}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              className="mt-2"
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-accent-green">{filtered.length}</span> produit
            {filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>
          {(categoryId !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setCategoryId('all')
                setSearch('')
                setPriceRange(priceBounds)
              }}
              className="text-sm font-semibold text-brand-red hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 py-20 text-center">
            <p className="font-display text-xl font-semibold text-foreground">Aucun produit trouvé</p>
            <p className="mt-2 text-muted-foreground">Essayez d&apos;élargir vos filtres.</p>
            <Link to="/" className="mt-6 inline-block text-brand-red font-semibold hover:underline">
              Retour à l&apos;accueil
            </Link>
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
      </div>

      <SiteFooter />
      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </main>
  )
}

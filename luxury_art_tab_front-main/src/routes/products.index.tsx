import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ProductCard } from '@/components/ProductCard'
import { ArViewer } from '@/components/ArViewer'
import { useCategories, useProducts } from '@/hooks/useStorefrontQueries'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import {
  PAGE_COPY,
  buildSeoHead,
  preferredCategorySlug,
  resolveCategoryBySlug,
} from '@/lib/seo'

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>) => ({
    category:
      typeof search.category === 'string' && search.category !== ''
        ? search.category
        : undefined,
  }),
  loader: async () => {
    const [products, categories] = await Promise.all([
      api.getProducts().catch(() => []),
      api.getCategories().catch(() => []),
    ])
    return { products, categories }
  },
  head: ({ loaderData, match }) => {
    const categoryParam = (match.search as { category?: string }).category
    const categories = loaderData?.categories ?? []
    let canonicalPath = '/products'
    if (categoryParam) {
      const byId = categories.find((c) => String(c.id) === categoryParam)
      if (byId) {
        canonicalPath = `/category/${preferredCategorySlug(byId)}`
      } else {
        const bySlug = resolveCategoryBySlug(categoryParam, categories)
        if (bySlug) canonicalPath = `/category/${preferredCategorySlug(bySlug)}`
      }
    }
    return buildSeoHead({
      title: PAGE_COPY.products.title,
      description: PAGE_COPY.products.description,
      path: '/products',
      canonical: canonicalPath,
    })
  },
  component: ProductsPage,
})

type SortOption = 'price-asc' | 'price-desc' | 'name' | 'stock'

const sortLabels: Record<SortOption, string> = {
  name: 'Nom A-Z',
  'price-asc': 'Prix croissant',
  'price-desc': 'Prix décroissant',
  stock: 'Disponibilité',
}

function ProductsPage() {
  const { products: seededProducts, categories: seededCategories } = Route.useLoaderData()
  const { category: categoryFromUrl } = Route.useSearch()
  const [categoryId, setCategoryId] = useState<string>(categoryFromUrl ?? 'all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [arImage, setArImage] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: products = [], isLoading: loadingProducts } = useProducts({
    initialData: seededProducts,
  })
  const { data: categories = [] } = useCategories({ initialData: seededCategories })

  useEffect(() => {
    setCategoryId(categoryFromUrl ?? 'all')
  }, [categoryFromUrl])

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.nom])),
    [categories],
  )

  const available = useMemo(
    () => products.filter((p) => p.statut !== 'ARCHIVE'),
    [products],
  )

  const countByCategory = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of available) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
    return counts
  }, [available])

  const priceBounds = useMemo(() => {
    if (available.length === 0) return [0, 1000] as [number, number]
    const prices = available.map((p) => Number(p.prix))
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number]
  }, [available])

  useEffect(() => {
    setPriceRange(priceBounds)
  }, [priceBounds[0], priceBounds[1]])

  const priceTouched = priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]
  const hasFilters = categoryId !== 'all' || search !== '' || inStockOnly || priceTouched

  const resetFilters = () => {
    setCategoryId('all')
    setSearch('')
    setInStockOnly(false)
    setPriceRange(priceBounds)
  }

  const filtered = useMemo(() => {
    const list = available.filter((p) => {
      const price = Number(p.prix)
      if (price < priceRange[0] || price > priceRange[1]) return false
      if (categoryId !== 'all' && p.categoryId !== Number(categoryId)) return false
      if (search && !p.ref.toLowerCase().includes(search.toLowerCase())) return false
      if (inStockOnly && (p.stock <= 0 || p.statut === 'RUPTURE_STOCK')) return false
      return true
    })

    return list.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return Number(a.prix) - Number(b.prix)
        case 'price-desc':
          return Number(b.prix) - Number(a.prix)
        case 'stock':
          return b.stock - a.stock
        default:
          return a.ref.localeCompare(b.ref, 'fr')
      }
    })
  }, [available, categoryId, search, sort, priceRange, inStockOnly])

  const filterPanel = (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
          Catégories
        </h3>
        <ul className="space-y-0.5">
          <li>
            <FilterRow
              label="Toutes les catégories"
              count={available.length}
              active={categoryId === 'all'}
              onSelect={() => setCategoryId('all')}
            />
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <FilterRow
                label={c.nom}
                count={countByCategory[c.id] ?? 0}
                active={categoryId === String(c.id)}
                onSelect={() => setCategoryId(String(c.id))}
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
          Prix
        </h3>
        <Slider
          min={priceBounds[0]}
          max={priceBounds[1]}
          step={10}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
        />
        <div className="mt-4 flex items-center justify-between gap-2">
          <PriceTag value={priceRange[0]} />
          <span className="text-xs text-muted-foreground">à</span>
          <PriceTag value={priceRange[1]} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
          Disponibilité
        </h3>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition hover:text-foreground">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(v) => setInStockOnly(v === true)}
          />
          En stock uniquement
        </label>
      </section>

      {hasFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  )

  return (
    <main className="flex min-h-screen flex-col bg-beige/25 font-[Inter,sans-serif]">
      <SiteNav />

      <div className="border-b border-border/40 bg-gradient-to-r from-foliage via-foliage to-taupe px-6 py-14 text-sand md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-accent">
            Catalogue complet
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Nos tableaux et <em className="text-gold">décorations murales</em>
          </h1>
          <p className="mt-4 max-w-2xl text-sand/80">
            Explorez notre collection en Tunisie — filtrez par catégorie et prix pour trouver la pièce parfaite.
          </p>
        </div>
      </div>

      {/* Barre d'outils collante : recherche, résultats, tri */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:px-10">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-sand px-3.5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtrer
                {hasFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display">Filtrer</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filterPanel}</div>
            </SheetContent>
          </Sheet>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un tableau..."
              className="w-full rounded-xl border border-border bg-sand py-2.5 pl-10 pr-4 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <p className="hidden shrink-0 text-sm text-muted-foreground md:block">
            <span className="font-semibold text-foreground">{filtered.length}</span> résultat
            {filtered.length !== 1 ? 's' : ''}
          </p>

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[150px] shrink-0 rounded-xl bg-sand sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {sortLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-10 px-4 py-8 md:px-10">
        <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
          <div className="sticky top-24">{filterPanel}</div>
        </aside>

        <section className="min-w-0 flex-1">
          {hasFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categoryId !== 'all' && (
                <Chip
                  label={categoryMap[Number(categoryId)] ?? 'Catégorie'}
                  onClear={() => setCategoryId('all')}
                />
              )}
              {search && <Chip label={`« ${search} »`} onClear={() => setSearch('')} />}
              {inStockOnly && (
                <Chip label="En stock" onClear={() => setInStockOnly(false)} />
              )}
              {priceTouched && (
                <Chip
                  label={`${priceRange[0]} – ${priceRange[1]} TND`}
                  onClear={() => setPriceRange(priceBounds)}
                />
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-sm font-semibold text-brand-red hover:underline"
              >
                Tout effacer
              </button>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 py-20 text-center">
              <p className="font-display text-xl font-semibold text-foreground">
                Aucun produit trouvé
              </p>
              <p className="mt-2 text-muted-foreground">Essayez d&apos;élargir vos filtres.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 font-semibold text-brand-red hover:underline"
              >
                Effacer les filtres
              </button>
              <Link to="/" className="mt-6 block text-sm text-muted-foreground hover:underline">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
        </section>
      </div>

      <SiteFooter />
      <ArViewer isOpen={!!arImage} onClose={() => setArImage(null)} imageSrc={arImage} />
    </main>
  )
}

function FilterRow({
  label,
  count,
  active,
  onSelect,
}: {
  label: string
  count: number
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
        active
          ? 'bg-secondary font-semibold text-foreground'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
    </button>
  )
}

function PriceTag({ value }: { value: number }) {
  return (
    <span className="rounded-lg border border-border bg-sand px-3 py-1.5 text-sm font-semibold text-foreground">
      {value} TND
    </span>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1.5 pl-3 pr-2 text-sm text-foreground">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Retirer le filtre ${label}`}
        className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

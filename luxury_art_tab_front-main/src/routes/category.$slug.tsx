import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { ProductCard } from '@/components/ProductCard'
import { api } from '@/lib/api'
import { getProductImages } from '@/lib/images'
import type { Category, Product } from '@/types/api'
import { heroCategories } from '@/data/heroCategories'
import {
  buildSeoHead,
  categorySeoCopy,
  resolveCategoryBySlug,
  preferredCategorySlug,
  breadcrumbSchema,
} from '@/lib/seo'

type CategoryLoaderData = {
  slug: string
  category: Category | null
  products: Product[]
  hero: (typeof heroCategories)[number] | null
}

export const Route = createFileRoute('/category/$slug')({
  loader: async ({ params }): Promise<CategoryLoaderData> => {
    const [categories, products] = await Promise.all([
      api.getCategories().catch(() => []),
      api.getProducts().catch(() => []),
    ])
    const category = resolveCategoryBySlug(params.slug, categories)
    const categoryProducts = category
      ? products.filter((p) => p.categoryId === category.id && p.statut !== 'ARCHIVE')
      : []
    const hero = heroCategories.find((item) => item.slug === params.slug) ?? null
    return {
      slug: params.slug,
      category,
      products: categoryProducts,
      hero,
    }
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category
    const products = loaderData?.products ?? []
    const slug = loaderData?.slug ?? ''
    const hero = loaderData?.hero
    const label = category?.nom ?? hero?.word ?? slug
    const indexable = !!category && products.length > 0
    const seo = categorySeoCopy(slug, label)
    const image = products[0] ? getProductImages(products[0])[0] : hero?.images[0]

    return buildSeoHead({
      title: seo.title,
      description: seo.description(products.length),
      path: `/category/${slug}`,
      image,
      robots: indexable ? 'index, follow' : 'noindex, follow',
      jsonLd: indexable
        ? [
            breadcrumbSchema([
              { name: 'Accueil', path: '/' },
              { name: 'Produits', path: '/products' },
              { name: label, path: `/category/${preferredCategorySlug(category!)}` },
            ]),
          ]
        : undefined,
    })
  },
  component: CategoryPage,
})

function CategoryPage() {
  const data = Route.useLoaderData() as CategoryLoaderData
  const { slug, category, products, hero } = data
  const label = category?.nom ?? hero?.word ?? slug
  const seo = categorySeoCopy(slug, label)
  const indexable = !!category && products.length > 0

  if (!category && !hero) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
        <SiteNav />
        <h1 className="mt-10 font-display text-4xl font-bold text-foreground">
          Catégorie introuvable
        </h1>
        <p className="mt-3 text-muted-foreground">Cette catégorie n&apos;existe pas.</p>
        <Link
          to="/products"
          search={{ category: undefined }}
          className="mt-6 inline-flex rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-sand"
        >
          Voir le catalogue
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-beige/25">
      <SiteNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
        <nav className="mb-4 flex flex-wrap items-center text-sm text-muted-foreground" aria-label="Fil d'Ariane">
          <Link to="/" className="hover:text-brand-red">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link to="/products" search={{ category: undefined }} className="hover:text-brand-red">
            Produits
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground" aria-current="page">
            {label}
          </span>
        </nav>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {seo.h1}
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          {category?.description?.trim() ||
            (indexable
              ? seo.intro
              : `Cette collection de tableaux décoratifs sera bientôt enrichie. Parcourez le catalogue en attendant, livraison en Tunisie.`)}
        </p>

        {indexable ? (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={category?.nom}
                index={i}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="font-display text-xl font-semibold text-foreground">
              Aucun produit dans cette catégorie pour le moment
            </p>
            <Link
              to="/products"
              search={{ category: undefined }}
              className="mt-4 inline-block font-semibold text-brand-red hover:underline"
            >
              Parcourir tous les tableaux →
            </Link>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}

import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";
import { ensureStorefrontCatalog, prefetchCatalogPricing } from "@/lib/storefrontLoader";
import {
  PAGE_COPY,
  buildSeoHead,
  organizationSchema,
  websiteSchema,
  faqPageSchema,
  STORE_FAQS,
} from "@/lib/seo";

const ProductShowcase = lazy(() =>
  import("@/components/ProductShowcase").then((m) => ({ default: m.ProductShowcase }))
);
const TestimonialsSection = lazy(() =>
  import("@/components/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);
const NewsSection = lazy(() =>
  import("@/components/NewsSection").then((m) => ({ default: m.NewsSection }))
);
const LatestDecor = lazy(() =>
  import("@/components/LatestDecor").then((m) => ({ default: m.LatestDecor }))
);
const SeoFaq = lazy(() =>
  import("@/components/SeoFaq").then((m) => ({ default: m.SeoFaq }))
);
const SiteFooter = lazy(() =>
  import("@/components/SiteFooter").then((m) => ({ default: m.SiteFooter }))
);

export const Route = createFileRoute("/")({
  loader: async () => {
    prefetchCatalogPricing();
    const [{ products, categories }, news, testimonials] = await Promise.all([
      ensureStorefrontCatalog(),
      api.getPublishedNews().catch(() => []),
      api.getActiveTestimonials().catch(() => []),
    ]);
    return { products, categories, news, testimonials };
  },
  head: () =>
    buildSeoHead({
      title: PAGE_COPY.home.title,
      description: PAGE_COPY.home.description,
      path: "/",
      jsonLd: [organizationSchema(), websiteSchema(), faqPageSchema(STORE_FAQS)],
    }),
  component: Index,
});

function SectionSkeleton() {
  return <div className="h-64 w-full animate-pulse bg-muted/40" />;
}

function Index() {
  const { products, categories, news, testimonials } = Route.useLoaderData();

  return (
    <main className="flex min-h-screen flex-col bg-background font-[Inter,sans-serif]">
      <SiteNav />
      <AnimatedHero />
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <ProductShowcase initialProducts={products} initialCategories={categories} />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <TestimonialsSection initialTestimonials={testimonials} />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <NewsSection initialNews={news} />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <LatestDecor />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <SeoFaq />
        </Reveal>
      </Suspense>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </main>
  );
}

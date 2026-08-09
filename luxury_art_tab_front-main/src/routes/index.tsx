import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";

// Below-the-fold sections are lazy-loaded to reduce the initial JS bundle
// and improve First Contentful Paint + Time to Interactive.
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
const SiteFooter = lazy(() =>
  import("@/components/SiteFooter").then((m) => ({ default: m.SiteFooter }))
);

export const Route = createFileRoute("/")({
  component: Index,
});

function SectionSkeleton() {
  return <div className="h-64 w-full animate-pulse bg-muted/40" />;
}

function Index() {
  return (
    <main className="flex min-h-screen flex-col bg-background font-[Inter,sans-serif]">
      <SiteNav />
      <AnimatedHero />
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <ProductShowcase />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <TestimonialsSection />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <NewsSection />
        </Reveal>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Reveal>
          <LatestDecor />
        </Reveal>
      </Suspense>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </main>
  );
}

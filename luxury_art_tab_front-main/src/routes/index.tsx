import { createFileRoute } from "@tanstack/react-router";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SiteNav } from "@/components/SiteNav";
import { ProductShowcase } from "@/components/ProductShowcase";
import { LatestDecor } from "@/components/LatestDecor";
import { NewsSection } from "@/components/NewsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />
      <AnimatedHero />
      <ProductShowcase />
      <TestimonialsSection />
      <NewsSection />
      <LatestDecor />
      <SiteFooter />
    </main>
  );
}

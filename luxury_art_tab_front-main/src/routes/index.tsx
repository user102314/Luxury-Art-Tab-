import { createFileRoute } from "@tanstack/react-router";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SiteNav } from "@/components/SiteNav";
import { ProductShowcase } from "@/components/ProductShowcase";
import { LatestDecor } from "@/components/LatestDecor";
import { NewsSection } from "@/components/NewsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col bg-background font-[Inter,sans-serif]">
      <SiteNav />
      <AnimatedHero />
      <Reveal>
        <ProductShowcase />
      </Reveal>
      <Reveal>
        <TestimonialsSection />
      </Reveal>
      <Reveal>
        <NewsSection />
      </Reveal>
      <Reveal>
        <LatestDecor />
      </Reveal>
      <SiteFooter />
    </main>
  );
}

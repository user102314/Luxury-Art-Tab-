import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { heroCategories } from "@/data/heroCategories";
import { useCategoryShowcase } from "@/hooks/useStorefrontQueries";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type HeroCard = {
  key: string;
  label: string;
  image: string;
  fallback: string;
  href: string;
};

function handleImageError(fallback: string) {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.src !== fallback) img.src = fallback;
  };
}

/**
 * Dispose les vignettes le long d'un grand demi-cercle (dôme) : le sommet de
 * l'arche culmine au centre en haut, et les deux côtés redescendent le long de
 * la courbe pour encadrer le texte, comme un arc de triomphe.
 */
function placeCard(index: number, count: number) {
  const t = count > 1 ? index / (count - 1) : 0.5; // 0 (gauche) → 1 (droite)
  const theta = Math.PI * (1 - t); // π (gauche) → 0 (droite)
  const lift = Math.sin(theta); // 0 aux extrémités, 1 au sommet
  const side = (t - 0.5) * 2; // -1 (gauche) → 1 (droite)

  return {
    // cos comprime les cartes vers les côtés : elles s'empilent en descendant
    left: 50 + 43 * Math.cos(theta),
    // sommet ≈14%, extrémités ≈64%
    top: 64 - lift * 50,
    width: 10.5 + lift * 3.2,
    rotate: side * 16, // forte inclinaison sur les flancs
    z: Math.round(lift * 20),
  };
}

// Static cards built from local assets — zero API wait, available on first render.
// This is what the browser paints immediately, eliminating LCP API-delay.
const staticCards: HeroCard[] = heroCategories.map((category) => ({
  key: category.slug,
  label: category.word,
  image: category.images[0],
  fallback: category.images[0],
  href: `/category/${category.slug}`,
}));

export function AnimatedHero() {
  const { data: showcase = [] } = useCategoryShowcase();
  const [mobileApi, setMobileApi] = useState<CarouselApi>();
  const [mobileIndex, setMobileIndex] = useState(0);
  const preloadedRef = useRef(false);

  // Inject a <link rel=preload> for the LCP image so Chrome's preload scanner
  // fetches it in parallel with JS parsing — before React even mounts.
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    const firstSrc = staticCards[0]?.image;
    if (!firstSrc) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = firstSrc;
    link.setAttribute('fetchpriority', 'high');
    document.head.prepend(link);
  }, []);

  const cards = useMemo<HeroCard[]>(() => {
    if (showcase.length > 0) {
      return showcase.map((slide, index) => {
        const fallback =
          heroCategories[index % heroCategories.length]?.images[0] ?? staticCards[0]?.image ?? "/placeholder-art.svg";
        return {
          key: `cat-${slide.categoryId}`,
          label: slide.nom,
          image: fallback,
          fallback,
          href: `/products?category=${slide.categoryId}`,
        };
      });
    }
    return staticCards;
  }, [showcase]);

  useEffect(() => {
    if (!mobileApi) return;
    const onSelect = () => setMobileIndex(mobileApi.selectedScrollSnap());
    onSelect();
    mobileApi.on("select", onSelect);
    mobileApi.on("reInit", onSelect);
    return () => {
      mobileApi.off("select", onSelect);
      mobileApi.off("reInit", onSelect);
    };
  }, [mobileApi]);

  return (
    <section className="relative isolate flex min-h-[calc(100svh-69px)] flex-col overflow-hidden bg-background md:min-h-[calc(100svh-73px)]">
      {/* Fond : dégradé chaud du thème, clair en haut, sablé en bas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--background) 30%, var(--card)) 0%, var(--background) 50%, color-mix(in oklab, var(--background) 92%, var(--accent-orange)) 100%)",
        }}
      />

      {/* Halos colorés : sable au sommet du dôme, brique et sienne aux angles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30"
        style={{
          background: [
            "radial-gradient(58% 42% at 50% 6%, color-mix(in oklab, var(--accent-orange) 30%, transparent), transparent 70%)",
            "radial-gradient(46% 42% at 6% 80%, color-mix(in oklab, var(--brand-red) 9%, transparent), transparent 70%)",
            "radial-gradient(46% 42% at 94% 80%, color-mix(in oklab, var(--accent-purple) 9%, transparent), transparent 70%)",
          ].join(", "),
        }}
      />

      {/* Arches concentriques alignées sur la courbe des vignettes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 hidden md:block">
        {[0.82, 1, 1.19, 1.4].map((scale, index) => (
          <span
            key={scale}
            className="absolute left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              // 86% × 100% = exactement l'ellipse suivie par placeCard
              width: `${86 * scale}%`,
              height: `${100 * scale}%`,
              borderColor: `color-mix(in oklab, var(--accent-orange) ${34 - index * 7}%, transparent)`,
            }}
          />
        ))}
      </div>

      {/* Sol chaud sous les reflets */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-20 h-[28%]"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--accent-orange) 10%, transparent))",
        }}
      />

      {/* Repères verticaux pointillés */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 hidden md:block">
        {[14, 30, 50, 70, 86].map((left) => (
          <span
            key={left}
            className="absolute top-[11%] bottom-0 w-px"
            style={{
              left: `${left}%`,
              backgroundImage:
                "repeating-linear-gradient(180deg, color-mix(in oklab, var(--accent-orange) 45%, transparent) 0 5px, transparent 5px 12px)",
              opacity: 0.32,
            }}
          />
        ))}
      </div>

      {/* Grain papier, pour la texture « galerie » */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignettage doux pour concentrer le regard */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 85% at 50% 45%, transparent 55%, color-mix(in oklab, var(--foreground) 10%, transparent) 100%)",
        }}
      />

      {/* Éventail de catégories — version large (dôme plein écran) */}
      <div className="absolute inset-x-0 top-0 bottom-0 z-10 hidden md:block">
        {cards.map((card, index) => {
          const spot = placeCard(index, cards.length);
          return (
            <a
              key={card.key}
              href={card.href}
              className="group absolute block"
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
                transform: `translateX(-50%) rotate(${spot.rotate}deg)`,
                zIndex: 10 + spot.z,
              }}
            >
              {/* Chaque effet a son propre calque : l'entrée, le flottement et
                  le survol utilisent tous `transform` et s'écraseraient sinon. */}
              <div className="animate-card-rise" style={{ animationDelay: `${index * 90}ms` }}>
                <div
                  className="animate-card-float"
                  style={{
                    animationDelay: `${index * 240}ms`,
                    animationDuration: `${5.5 + (index % 4) * 0.6}s`,
                  }}
                >
                  {/* Reflet miroir natif : copie nette du cadre, courte, sans flou */}
                  <div
                    className="relative overflow-hidden rounded-2xl bg-sand p-1.5 shadow-[0_18px_40px_-24px_rgba(74,93,79,0.45)] ring-1 ring-foliage/[0.04] transition duration-500 group-hover:-translate-y-2.5 group-hover:shadow-[0_30px_60px_-20px_rgba(74,93,79,0.6)]"
                    style={{
                      WebkitBoxReflect:
                        "below 3px linear-gradient(to bottom, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.08) 18%, transparent 30%)",
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-muted">
                      <img
                        src={card.image}
                        alt={card.label}
                        loading={index < 2 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        decoding="async"
                        onError={handleImageError(card.fallback)}
                        className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-[1.07]"
                      />

                      {/* Voile sombre : garantit la lisibilité quelle que soit l'œuvre */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foliage/80 via-foliage/35 to-transparent transition-opacity duration-500 group-hover:from-foliage/90"
                      />

                      {/* Cartouche en verre dépoli, remonte au survol */}
                      <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 flex flex-col items-center gap-1 rounded-lg bg-sand/10 px-2 py-1.5 ring-1 ring-inset ring-sand/25 backdrop-blur-md transition duration-500 group-hover:-translate-y-1 group-hover:bg-sand/20">
                        <span
                          aria-hidden
                          className="h-px w-5 rounded-full transition-all duration-500 group-hover:w-10"
                          style={{ backgroundColor: "var(--accent-orange)" }}
                        />
                        <span className="w-full truncate text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-sand">
                          {card.label}
                        </span>
                      </span>
                    </div>
                    {/* Éclat qui balaie la vitre au survol */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-sand/55 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
                    />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Catégories mobile — carrousel swipe avec aperçu des voisines */}
      <div className="relative min-h-0 flex-1 pt-4 md:hidden">
        <Carousel
          setApi={setMobileApi}
          opts={{ align: "center", loop: true, dragFree: false }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {cards.map((card, index) => (
              <CarouselItem key={card.key} className="basis-[68%] pl-3 sm:basis-[58%]">
                <a href={card.href} className="group block">
                  <div
                    className={[
                      "overflow-hidden rounded-2xl bg-sand p-1.5 shadow-[0_18px_40px_-22px_rgba(74,93,79,0.55)] ring-1 ring-foliage/[0.06] transition duration-500",
                      index === mobileIndex
                        ? "scale-100 opacity-100"
                        : "scale-[0.92] opacity-70",
                    ].join(" ")}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-muted">
                      <img
                        src={card.image}
                        alt={card.label}
                        loading={index < 2 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        decoding="async"
                        onError={handleImageError(card.fallback)}
                        className="aspect-[3/4] w-full object-cover transition duration-700 group-active:scale-[1.03]"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foliage/80 via-foliage/30 to-transparent"
                      />
                      <span className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-col items-center gap-1 rounded-lg bg-sand/15 px-2.5 py-2 ring-1 ring-inset ring-sand/30 backdrop-blur-md">
                        <span
                          aria-hidden
                          className="h-px w-8 rounded-full"
                          style={{ backgroundColor: "var(--accent-orange)" }}
                        />
                        <span className="w-full truncate text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-sand">
                          {card.label}
                        </span>
                      </span>
                    </div>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-4 flex items-center justify-center gap-3 px-4">
            <button
              type="button"
              aria-label="Catégorie précédente"
              onClick={() => mobileApi?.scrollPrev()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-sand text-foreground shadow-sm transition active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Catégories">
              {cards.map((card, index) => (
                <button
                  key={card.key}
                  type="button"
                  role="tab"
                  aria-label={card.label}
                  aria-selected={index === mobileIndex}
                  onClick={() => mobileApi?.scrollTo(index)}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    index === mobileIndex
                      ? "w-5 bg-foreground"
                      : "w-1.5 bg-foreground/25",
                  ].join(" ")}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Catégorie suivante"
              onClick={() => mobileApi?.scrollNext()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-sand text-foreground shadow-sm transition active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Carousel>
      </div>

      {/* Bloc éditorial — dans le flux sur mobile, centré dans le dôme sur desktop */}
      <div className="relative z-30 mx-auto w-full max-w-2xl shrink-0 px-6 pb-8 text-center md:absolute md:left-1/2 md:top-[79%] md:mx-0 md:-translate-x-1/2 md:-translate-y-1/2 md:pb-0">
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          Nos categories
        </span>

        <h1 className="mt-4 font-display text-[1.9rem] font-bold leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]">
          Tableaux décoratifs muraux en Tunisie
          <br />
          <span className="text-muted-foreground">salon, cuisine et calligraphie</span>
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
          Commandez un tableau décoratif en ligne : dimension et cadre au choix,
          livraison partout en Tunisie.
        </p>

        <a
          href="/products"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-[0_16px_34px_-18px_rgba(0,0,0,0.7)] transition hover:scale-[1.03]"
        >
          Voir toute la galerie
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

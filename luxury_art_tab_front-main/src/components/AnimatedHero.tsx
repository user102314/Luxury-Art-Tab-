import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { heroCategories } from "@/data/heroCategories";
import { useCategoryShowcase } from "@/hooks/useStorefrontQueries";
import { getProductImage } from "@/lib/images";

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

export function AnimatedHero() {
  const { data: showcase = [] } = useCategoryShowcase();

  const cards = useMemo<HeroCard[]>(() => {
    if (showcase.length > 0) {
      return showcase.map((slide, index) => {
        const image = getProductImage(slide.product);
        // Œuvre maison utilisée si la catégorie n'a pas de visuel produit
        // valide (placeholder ou URL cassée gérée via onError).
        const fallback = heroCategories[index % heroCategories.length].images[0];
        return {
          key: `cat-${slide.categoryId}`,
          label: slide.nom,
          image: image.includes("placeholder-art") ? fallback : image,
          fallback,
          href: `/products?category=${slide.categoryId}`,
        };
      });
    }
    return heroCategories.map((category) => ({
      key: category.slug,
      label: category.word,
      image: category.images[0],
      fallback: category.images[0],
      href: `/category/${category.slug}`,
    }));
  }, [showcase]);

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
                        loading={index < 6 ? "eager" : "lazy"}
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

      {/* Éventail de catégories — version mobile en grille */}
      <div className="relative min-h-0 flex-1 px-4 pt-5 md:hidden">
        <div className="grid grid-cols-5 gap-2">
          {cards.map((card, index) => (
            <a
              key={card.key}
              href={card.href}
              className="group block"
              style={{
                transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)`,
              }}
            >
              <div className="overflow-hidden rounded-xl bg-sand p-1 shadow-[0_12px_26px_-18px_rgba(74,93,79,0.5)] ring-1 ring-foliage/[0.04]">
                <div className="overflow-hidden rounded-lg bg-muted">
                  <img
                    src={card.image}
                    alt={card.label}
                    loading={index < 5 ? "eager" : "lazy"}
                    onError={handleImageError(card.fallback)}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
              </div>
              <span className="mt-1 block truncate text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Bloc éditorial — dans le flux sur mobile, centré dans le dôme sur desktop */}
      <div className="relative z-30 mx-auto w-full max-w-2xl shrink-0 px-6 pb-8 text-center md:absolute md:left-1/2 md:top-[79%] md:mx-0 md:-translate-x-1/2 md:-translate-y-1/2 md:pb-0">
        <span className="inline-flex items-center rounded-full border border-border bg-sand px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          Nos categories
        </span>

        <h1 className="mt-4 font-display text-[1.9rem] font-bold leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]">
          Dix univers pour vos murs
          <br />
          <span className="text-muted-foreground">reunis en un seul regard</span>
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
          Cuisine, florale, calligraphie, animaux… choisissez la collection qui
          habillera votre interieur.
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

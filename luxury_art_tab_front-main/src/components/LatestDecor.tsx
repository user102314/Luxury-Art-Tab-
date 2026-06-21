import authorArt from "@/assets/salon/art-botanical.jpg";

export function LatestDecor() {
  return (
    <section
      id="nouveautes"
      className="relative overflow-hidden px-6 py-24 md:py-32"
      style={{
        background:
          "linear-gradient(180deg, var(--background) 0%, color-mix(in oklab, var(--brand-red) 5%, var(--background)) 60%, var(--background) 100%)",
      }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div>
          <div className="mb-5 inline-flex items-center rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-red">
            About Me
          </div>

          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Artiste derrière <em className="text-accent-orange">chaque toile</em>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Je crée des tableaux décoratifs inspirés du quotidien marocain: des tons chauds,
            des formes organiques et des détails qui apportent une vraie présence à votre
            salon ou votre cuisine. Chaque pièce est pensée pour raconter une histoire simple,
            élégante et personnelle.
          </p>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Mon objectif est de proposer un art accessible, fabriqué avec soin, et facile à
            intégrer dans les intérieurs modernes comme traditionnels.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#galerie"
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Voir la galerie
            </a>
            <a
              href="#"
              className="rounded-full border border-foreground/20 bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:border-foreground/50"
            >
              Me contacter
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-brand-red/10 blur-2xl" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-accent-orange/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-white/40 p-3 shadow-[0_30px_60px_-25px_rgba(50,20,0,0.35)] backdrop-blur-sm">
            <img
              src={authorArt}
              alt="Portrait artistique"
              className="h-[360px] w-full rounded-2xl object-cover md:h-[460px]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

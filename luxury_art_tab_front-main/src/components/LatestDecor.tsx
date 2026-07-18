import { Link } from '@tanstack/react-router'
import atelierProcess from '@/assets/decor/atelier-process.jpg'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'

export function LatestDecor() {
  return (
    <section
      id="nouveautes"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{
        background:
          'linear-gradient(180deg, var(--background) 0%, color-mix(in oklab, var(--brand-red) 5%, var(--background)) 60%, var(--background) 100%)',
      }}
    >
      <PaintStroke
        color="brown"
        opacity={0.35}
        rotate={-6}
        float
        className="-left-24 top-12 hidden h-20 w-80 md:block"
      />
      <PaintSplash
        color="beige"
        opacity={0.45}
        rotate={12}
        floatSlow
        className="right-[18%] top-4 hidden h-32 w-32 md:block"
      />
      <PaintSplash
        color="brick"
        opacity={0.3}
        rotate={-15}
        flip
        className="-right-12 bottom-8 hidden h-40 w-40 lg:block"
      />
      <PaintStroke
        color="beige"
        opacity={0.4}
        rotate={4}
        className="left-[28%] -bottom-2 hidden h-14 w-56 md:block"
      />

      <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
        <div>
          <div className="mb-5 inline-flex items-center rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-red">
            About Me
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Artiste derrière <em className="text-accent-orange">chaque toile</em>
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Je crée des tableaux décoratifs inspirés du quotidien marocain: des tons chauds,
            des formes organiques et des détails qui apportent une vraie présence à votre
            salon ou votre cuisine. Chaque pièce est pensée pour raconter une histoire simple,
            élégante et personnelle.
          </p>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
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
            <Link
              to="/contact"
              className="rounded-full border border-foreground/20 bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:border-foreground/50"
            >
              Me contacter
            </Link>
          </div>
        </div>

        <div className="relative">
          <PaintSplash
            color="orange"
            opacity={0.4}
            rotate={18}
            className="-right-8 -top-10 h-36 w-36"
          />
          <PaintStroke
            color="red"
            opacity={0.38}
            rotate={-10}
            className="-bottom-1 -left-12 h-12 w-48"
          />
          <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-white/40 p-2.5 shadow-[0_30px_60px_-25px_rgba(50,20,0,0.35)] backdrop-blur-sm">
            <img
              src={atelierProcess}
              alt="Application de peinture à l'atelier"
              className="h-[320px] w-full rounded-2xl object-cover md:h-[420px]"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-[#3b2418]/80 to-transparent p-5 pt-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4a15d]">
                L&apos;atelier
              </p>
              <p className="mt-1 font-display text-lg font-bold text-[#f7efe2]">
                Chaque geste compte
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

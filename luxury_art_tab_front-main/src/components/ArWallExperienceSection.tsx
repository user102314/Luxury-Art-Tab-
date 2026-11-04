import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Camera, Sparkles, Smartphone, Eye, CheckCircle2, ArrowRight } from 'lucide-react'
import { LazyArViewer } from '@/components/LazyArViewer'

export function ArWallExperienceSection({
  sampleImageUrl = '/placeholder-art.svg',
}: {
  sampleImageUrl?: string
}) {
  const [arOpen, setArOpen] = useState(false)

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-beige/35 via-sand to-beige/25 py-16 sm:py-24">
      {/* Motifs géométriques subtils d'arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--gold) 1.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        {/* En-tête de la section */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold shadow-sm">
            <Sparkles className="h-4 w-4" />
            Innovation Exclusive Luxury Art
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Testez nos tableaux sur votre mur réel <br className="hidden sm:inline" />
            <span className="text-gold">avant de commander</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Finies les hésitations sur la taille ou l’harmonie des couleurs. Grâce à notre simulateur en
            <strong> Réalité Augmentée</strong>, activez votre caméra et projetez n’importe quel tableau
            directement dans votre salon en temps réel.
          </p>
        </div>

        {/* 3 Étapes claires et illustrées */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
          <div className="group rounded-3xl border border-border/80 bg-sand p-6 shadow-[0_12px_30px_-15px_rgba(74,93,79,0.3)] transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foliage/10 text-foliage transition duration-300 group-hover:bg-foliage group-hover:text-sand">
              <Eye className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 1
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Choisissez votre tableau
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Explorez nos collections (Calligraphie, Abstrait, Nature, Salon) et ouvrez la fiche de l'œuvre qui vous inspire.
            </p>
          </div>

          <div className="group rounded-3xl border border-gold/50 bg-sand p-6 shadow-[0_16px_36px_-15px_rgba(74,93,79,0.4)] transition duration-300 hover:-translate-y-1 hover:border-gold sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-gold transition duration-300 group-hover:bg-gold group-hover:text-sand">
              <Camera className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 2
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Cliquez « Tester sur mon mur »
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              En un clic, votre caméra s'active directement dans votre navigateur web sans installer aucune application.
            </p>
          </div>

          <div className="group rounded-3xl border border-border/80 bg-sand p-6 shadow-[0_12px_30px_-15px_rgba(74,93,79,0.3)] transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green transition duration-300 group-hover:bg-accent-green group-hover:text-sand">
              <Smartphone className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 3
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Ajustez et admirez chez vous
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Déplacez l’œuvre sur votre mur avec votre doigt, adaptez le zoom à l’échelle et confirmez votre choix en toute certitude.
            </p>
          </div>
        </div>

        {/* Bannière d'action interactive */}
        <div className="mt-12 rounded-3xl border border-gold/30 bg-foliage p-8 text-sand shadow-2xl sm:p-10 md:p-12">
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand/15 px-3 py-1 text-xs font-semibold text-sand backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                  100% Gratuit & Instantané
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand/15 px-3 py-1 text-xs font-semibold text-sand backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                  Compatible tous smartphones (iPhone & Android)
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                Prêt à essayer l’expérience sur vos propres murs ?
              </h3>
              <p className="mt-2 text-sm text-sand/80 sm:text-base">
                Découvrez dès maintenant nos tableaux et testez la fonctionnalité sur chaque modèle du catalogue.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              {sampleImageUrl && sampleImageUrl !== '/placeholder-art.svg' && (
                <button
                  type="button"
                  onClick={() => setArOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-6 py-3.5 text-sm font-bold text-sand shadow-lg transition hover:brightness-110 active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  Démonstration Caméra
                </button>
              )}
              <Link
                to="/products"
                search={{ category: undefined }}
                className="inline-flex items-center gap-2 rounded-full border border-sand/40 bg-sand/10 px-6 py-3.5 text-sm font-bold text-sand backdrop-blur-sm transition hover:bg-sand/20 active:scale-95"
              >
                Parcourir les tableaux
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LazyArViewer
        isOpen={arOpen}
        onClose={() => setArOpen(false)}
        imageSrc={sampleImageUrl}
      />
    </section>
  )
}


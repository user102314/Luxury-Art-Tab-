import { STORE_FAQS } from '@/lib/seo'

export function SeoFaq({ className }: { className?: string } = {}) {
  return (
    <section className={className ?? 'bg-beige/40 px-6 py-16 md:py-20'} aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-gold">Questions fréquentes</p>
        <h2 id="faq-heading" className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Acheter un tableau décoratif en Tunisie
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          Réponses claires sur les formats, les cadres et la livraison — pour commander en ligne en toute confiance.
        </p>
        <dl className="mt-8 space-y-4">
          {STORE_FAQS.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-border/70 bg-sand/70 px-5 py-4">
              <dt className="font-display text-base font-semibold text-foreground">{faq.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

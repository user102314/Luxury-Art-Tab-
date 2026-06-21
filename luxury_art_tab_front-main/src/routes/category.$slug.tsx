import { createFileRoute } from "@tanstack/react-router";
import { heroCategories } from "@/data/heroCategories";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = heroCategories.find((item) => item.slug === slug);

  if (!category) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
        <h1 className="font-display text-4xl font-bold text-foreground">Categorie introuvable</h1>
        <p className="mt-3 text-muted-foreground">Cette categorie n'existe pas.</p>
        <a href="/" className="mt-6 inline-flex rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white">
          Retour a l'accueil
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-sm font-semibold text-brand-red hover:underline">Retour</a>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Categorie: <span className={category.color}>{category.word}</span>
        </h1>

        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tous les produits de cette categorie.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {category.images.map((src, i) => (
            <article key={`${category.slug}-${i}`} className="overflow-hidden rounded-2xl border border-black/5 bg-white/40 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)]">
              <img src={src} alt={`${category.word} ${i + 1}`} loading="lazy" className="h-64 w-full object-cover" />
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">Produit {i + 1}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

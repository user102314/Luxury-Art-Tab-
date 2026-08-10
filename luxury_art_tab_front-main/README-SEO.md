# Audit SEO — Luxury Art_Tab

**Date :** 10 août 2026  
**Périmètre :** `luxury_art_tab_front-main` (boutique + admin unifiés)  
**Mode :** analyse en lecture seule (aucune modification du code au moment de l’audit)

---

# ÉTAPE 1 — Architecture du projet

## 1. Stack détectée

```text
React :               19.2.0
Vite :                7.3.1
TypeScript :          Oui (5.8)
Router :              @tanstack/react-router ^1.168 (PAS react-router-dom côté boutique)
Framework app :       @tanstack/react-start ^1.167 (+ Nitro)
Mode rendu :          SSR / hybride (TanStack Start + shell HTML + HeadContent)
                      → PAS une SPA classique CRA ; PAS Create React App
État / data :         @tanstack/react-query ^5.83
CSS :                 Tailwind CSS 4.2 (+ @tailwindcss/vite, tw-animate-css)
UI :                  Radix / shadcn-like (components/ui), Lucide, Sonner
Forms :               react-hook-form + Zod
Charts (admin) :      Recharts
PDF (admin) :         jspdf
Build / host :        Vite + Nitro ; vercel.json (cible Vercel) ; wrangler.jsonc optionnel
Entrée routing :      src/routes/* (file-based) + src/routeTree.gen.ts + src/router.tsx
API :                 Spring Boot via VITE_API_URL (ex. https://api.luxury-art.tn/api)
```

**Point important :** ce n’est **pas** un “React Router Vite SPA” naïf. TanStack Start fournit déjà un **document HTML serveur** (`shellComponent` + `HeadContent` dans `__root.tsx`). Le SEO est donc plus favorable qu’une SPA pure, **mais** une grande partie du contenu catalogue/actus est encore hydratée côté client via React Query.

---

## 2. Architecture

```text
luxury_art_tab_front-main/
├── public/
│   ├── favicon.png          ✅ présent
│   └── logo.png             ✅ présent
│   ├── robots.txt           ❌ NON PRÉSENT
│   ├── sitemap.xml          ❌ NON PRÉSENT
│   └── site.webmanifest     ❌ NON PRÉSENT
├── src/
│   ├── routes/              ← pages / routing (file-based TanStack)
│   │   ├── __root.tsx       ← layout global, head global, 404, maintenance
│   │   ├── index.tsx        ← /
│   │   ├── products.index.tsx
│   │   ├── products.$id.tsx
│   │   ├── category.$slug.tsx
│   │   ├── actualites.tsx
│   │   ├── contact.tsx
│   │   ├── checkout.tsx
│   │   ├── signin.tsx / signup.tsx / compte.tsx
│   │   ├── maintenance.tsx
│   │   └── admin/**         ← dashboard (ne pas indexer)
│   ├── components/          ← SiteNav, Hero, ProductCard, Footer, UI…
│   ├── admin/               ← code admin fusionné
│   ├── context/             ← Auth client, Cart, Favorites, Visitor
│   ├── hooks/               ← useStorefrontQueries (client fetch)
│   ├── lib/                 ← api, pricing, images…
│   ├── data/heroCategories.ts
│   ├── assets/              ← images cuisine/salon
│   ├── router.tsx
│   └── routeTree.gen.ts
├── vite.config.ts           ← tanstackStart() + nitro()
└── vercel.json
```

Pas de dossiers `src/pages/` ni `src/layouts/` séparés : les “pages” = fichiers dans `src/routes/`.

---

## 3. Toutes les routes

| Route | Composant / fichier | Publique ? | Dynamique ? | Indexable ? |
| ----- | ------------------- | ---------- | ----------- | ----------- |
| `/` | `routes/index.tsx` | Oui | Non | Oui |
| `/products` | `routes/products.index.tsx` | Oui | Search `?category=` | Oui |
| `/products/$id` | `routes/products.$id.tsx` | Oui | Oui (`id`) | Oui (prioritaire) |
| `/category/$slug` | `routes/category.$slug.tsx` | Oui | Oui (`slug`) | Oui, **mais contenu faible** |
| `/actualites` | `routes/actualites.tsx` | Oui | Non | Oui |
| `/contact` | `routes/contact.tsx` | Oui | Non | Oui |
| `/checkout` | `routes/checkout.tsx` | Semi | Non | Non |
| `/signin` | `routes/signin.tsx` | Oui | Non | Non |
| `/signup` | `routes/signup.tsx` | Oui | Non | Non |
| `/compte` | `routes/compte.tsx` | Privée (client) | Non | Non |
| `/maintenance` | `routes/maintenance.tsx` | Technique | Non | Non |
| 404 (notFound) | `__root.tsx` `NotFoundComponent` | Oui | — | Non (`noindex` recommandé) |
| `/admin` | redirect → revenue | Non | Non | Non |
| `/admin/login` | Login admin | Non | Non | Non |
| `/admin/revenue` | Dashboard | Non | Non | Non |
| `/admin/analytics` | Admin | Non | Non | Non |
| `/admin/orders` | Admin | Non | Non | Non |
| `/admin/tracking` | Admin | Non | Non | Non |
| `/admin/notifications` | Admin | Non | Non | Non |
| `/admin/facebook-orders` | Admin | Non | Non | Non |
| `/admin/instagram-orders` | Admin | Non | Non | Non |
| `/admin/whatsapp-orders` | Admin | Non | Non | Non |
| `/admin/clients` | Admin | Non | Non | Non |
| `/admin/products` | Admin | Non | Non | Non |
| `/admin/moderation` | Admin | Non | Non | Non |
| `/admin/loyalty` | Admin | Non | Non | Non |
| `/admin/news` | Admin | Non | Non | Non |
| `/admin/testimonials` | Admin | Non | Non | Non |
| `/admin/settings` | Admin | Non | Non | Non |

**Slugs catégories hero (statiques)** : `enfants`, `femmes`, `cuisine`, `animaux`, `moderne-abstrait`, `florale`, `calligraphie-et-islamique`, `traditionnel-orientale-mediterraneenne` (`src/data/heroCategories.ts`).

---

## 4. Pages publiques à indexer

```text
✅ /
✅ /products
✅ /products/{id}          ← pages produit (cœur e-commerce)
✅ /category/{slug}        ← à indexer seulement si contenu produit réel (aujourd’hui discutable)
✅ /actualites
✅ /contact
```

---

## 5. Pages à ne probablement PAS indexer

```text
❌ /signin /signup /compte     → comptes / auth
❌ /checkout                   → tunnel d’achat (session)
❌ /maintenance                → page technique
❌ /admin et /admin/*          → back-office
❌ 404                         → noindex
❌ /products?category=*        → filtres (canonical vers /products ou page catégorie propre)
```

**Pourquoi :** pas de valeur SEO, risque de crawl budget gaspillé, fuite d’infos admin, contenus personnalisés / vides sans session.

---

## 6. État SEO actuel

| Élément | État | Problème | Priorité |
| ------- | ---- | -------- | -------- |
| Title | ⚠️ | Global unique sur la plupart des pages ; dynamiques seulement sur PDP + catégorie (`__root.tsx` ; `products.$id.tsx` ; `category.$slug.tsx`) | 🔴 Critique |
| Meta description | ⚠️ | 1 description globale (~110 car.) pour presque tout ; dynamiques PDP/catégorie seulement | 🔴 Critique |
| H1 | ⚠️ | Présent sur pages clés ; home H1 = “Dix univers…” (pas le brand) ; catégories H1 générique | 🟠 Important |
| Canonical | ❌ | **NON PRÉSENT** partout | 🔴 Critique |
| Sitemap | ❌ | **NON PRÉSENT** (`public/` = favicon + logo uniquement) | 🔴 Critique |
| Robots | ❌ | **NON PRÉSENT** `robots.txt` ; `noindex` seulement si maintenance | 🔴 Critique |
| Open Graph | ⚠️ | `og:title/description/type` globaux ; pas d’`og:image` ni `og:url` ; PDP/catégorie partiels | 🟠 Important |
| Twitter Cards | ⚠️ | `twitter:card=summary` global ; pas d’image | 🟡 À améliorer |
| JSON-LD | ⚠️ | Product sur PDP seulement ; incomplet (pas d’image/brand/SKU) ; URL hardcodée `luxuryarttab.com` | 🟠 Important |
| Favicon | 🟢 | `/favicon.png` déclaré + fichier public | 🟢 Correct |
| Manifest PWA | ❌ | **NON PRÉSENT** | 🟡 À améliorer |
| 404 | 🟢 | `notFoundComponent` présent (texte EN) | 🟡 À améliorer |
| lang HTML | 🟢 | `lang="fr"` dans `__root.tsx` | 🟢 Correct |
| SSR head | 🟢 | TanStack Start `head` + `HeadContent` | 🟢 Correct (base) |
| Contenu catalogue SSR | ⚠️ | Home /products /actualites = fetch client React Query | 🔴 Critique |
| Cohérence geo/marque | ⚠️ | Meta “Maroc” / MAD / Monastir TN / domaine JSON-LD différent de `api.luxury-art.tn` | 🟠 Important |

Légende priorités :

- 🔴 Critique
- 🟠 Important
- 🟡 À améliorer
- 🟢 Correct

---

# ÉTAPE 2 — Vérification React pour le SEO

## A. React Router / TanStack Router

- Routes déclarées en **file-based routing** sous `src/routes/`.
- Chaque route peut être ouverte directement (TanStack Start + Nitro/Vercel) → **pas le classique “refresh 404 SPA”**.
- Routes dynamiques : `/products/$id`, `/category/$slug` — fonctionnelles.
- Page 404 : `notFoundComponent` dans `__root.tsx` (texte en anglais).
- Admin protégé côté UI (`AdminAuth`), pas via robots/meta.

## B. Rendu du contenu

| Page | Contenu dans HTML initial | Dépendance JS / client | Risque Google |
| ---- | ------------------------- | ---------------------- | ------------- |
| `/` | Shell + hero (composants sync) ; sections below-the-fold **lazy** | Produits / avis / actus via React Query | Moyen–élevé |
| `/products` | Shell + H1 | Liste via `useProducts()` | Élevé |
| `/products/$id` | `loader` serveur + `head` dynamique | Compléments (avis, similaires) client | Faible–moyen |
| `/category/$slug` | Données statiques `heroCategories` | Contenu thin (images assets, pas catalogue DB) | Thin content |
| `/actualites` | Shell + H1 | `usePublishedNews()` | Élevé |
| `/contact` | Shell + H1 + formulaire | Settings boutique via API | Moyen |

**Ne pas conclure “React = mauvais pour Google”.** Ici le vrai problème est le **contenu catalogue/actus surtout client-side**, pas React en soi. TanStack Start est déjà un levier SSR à exploiter davantage.

## C. `<title>` — exemples actuels

| Page | Title actuel |
| ---- | ------------ |
| `/` | `Luxury Art_Tab By Insaf — Tableaux & Décoration` (root) |
| `/products` | **identique au root** |
| `/actualites` | **identique au root** |
| `/contact` | **identique au root** |
| `/products/123` | `{nom} \| Tableau Décoration Luxe` ✅ |
| `/category/cuisine` | `Tableaux pour cuisine \| Décoration Luxe` ✅ |
| `/signin`, `/checkout`… | **identique au root** (devraient être noindex) |

Le title **change** à la navigation seulement vers PDP / catégorie (via `head` TanStack). Les autres pages gardent le title global.

## D. Meta description

- **Présence :** oui (globale dans `__root.tsx`).
- **Unicité :** non (presque toutes les pages).
- **Dynamique :** oui sur PDP + catégorie uniquement.
- **Qualité globale :** correcte (~110 caractères), mention “livraison au Maroc”.
- **Pages sans description propre :** `/`, `/products`, `/actualites`, `/contact`, auth, checkout, admin.

## E. H1 / structure HTML

- **Home :** 1 H1 — “Dix univers pour vos murs…” (`AnimatedHero.tsx`) ; marque = `BrandLogo` en `<span>` dans la nav.
- **Products :** 1 H1 — “Tous nos tableaux”.
- **PDP :** 1 H1 — nom du produit.
- **Actualités :** 1 H1 — “Actualités Luxury Art”.
- **Contact :** 1 H1 — “Contactez-nous”.
- **Catégorie :** 1 H1 — “Categorie: {word}”.
- **Admin :** H1 “Tableau de bord” sur le layout (non SEO).

## F. Images

- Bons `alt` produits (`ProductCard`, PDP, hero cards).
- Plusieurs `alt=""` : panier nav, avatars témoignages, thumbs galerie, décors (`ArtDecor`) — OK si purement décoratif.
- `loading="lazy"` fréquent ; hero : eager sur les 2 premières images.
- Formats : JPEG/JPG assets, PNG logo/favicon ; pas de stratégie WebP systématique visible.
- Optimisation potentielle : poids assets hero, `og:image`, formats modernes.

## G. Liens internes

- `SiteNav` + `SiteFooter` + `ProductCard` via `Link` TanStack — bons.
- Hero → `/category/{slug}` ; Nav catalogue → `/products?category={id}` (**deux systèmes**).
- `/admin` **non lié** depuis la boutique (bon).
- Footer : Accueil, Produits, Actualités, Contact, ancres `#nouveautes`, `#avis-clients`.

## H. URLs

- Lisibles : `/products`, `/actualites`, `/contact`.
- PDP : `/products/{id}` numérique — OK court terme ; slugs texte meilleurs long terme.
- Risque duplicate : `/products` vs `/products/` + `?category=`.
- Catégories hero slugs longs (ex. `traditionnel-orientale-mediterraneenne`).

## I. Canonical

- **NON PRÉSENT** sur aucune page.
- Devrait exister : toutes les pages publiques, surtout `/products`, `/products/$id`, `/category/$slug`, `/actualites`, `/contact`.

## J. Open Graph / Twitter

| Tag | État |
| --- | ---- |
| `og:title` | Global + PDP/catégorie |
| `og:description` | Global + PDP/catégorie |
| `og:type` | `website` (global) |
| `og:image` | ❌ NON PRÉSENT |
| `og:url` | ❌ NON PRÉSENT |
| `twitter:card` | `summary` (global) |

---

## 7. Problèmes React / SEO (détail)

### Problème 1 — Titles presque tous identiques

**Problème :** Seules `/products/$id` et `/category/$slug` définissent un `head` local. Les autres pages héritent du title root.

**Pourquoi c’est important pour Google :** titles = signal de pertinence #1 dans les SERP ; pages concurrentes avec le même title = cannibalisation / CTR faible.

**Fichier concerné :** `src/routes/__root.tsx` ; absence de `head` dans `index.tsx`, `products.index.tsx`, `actualites.tsx`, `contact.tsx`, etc.

**Solution recommandée :** `head` par route (title unique + template marque).

---

### Problème 2 — Meta description unique globale

**Problème :** Une seule description storefront dans le root.

**Pourquoi :** snippets génériques ; Google peut ignorer / réécrire.

**Fichier :** `__root.tsx`.

**Solution :** descriptions dédiées (accueil, catalogue, actualités, contact) + dynamiques PDP (déjà partiel).

---

### Problème 3 — Contenu catalogue / actus dépendant du client

**Problème :** Home / products / actualites chargent les listes via React Query côté client. Seul le PDP a un `loader` serveur.

**Pourquoi :** HTML initial des listes peut être squelette / vide → indexation plus lente/fragile.

**Fichiers :** `src/hooks/useStorefrontQueries.ts`, `products.index.tsx`, `actualites.tsx`, `index.tsx`.

**Solution :** loaders TanStack Start pour produits/actus/home ; hydrater Query avec les données loader.

---

### Problème 4 — Double système de catégories (risque duplicate / thin content)

**Problème :** Nav → `/products?category={id}` (vrais produits API). Hero → `/category/{slug}` (images statiques, pas le catalogue DB).

**Pourquoi :** pages catégorie peu utiles ; confusion crawl ; thin content.

**Fichiers :** `AnimatedHero.tsx`, `SiteNav.tsx`, `category.$slug.tsx`.

**Solution :** unifier (catégorie = liste produits réelle) + canonical ; ou `noindex` sur les pages hero-only.

---

### Problème 5 — Canonical absent

**Problème :** Aucun `<link rel="canonical">`.

**Pourquoi :** risque de duplicate content sur filtres / trailing slash.

**Solution :** canonical absolu par page (domaine de prod à figer).

---

### Problème 6 — robots.txt / sitemap absents

**Problème :** `public/` ne contient que `favicon.png` et `logo.png`.

**Pourquoi :** mauvaise découverte du site ; admin crawlable ; pas de carte des URLs produit.

**Solution :** `robots.txt` (Disallow `/admin`, `/checkout`, `/compte`…) + sitemap dynamique.

---

### Problème 7 — Open Graph incomplet

**Problème :** Pas d’`og:image`, pas d’`og:url`.

**Pourquoi :** partages sociaux sans vignette.

**Solution :** `og:image` (logo home ; image produit PDP), `og:url`, `og:locale=fr_FR`.

---

### Problème 8 — JSON-LD Product incomplet + domaine hardcodé

**Problème :** Schema Product sans `image`, `brand`, `sku` ; URL `https://luxuryarttab.com/...` alors que l’API prod pointe `luxury-art.tn`.

**Pourquoi :** rich results refusés / incohérence marque.

**Fichier :** `products.$id.tsx`.

**Solution :** JSON-LD complet + domaine unique ; ajouter `Organization` / `WebSite` / `BreadcrumbList`.

---

### Problème 9 — Admin accessible sans barrière robots

**Problème :** `/admin/login` public ; pas de `noindex` ni Disallow.

**Pourquoi :** pages login/dashboard indexables = bruit SERP.

**Solution :** `meta robots noindex` sur `/admin/*` + Disallow robots.txt.

---

### Problème 10 — Incohérence marché (Maroc / Tunisie / MAD / TND)

**Problème :** description root “livraison au Maroc” ; contact défaut Monastir ; prix schema `MAD` ; email `.tn`.

**Pourquoi :** signaux E-E-A-T / Local SEO confus.

**Solution :** figer 1 marché + 1 devise + 1 domaine avant SEO local.

---

## 8. Architecture SEO recommandée

```text
luxury_art_tab_front-main/
├── public/
│   ├── robots.txt
│   ├── favicon.png
│   └── logo.png                 (sitemap plutôt généré dynamiquement)
├── src/
│   ├── lib/seo/
│   │   ├── site.ts              ← domain, brand, default OG image
│   │   ├── titles.ts
│   │   ├── schema.ts            ← JSON-LD builders
│   │   └── robots-policy.ts
│   ├── routes/
│   │   ├── __root.tsx           ← defaults + noindex admin/maintenance
│   │   ├── index.tsx            ← head + loader home
│   │   ├── products.index.tsx   ← head + loader catalogue
│   │   ├── products.$id.tsx     ← head + Product schema (déjà amorcé)
│   │   ├── category.$slug.tsx   ← contenu réel OU noindex
│   │   ├── actualites.tsx       ← head + loader
│   │   ├── contact.tsx          ← head + LocalBusiness schema
│   │   ├── sitemap[.]tsx        ← route dynamique /sitemap.xml (TanStack)
│   │   └── admin/**             ← robots: noindex
│   └── components/seo/
│       └── (optionnel) JsonLd.tsx
```

Exploiter **TanStack Start loaders + `head`** (déjà en place sur PDP) plutôt qu’ajouter React Helmet sur une SPA.

---

## 9. Plan d’action (ordre exact)

| # | Action | Priorité |
| - | ------ | -------- |
| 1 | Figer domaine prod + marché (TN/MA) + devise | 🔴 |
| 2 | `robots.txt` + `noindex` sur `/admin/*`, checkout, compte, auth | 🔴 |
| 3 | Titles + meta uniques sur `/`, `/products`, `/actualites`, `/contact` | 🔴 |
| 4 | Canonical absolus (surtout catalogue + PDP) | 🔴 |
| 5 | Loaders SSR pour catalogue / home / actualités (HTML avec contenu) | 🔴 |
| 6 | Unifier catégories (`/category` vs `?category=`) | 🟠 |
| 7 | Compléter OG (`og:image`, `og:url`) + Twitter | 🟠 |
| 8 | Enrichir JSON-LD Product + Organization + Breadcrumb | 🟠 |
| 9 | Sitemap XML dynamique (pages + produits) | 🟠 |
| 10 | Alts images manquants (panier, avatars, miniatures galerie) | 🟡 |
| 11 | H1 home / catégories plus orientés mots-clés + brand | 🟡 |
| 12 | 404 FR + `noindex` | 🟡 |
| 13 | Search Console + test rich results + inspection URL | 🟠 |
| 14 | Perf (LCP hero, images WebP, fonts) | 🟡 |

---

## Score SEO actuel : **4/10**

**Justification :**  
Base technique **au-dessus d’une SPA classique** (TanStack Start, `lang=fr`, favicon, head root, head dynamique PDP/catégorie, JSON-LD Product amorcé, 404). Mais les fondamentaux d’indexation professionnelle manquent : **pas de robots/sitemap/canonical**, **titles/descriptions non différenciés** sur les pages stratégiques, **catalogue/actus surtout client-side**, **catégories marketing thin**, **OG/schema incomplets**, **incohérence geo/domaine**. Pour un référencement Google pro e-commerce, le socle est amorcé mais **pas encore “SEO-ready”**.

---

## Liens utiles du projet

| Élément | URL / chemin |
| ------- | ------------ |
| Boutique (dev) | http://localhost:5173/ |
| Dashboard admin | http://localhost:5173/admin/login |
| Favicon | `public/favicon.png` |
| Head global | `src/routes/__root.tsx` |
| SEO PDP (déjà amorcé) | `src/routes/products.$id.tsx` |
| SEO catégorie (déjà amorcé) | `src/routes/category.$slug.tsx` |

---

*Rapport généré pour préparation SEO Google professionnelle — Étape 1 (audit uniquement).*

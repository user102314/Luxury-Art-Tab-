import type { Category, Product } from '@/types/api'

export type ChatLink = { label: string; to: string }

export type ChatProductCard = {
  id: number
  nom: string
  prix: number
  stock: number
  categoryName?: string
  statut: string
}

export type BotReply = {
  text: string
  links?: ChatLink[]
  products?: ChatProductCard[]
}

const SITE_GUIDE: { keywords: string[]; reply: BotReply }[] = [
  {
    keywords: ['accueil', 'home', 'début', 'debut', 'commencer'],
    reply: {
      text: "La page d'accueil présente nos collections et nouveautés. Vous y trouverez un aperçu de la galerie.",
      links: [{ label: 'Aller à l\'accueil', to: '/' }],
    },
  },
  {
    keywords: ['galerie', 'catalogue', 'tous les produits', 'acheter', 'boutique'],
    reply: {
      text: 'La galerie liste tous nos tableaux avec filtres par catégorie, prix et stock en temps réel.',
      links: [{ label: 'Voir la galerie', to: '/products' }],
    },
  },
  {
    keywords: ['compte', 'profil', 'fidélité', 'fidelite', 'inscri', 'connexion', 'connecter', 'login'],
    reply: {
      text: 'Créez un compte pour le programme fidélité (tableaux gratuits et réductions). Connectez-vous pour suivre vos récompenses.',
      links: [
        { label: 'Créer un compte', to: '/signup' },
        { label: 'Se connecter', to: '/signin' },
        { label: 'Mon profil', to: '/compte' },
      ],
    },
  },
  {
    keywords: ['panier', 'commander', 'checkout', 'paiement', 'livraison adresse'],
    reply: {
      text: 'Ajoutez des œuvres au panier depuis la galerie, puis validez votre commande avec adresse et téléphone.',
      links: [
        { label: 'Galerie produits', to: '/products' },
        { label: 'Passer commande', to: '/checkout' },
      ],
    },
  },
  {
    keywords: ['contact', 'email', 'message', 'nous contacter'],
    reply: {
      text: 'Envoyez-nous un message via le formulaire contact ou WhatsApp (icône verte en bas à droite).',
      links: [{ label: 'Page contact', to: '/contact' }],
    },
  },
  {
    keywords: ['actualité', 'actualite', 'blog', 'news', 'article'],
    reply: {
      text: 'Consultez nos dernières publications et inspirations sur la page Actualités.',
      links: [{ label: 'Actualités', to: '/actualites' }],
    },
  },
]

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function formatDh(n: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} DH`
}

function stockLabel(stock: number, statut: string) {
  if (statut === 'ARCHIVE') return 'archivé'
  if (stock <= 0 || statut === 'RUPTURE_STOCK') return 'rupture de stock'
  if (stock <= 3) return `stock faible (${stock})`
  return `en stock (${stock})`
}

function availableProducts(products: Product[]) {
  return products.filter((p) => p.statut !== 'ARCHIVE')
}

function toCard(p: Product, categoryMap: Record<number, string>): ChatProductCard {
  return {
    id: p.id,
    nom: p.nom,
    prix: Number(p.prix),
    stock: p.stock,
    categoryName: categoryMap[p.categoryId],
    statut: p.statut,
  }
}

function matchProducts(query: string, products: Product[], categoryMap: Record<number, string>, limit = 5): Product[] {
  const q = normalize(query)
  const tokens = q.split(/\s+/).filter((t) => t.length > 2)
  const list = availableProducts(products)

  return list
    .map((p) => {
      const cat = categoryMap[p.categoryId] ?? ''
      const hay = normalize(`${p.nom} ${p.description ?? ''} ${cat}`)
      let score = 0
      for (const t of tokens) {
        if (hay.includes(t)) score += 2
      }
      if (hay.includes(q)) score += 5
      return { p, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p)
}

export function buildWelcomeReply(): BotReply {
  return {
    text: "Bonjour, je suis l'assistant Luxury Art. Je connais le catalogue, les stocks et les prix en direct, et je peux vous guider sur le site.",
    links: [
      { label: 'Voir la galerie', to: '/products' },
      { label: 'Programme fidélité', to: '/signup' },
    ],
  }
}

export function getQuickPrompts(): string[] {
  return [
    'Quels produits en stock ?',
    'Liste des catégories',
    'Comment commander ?',
    'Programme fidélité',
    'Produits pas chers',
  ]
}

export function processChatMessage(
  raw: string,
  products: Product[],
  categories: Category[],
): BotReply {
  const q = raw.trim()
  const lower = normalize(q)
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.nom]))
  const list = availableProducts(products)

  // Navigation / guide site
  for (const guide of SITE_GUIDE) {
    if (guide.keywords.some((k) => lower.includes(normalize(k)))) {
      return guide.reply
    }
  }

  // Catégories
  if (
    lower.includes('categor') ||
    lower.includes('collection') ||
    lower.includes('type de tableau')
  ) {
    if (categories.length === 0) {
      return { text: 'Aucune catégorie disponible pour le moment.', links: [{ label: 'Galerie', to: '/products' }] }
    }
    const lines = categories.map((c) => {
      const count = list.filter((p) => p.categoryId === c.id).length
      const inStock = list.filter((p) => p.categoryId === c.id && p.stock > 0).length
      return `• ${c.nom} — ${count} produit(s), ${inStock} en stock`
    })
    return {
      text: `Nos catégories :\n${lines.join('\n')}\n\nFiltrez par catégorie dans la galerie.`,
      links: [{ label: 'Ouvrir la galerie', to: '/products' }],
    }
  }

  // Stock global
  if (
    lower.includes('stock') &&
    !lower.match(/\d/) &&
    (lower.includes('quoi') || lower.includes('quel') || lower.includes('liste') || lower.includes('dispo') || lower.includes('en stock'))
  ) {
    const inStock = list.filter((p) => p.stock > 0 && p.statut === 'DISPONIBLE')
    if (inStock.length === 0) {
      return { text: 'Aucun produit en stock actuellement. Revenez bientôt ou contactez-nous sur WhatsApp.' }
    }
    const cards = inStock.slice(0, 6).map((p) => toCard(p, categoryMap))
    return {
      text: `${inStock.length} produit(s) disponible(s). Voici les principaux :`,
      products: cards,
      links: [{ label: 'Toute la galerie', to: '/products' }],
    }
  }

  // Prix / pas cher / promo
  if (
    lower.includes('prix') ||
    lower.includes('pas cher') ||
    lower.includes('bon marche') ||
    lower.includes('coût') ||
    lower.includes('cout') ||
    lower.includes('combien')
  ) {
    const sorted = [...list].filter((p) => p.stock > 0).sort((a, b) => Number(a.prix) - Number(b.prix))
    if (sorted.length === 0) {
      return { text: 'Catalogue momentanément indisponible.', links: [{ label: 'Contact', to: '/contact' }] }
    }
    if (lower.includes('pas cher') || lower.includes('bon marche') || lower.includes('moins cher')) {
      const cheap = sorted.slice(0, 5)
      return {
        text: 'Voici nos tableaux les plus accessibles (prix de base) :',
        products: cheap.map((p) => toCard(p, categoryMap)),
        links: [{ label: 'Comparer dans la galerie', to: '/products' }],
      }
    }
    const avg = sorted.reduce((s, p) => s + Number(p.prix), 0) / sorted.length
    return {
      text: `Nos prix de base vont de ${formatDh(Number(sorted[0].prix))} à ${formatDh(Number(sorted[sorted.length - 1].prix))} (moyenne ~${formatDh(avg)}). Le prix final dépend de la taille et du cadre sur la fiche produit.`,
      links: [{ label: 'Voir les produits', to: '/products' }],
    }
  }

  // Recherche produit par nom
  if (
    lower.includes('produit') ||
    lower.includes('tableau') ||
    lower.includes('cherche') ||
    lower.includes('trouve') ||
    lower.includes('montre') ||
    lower.includes('recherche')
  ) {
    const matched = matchProducts(q, products, categoryMap, 5)
    if (matched.length > 0) {
      return {
        text: 'Voici ce que j\'ai trouvé dans le catalogue :',
        products: matched.map((p) => toCard(p, categoryMap)),
      }
    }
  }

  // Match direct sur nom produit
  const direct = matchProducts(q, products, categoryMap, 3)
  if (direct.length > 0) {
    return {
      text: direct.length === 1 ? 'Produit correspondant :' : 'Plusieurs produits correspondent :',
      products: direct.map((p) => toCard(p, categoryMap)),
    }
  }

  // Match catégorie par nom
  const cat = categories.find((c) => normalize(c.nom).includes(lower) || lower.includes(normalize(c.nom)))
  if (cat) {
    const catProducts = list.filter((p) => p.categoryId === cat.id).slice(0, 5)
    return {
      text: `Catégorie « ${cat.nom} » — ${catProducts.length} produit(s) affiché(s) :`,
      products: catProducts.map((p) => toCard(p, categoryMap)),
      links: [{ label: 'Filtrer en galerie', to: '/products' }],
    }
  }

  // Fidélité détaillé
  if (lower.includes('cadeau') || lower.includes('gratuit') || lower.includes('reduction') || lower.includes('récompense')) {
    return {
      text: 'Le programme fidélité offre des tableaux gratuits ou des réductions après vos commandes livrées. Inscrivez-vous gratuitement pour suivre votre progression.',
      links: [
        { label: 'Créer mon compte', to: '/signup' },
        { label: 'Mon profil', to: '/compte' },
      ],
    }
  }

  // Livraison / paiement
  if (lower.includes('livraison') || lower.includes('delai') || lower.includes('délai')) {
    return {
      text: 'Livraison au Maroc en 3 à 7 jours ouvrés. Paiement à la livraison ou virement. Pour une commande sur mesure, utilisez WhatsApp.',
    }
  }
  if (lower.includes('paiement') || lower.includes('payer')) {
    return {
      text: 'Nous acceptons le paiement à la livraison et le virement bancaire. Finalisez votre panier sur la page commande.',
      links: [{ label: 'Commander', to: '/checkout' }],
    }
  }

  // Aide générale site
  if (lower.includes('aide') || lower.includes('help') || lower.includes('comment') || lower.includes('utiliser') || lower.includes('site')) {
    return {
      text: 'Sur Luxury Art Tab :\n1. Galerie → choisir un tableau\n2. Fiche produit → taille, cadre, panier\n3. Checkout → adresse et validation\n4. Compte fidélité → récompenses après livraison',
      links: [
        { label: 'Galerie', to: '/products' },
        { label: 'Créer un compte', to: '/signup' },
        { label: 'Contact', to: '/contact' },
      ],
    }
  }

  // Salutations
  if (/^(bonjour|salut|hello|bonsoir|hey)\b/.test(lower)) {
    return buildWelcomeReply()
  }

  return {
    text: 'Je n\'ai pas bien compris. Essayez « produits en stock », « catégories », « comment commander » ou le nom d\'un tableau. Vous pouvez aussi nous écrire sur WhatsApp.',
    links: [
      { label: 'Galerie', to: '/products' },
      { label: 'Contact', to: '/contact' },
    ],
  }
}

export function formatProductLine(card: ChatProductCard): string {
  return `${card.nom} — ${formatDh(card.prix)} — ${stockLabel(card.stock, card.statut)}${card.categoryName ? ` (${card.categoryName})` : ''}`
}

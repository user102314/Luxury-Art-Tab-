import { slugify } from './categories'

/** Textes SEO / éditoriaux — mots-clés naturels, sans bourrage. */
export const PAGE_COPY = {
  home: {
    title: 'Tableau décoratif Tunisie | Luxury Art_Tab',
    description:
      'Boutique de tableaux décoratifs muraux en Tunisie. Salon, cuisine, floral, calligraphie : formats et cadres au choix, livraison partout en Tunisie.',
    h1: 'Tableaux décoratifs muraux en Tunisie',
    intro:
      'Luxury Art_Tab vend des tableaux décoratifs à commander en ligne : choisissez la dimension et le cadre, puis faites livrer en Tunisie.',
  },
  products: {
    title: 'Catalogue tableaux décoratifs | Luxury Art_Tab',
    description:
      'Parcourez nos tableaux décoratifs et décorations murales. Filtrez par style, comparez formats et cadres, commandez avec livraison en Tunisie.',
    h1: 'Catalogue de tableaux décoratifs',
    intro:
      'Trouvez un tableau mural pour le salon, la cuisine ou la chambre. Le prix dépend du format et du type de cadre.',
  },
  actualites: {
    title: 'Actualités tableaux décoratifs | Luxury Art_Tab',
    description:
      'Promotions, nouvelles collections et conseils déco Luxury Art_Tab. Suivez les tableaux décoratifs et la décoration murale en Tunisie.',
    h1: 'Actualités déco et tableaux',
    intro:
      'Soldes, nouveautés et annonces de la boutique : tout pour habiller vos murs en Tunisie.',
  },
  contact: {
    title: 'Commander un tableau sur mesure | Contact Luxury Art_Tab',
    description:
      'Contactez Luxury Art_Tab pour un tableau décoratif, un format sur mesure ou une question de livraison en Tunisie. Réponse sous 24 h.',
    h1: 'Commander ou poser une question',
    intro:
      'Projet sur mesure, choix de cadre ou délai de livraison en Tunisie : écrivez-nous, nous répondons sous 24 h.',
  },
} as const

export type CategorySeoCopy = {
  title: string
  h1: string
  description: (count: number) => string
  intro: string
}

const CATEGORY_SEO: Record<string, CategorySeoCopy> = {
  enfants: {
    title: 'Tableau décoratif enfant | Luxury Art_Tab Tunisie',
    h1: 'Tableaux décoratifs pour chambre d’enfant',
    description: (count) =>
      `Tableaux décoratifs enfant (${count} modèles). Décoration murale douce pour chambre, livraison en Tunisie.`,
    intro:
      'Des tableaux muraux colorés pour la chambre d’enfant : formats adaptés, cadres au choix, commande en ligne et livraison en Tunisie.',
  },
  femmes: {
    title: 'Tableau décoratif portrait femme | Luxury Art_Tab',
    h1: 'Tableaux décoratifs portraits de femme',
    description: (count) =>
      `Tableaux décoratifs femme et portraits (${count} œuvres). Art mural élégant, livraison en Tunisie.`,
    intro:
      'Portraits et silhouettes pour un mur de salon ou de chambre. Chaque tableau décoratif se commande avec dimension et cadre.',
  },
  cuisine: {
    title: 'Tableau décoratif cuisine | Luxury Art_Tab Tunisie',
    h1: 'Tableaux décoratifs pour la cuisine',
    description: (count) =>
      `Tableaux muraux cuisine (${count} modèles). Décoration murale gourmande, formats et cadres, livraison Tunisie.`,
    intro:
      'Habiller un mur de cuisine avec un tableau décoratif : scènes gourmandes, formats pratiques et livraison partout en Tunisie.',
  },
  animaux: {
    title: 'Tableau décoratif animaux | Luxury Art_Tab Tunisie',
    h1: 'Tableaux décoratifs animaux',
    description: (count) =>
      `Tableaux décoratifs animaux (${count} œuvres). Décoration murale salon ou chambre, livraison en Tunisie.`,
    intro:
      'Animaux illustrés pour un tableau mural vivant. Choisissez la taille et le cadre, puis commandez en Tunisie.',
  },
  'moderne-abstrait': {
    title: 'Tableau abstrait moderne | Luxury Art_Tab Tunisie',
    h1: 'Tableaux abstraits modernes',
    description: (count) =>
      `Tableaux décoratifs abstraits et modernes (${count} toiles). Décoration murale contemporaine, livraison Tunisie.`,
    intro:
      'Lignes, couleurs et compositions abstraites pour un salon contemporain. Tableau décoratif mural, cadre au choix, livraison en Tunisie.',
  },
  florale: {
    title: 'Tableau floral décoratif | Luxury Art_Tab Tunisie',
    h1: 'Tableaux décoratifs floraux',
    description: (count) =>
      `Tableaux floraux et botaniques (${count} modèles). Décoration murale salon, livraison en Tunisie.`,
    intro:
      'Fleurs et feuillages pour un tableau mural lumineux. Idéal au salon ou dans une entrée, avec livraison en Tunisie.',
  },
  'calligraphie-et-islamique': {
    title: 'Tableau calligraphie islamique | Luxury Art_Tab',
    h1: 'Tableaux calligraphie et art islamique',
    description: (count) =>
      `Tableaux calligraphie islamique (${count} œuvres). Décoration murale spirituelle, livraison en Tunisie.`,
    intro:
      'Calligraphie et motifs islamiques pour un tableau décoratif de salon ou de pièce de réception, livré en Tunisie.',
  },
  'traditionnel-orientale-mediterraneenne': {
    title: 'Tableau oriental méditerranéen | Luxury Art_Tab',
    h1: 'Tableaux traditionnels, orientaux et méditerranéens',
    description: (count) =>
      `Tableaux décoratifs orientaux et méditerranéens (${count} toiles). Art mural, livraison en Tunisie.`,
    intro:
      'Ambiances traditionnelles, orientales et méditerranéennes pour vos murs. Tableau décoratif à encadrer, livraison en Tunisie.',
  },
}

export function categorySeoCopy(slug: string, label: string): CategorySeoCopy {
  const key = slugify(slug)
  if (CATEGORY_SEO[key]) return CATEGORY_SEO[key]
  const fromLabel = Object.entries(CATEGORY_SEO).find(([k, v]) => {
    const hay = `${k} ${v.h1} ${label}`.toLowerCase()
    return hay.includes(slugify(label)) || slugify(label).includes(k)
  })
  if (fromLabel) return fromLabel[1]
  const name = label.trim() || 'mural'
  return {
    title: `Tableau décoratif ${name} | Luxury Art_Tab Tunisie`,
    h1: `Tableaux décoratifs ${name}`,
    description: (count) =>
      count > 0
        ? `Tableaux décoratifs ${name.toLowerCase()} (${count} œuvre${count > 1 ? 's' : ''}). Décoration murale Luxury Art_Tab, livraison en Tunisie.`
        : `Collection ${name} — tableaux décoratifs et décoration murale en Tunisie.`,
    intro: `Sélection de tableaux décoratifs ${name.toLowerCase()} : formats et cadres au choix, commande en ligne, livraison en Tunisie.`,
  }
}

export function productSeoTitle(ref: string, categoryName?: string): string {
  const cat = categoryName?.trim()
  const base = cat ? `Tableau décoratif ${cat} ${ref}` : `Tableau décoratif ${ref}`
  const withBrand = `${base} | Luxury Art_Tab`
  return withBrand.length <= 65 ? withBrand : `${base} | Tunisie`
}

export function productVisibleTitle(ref: string, categoryName?: string): string {
  const cat = categoryName?.trim()
  return cat ? `Tableau décoratif ${cat} · ${ref}` : `Tableau décoratif ${ref}`
}

export const STORE_FAQS: { question: string; answer: string }[] = [
  {
    question: 'Où acheter un tableau décoratif en Tunisie ?',
    answer:
      'Chez Luxury Art_Tab, boutique en ligne de tableaux décoratifs muraux. Vous commandez sur luxury-art.tn et la livraison se fait partout en Tunisie.',
  },
  {
    question: 'Comment est calculé le prix d’un tableau mural ?',
    answer:
      'Le prix dépend de la dimension et du type de cadre (sans cadre, cadre américain ou cadre large). La couleur du cadre ne change pas le tarif.',
  },
  {
    question: 'Quels formats de tableaux proposez-vous ?',
    answer:
      'Plusieurs formats sont disponibles selon l’œuvre, du 30×40 cm jusqu’aux grands formats type 160×100 cm. Seules les tailles tarifées pour le modèle apparaissent à la commande.',
  },
  {
    question: 'Livrez-vous partout en Tunisie ?',
    answer:
      'Oui. Après validation de la commande, le tableau décoratif est préparé à l’atelier puis expédié en Tunisie. Un délai estimé s’affiche sur chaque fiche produit.',
  },
  {
    question: 'Puis-je commander un tableau sur mesure ?',
    answer:
      'Oui. Indiquez le motif, le format et le cadre souhaités via la page Contact. L’atelier Luxury Art_Tab confirme la faisabilité et le délai avant production.',
  },
  {
    question: 'Quels styles de décoration murale trouvez-vous sur le site ?',
    answer:
      'Le catalogue couvre notamment la cuisine, le floral, l’abstrait moderne, la calligraphie islamique, les animaux, les portraits et les ambiances orientales ou méditerranéennes.',
  },
]

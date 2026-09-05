export type ProductStatut = 'DISPONIBLE' | 'RUPTURE_STOCK' | 'ARCHIVE'
export type OrderStatut = 'EN_ATTENTE' | 'CONFIRMEE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE'
export type ReviewStatut = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE'
export type NewsStatut = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE'

export interface ProductImage {
  id: number
  productId: number
  url: string
  storagePath?: string
  ordre: number
  createdAt?: string
}

export interface TableauDimension {
  id: number
  label: string
  largeur?: number
  hauteur?: number
  ordre?: number
  /** Ex. « 3 » pour tableau 3 pièces — optionnel */
  note?: string | null
}

export interface CadreCouleur {
  id: number
  cadreId: number
  nom: string
  hex?: string
  imageUrl?: string
  ordre?: number
}

export interface Cadre {
  id: number
  nom: string
  code: string
  ordre?: number
  couleurs?: CadreCouleur[]
}

export interface DimensionCadrePrix {
  id?: number
  dimensionId: number
  dimensionLabel?: string
  cadreId: number
  cadreNom?: string
  cadreCode?: string
  prix?: number | null
}

export interface CatalogPricing {
  dimensions: TableauDimension[]
  cadres: Cadre[]
  tarifs: DimensionCadrePrix[]
}

export interface Product {
  id: number
  ref: string
  description?: string
  /** Prix de départ (minimum des dimensions sélectionnées) */
  prix?: number | null
  dimensionIds?: number[]
  dimensions?: TableauDimension[]
  imageUrl?: string
  images?: ProductImage[]
  categoryId: number
  statut: ProductStatut
  displayOrder?: number
}

export interface Category {
  id: number
  nom: string
  description?: string
  heroProductId?: number | null
}

export interface CategoryShowcase {
  categoryId: number
  nom: string
  description?: string
  product: Product
}

export interface ProductComment {
  id: number
  userId: number
  userNom?: string
  productId: number
  contenu: string
  createdAt?: string
  statut?: string
}

export interface Review {
  id: number
  userId: number
  productId: number
  note: number
  commentaire?: string
  createdAt?: string
  statut?: ReviewStatut
}

export interface ProductLikeSummary {
  count: number
  userLiked: boolean
}

export interface Visitor {
  id: number
  nom: string
  email: string
}

export interface ContactMessage {
  nom: string
  email: string
  sujet: string
  message: string
}

export interface Order {
  id?: number
  userId: number
  dateCommande?: string
  statut: OrderStatut
  total?: number
  adresseLivraison: string
}

export interface OrderItem {
  id?: number
  orderId?: number
  productId: number
  quantite: number
  prixUnitaire: number
}

export interface News {
  id: number
  titre: string
  resume?: string
  contenu: string
  imageUrl?: string
  auteurId: number
  auteurNom?: string
  statut: NewsStatut
  createdAt?: string
  publishedAt?: string
}

export interface CartItem {
  productId: number
  ref: string
  imageUrl: string
  prixUnitaire: number
  quantite: number
  taille: string
  encadrement: string
  couleur?: string
}

export interface ClientAccount {
  id: number
  nom: string
  email: string
  role: string
  clientProfileId?: number
  commandesCycle?: number
  commandesRequises?: number
  tableauxGratuits?: number
  reductionDisponible?: number
  totalRecompenses?: number
  programmeNom?: string
  typeRecompense?: string
}

export interface LoyaltyProgramPublic {
  id: number
  nom: string
  description?: string
  commandesRequises: number
  typeRecompense: string
  valeurRecompense: number
}

export type TestimonialPlateforme =
  | 'WHATSAPP'
  | 'MESSENGER'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'AUTRE'

export interface Testimonial {
  id: number
  clientNom: string
  message?: string
  plateforme: TestimonialPlateforme
  imageUrl?: string
  avatarUrl?: string
  reponseBoutique?: string
  actif: boolean
  ordre: number
  createdAt?: string
}

export interface SiteSettings {
  termsVersion?: number
  termsContent?: string
  whatsappNumber?: string
  boutiqueNom?: string
  slogan?: string
  emailContact?: string
  telephoneContact?: string
  adresse?: string
  ville?: string
  pays?: string
  supportFaq?: { question: string; answer: string }[]
}

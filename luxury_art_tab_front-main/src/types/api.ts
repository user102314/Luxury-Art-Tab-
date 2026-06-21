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

export interface Product {
  id: number
  nom: string
  description?: string
  prix: number
  stock: number
  imageUrl?: string
  images?: ProductImage[]
  categoryId: number
  statut: ProductStatut
}

export interface Category {
  id: number
  nom: string
  description?: string
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
  nom: string
  imageUrl: string
  prixUnitaire: number
  quantite: number
  taille: string
  encadrement: string
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

export interface SiteSettings {
  termsVersion: number
  termsContent: string
  whatsappNumber: string
  supportFaq: { question: string; answer: string }[]
}

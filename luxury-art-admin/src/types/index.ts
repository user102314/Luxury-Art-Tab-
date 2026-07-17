export type Role = 'ADMIN' | 'CLIENT' | 'VENDEUR'

export interface User {
  id: number
  nom: string
  email: string
  role: Role
}

export type OrderStatut =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'EXPEDIEE'
  | 'LIVREE'
  | 'ANNULEE'

export type OrderCanal = 'SITE_WEB' | 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP'

export interface OrderItem {
  id?: number
  orderId?: number
  productId: number
  productNom?: string
  quantite: number
  prixUnitaire: number
}

export interface Order {
  id: number
  userId: number
  userNom?: string
  dateCommande: string
  statut: OrderStatut
  total: number | null
  adresseLivraison: string
  canal?: OrderCanal
  clientNom?: string
  clientTelephone?: string
  referenceFacebook?: string
  referenceInstagram?: string
  referenceWhatsapp?: string
  numeroColis?: string
  items?: OrderItem[]
}

export interface OrderChannelStats {
  totalFacebook: number
  totalInstagram: number
  totalWhatsapp: number
  totalSiteWeb: number
  facebookLivrees: number
  instagramLivrees: number
  whatsappLivrees: number
  siteWebLivrees: number
  caFacebook: number
  caInstagram: number
  caWhatsapp: number
  caSiteWeb: number
  caTotal: number
}

export interface FacebookOrderLine {
  productId: number
  quantite: number
  prixUnitaire?: number
}

export interface FacebookOrderCreate {
  clientNom: string
  clientEmail?: string
  clientTelephone?: string
  adresseLivraison: string
  referenceFacebook?: string
  statut?: OrderStatut
  items: FacebookOrderLine[]
}

export interface InstagramOrderLine {
  productId: number
  quantite: number
  prixUnitaire?: number
}

export interface InstagramOrderCreate {
  clientNom: string
  clientEmail?: string
  clientTelephone?: string
  adresseLivraison: string
  referenceInstagram?: string
  statut?: OrderStatut
  items: InstagramOrderLine[]
}

export interface WhatsAppOrderLine {
  productId: number
  quantite: number
  prixUnitaire?: number
}

export interface WhatsAppOrderCreate {
  clientNom: string
  clientEmail?: string
  clientTelephone?: string
  adresseLivraison: string
  referenceWhatsapp?: string
  statut?: OrderStatut
  items: WhatsAppOrderLine[]
}

export interface Product {
  id: number
  nom: string
  description: string
  prix: number
  stock: number
  imageUrl?: string
  images?: ProductImage[]
  categoryId: number
  statut: string
}

export interface ProductImage {
  id: number
  productId: number
  url: string
  storagePath: string
  ordre: number
  createdAt?: string
}

export interface DashboardStats {
  id: number
  dateDebut?: string
  dateFin?: string
  totalCommandes: number
  chiffreAffaires: number
  profitBrut: number
  profitNet: number
  topProduits?: string
}

export interface News {
  id: number
  titre: string
  resume?: string
  contenu: string
  imageUrl?: string
  auteurId: number
  auteurNom?: string
  statut: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE'
  createdAt: string
  publishedAt?: string
}

export interface Category {
  id: number
  nom: string
  description?: string
}

export type ProductStatut = 'DISPONIBLE' | 'RUPTURE_STOCK' | 'ARCHIVE'

export interface ProductComment {
  id: number
  userId: number
  userNom?: string
  productId: number
  contenu: string
  createdAt: string
  statut: string
}

export interface ProductLike {
  id: number
  userId: number
  userNom?: string
  productId: number
  createdAt: string
}

export interface ProductBestSeller {
  productId: number
  nom: string
  quantiteVendue: number
  chiffreAffaires: number
}

export interface ProductAnalytics {
  productId: number
  nom: string
  nombreJaimes: number
  nombreCommentaires: number
  nombreAvis: number
  noteMoyenne: number
  quantiteVendue: number
  chiffreAffaires: number
  jaimes: ProductLike[]
  commentaires: ProductComment[]
}

export type ReviewStatut = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE'
export type CommentStatut = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE'

export interface Review {
  id: number
  userId: number
  productId: number
  note: number
  commentaire?: string
  createdAt: string
  statut: ReviewStatut
}

export type LoyaltyRewardType = 'FREE_TABLEAU' | 'DISCOUNT_DH'

export interface LoyaltyProgram {
  id: number
  nom: string
  description?: string
  commandesRequises: number
  typeRecompense: LoyaltyRewardType
  valeurRecompense: number
  actif?: boolean
  createdAt?: string
}

export interface ClientProfile {
  id: number
  userId: number
  nom: string
  email: string
  telephone?: string
  commandesCycle: number
  totalCommandesLivrees: number
  totalRecompenses: number
  tableauxGratuits: number
  reductionDisponible: number
  commandesRequises?: number
  programmeNom?: string
  typeRecompense?: string
  valeurRecompense?: number
  createdAt?: string
}

export interface LoyaltyStats {
  totalClients: number
  totalRecompenses: number
  totalCommandesLivreesClients: number
  totalReductionsAccordees: number
  tableauxGratuitsAccordes: number
  programmeActif?: LoyaltyProgram | null
}

export interface LoyaltyReward {
  id: number
  clientProfileId: number
  clientNom?: string
  programmeNom?: string
  typeRecompense: string
  valeurRecompense: number
  message?: string
  earnedAt: string
}

export interface ProductStats {
  productId: number
  productName: string
  totalViews: number
  totalClicks: number
  totalAddToCart?: number
  totalSales: number
  revenue: number
  conversionRate: number
}

export interface DashboardSummary {
  totalRevenue: number
  totalOrders: number
  totalActiveProducts: number
  averageOrderValue: number
  conversionRate: number
  topProductsBySales: ProductStats[]
  topProductsByViews: ProductStats[]
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export type TopProductCriteria = 'VIEWS' | 'CLICKS' | 'ADD_TO_CART' | 'SALES'
export type SalesGranularity = 'DAY' | 'WEEK' | 'MONTH'

export interface ClientCrm {
  userId: number
  nom: string
  email: string
  telephone?: string
  inscritLe?: string
  nombreCommandes: number
  commandesLivrees: number
  totalDepense: number
  derniereCommande?: string
  canaux: string[]
}

export interface StockAlert {
  productId: number
  nom: string
  stock: number
  statut: string
  imageUrl?: string
}

export interface SiteSettings {
  boutiqueNom?: string
  slogan?: string
  emailContact?: string
  telephoneContact?: string
  adresse?: string
  ville?: string
  pays?: string
  whatsappNumber?: string
  termsVersion?: number
  termsContent?: string
  supportFaq?: { question: string; answer: string }[]
}

export interface AdminNotification {
  type: string
  title: string
  message: string
  orderId?: number
  canal?: string
  clientNom?: string
  total?: number
  createdAt?: string
}

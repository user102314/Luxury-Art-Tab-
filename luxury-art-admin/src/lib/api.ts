import type {
  Category,
  DashboardStats,
  News,
  Order,
  OrderStatut,
  OrderCanal,
  OrderChannelStats,
  FacebookOrderCreate,
  Product,
  ProductAnalytics,
  ProductBestSeller,
  ProductComment,
  Review,
  User,
  LoyaltyProgram,
  LoyaltyStats,
  ClientProfile,
  LoyaltyReward,
} from '../types'

/** Commandes comptabilisées dans le chiffre d'affaires (livrées uniquement) */
export const REVENUE_ORDER_STATUSES: OrderStatut[] = ['LIVREE']

/** Commandes comptées dans le total « confirmées » (confirmées + livrées) */
export const CONFIRMED_ORDER_STATUSES: OrderStatut[] = ['CONFIRMEE', 'LIVREE']

export function isRevenueOrder(order: Order) {
  return order.statut === 'LIVREE'
}

export function isConfirmedOrder(order: Order) {
  return CONFIRMED_ORDER_STATUSES.includes(order.statut)
}

export function orderAmount(order: Order) {
  return Number(order.total) || 0
}

const BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }))
    throw new Error(err.message ?? `Erreur ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (email: string, motDePasse: string) =>
    request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse }),
    }),

  getOrders: () => request<Order[]>('/orders'),
  getOrdersByCanal: (canal: OrderCanal) => request<Order[]>(`/orders?canal=${canal}`),
  getOrderChannelStats: () => request<OrderChannelStats>('/orders/stats/channels'),
  createFacebookOrder: (data: FacebookOrderCreate) =>
    request<Order>('/orders/facebook', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: number, data: Partial<Order>) =>
    request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id: number) =>
    request<void>(`/orders/${id}`, { method: 'DELETE' }),

  getProducts: () => request<Product[]>('/products'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  uploadProductImages: async (productId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    const res = await fetch(`${BASE}/products/${productId}/images`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erreur upload' }))
      throw new Error(err.message ?? `Erreur ${res.status}`)
    }
    return res.json() as Promise<import('../types').ProductImage[]>
  },

  deleteProductImage: (imageId: number) =>
    request<void>(`/products/images/${imageId}`, { method: 'DELETE' }),

  getCategories: () => request<Category[]>('/categories'),
  getBestSellers: () => request<ProductBestSeller[]>('/products/analytics/best-sellers'),
  getProductAnalytics: (id: number) =>
    request<ProductAnalytics>(`/products/${id}/analytics`),

  getDashboardStats: () => request<DashboardStats[]>('/dashboard-stats'),
  genererRapport: () =>
    request<DashboardStats>('/dashboard-stats/generer-rapport', { method: 'POST' }),

  getNews: () => request<News[]>('/news'),
  createNews: (data: Partial<News>) =>
    request<News>('/news', { method: 'POST', body: JSON.stringify(data) }),
  publishNews: (id: number) =>
    request<News>(`/news/${id}/publish`, { method: 'PATCH' }),
  deleteNews: (id: number) =>
    request<void>(`/news/${id}`, { method: 'DELETE' }),

  getUsers: () => request<User[]>('/users'),

  getReviews: () => request<Review[]>('/reviews'),
  approveReview: (id: number) =>
    request<Review>(`/reviews/${id}/approuver`, { method: 'PATCH' }),
  rejectReview: (review: Review) =>
    request<Review>(`/reviews/${review.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        userId: review.userId,
        productId: review.productId,
        note: review.note,
        commentaire: review.commentaire,
        statut: 'REJETE',
      }),
    }),
  deleteReview: (id: number) =>
    request<void>(`/reviews/${id}`, { method: 'DELETE' }),

  getProductComments: () => request<ProductComment[]>('/product-comments'),
  updateProductComment: (id: number, data: Partial<ProductComment>) =>
    request<ProductComment>(`/product-comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProductComment: (id: number) =>
    request<void>(`/product-comments/${id}`, { method: 'DELETE' }),

  getLoyaltyPrograms: () => request<LoyaltyProgram[]>('/loyalty/programs'),
  createLoyaltyProgram: (data: Partial<LoyaltyProgram>) =>
    request<LoyaltyProgram>('/loyalty/programs', { method: 'POST', body: JSON.stringify(data) }),
  updateLoyaltyProgram: (id: number, data: Partial<LoyaltyProgram>) =>
    request<LoyaltyProgram>(`/loyalty/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activateLoyaltyProgram: (id: number) =>
    request<LoyaltyProgram>(`/loyalty/programs/${id}/activate`, { method: 'PATCH' }),
  deleteLoyaltyProgram: (id: number) =>
    request<void>(`/loyalty/programs/${id}`, { method: 'DELETE' }),
  getLoyaltyStats: () => request<LoyaltyStats>('/loyalty/stats'),
  getLoyaltyClients: () => request<ClientProfile[]>('/loyalty/clients'),
  getLoyaltyRewards: () => request<LoyaltyReward[]>('/loyalty/rewards/recent'),
}

export function computeRevenue(orders: Order[]) {
  const revenueOrders = orders.filter(isRevenueOrder)
  const pendingOrders = orders.filter((o) => o.statut === 'EN_ATTENTE')
  const confirmedOrders = orders.filter(isConfirmedOrder)
  const confirmedOnlyOrders = orders.filter((o) => o.statut === 'CONFIRMEE')

  const total = revenueOrders.reduce((s, o) => s + orderAmount(o), 0)
  const pendingAmount = pendingOrders.reduce((s, o) => s + orderAmount(o), 0)
  const confirmedAmount = confirmedOrders.reduce((s, o) => s + orderAmount(o), 0)
  const confirmedOnlyAmount = confirmedOnlyOrders.reduce((s, o) => s + orderAmount(o), 0)

  const count = revenueOrders.length
  const delivered = revenueOrders.length
  const pending = pendingOrders.length
  const confirmed = confirmedOrders.length
  const profitNet = total * 0.15
  const profitBrut = total * 0.3

  return {
    total,
    count,
    delivered,
    pending,
    confirmed,
    pendingAmount,
    confirmedAmount,
    confirmedOnlyAmount,
    profitNet,
    profitBrut,
    revenueOrders,
    confirmedOrders,
  }
}

/** Répartition CA par jour (7 derniers jours) */
export function revenueByDay(orders: Order[]) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const buckets = days.map((name) => ({ name, revenu: 0, commandes: 0 }))

  orders.filter(isRevenueOrder).forEach((o) => {
    const d = new Date(o.dateCommande)
    const idx = d.getDay()
    buckets[idx].revenu += orderAmount(o)
    buckets[idx].commandes += 1
  })

  // Réordonner Lun → Dim
  return [...buckets.slice(1), buckets[0]]
}

export function formatCurrency(n: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} DH`
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export const ORDER_CANAL_LABELS: Record<OrderCanal, string> = {
  SITE_WEB: 'Site web',
  FACEBOOK: 'Facebook',
}

export const ORDER_CANAL_COLORS: Record<OrderCanal, string> = {
  SITE_WEB: 'bg-blue-500/20 text-blue-300',
  FACEBOOK: 'bg-indigo-500/20 text-indigo-300',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-500/20 text-amber-300',
  CONFIRMEE: 'bg-blue-500/20 text-blue-300',
  EXPEDIEE: 'bg-purple-500/20 text-purple-300',
  LIVREE: 'bg-emerald-500/20 text-emerald-300',
  ANNULEE: 'bg-red-500/20 text-red-300',
}

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
}

export const COMMENT_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
}

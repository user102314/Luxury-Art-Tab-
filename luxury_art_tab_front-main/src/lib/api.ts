import type {
  CartItem,
  ContactMessage,
  News,
  Order,
  OrderItem,
  Product,
  ProductComment,
  ProductLikeSummary,
  Review,
  Visitor,
} from '@/types/api'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export function getVisitorKey(): string {
  const KEY = 'luxart_visitor_key'
  let key = localStorage.getItem(KEY)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(KEY, key)
  }
  return key
}

/** Session anonyme pour le tracking analytics (dure le temps de l'onglet). */
export function getTrackingSessionId(): string {
  const KEY = 'luxart_tracking_session'
  let key = sessionStorage.getItem(KEY)
  if (!key) {
    key = crypto.randomUUID()
    sessionStorage.setItem(KEY, key)
  }
  return key
}

async function trackBeacon(path: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    if (!res.ok && res.status !== 202) {
      // silencieux — tracking best-effort
    }
  } catch {
    // silencieux
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    let message = `Erreur ${res.status}`
    try {
      const body = await res.json()
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

async function registerVisitorFallback(visitorKey: string, nom?: string): Promise<Visitor> {
  const email = `${visitorKey.replace(/[^a-zA-Z0-9-]/gi, '').toLowerCase()}@guest.luxart.local`
  try {
    const user = await request<{ id: number; nom: string; email: string }>('/users', {
      method: 'POST',
      body: JSON.stringify({
        nom: nom?.trim() || 'Visiteur',
        email,
        motDePasse: crypto.randomUUID(),
        role: 'CLIENT',
      }),
    })
    return { id: user.id, nom: user.nom, email: user.email }
  } catch {
    const users = await request<{ id: number; nom: string; email: string }[]>('/users')
    const found = users.find((u) => u.email === email)
    if (found) return { id: found.id, nom: found.nom, email: found.email }
    throw new Error('Impossible de créer le profil visiteur. Redémarrez le backend.')
  }
}

export const api = {
  getProducts: () => request<Product[]>('/products'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  getCategories: () => request<Category[]>('/categories'),

  getProductComments: (productId: number) =>
    request<ProductComment[]>(`/products/${productId}/comments`),

  createComment: (data: { userId: number; productId: number; contenu: string }) =>
    request<ProductComment>('/product-comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getApprovedReviews: async (productId: number): Promise<Review[]> => {
    try {
      return await request<Review[]>(`/reviews/product/${productId}/approved`)
    } catch {
      const all = await request<Review[]>('/reviews')
      return all.filter((r) => r.productId === productId && r.statut === 'APPROUVE')
    }
  },

  createReview: (data: {
    userId: number
    productId: number
    note: number
    commentaire?: string
  }) =>
    request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLikeSummary: async (productId: number, userId?: number): Promise<ProductLikeSummary> => {
    try {
      return await request<ProductLikeSummary>(
        `/products/${productId}/likes${userId ? `?userId=${userId}` : ''}`,
      )
    } catch {
      return { count: 0, userLiked: false }
    }
  },

  likeProduct: async (productId: number, userId: number) => {
    return request(`/products/${productId}/likes`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },

  unlikeProduct: (productId: number, userId: number) =>
    request(`/products/${productId}/likes?userId=${userId}`, { method: 'DELETE' }),

  registerVisitor: async (visitorKey: string, nom?: string): Promise<Visitor> => {
    try {
      return await request<Visitor>('/storefront/visitor', {
        method: 'POST',
        body: JSON.stringify({ visitorKey, nom }),
      })
    } catch {
      return registerVisitorFallback(visitorKey, nom)
    }
  },

  checkout: async (payload: {
    visitorKey: string
    nom?: string
    clientUserId?: number
    adresseLivraison: string
    telephone?: string
    items: { productId: number; quantite: number; prixUnitaire: number }[]
  }) => {
    try {
      return await request<{ orderId: number; userId: number; total: number }>(
        '/storefront/checkout',
        { method: 'POST', body: JSON.stringify(payload) },
      )
    } catch {
      let visitor: Visitor
      try {
        visitor = await request<Visitor>('/storefront/visitor', {
          method: 'POST',
          body: JSON.stringify({ visitorKey: payload.visitorKey, nom: payload.nom }),
        })
      } catch {
        visitor = await registerVisitorFallback(payload.visitorKey, payload.nom)
      }
      const total = payload.items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)
      const order = await request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          userId: visitor.id,
          statut: 'EN_ATTENTE',
          total,
          adresseLivraison: payload.adresseLivraison,
          clientNom: payload.nom,
          clientTelephone: payload.telephone,
        }),
      })
      for (const item of payload.items) {
        await request<OrderItem>('/order-items', {
          method: 'POST',
          body: JSON.stringify({
            orderId: order.id,
            productId: item.productId,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
          }),
        })
      }
      return { orderId: order.id!, userId: visitor.id, total }
    }
  },

  sendContact: (data: ContactMessage) =>
    request('/contact-messages', { method: 'POST', body: JSON.stringify(data) }),

  getPublishedNews: () => request<News[]>('/news/published'),

  registerClient: (data: {
    nom: string
    email: string
    motDePasse: string
    telephone?: string
    acceptTerms: boolean
  }) =>
    request<import('@/types/api').ClientAccount>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  clientLogin: (email: string, motDePasse: string) =>
    request<import('@/types/api').ClientAccount>('/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse }),
    }),

  getActiveLoyaltyProgram: async () => {
    const res = await fetch(`${BASE}/loyalty/program/active`)
    if (res.status === 204 || !res.ok) return null
    return res.json() as Promise<import('@/types/api').LoyaltyProgramPublic>
  },

  getSiteSettings: () => request<import('@/types/api').SiteSettings>('/site/settings'),

  trackProductView: (productId: number, sessionId: string, userId?: number) =>
    trackBeacon(`/products/${productId}/track/view`, { sessionId, userId: userId ?? null }),

  trackProductClick: (
    productId: number,
    sessionId: string,
    eventType: 'CLICK' | 'ADD_TO_CART' = 'CLICK',
    userId?: number,
  ) =>
    trackBeacon(`/products/${productId}/track/click`, {
      sessionId,
      eventType,
      userId: userId ?? null,
    }),
}

interface Category {
  id: number
  nom: string
  description?: string
}

export type { CartItem }

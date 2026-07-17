export const queryKeys = {
  orders: ['orders'] as const,
  orderChannelStats: ['orderChannelStats'] as const,
  products: ['products'] as const,
  categories: ['categories'] as const,
  bestSellers: ['bestSellers'] as const,
  dashboardStats: ['dashboardStats'] as const,
  news: ['news'] as const,
  reviews: ['reviews'] as const,
  comments: ['comments'] as const,
  loyaltyStats: ['loyaltyStats'] as const,
  loyaltyPrograms: ['loyaltyPrograms'] as const,
  loyaltyClients: ['loyaltyClients'] as const,
  loyaltyRewards: ['loyaltyRewards'] as const,
  clients: ['clients'] as const,
  stockAlerts: ['stockAlerts'] as const,
  productAnalytics: (id: number) => ['productAnalytics', id] as const,
  dashboardSummary: (from: string, to: string) => ['dashboardSummary', from, to] as const,
  salesOverTime: (from: string, to: string, granularity: string) =>
    ['salesOverTime', from, to, granularity] as const,
  topProductsAnalytics: (criteria: string, limit: number, from: string, to: string) =>
    ['topProductsAnalytics', criteria, limit, from, to] as const,
  allProductStats: (from: string, to: string) => ['allProductStats', from, to] as const,
}

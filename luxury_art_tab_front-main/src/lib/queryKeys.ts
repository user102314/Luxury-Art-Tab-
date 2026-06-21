export const queryKeys = {
  products: ['products'] as const,
  categories: ['categories'] as const,
  news: ['news'] as const,
  newsPublished: ['news', 'published'] as const,
  product: (id: number) => ['products', id] as const,
  productComments: (id: number) => ['products', id, 'comments'] as const,
  productReviews: (id: number) => ['products', id, 'reviews'] as const,
  productLikes: (id: number, visitorId: string | null) =>
    ['products', id, 'likes', visitorId] as const,
}

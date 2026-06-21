import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CartItem } from '@/types/api'

const STORAGE_KEY = 'luxart_cart'

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number, taille: string) => void
  updateQuantity: (productId: number, taille: string, quantite: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === item.productId && i.taille === item.taille,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantite: next[idx].quantite + item.quantite }
        return next
      }
      return [...prev, item]
    })
  }

  const removeItem = (productId: number, taille: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.taille === taille)),
    )
  }

  const updateQuantity = (productId: number, taille: string, quantite: number) => {
    if (quantite < 1) {
      removeItem(productId, taille)
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.taille === taille ? { ...i, quantite } : i,
      ),
    )
  }

  const clearCart = () => setItems([])

  const total = items.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0)
  const count = items.reduce((s, i) => s + i.quantite, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

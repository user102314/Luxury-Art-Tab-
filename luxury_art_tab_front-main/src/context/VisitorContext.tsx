import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getVisitorKey } from '@/lib/api'
import type { Visitor } from '@/types/api'

const VISITOR_DATA = 'luxart_visitor_data'

interface VisitorContextType {
  visitor: Visitor | null
  loading: boolean
  ready: boolean
  ensureVisitor: (nom?: string) => Promise<Visitor>
}

const VisitorContext = createContext<VisitorContextType | null>(null)

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [loading, setLoading] = useState(true)

  const register = async (nom?: string) => {
    const v = await api.registerVisitor(getVisitorKey(), nom)
    localStorage.setItem(VISITOR_DATA, JSON.stringify(v))
    setVisitor(v)
    return v
  }

  useEffect(() => {
    const stored = localStorage.getItem(VISITOR_DATA)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Visitor
        if (parsed?.id) {
          setVisitor(parsed)
          setLoading(false)
          return
        }
      } catch {
        localStorage.removeItem(VISITOR_DATA)
      }
    }
    register()
      .catch(() => setVisitor(null))
      .finally(() => setLoading(false))
  }, [])

  const ensureVisitor = async (nom?: string) => {
    if (visitor?.id) return visitor
    return register(nom)
  }

  return (
    <VisitorContext.Provider
      value={{ visitor, loading, ready: !loading && visitor !== null, ensureVisitor }}
    >
      {children}
    </VisitorContext.Provider>
  )
}

export function useVisitor() {
  const ctx = useContext(VisitorContext)
  if (!ctx) throw new Error('useVisitor must be used within VisitorProvider')
  return ctx
}

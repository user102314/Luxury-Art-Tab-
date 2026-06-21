import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { ClientAccount } from '@/types/api'

const STORAGE_KEY = 'luxart_client_account'

type AuthContextValue = {
  client: ClientAccount | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    nom: string
    email: string
    motDePasse: string
    telephone?: string
    acceptTerms: boolean
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setClient(JSON.parse(raw) as ClientAccount)
    } finally {
      setLoading(false)
    }
  }, [])

  const persist = useCallback((account: ClientAccount | null) => {
    setClient(account)
    if (account) localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const login = useCallback(
    async (email: string, motDePasse: string) => {
      const account = await api.clientLogin(email, motDePasse)
      persist(account)
    },
    [persist],
  )

  const register = useCallback(
    async (data: {
      nom: string
      email: string
      motDePasse: string
      telephone?: string
      acceptTerms: boolean
    }) => {
      const account = await api.registerClient(data)
      persist(account)
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  const value = useMemo(
    () => ({ client, loading, login, register, logout }),
    [client, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

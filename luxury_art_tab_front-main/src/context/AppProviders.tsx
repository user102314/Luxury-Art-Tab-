import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { FixedSupportWidget } from '@/components/FixedSupportWidget'
import { LoginInviteModal } from '@/components/LoginInviteModal'
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { VisitorProvider } from '@/context/VisitorContext'
import { queryClient } from '@/lib/queryClient'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VisitorProvider>
          <CartProvider>
            <FavoritesProvider>
              {children}
              <FixedSupportWidget />
              <LoginInviteModal />
              <TermsAcceptanceModal />
              <Toaster position="top-center" richColors />
            </FavoritesProvider>
          </CartProvider>
        </VisitorProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

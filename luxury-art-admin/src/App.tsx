import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import RevenuePage from './pages/RevenuePage'
import ProductsPage from './pages/ProductsPage'
import NewsPage from './pages/NewsPage'
import ModerationPage from './pages/ModerationPage'
import LoyaltyPage from './pages/LoyaltyPage'
import FacebookOrdersPage from './pages/FacebookOrdersPage'
import InstagramOrdersPage from './pages/InstagramOrdersPage'
import WhatsAppOrdersPage from './pages/WhatsAppOrdersPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ClientsPage from './pages/ClientsPage'
import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Navigate to="/revenue" replace />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/facebook-orders" element={<FacebookOrdersPage />} />
              <Route path="/instagram-orders" element={<InstagramOrdersPage />} />
              <Route path="/whatsapp-orders" element={<WhatsAppOrdersPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/loyalty" element={<LoyaltyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

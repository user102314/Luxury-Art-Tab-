import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useVisitor } from '@/context/VisitorContext'
import { api, getVisitorKey } from '@/lib/api'
import { formatPrice } from '@/lib/pricing'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { client } = useAuth()
  const { visitor } = useVisitor()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Votre panier est vide')
      return
    }
    if (!adresse.trim()) {
      toast.error('Adresse de livraison requise')
      return
    }

    setLoading(true)
    try {
      const fullAddress = [adresse, telephone ? `Tél: ${telephone}` : '', email ? `Email: ${email}` : '']
        .filter(Boolean)
        .join('\n')

      const result = await api.checkout({
        visitorKey: getVisitorKey(),
        nom: nom.trim() || client?.nom || undefined,
        clientUserId: client?.id,
        adresseLivraison: fullAddress,
        items: items.map((item) => ({
          productId: item.productId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        })),
      })

      clearCart()
      toast.success('Commande confirmée !', {
        description: `Réf. commande #${result.orderId}`,
      })
      navigate({ to: '/' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-lg px-6 py-32 text-center">
          <h1 className="font-display text-3xl font-bold">Panier vide</h1>
          <p className="mt-4 text-muted-foreground">Ajoutez des tableaux depuis la galerie.</p>
          <Link
            to="/products"
            className="mt-8 inline-block rounded-full bg-brand-red px-8 py-3 font-semibold text-white"
          >
            Voir les produits
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />

      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">
        <h1 className="font-display text-4xl font-bold text-foreground">
          Finaliser la <span className="text-brand-red">commande</span>
        </h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/60 bg-white/70 p-8">
            <h2 className="font-display text-xl font-bold">Livraison</h2>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={client?.nom ?? visitor?.nom ?? 'Votre nom'}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+212 6..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse de livraison *</Label>
              <Textarea
                id="adresse"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                required
                placeholder="Rue, ville, code postal..."
                className="min-h-[100px] rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent-green py-6 text-base font-bold hover:bg-accent-green/90"
            >
              {loading ? 'Traitement...' : `Confirmer · ${formatPrice(total)}`}
            </Button>
          </form>

          <div className="rounded-3xl border border-border/60 bg-[#3b2418] p-8 text-[#f7efe2]">
            <h2 className="font-display text-xl font-bold text-[#f4a15d]">Récapitulatif</h2>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.taille}`}
                  className="flex gap-4 border-b border-white/10 pb-4"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.nom}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.nom}</p>
                    <p className="text-xs text-[#f7efe2]/70">
                      {item.taille} · {item.encadrement.slice(0, 30)}...
                    </p>
                    <p className="text-sm">
                      {item.quantite} × {formatPrice(item.prixUnitaire)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-between border-t border-white/20 pt-6 text-lg font-bold">
              <span>Total</span>
              <span className="text-accent-green">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}

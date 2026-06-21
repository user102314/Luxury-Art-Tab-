import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { api } from '@/lib/api'
import {
  buildWelcomeReply,
  formatProductLine,
  getQuickPrompts,
  processChatMessage,
  type BotReply,
  type ChatProductCard,
} from '@/lib/chatbot'
import { useCategories, useProducts } from '@/hooks/useStorefrontQueries'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

type ChatMessage = {
  from: 'bot' | 'user'
  text: string
  links?: BotReply['links']
  products?: ChatProductCard[]
}

function BotMessageContent({ msg }: { msg: ChatMessage }) {
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
      {msg.products && msg.products.length > 0 && (
        <ul className="space-y-1.5">
          {msg.products.map((p) => (
            <li key={p.id}>
              <Link
                to="/products/$id"
                params={{ id: String(p.id) }}
                className="block rounded-lg border border-[#f4a15d]/25 bg-[#f4a15d]/10 px-2.5 py-2 text-xs transition hover:bg-[#f4a15d]/20"
              >
                <span className="font-semibold text-foreground">{p.nom}</span>
                <span className="mt-0.5 block text-muted-foreground">{formatProductLine(p)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {msg.links && msg.links.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {msg.links.map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              className="rounded-full bg-[#3b2418] px-2.5 py-1 text-[11px] font-medium text-[#f4a15d] hover:bg-[#3b2418]/90"
            >
              {link.label} →
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function FixedSupportWidget() {
  const { data: products = [] } = useProducts()
  const { data: categories = [] } = useCategories()
  const [whatsapp, setWhatsapp] = useState('212600000000')
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const quickPrompts = useMemo(() => getQuickPrompts(), [])

  useEffect(() => {
    api.getSiteSettings().then((s) => {
      setWhatsapp(s.whatsappNumber.replace(/\D/g, ''))
    }).catch(() => {})
    const welcome = buildWelcomeReply()
    setMessages([{ from: 'bot', text: welcome.text, links: welcome.links }])
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const waLink = useMemo(
    () =>
      `https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour Luxury Art, j'aimerais des informations.")}`,
    [whatsapp],
  )

  const reply = (text: string) => {
    setTyping(true)
    window.setTimeout(() => {
      const answer = processChatMessage(text, products, categories)
      setMessages((m) => [
        ...m,
        { from: 'bot', text: answer.text, links: answer.links, products: answer.products },
      ])
      setTyping(false)
    }, 350 + Math.min(text.length * 8, 400))
  }

  const send = (text: string) => {
    if (!text.trim() || typing) return
    setMessages((m) => [...m, { from: 'user', text: text.trim() }])
    setInput('')
    reply(text.trim())
  }

  return (
    <>
      {/* Fenêtre chat — au-dessus des icônes en bas à droite */}
      {chatOpen && (
        <div className="fixed bottom-24 right-4 z-[110] flex h-[min(520px,calc(100vh-7rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-2 bg-[#3b2418] px-4 py-3 text-[#f7efe2]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4a15d]/20">
              <Bot className="h-4 w-4 text-[#f4a15d]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Assistant Luxury Art</p>
              <p className="flex items-center gap-1 text-[10px] text-[#f7efe2]/70">
                <Sparkles className="h-3 w-3" />
                Catalogue & guide en direct
              </p>
            </div>
            <button type="button" onClick={() => setChatOpen(false)} className="rounded p-1 hover:bg-white/10" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-xl px-3 py-2 ${
                  m.from === 'bot'
                    ? 'bg-muted text-foreground'
                    : 'ml-auto bg-[#f4a15d]/20 text-foreground'
                }`}
              >
                {m.from === 'bot' ? <BotMessageContent msg={m} /> : <p className="text-sm">{m.text}</p>}
              </div>
            ))}
            {typing && (
              <div className="max-w-[80%] rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                L&apos;assistant réfléchit…
              </div>
            )}
          </div>

          <div className="border-t border-border p-2">
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={typing}
                  className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Ex: tableaux en stock, catégories…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={typing}
              />
              <button
                type="submit"
                disabled={typing || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Icônes fixes en bas à droite */}
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col-reverse gap-3 sm:bottom-6 sm:right-6">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-background/80 transition hover:scale-105"
          title="WhatsApp vendeur"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-4 ring-background/80 transition hover:scale-105 ${
            chatOpen ? 'bg-[#f4a15d] text-[#2f1b12]' : 'bg-[#3b2418] text-[#f4a15d]'
          }`}
          title="Assistant intelligent"
          aria-expanded={chatOpen}
        >
          {chatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </>
  )
}

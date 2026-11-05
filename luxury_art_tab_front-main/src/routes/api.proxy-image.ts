import { createFileRoute } from '@tanstack/react-router'

async function handleProxyImage(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')
    if (!targetUrl) {
      return new Response('Missing url query parameter', { status: 400 })
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return new Response('Invalid url scheme', { status: 400 })
    }

    // Fetch from backend without browser Origin header so nginx does not block with 403
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'LuxuryArt-Proxy/1.0',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!upstreamRes.ok) {
      return new Response(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
      })
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/webp'
    const arrayBuffer = await upstreamRes.arrayBuffer()

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('Error in proxy-image route:', err)
    return new Response('Error proxying image', { status: 500 })
  }
}

const createProxyRoute = createFileRoute('/api/proxy-image') as unknown as (
  options: Record<string, unknown>,
) => ReturnType<typeof createFileRoute>

export const Route = createProxyRoute({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleProxyImage(request),
    },
  },
})


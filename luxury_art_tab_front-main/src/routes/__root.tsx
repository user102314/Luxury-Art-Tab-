import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { AppProviders } from "@/context/AppProviders";
import { MaintenancePage } from "@/components/MaintenancePage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SITE, PAGE_COPY, buildSeoHead, organizationSchema, websiteSchema } from "@/lib/seo";

import appCss from "../styles.css?url";

const maintenanceEnabled = import.meta.env.VITE_MAINTENANCE_MODE === "true";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            to="/products"
            search={{ category: undefined }}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Voir les tableaux
          </Link>
        </div>
      </div>
    </div>
  );
}

const rootHead = maintenanceEnabled
  ? buildSeoHead({
      title: `Maintenance — ${SITE.name}`,
      description: SITE.defaultDescription,
      path: '/',
      robots: 'noindex, nofollow',
    })
  : buildSeoHead({
      title: PAGE_COPY.home.title,
      description: PAGE_COPY.home.description,
      path: '/',
      jsonLd: [organizationSchema(), websiteSchema()],
    });

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: SITE.fullName },
      {
        name: "google-site-verification",
        content: "NSNJzeuOhBiYEpAZd3exGuMZrIdq_DMragxJR3gAAmk",
      },
      ...(rootHead.meta as Array<Record<string, string>>),
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://api.luxury-art.tn" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;600&display=swap",
      },
      ...(rootHead.links ?? []),
    ],
    scripts: rootHead.scripts,
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.htmlLang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  // Mode maintenance : boutique hors ligne, dashboard admin toujours accessible.
  if (maintenanceEnabled && !isAdmin) {
    return (
      <>
        <Analytics />
        <MaintenancePage />
      </>
    );
  }

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Analytics />
        <Outlet />
      </QueryClientProvider>
    );
  }

  return (
    <AppProviders>
      <Analytics />
      <Outlet />
    </AppProviders>
  );
}

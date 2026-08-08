import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { AppProviders } from "@/context/AppProviders";
import { MaintenancePage } from "@/components/MaintenancePage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import appCss from "../styles.css?url";

const maintenanceEnabled = import.meta.env.VITE_MAINTENANCE_MODE === "true";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: maintenanceEnabled
          ? "Maintenance — Luxury Art_Tab By Insaf"
          : "Luxury Art_Tab By Insaf — Tableaux & Décoration",
      },
      { name: "description", content: "Galerie d'art murale premium. Tableaux sur mesure, collections cuisine et salon, livraison au Maroc." },
      { name: "author", content: "Luxury Art_Tab By Insaf" },
      { property: "og:title", content: "Luxury Art_Tab By Insaf — Tableaux & Décoration" },
      { property: "og:description", content: "Galerie d'art murale premium. Découvrez nos créations uniques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      ...(maintenanceEnabled
        ? [{ name: "robots", content: "noindex, nofollow" }]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
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
    return <MaintenancePage />;
  }

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}

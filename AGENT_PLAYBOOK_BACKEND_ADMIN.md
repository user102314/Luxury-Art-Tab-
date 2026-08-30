# Guide Agent Cursor — Template Backend + Admin (inspiré Luxury Art)

> **Objectif pour l’agent :** reconstruire une application e-commerce / catalogue **professionnelle** avec :
> 1. un **backend Spring Boot** structuré comme ce template ;
> 2. un **espace administrateur** React sombre, rapide, CRUD complet.
>
> **OBLIGATOIRE :** suivre aussi `AGENT_CHECKLIST_COMPLET.md` — liste **toutes** les classes backend et **toutes** les 18 pages admin. Ne pas s’arrêter à Auth + Produits.

**Projet de référence :**
- Backend : `luxury-art-backend/` (Spring Boot 3.2.5, Java 17)
- Admin front : `luxury_art_tab_front-main/src/admin/` + `src/routes/admin/`

---

## 0. Règles d’exécution pour l’agent

0. **Couverture totale** : `AGENT_CHECKLIST_COMPLET.md` est la liste de suivi. Interdit de livrer seulement Login + Produits. 18 pages menu + ~241 classes Java.
1. **Toujours** respecter la couche : `Controller → Service (interface + impl) → Repository → Entity` + `DTO`.
2. **Toujours** créer une page admin via le pipeline : `types → api → queryKeys → hooks → page → lazyPages → route → nav → prefetch`.
3. Ne pas inventer Spring Security/JWT **sauf** si le user le demande (le template actuel gate côté front).
4. Secrets uniquement dans `application-local.properties` / `.env` — **jamais** dans le JAR.
5. Après chaque feature : compile backend (`mvn compile`) + build front (`npm run build`).
6. UI admin : thème sombre `.admin-shell` (pas de design générique violet/Inter).
7. Français pour les labels UI ; code et noms de classes en anglais.

---

## 1. Backend — Stack & démarrage

### Stack obligatoire

| Élément | Choix |
|---------|--------|
| Java | 17 |
| Spring Boot | 3.2.x |
| Web | `spring-boot-starter-web` |
| Persistence | `spring-boot-starter-data-jpa` |
| Validation | `spring-boot-starter-validation` |
| DB | PostgreSQL (prod) + H2 optionnel (tests) |
| Lombok | oui |
| Sécurité | **absente** dans le template (login custom) |

### `pom.xml` — dépendances types

- web, data-jpa, validation, (websocket si notifications live)
- postgresql + h2
- lombok (+ annotationProcessorPaths dans maven-compiler-plugin)
- optionnel images : TwelveMonkeys + webp-imageio

### Package racine

```
com.<votreentreprise>.<app>/
├── Application.java
├── audit/                 # filtre + contexte admin (optionnel mais recommandé)
├── config/                # CORS, WebConfig uploads, SchemaPatchers, Seed
├── controller/            # REST public + Admin*
├── dto/
├── exception/             # GlobalExceptionHandler, ResourceNotFoundException
├── model/entity/
├── model/enums/
├── repository/
├── service/               # interfaces
│   └── impl/              # implémentations
└── websocket/             # optionnel
```

### Ports & profils

- Port API : `8081`
- `spring.jpa.hibernate.ddl-auto=update`
- Naming : `CamelCaseToUnderscoresNamingStrategy`
- Profils : `local` / `prod` ; exclure `application-local.properties` du JAR

---

## 2. Backend — Pattern d’une ressource (à recopier à chaque fois)

Pour **chaque** entité métier (ex. `Product`, `Category`, `Order`) :

### 2.1 Entity

```java
@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  // champs + relations
  @PrePersist
  protected void onCreate() { /* defaults */ }
}
```

### 2.2 Enum

`model/enums/ProductStatut.java` → `DISPONIBLE`, `RUPTURE_STOCK`, `ARCHIVE`

### 2.3 DTO

`ProductDto` avec Jakarta Validation (`@NotBlank`, `@NotNull`). **Jamais** exposer l’entité JPA brute.

### 2.4 Repository

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByCategorieId(Long categoryId);
}
```

### 2.5 Service

- Interface `ProductService`
- Impl `ProductServiceImpl` : `@Service @RequiredArgsConstructor @Transactional`
- Méthodes : `findAll`, `findById`, `create`, `update`, `delete`
- Mapping privé `toDto(entity)`
- Erreurs : `ResourceNotFoundException` ou `ResponseStatusException`

### 2.6 Controller

```java
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
  // GET /, GET /{id}, POST (201), PUT /{id}, DELETE /{id} (204)
}
```

### Checklist “nouvelle ressource”

- [ ] Entity + table
- [ ] Enum si statut
- [ ] DTO + validation
- [ ] Repository
- [ ] Service + Impl
- [ ] Controller `/api/...`
- [ ] (Admin) endpoints analytics/audit si besoin
- [ ] (Front) types + api + hooks + page

---

## 3. Backend — Auth admin (modèle du template)

### Endpoints

| Méthode | Path | Rôle |
|---------|------|------|
| `POST` | `/api/auth/login` | Admin / Vendeur |
| `POST` | `/api/auth/client/login` | Client storefront |
| `POST` | `/api/auth/register` | Inscription client |

### Comportement

1. Lookup user par email
2. Comparaison mot de passe (template actuel : **plaintext** — à renforcer si prod publique)
3. Vérifier `Role.ADMIN` ou `VENDEUR`
4. Retourner `{ id, nom, email, role }` — **pas de JWT**
5. Le front stocke l’user dans `localStorage` et protège les routes admin

### Important pour l’agent

- Documenter clairement : **pas de protection serveur** sur `/api/admin/**` dans ce template.
- Pour une app publique réelle, proposer ensuite Spring Security + JWT **en phase 2**.

### Headers audit (recommandé)

Sur chaque mutation admin, le front envoie :

```
X-Admin-Email: admin@...
X-Admin-Name: Nom
```

Le backend lit ces headers via un `OncePerRequestFilter` (`AdminAuditFilter`) et remplit un `ThreadLocal` (`AdminAuditContext`).

---

## 4. Backend — Config obligatoire

### CORS (`CorsConfig`)

- `/api/**` : origines front (localhost + domaine prod), credentials, méthodes CRUD + OPTIONS
- `/uploads/**` : origines pour images

### Uploads (`WebConfig` + `LocalFileStorageService`)

- Dossier : `app.uploads.dir` (local `${user.dir}/uploads`, prod `/opt/.../uploads`)
- Mapping URL : `/uploads/**` → fichiers locaux
- Paths : `products/{id}/{uuid}-name.webp`, `news/`, etc.
- Multipart : 10MB / fichier, 50MB / requête
- Conversion WebP recommandée pour perf

### Schema patchers (`CommandLineRunner` + `JdbcTemplate`)

Quand `ddl-auto=update` ne suffit pas (colonne NOT NULL sur table remplie) :

```java
@Component @Order(2)
public class XxxSchemaPatcher implements CommandLineRunner {
  // 1. information_schema.columns
  // 2. ALTER TABLE ADD COLUMN ... DEFAULT 0
  // 3. UPDATE ... WHERE col IS NULL
}
```

**Règle d’or :** ne jamais ajouter une colonne `NOT NULL` sans `DEFAULT` sur une table déjà peuplée.

### Exceptions (`GlobalExceptionHandler`)

Réponse JSON uniforme :

```json
{ "timestamp": "...", "message": "..." }
```

Mapper : validation 400, not found 404, `ResponseStatusException` tel quel.

---

## 5. Backend — Features “pro” à reproduire

### 5.1 Journal d’audit admin

- Entity `AdminAuditLog` (actionType, productRef, imageUrl, imageStoragePath, request/response JSON, httpStatus, adminEmail, createdAt)
- Enum `AdminActionType` : CREATE/UPDATE/DELETE produit, upload image, catégorie, priorité…
- Service `logSuccess` / `logFailure` (transaction `REQUIRES_NEW`)
- API : `GET /api/admin/audit-logs?from&to&actionType`, `GET /api/admin/audit-logs/stats`
- Brancher l’audit dans **chaque** mutation produit/image/catégorie

### 5.2 Priorité d’affichage catalogue

- Champ `Product.displayOrder` (Integer, 1 = premier dans sa catégorie)
- `POST /api/products/{id}/priority?toFirst=true|false`
  - `toFirst=true` → place en tête
  - `false` → avance d’une place
- Re-numéroter 1..n dans la catégorie
- Storefront trie par `displayOrder` puis `ref`

### 5.3 Dashboard analytics admin

Sous `/api/admin/dashboard` :

- `summary?from&to`
- `sales-over-time?granularity=DAY|WEEK|MONTH`
- `top-products?criteria=...`
- `product-stats`

### 5.4 Autres modules optionnels (à inclure si le métier le demande)

Commandes multi-canaux, stock alerts, notifications WebSocket, fidélité, avis, actualités, tarifs/cadres, tracking livraison.

---

## 6. Backend — Déploiement type VPS

```
/opt/<app>/
  ├── <app>-backend-1.0.0.jar
  ├── .env
  ├── start.sh
  └── uploads/
```

- systemd service `Restart=always`
- `SPRING_PROFILES_ACTIVE=prod`
- Build : `mvn -DskipTests clean package`
- Deploy : `scp` JAR + `systemctl restart`

---

## 7. Admin Frontend — Stack & structure

### Stack

| Élément | Choix |
|---------|--------|
| React | 19 |
| Router | TanStack Router (file routes) |
| App shell | TanStack Start + Vite 7 |
| Data | TanStack React Query v5 |
| Style | Tailwind v4 + thème `.admin-shell` |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | sonner |
| Dialogs | Radix / shadcn `alert-dialog` |

### Arborescence obligatoire

```
src/admin/
├── lazyPages.ts
├── components/     # AdminLayout, ListToolbar, StatCard, QueryStatusBar…
├── context/        # AdminAuthContext
├── hooks/          # useAdminQueries
├── lib/            # api.ts, queryKeys.ts, listUtils.ts
├── pages/          # Pages complètes
└── types/index.ts

src/routes/admin/
├── route.tsx           # AdminAuthProvider + noindex
├── login.tsx
├── index.tsx           # redirect → dashboard
└── _app/
    ├── route.tsx       # garde auth → AdminLayout
    └── *.tsx           # routes minces → lazy pages
```

---

## 8. Admin — Auth front

### `AdminAuthContext`

- Clé : `localStorage` (ex. `luxury_art_admin_user`)
- `login` → `api.login` → stocke `{id,nom,email,role}`
- `logout` → clear

### Routes

```
/admin/login     → LoginPage (hors layout)
/admin           → redirect /admin/revenue (ou dashboard)
/admin/_app/*    → si !user → /admin/login sinon AdminLayout + page
```

### Headers API

Dans `admin/lib/api.ts`, chaque `fetch` ajoute :

```ts
'X-Admin-Email': user.email
'X-Admin-Name': user.nom
```

(y compris uploads `FormData`)

---

## 9. Admin — Pipeline “nouvelle page” (OBLIGATOIRE)

L’agent doit suivre **cet ordre** :

### Étape 1 — Types
`src/admin/types/index.ts` → interfaces métier

### Étape 2 — API
`src/admin/lib/api.ts` → `getX`, `createX`, `updateX`, `deleteX`

### Étape 3 — Query keys
`src/admin/lib/queryKeys.ts`

### Étape 4 — Hooks
`useAdminQueries.ts` → `useX()` + invalidation dans `useInvalidateAdmin()`

### Étape 5 — Page
`src/admin/pages/XxxPage.tsx` :
```
<div>
  <QueryStatusBar fetching={...} />
  <h2>…</h2>
  <StatCard … />          // optionnel
  <ListToolbar … />
  <div className="card">table / grille</div>
</div>
```
Loading initial : `PageSkeleton`

### Étape 6 — Lazy
`lazyPages.ts` → `export const AdminXxxPage = lazy(() => import('./pages/XxxPage'))`

### Étape 7 — Route
`src/routes/admin/_app/xxx.tsx` → `createFileRoute('/admin/_app/xxx')`

### Étape 8 — Menu
`AdminLayout.tsx` → entrée `{ to, icon, label }`

### Étape 9 — Prefetch
`prefetchRoute` switch case au survol du menu

---

## 10. Admin — Composants & UX à respecter

| Composant | Usage |
|-----------|--------|
| `AdminLayout` | Sidebar fixe, logo, nav, logout, Suspense |
| `ListToolbar` | Recherche, filtres select, tri, dates, compteur |
| `StatCard` | KPI (commandes, CA, alertes…) |
| `QueryStatusBar` | Barre discrète pendant refetch (ne pas vider l’UI) |
| `PageSkeleton` | Premier chargement |

### Patterns pages

| Type | Exemple référence | Pattern |
|------|-------------------|---------|
| CRUD complexe | ProductsPage | Tabs + modal overlay + grille/liste |
| Liste filtrée | OrdersPage | StatCards cliquables + table + détail |
| Analytics | AnalyticsPage | Période 7j/30j + Recharts + table |
| CRUD simple | CategoriesPage | Formulaire inline card |
| Timeline détail | AuditLogsPage | Chips type d’action + cartes détaillées |

### Thème CSS (dans `styles.css` sous `.admin-shell`)

- `.card` — panneau bordure blanche/10
- `.btn-primary` — or / accent marque
- `.btn-ghost` — secondaire
- `.input` / `.label`
- Couleurs : fond `#0a0a0b`, accent gold, texte zinc

### Prefetch

Au `mouseEnter` / `focus` / `touchStart` des liens nav → `prefetchQuery` (staleTime ~2 min).

Au mount layout → prefetch essentials (dashboard + commandes + produits).

---

## 11. Admin — API base URL

```ts
// DEV  → http://localhost:8081/api
// PROD → VITE_API_URL || https://api.<domaine>/api
```

Ne pas appeler `/api` relatif en DEV (risque 404 HTML du routeur Start).

---

## 12. Plan de construction recommandé (ordre pour l’agent)

### Phase A — Backend fondations (1–2 jours)

1. Projet Maven Spring Boot + packages
2. `User` + `Role` + `AuthController`
3. CORS + GlobalExceptionHandler + health
4. Une ressource CRUD complète (ex. Category)
5. Uploads locaux + WebConfig

### Phase B — Catalogue (cœur)

1. Product + Category + images multipart
2. Statuts produit
3. (Option) displayOrder + promote
4. Audit logs sur mutations

### Phase C — Commandes & dashboard

1. Order + OrderItem + statuts
2. Admin dashboard summary / sales
3. Notifications (REST ou WebSocket)

### Phase D — Admin front

1. Auth + layout + login
2. Pages : Revenue/Dashboard, Orders, Products, Categories
3. Analytics + Audit
4. Prefetch + lazy loading

### Phase E — Polish pro

1. ListToolbar partout
2. Confirm dialogs suppressions
3. Toasts succès/erreur
4. Grille/liste produits + priorité flèche
5. Build + smoke tests API

---

## 13. Critères d’acceptation “niveau professionnel”

L’agent n’a terminé que si :

- [ ] Backend compile (`mvn -DskipTests package`)
- [ ] Front admin build (`npm run build`)
- [ ] Login admin fonctionne et redirige vers dashboard
- [ ] CRUD produits + upload image opérationnels
- [ ] Liste admin avec filtres / recherche / skeleton / refetch soft
- [ ] Mutations invalident le cache React Query
- [ ] (Si audit) chaque upload/création apparaît avec date + path image
- [ ] (Si priorité) flèche / double-clic change l’ordre storefront
- [ ] CORS OK depuis l’origine front
- [ ] Aucun secret dans le repo

---

## 14. Anti-patterns à éviter

| À ne pas faire | Faire plutôt |
|----------------|--------------|
| Entité JPA dans le JSON API | DTO + `toDto` |
| Tout dans un seul Controller | 1 ressource = 1 controller |
| Page admin sans lazy | `lazyPages.ts` |
| Logique métier dans le composant route | Page dans `admin/pages/` |
| `useEffect` fetch manuel | React Query hooks |
| Écran blanc au refetch | `keepPreviousData` + QueryStatusBar |
| Auth JWT inventé sans besoin | Garder modèle template puis phase 2 |
| `NOT NULL` sans default sur DB peuplée | Patcher + DEFAULT |
| Design Inter/violet générique | Thème `.admin-shell` sombre + accent marque |

---

## 15. Prompt court à coller pour démarrer un nouvel agent

```
Lis AGENT_CHECKLIST_COMPLET.md (toutes les pages et classes) ET AGENT_PLAYBOOK_BACKEND_ADMIN.md.
Développe TOUS les modules M0→M18. Interdit de sauter des pages admin.
Coche chaque fichier créé. Ne dis pas terminé tant qu’il reste un [ ].
```

---

## 16. Fichiers de référence à ouvrir dans le repo Luxury Art

### Backend
- `pom.xml`
- `controller/ProductController.java`, `ProductImageController.java`, `AuthController.java`
- `controller/AdminAuditLogController.java`, `AdminDashboardController.java`
- `service/impl/ProductServiceImpl.java`, `ProductImageServiceImpl.java`
- `audit/AdminAuditFilter.java`
- `config/CorsConfig.java`, `WebConfig.java`, `ProductDisplayOrderPatcher.java`
- `exception/GlobalExceptionHandler.java`
- `deploy/luxury-art-backend.service`, `deploy/start.sh`

### Admin front
- `src/admin/components/AdminLayout.tsx`
- `src/admin/lib/api.ts`, `queryKeys.ts`
- `src/admin/hooks/useAdminQueries.ts`
- `src/admin/context/AdminAuthContext.tsx`
- `src/admin/lazyPages.ts`
- `src/admin/pages/ProductsPage.tsx`, `OrdersPage.tsx`, `AnalyticsPage.tsx`, `AuditLogsPage.tsx`, `CategoriesPage.tsx`
- `src/routes/admin/_app/route.tsx`, `login.tsx`
- `src/styles.css` (section `.admin-shell`)
- `src/lib/apiBase.ts`

---

*Fin du guide. L’agent doit traiter ce fichier comme un playbook exécutable, pas comme une documentation optionnelle.*

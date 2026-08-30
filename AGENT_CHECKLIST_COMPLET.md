# Checklist complète — Backend + Admin (Luxury Art)

> **Pour l’agent :** tu n’as **pas le droit** de t’arrêter après Auth + Produits.  
> Chaque case `[ ]` doit passer à `[x]` avec le fichier réellement créé.  
> Si une case n’est pas faite, le module n’est **pas terminé**.
>
> **Pour le user :** coche au fur et à mesure. Si l’agent dit « c’est fini » alors qu’il reste des `[ ]`, refuse et envoie-lui **ce fichier**.

**Total à livrer**
- Admin : **18 pages menu + login + layout** (19 écrans)
- Backend : **~241 classes Java** (liste exhaustive plus bas)
- Une page admin = backend **complet** du module (entity + dto + repo + service + impl + controller)

---

## Comment suivre les modifications

| Qui | Quoi |
|-----|------|
| User | Ouvre ce fichier, cherche le module, vérifie que les fichiers existent |
| Agent | Après chaque module : liste les fichiers créés + `mvn compile` / `npm run build` |
| Agent | Interdit de passer au module N+1 tant que N n’est pas 100 % coché |

**Prompt à coller à l’agent :**

```
Lis AGENT_CHECKLIST_COMPLET.md.
Développe TOUS les modules dans l’ordre M0 → M18.
Ne saute aucune page admin ni aucune classe listée.
Coche chaque case dans ta réponse (fichier créé).
Ne déclare pas « terminé » tant qu’il reste un [ ].
```

---

## M0 — Socle (obligatoire avant tout)

### Backend infra
- [ ] `EcommerceApplication.java`
- [ ] `pom.xml` (web, jpa, validation, lombok, postgres)
- [ ] `application.properties` (port 8081, ddl-auto=update)
- [ ] `exception/ResourceNotFoundException.java`
- [ ] `exception/GlobalExceptionHandler.java`
- [ ] `config/CorsConfig.java`
- [ ] `config/WebConfig.java` (uploads `/uploads/**`)
- [ ] `config/AsyncConfig.java`
- [ ] `controller/HealthController.java` → `GET /api/health`
- [ ] `service/LocalFileStorageService.java`
- [ ] `service/ImageConversionService.java`
- [ ] `service/RemoteImageFetchService.java`
- [ ] `service/MediaThumbPaths.java`
- [ ] `controller/MediaController.java` → `GET /api/media/thumb`

### Admin socle
- [ ] `src/admin/types/index.ts`
- [ ] `src/admin/lib/api.ts` + headers `X-Admin-Email` / `X-Admin-Name`
- [ ] `src/admin/lib/queryKeys.ts`
- [ ] `src/admin/lib/queryClient.ts`
- [ ] `src/admin/lib/listUtils.ts`
- [ ] `src/admin/hooks/useAdminQueries.ts`
- [ ] `src/admin/context/AdminAuthContext.tsx`
- [ ] `src/admin/lazyPages.ts`
- [ ] `src/admin/components/AdminLayout.tsx` (sidebar **18 liens**)
- [ ] `src/admin/components/ListToolbar.tsx`
- [ ] `src/admin/components/StatCard.tsx`
- [ ] `src/admin/components/QueryStatusBar.tsx` (+ PageSkeleton)
- [ ] `src/admin/components/BrandLogo.tsx`
- [ ] `src/admin/components/ProtectedRoute.tsx`
- [ ] `src/styles.css` → `.admin-shell` `.card` `.btn-primary` `.input` `.label`
- [ ] Routes : `src/routes/admin/route.tsx`, `index.tsx`, `login.tsx`, `_app/route.tsx`
- [ ] `src/lib/apiBase.ts` (DEV `localhost:8081/api`)

---

## M1 — Login admin

**Page :** `/admin/login`

### Front
- [ ] `src/admin/pages/LoginPage.tsx`
- [ ] Route `src/routes/admin/login.tsx`

### Backend
- [ ] Entity `User.java`
- [ ] Enum `Role.java` (ADMIN, CLIENT, VENDEUR)
- [ ] DTO `LoginRequest.java`, `LoginResponse.java`, `RegisterRequest.java`, `ClientAuthResponse.java`, `UserDto.java`
- [ ] Repo `UserRepository.java`
- [ ] `AuthService.java` + `AuthServiceImpl.java`
- [ ] `UserService.java` + `UserServiceImpl.java`
- [ ] `AuthController.java` → `/api/auth/login` `/register` `/client/login`
- [ ] `UserController.java` → `/api/users` CRUD
- [ ] `config/DataInitializer.java` (seed admin)

---

## M2 — Revenus (page d’accueil admin)

**Page menu :** `/admin/revenue` — **Revenus**  
Redirect `/admin` → `/admin/revenue`

### Front
- [ ] `src/admin/pages/RevenuePage.tsx`
- [ ] Route `src/routes/admin/_app/revenue.tsx`
- [ ] Lien menu AdminLayout
- [ ] (option) `DashboardPage.tsx` existe dans le template mais **sans route** — ne pas compter comme page menu

### Backend
- [ ] Entity `DashboardStats.java`, `DateRange.java`
- [ ] DTO `DashboardStatsDto.java`
- [ ] Repo `DashboardStatsRepository.java`
- [ ] `DashboardStatsService.java` + `Impl`
- [ ] `DashboardStatsController.java` → `/api/dashboard-stats` + `POST /generer-rapport`
- [ ] `OrderController` stats canaux (voir M4)

---

## M3 — Analytics

**Page :** `/admin/analytics`

### Front
- [ ] `src/admin/pages/AnalyticsPage.tsx`
- [ ] Route `_app/analytics.tsx`

### Backend
- [ ] Enums `SalesGranularity.java`, `TopProductCriteria.java`
- [ ] DTO `DashboardSummaryDto.java`, `TimeSeriesPointDto.java`, `ProductStatsDto.java`, `AnalyticsPeriod.java`
- [ ] Entity `ProductEvent.java` + enum `ProductEventType.java`
- [ ] Repo `ProductEventRepository.java`
- [ ] `DashboardService.java` + `DashboardServiceImpl.java`
- [ ] `ProductAnalyticsService.java` + `Impl`
- [ ] DTO `ProductAnalyticsDto.java`, `ProductBestSellerDto.java`
- [ ] `AdminDashboardController.java` :
  - [ ] `GET /api/admin/dashboard/summary`
  - [ ] `GET /api/admin/dashboard/sales-over-time`
  - [ ] `GET /api/admin/dashboard/top-products`
  - [ ] `GET /api/admin/dashboard/product-stats`
- [ ] `ProductTrackingController.java` → `/api/products/{id}/track/view|click`
- [ ] DTO `ProductTrackRequest.java`

---

## M4 — Journal d’audit

**Page :** `/admin/audit-logs`

### Front
- [ ] `src/admin/pages/AuditLogsPage.tsx`
- [ ] Route `_app/audit-logs.tsx`

### Backend
- [ ] Entity `AdminAuditLog.java`
- [ ] Enum `AdminActionType.java`
- [ ] DTO `AdminAuditLogDto.java`, `AdminAuditStatsDto.java`, `DuplicateRefAlertDto.java`, `ProductActivityDto.java`
- [ ] Repo `AdminAuditLogRepository.java`
- [ ] `AdminAuditService.java` + `Impl`
- [ ] `audit/AdminActor.java`, `AdminAuditContext.java`, `AdminAuditFilter.java`
- [ ] `AdminAuditLogController.java` → `GET /api/admin/audit-logs` + `/stats`

---

## M5 — Commandes

**Page :** `/admin/orders`

### Front
- [ ] `src/admin/pages/OrdersPage.tsx`
- [ ] `src/admin/lib/orderListFilters.ts`
- [ ] `src/admin/lib/invoice.ts`
- [ ] `src/admin/components/InvoiceModal.tsx`
- [ ] Route `_app/orders.tsx`

### Backend
- [ ] Entity `Order.java`, `OrderItem.java`
- [ ] Enums `OrderStatut.java`, `OrderCanal.java`
- [ ] DTO `OrderDto.java`, `OrderItemDto.java`, `OrderChannelStatsDto.java`
- [ ] DTO `FacebookOrderCreateDto.java`, `InstagramOrderCreateDto.java`, `WhatsAppOrderCreateDto.java`
- [ ] Repo `OrderRepository.java`, `OrderItemRepository.java`
- [ ] `OrderService.java` + `Impl`
- [ ] `OrderItemService.java` + `Impl`
- [ ] `OrderController.java` → CRUD + `POST /facebook|/instagram|/whatsapp` + `GET /stats/channels`
- [ ] `OrderItemController.java`
- [ ] Event `OrderCreatedEvent.java`

---

## M6 — Suivi livraisons (Colissimo)

**Page :** `/admin/tracking`

### Front
- [ ] `src/admin/pages/ShipmentTrackingPage.tsx`
- [ ] `src/admin/components/OrderTrackingDetail.tsx`
- [ ] Route `_app/tracking.tsx`

### Backend (package `colissimo/`)
- [ ] `ColissimoProperties.java`
- [ ] `ColissimoApiException.java`
- [ ] `ColissimoSoapClient.java`
- [ ] `ColissimoShipmentService.java`
- [ ] `ColissimoSyncService.java`
- [ ] `ColissimoSyncScheduler.java`
- [ ] `ColissimoTrackingService.java`
- [ ] `ColissimoParcelImportService.java`
- [ ] `ColissimoImportResult.java`
- [ ] DTOs : `ColissimoAddParcelRequest`, `ColissimoApiResponse`, `ColissimoListContent`, `ColissimoParcel`, `ColissimoSyncResultDto`, `ColissimoSyncStatusDto`, `ColissimoTrackingDto`, `ColissimoTrackingStepDto`, `ColissimoTrackingSummaryDto`
- [ ] `ColissimoController.java` → `/api/colissimo/status|sync|tracking|orders/{id}/tracking|push|invoice`
- [ ] `config/OrderSchemaPatcher.java` (colonnes colis)

---

## M7 — Notifications

**Page :** `/admin/notifications`

### Front
- [ ] `src/admin/pages/NotificationsPage.tsx`
- [ ] `src/admin/components/OrderNotificationsBell.tsx`
- [ ] `src/admin/lib/notificationSound.ts`
- [ ] Route `_app/notifications.tsx`

### Backend
- [ ] Entity `AdminNotification.java`
- [ ] DTO `AdminNotificationDto.java`
- [ ] Repo (si dédié) / service `AdminNotificationService.java`
- [ ] `AdminNotificationController.java` → `/api/notifications` + unread + mark-read
- [ ] `config/WebSocketConfig.java`
- [ ] `websocket/OrderNotificationWebSocketHandler.java`

---

## M8 — Commandes Facebook / Instagram / WhatsApp

**3 pages menu distinctes** — ne pas fusionner.

### Front
- [ ] `FacebookOrdersPage.tsx` + route `_app/facebook-orders.tsx` + menu
- [ ] `InstagramOrdersPage.tsx` + route `_app/instagram-orders.tsx` + menu
- [ ] `WhatsAppOrdersPage.tsx` + route `_app/whatsapp-orders.tsx` + menu

### Backend
Réutilise M5 (`POST /api/orders/facebook|instagram|whatsapp`).  
- [ ] Les 3 endpoints existent et sont testés

---

## M9 — Clients CRM

**Page :** `/admin/clients`

### Front
- [ ] `src/admin/pages/ClientsPage.tsx`
- [ ] Route `_app/clients.tsx`

### Backend
- [ ] Entity `ClientProfile.java`
- [ ] DTO `ClientProfileDto.java`, `ClientCrmDto.java`
- [ ] Repo `ClientProfileRepository.java`
- [ ] `ClientCrmService.java` + `Impl`
- [ ] `AdminClientController.java` → `/api/admin/clients`

---

## M10 — Produits (cœur catalogue)

**Page :** `/admin/products`  
Fonctions : CRUD, upload images, grille/liste, flèche priorité, stats produit

### Front
- [ ] `src/admin/pages/ProductsPage.tsx`
- [ ] Route `_app/products.tsx`
- [ ] `src/admin/components/StockAlertsBanner.tsx`

### Backend
- [ ] Entity `Product.java`, `ProductImage.java`
- [ ] Enum `ProductStatut.java`
- [ ] DTO `ProductDto.java`, `ProductImageDto.java`, `StockAlertDto.java`, `RestockRequestDto.java`
- [ ] DTO likes : `ProductLikeDto.java`, `ProductLikeSummaryDto.java`
- [ ] Repo `ProductRepository.java`, `ProductImageRepository.java`, `ProductLikeRepository.java`
- [ ] `ProductService.java` + `Impl` (create/update/delete/**promote**)
- [ ] `ProductImageService.java` + `Impl`
- [ ] `ProductLikeService.java` + `Impl`
- [ ] `StockService.java` + `Impl`
- [ ] `ProductImageWebpMigrationService.java`
- [ ] `ProductController.java` (CRUD + analytics + **priority**)
- [ ] `ProductImageController.java` (GET/POST images, DELETE)
- [ ] `ProductLikeController.java`
- [ ] `AdminStockController.java` → `/api/admin/stock/alerts` + restock
- [ ] `AdminProductImageController.java` → migrate-webp
- [ ] Patchers : `ProductRefPatcher.java`, `ProductDisplayOrderPatcher.java`, `ProductPricingSchemaPatcher.java`, `ProductImageWebpMigrationRunner.java`

---

## M11 — Catégories

**Page :** `/admin/categories`

### Front
- [ ] `src/admin/pages/CategoriesPage.tsx`
- [ ] Route `_app/categories.tsx`

### Backend
- [ ] Entity `Category.java`
- [ ] DTO `CategoryDto.java`, `CategoryShowcaseDto.java`
- [ ] Repo `CategoryRepository.java`
- [ ] `CategoryService.java` + `Impl`
- [ ] `CategoryController.java` → CRUD + `GET /showcase`

---

## M12 — Tarifs & cadres

**Page :** `/admin/pricing`

### Front
- [ ] `src/admin/pages/PricingPage.tsx`
- [ ] Route `_app/pricing.tsx`

### Backend
- [ ] Entity `TableauDimension.java`, `Cadre.java`, `CadreCouleur.java`, `DimensionCadrePrix.java`
- [ ] DTO `TableauDimensionDto.java`, `CadreDto.java`, `CadreCouleurDto.java`, `DimensionCadrePrixDto.java`, `CatalogPricingDto.java`
- [ ] Repo `TableauDimensionRepository.java`, `CadreRepository.java` (si présent), `DimensionCadrePrixRepository.java`
- [ ] `CatalogPricingService.java` + `Impl`
- [ ] `CatalogPricingController.java` → `/api/catalog/pricing|dimensions|cadres|couleurs|tarifs`
- [ ] `config/CatalogPricingSeedRunner.java`

---

## M13 — Avis & commentaires (modération)

**Page :** `/admin/moderation`

### Front
- [ ] `src/admin/pages/ModerationPage.tsx`
- [ ] Route `_app/moderation.tsx`

### Backend
- [ ] Entity `Review.java`, `ProductComment.java`
- [ ] Enums `ReviewStatut.java`, `CommentStatut.java`
- [ ] DTO `ReviewDto.java`, `ProductCommentDto.java`
- [ ] Repo `ReviewRepository.java`, `ProductCommentRepository.java`
- [ ] `ReviewService.java` + `Impl`
- [ ] `ProductCommentService.java` + `Impl`
- [ ] `ReviewController.java` (dont `PATCH /{id}/approuver`)
- [ ] `ProductCommentController.java`

---

## M14 — Fidélité

**Page :** `/admin/loyalty`

### Front
- [ ] `src/admin/pages/LoyaltyPage.tsx`
- [ ] Route `_app/loyalty.tsx`

### Backend
- [ ] Entity `LoyaltyProgram.java`, `LoyaltyReward.java`
- [ ] Enum `LoyaltyRewardType.java`
- [ ] DTO `LoyaltyProgramDto.java`, `LoyaltyRewardDto.java`, `LoyaltyStatsDto.java`
- [ ] Repo `LoyaltyProgramRepository.java`, `LoyaltyRewardRepository.java`
- [ ] `LoyaltyService.java` + `Impl`
- [ ] `LoyaltyController.java` → `/api/loyalty/programs|stats|clients|rewards`

---

## M15 — Actualités

**Page :** `/admin/news`

### Front
- [ ] `src/admin/pages/NewsPage.tsx`
- [ ] Route `_app/news.tsx`

### Backend
- [ ] Entity `News.java`
- [ ] Enum `NewsStatut.java`
- [ ] DTO `NewsDto.java`
- [ ] Repo `NewsRepository.java`
- [ ] `NewsService.java` + `Impl`
- [ ] `NewsController.java` (CRUD + publish + upload image)

---

## M16 — Témoignages / avis clients vitrine

**Page :** `/admin/testimonials`

### Front
- [ ] `src/admin/pages/TestimonialsPage.tsx`
- [ ] Route `_app/testimonials.tsx`

### Backend
- [ ] Entity `Testimonial.java`
- [ ] Enum `TestimonialPlateforme.java`
- [ ] DTO `TestimonialDto.java`
- [ ] Repo `TestimonialRepository.java`
- [ ] `TestimonialService.java` + `Impl`
- [ ] `TestimonialController.java` (CRUD + image)
- [ ] `config/TestimonialSeedRunner.java`

---

## M17 — Boutique / settings

**Page :** `/admin/settings`

### Front
- [ ] `src/admin/pages/SettingsPage.tsx`
- [ ] Route `_app/settings.tsx`

### Backend
- [ ] Entity `SiteSettings.java`
- [ ] DTO `SiteSettingsDto.java`, `SupportFaqItem.java`
- [ ] Repo `SiteSettingsRepository.java`
- [ ] `SiteSettingsService.java` + `Impl`
- [ ] `SiteController.java` → `GET /api/site/settings` + admin GET/PUT
- [ ] `config/SiteSettingsSchemaPatcher.java`

---

## M18 — Storefront + extras backend (pas une page admin, mais classes du template)

L’agent **doit aussi** créer ces classes (utilisées par le site public / le dashboard) :

### Contact
- [ ] Entity `ContactMessage.java` + enum `ContactMessageStatut.java`
- [ ] DTO `ContactMessageDto.java`
- [ ] Repo `ContactMessageRepository.java`
- [ ] `ContactMessageService.java` + `Impl`
- [ ] `ContactMessageController.java`

### Storefront checkout
- [ ] DTO `VisitorRegisterRequest.java`, `VisitorResponse.java`, `StorefrontCheckoutRequest.java`, `StorefrontCheckoutResponse.java`
- [ ] `StorefrontService.java` + `Impl`
- [ ] `StorefrontController.java` → `/api/storefront/visitor` + `/checkout`

### AI Advisor (CRUD template)
- [ ] Entity `AIAdvisor.java`
- [ ] DTO `AIAdvisorDto.java`
- [ ] `AIAdvisorService.java` + `Impl`
- [ ] `AIAdvisorController.java` → `/api/ai-advisors`

---

## Menu admin — 18 liens (contrôle visuel)

L’agent doit avoir **exactement** ces routes dans `AdminLayout` :

| # | URL | Label | Page |
|---|-----|--------|------|
| 1 | `/admin/revenue` | Revenus | RevenuePage |
| 2 | `/admin/analytics` | Analytics | AnalyticsPage |
| 3 | `/admin/audit-logs` | Journal audit | AuditLogsPage |
| 4 | `/admin/orders` | Commandes | OrdersPage |
| 5 | `/admin/tracking` | Suivi livraisons | ShipmentTrackingPage |
| 6 | `/admin/notifications` | Notifications | NotificationsPage |
| 7 | `/admin/facebook-orders` | Facebook | FacebookOrdersPage |
| 8 | `/admin/instagram-orders` | Instagram | InstagramOrdersPage |
| 9 | `/admin/whatsapp-orders` | WhatsApp | WhatsAppOrdersPage |
| 10 | `/admin/clients` | Clients | ClientsPage |
| 11 | `/admin/products` | Produits | ProductsPage |
| 12 | `/admin/categories` | Catégories | CategoriesPage |
| 13 | `/admin/pricing` | Tarifs & cadres | PricingPage |
| 14 | `/admin/moderation` | Avis & Commentaires | ModerationPage |
| 15 | `/admin/loyalty` | Fidélité | LoyaltyPage |
| 16 | `/admin/news` | Actualités | NewsPage |
| 17 | `/admin/testimonials` | Avis clients | TestimonialsPage |
| 18 | `/admin/settings` | Boutique | SettingsPage |
| — | `/admin/login` | Login | LoginPage |

**Test de fin :** cliquer les 18 liens + login. Aucune page 404 / « coming soon ».

---

## Inventaire backend (pour contrôle fichier par fichier)

### Entities (26)
User, Category, Product, ProductImage, ProductLike, ProductComment, ProductEvent, Order, OrderItem, Review, News, Testimonial, ContactMessage, DashboardStats, DateRange, SiteSettings, ClientProfile, LoyaltyProgram, LoyaltyReward, Cadre, CadreCouleur, TableauDimension, DimensionCadrePrix, AdminAuditLog, AdminNotification, AIAdvisor

### Enums (14)
Role, ProductStatut, OrderStatut, OrderCanal, ReviewStatut, CommentStatut, NewsStatut, ContactMessageStatut, LoyaltyRewardType, TestimonialPlateforme, ProductEventType, AdminActionType, SalesGranularity, TopProductCriteria

### Controllers (29)
Health, Auth, User, Category, Product, ProductImage, ProductLike, ProductComment, ProductTracking, Order, OrderItem, Review, News, Testimonial, ContactMessage, CatalogPricing, Site, Storefront, Loyalty, DashboardStats, AdminDashboard, AdminAuditLog, AdminClient, AdminStock, AdminProductImage, AdminNotification, Colissimo, Media, AIAdvisor

### Services impl (24)
Auth, User, Category, Product, ProductImage, ProductLike, ProductComment, ProductAnalytics, Order, OrderItem, Review, News, Testimonial, Contact, CatalogPricing, SiteSettings, Storefront, Loyalty, Dashboard, DashboardStats, AdminAudit, ClientCrm, Stock, AIAdvisor

(+ classes service non-impl : LocalFileStorage, ImageConversion, RemoteImageFetch, MediaThumbPaths, ProductImageWebpMigration, AdminNotification)

---

## Règle anti-saut

Si l’agent livre seulement Login + Products + Categories :

> **Incomplet.** Il manque 15 pages admin (M2–M9, M12–M17) et tout Colissimo / Loyalty / News / Testimonials / Audit / Analytics.

Renvoyer : `Termine M2 à M18 selon AGENT_CHECKLIST_COMPLET.md, une module à la fois, fichiers listés cochés.`

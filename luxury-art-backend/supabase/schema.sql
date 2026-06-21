-- =============================================================================
-- LUXURY ART — Création de TOUTES les tables PostgreSQL (Supabase)
-- Modèles Java : User, Category, Product, Order, OrderItem, Review,
--                ContactMessage, DashboardStats, AIAdvisor, ProductComment, News
-- DateRange → colonnes embarquées dans dashboard_stats
-- =============================================================================
-- Supabase : SQL Editor → New query → coller ce script → Run
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SUPPRESSION (décommenter pour tout recréer à zéro)
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS news             CASCADE;
-- DROP TABLE IF EXISTS product_comments CASCADE;
-- DROP TABLE IF EXISTS reviews          CASCADE;
-- DROP TABLE IF EXISTS order_items      CASCADE;
-- DROP TABLE IF EXISTS orders           CASCADE;
-- DROP TABLE IF EXISTS products         CASCADE;
-- DROP TABLE IF EXISTS categories       CASCADE;
-- DROP TABLE IF EXISTS contact_messages CASCADE;
-- DROP TABLE IF EXISTS dashboard_stats  CASCADE;
-- DROP TABLE IF EXISTS ai_advisors      CASCADE;
-- DROP TABLE IF EXISTS users            CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS  (entité User)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL       PRIMARY KEY,
    nom             VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'CLIENT'
                    CONSTRAINT chk_users_role
                    CHECK (role IN ('ADMIN', 'CLIENT', 'VENDEUR')),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users IS 'Utilisateurs — register/login, rôles admin/client/vendeur';
COMMENT ON COLUMN users.role IS 'Enum Role: ADMIN | CLIENT | VENDEUR';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CATEGORIES  (entité Category)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id              BIGSERIAL       PRIMARY KEY,
    nom             VARCHAR(255)    NOT NULL,
    description     VARCHAR(1000)
);

COMMENT ON TABLE categories IS 'Catégories de produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCTS  (entité Product)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL       PRIMARY KEY,
    nom             VARCHAR(255)    NOT NULL,
    description     VARCHAR(2000),
    prix            NUMERIC(10, 2)  NOT NULL
                    CONSTRAINT chk_products_prix CHECK (prix >= 0),
    stock           INTEGER         NOT NULL
                    CONSTRAINT chk_products_stock CHECK (stock >= 0),
    image_url       VARCHAR(500),
    category_id     BIGINT
                    REFERENCES categories(id) ON DELETE SET NULL,
    statut          VARCHAR(20)     NOT NULL DEFAULT 'DISPONIBLE'
                    CONSTRAINT chk_products_statut
                    CHECK (statut IN ('DISPONIBLE', 'RUPTURE_STOCK', 'ARCHIVE'))
);

COMMENT ON TABLE  products IS 'Catalogue produits';
COMMENT ON COLUMN products.statut IS 'Enum ProductStatut';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ORDERS  (entité Order)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
    date_commande       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    statut              VARCHAR(20)     NOT NULL DEFAULT 'EN_ATTENTE'
                        CONSTRAINT chk_orders_statut
                        CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE')),
    total               NUMERIC(12, 2)
                        CONSTRAINT chk_orders_total CHECK (total IS NULL OR total >= 0),
    adresse_livraison   VARCHAR(500)    NOT NULL
);

COMMENT ON TABLE orders IS 'Commandes clients — calcTotal(), updateStatut()';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ORDER_ITEMS  (entité OrderItem)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              BIGSERIAL       PRIMARY KEY,
    order_id        BIGINT          NOT NULL
                    REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE RESTRICT,
    quantite        INTEGER         NOT NULL
                    CONSTRAINT chk_order_items_quantite CHECK (quantite > 0),
    prix_unitaire   NUMERIC(10, 2)  NOT NULL
                    CONSTRAINT chk_order_items_prix CHECK (prix_unitaire >= 0),
    CONSTRAINT uq_order_items_order_product UNIQUE (order_id, product_id)
);

COMMENT ON TABLE order_items IS 'Lignes de commande — produit + quantité + prix unitaire';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REVIEWS  (entité Review)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE CASCADE,
    note            INTEGER         NOT NULL
                    CONSTRAINT chk_reviews_note CHECK (note BETWEEN 1 AND 5),
    commentaire     VARCHAR(2000),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    statut          VARCHAR(20)     NOT NULL DEFAULT 'EN_ATTENTE'
                    CONSTRAINT chk_reviews_statut
                    CHECK (statut IN ('EN_ATTENTE', 'APPROUVE', 'REJETE'))
);

COMMENT ON TABLE reviews IS 'Avis produits avec note 1-5 — approuver()';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CONTACT_MESSAGES  (entité ContactMessage)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id              BIGSERIAL       PRIMARY KEY,
    nom             VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    sujet           VARCHAR(255)    NOT NULL,
    message         VARCHAR(5000)   NOT NULL,
    statut          VARCHAR(20)     NOT NULL DEFAULT 'NON_LU'
                    CONSTRAINT chk_contact_messages_statut
                    CHECK (statut IN ('NON_LU', 'LU', 'REPONDU'))
);

COMMENT ON TABLE contact_messages IS 'Formulaire contact — send(), markRead()';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. DASHBOARD_STATS  (entité DashboardStats + DateRange embarqué)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id                  BIGSERIAL       PRIMARY KEY,
    periode_date_debut  DATE,           -- DateRange.dateDebut
    periode_date_fin    DATE,           -- DateRange.dateFin
    total_commandes     BIGINT,
    chiffre_affaires    NUMERIC(14, 2),
    profit_brut         NUMERIC(14, 2),
    profit_net          NUMERIC(14, 2),
    top_produits        VARCHAR(5000)   -- JSON ou liste sérialisée
);

COMMENT ON TABLE dashboard_stats IS 'Statistiques dashboard — genererRapport(), filtrerParPeriode()';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. AI_ADVISORS  (entité AIAdvisor)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_advisors (
    id              BIGSERIAL       PRIMARY KEY,
    model_name      VARCHAR(255)    NOT NULL,
    context         VARCHAR(5000),
    historique      VARCHAR(10000)
);

COMMENT ON TABLE ai_advisors IS 'Conseiller IA — analyserStock(), conseilPrix(), detectionFraude()';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PRODUCT_COMMENTS  (entité ProductComment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_comments (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE CASCADE,
    contenu         VARCHAR(2000)   NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    statut          VARCHAR(20)     NOT NULL DEFAULT 'APPROUVE'
                    CONSTRAINT chk_product_comments_statut
                    CHECK (statut IN ('EN_ATTENTE', 'APPROUVE', 'REJETE'))
);

COMMENT ON TABLE product_comments IS 'Commentaires texte laissés par les clients sur chaque produit';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NEWS  (entité News)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
    id              BIGSERIAL       PRIMARY KEY,
    titre           VARCHAR(255)    NOT NULL,
    resume          VARCHAR(500),
    contenu         VARCHAR(10000)  NOT NULL,
    image_url       VARCHAR(500),
    auteur_id       BIGINT          NOT NULL
                    REFERENCES users(id) ON DELETE RESTRICT,
    statut          VARCHAR(20)     NOT NULL DEFAULT 'BROUILLON'
                    CONSTRAINT chk_news_statut
                    CHECK (statut IN ('BROUILLON', 'PUBLIE', 'ARCHIVE')),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

COMMENT ON TABLE news IS 'Articles actualités créés par admin — séparés du catalogue produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX (performances)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category_id         ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_statut              ON products(statut);

CREATE INDEX IF NOT EXISTS idx_orders_user_id               ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_statut                ON orders(statut);
CREATE INDEX IF NOT EXISTS idx_orders_date_commande         ON orders(date_commande DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id         ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id       ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id           ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id              ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_statut               ON reviews(statut);

CREATE INDEX IF NOT EXISTS idx_contact_messages_statut      ON contact_messages(statut);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_id  ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id     ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at  ON product_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_auteur_id               ON news(auteur_id);
CREATE INDEX IF NOT EXISTS idx_news_statut                  ON news(statut);
CREATE INDEX IF NOT EXISTS idx_news_published_at            ON news(published_at DESC);

-- Catégories par défaut
INSERT INTO categories (nom, description)
SELECT 'Cuisine', 'Art et décoration pour la cuisine'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(nom) = 'cuisine');

INSERT INTO categories (nom, description)
SELECT 'Enfant', 'Œuvres et objets pour chambre enfant'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(nom) = 'enfant');

COMMIT;

-- =============================================================================
-- RÉCAPITULATIF — 11 tables créées
-- =============================================================================
-- users            → User
-- categories       → Category
-- products         → Product
-- orders           → Order
-- order_items      → OrderItem
-- reviews          → Review
-- contact_messages → ContactMessage
-- dashboard_stats  → DashboardStats (+ DateRange)
-- ai_advisors      → AIAdvisor
-- product_comments → ProductComment
-- news             → News
-- =============================================================================

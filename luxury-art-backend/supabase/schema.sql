-- =============================================================================
-- LUXURY ART — Création de TOUTES les tables PostgreSQL (Supabase)
-- Aligné sur les entités JPA actuelles du backend
-- =============================================================================
-- Supabase : SQL Editor → New query → coller ce script → Run
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SUPPRESSION (décommenter pour tout recréer à zéro)
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS product_events     CASCADE;
-- DROP TABLE IF EXISTS loyalty_rewards    CASCADE;
-- DROP TABLE IF EXISTS client_profiles    CASCADE;
-- DROP TABLE IF EXISTS loyalty_programs   CASCADE;
-- DROP TABLE IF EXISTS product_likes      CASCADE;
-- DROP TABLE IF EXISTS product_images     CASCADE;
-- DROP TABLE IF EXISTS site_settings      CASCADE;
-- DROP TABLE IF EXISTS news               CASCADE;
-- DROP TABLE IF EXISTS product_comments   CASCADE;
-- DROP TABLE IF EXISTS reviews            CASCADE;
-- DROP TABLE IF EXISTS order_items        CASCADE;
-- DROP TABLE IF EXISTS orders             CASCADE;
-- DROP TABLE IF EXISTS products           CASCADE;
-- DROP TABLE IF EXISTS categories         CASCADE;
-- DROP TABLE IF EXISTS contact_messages   CASCADE;
-- DROP TABLE IF EXISTS dashboard_stats    CASCADE;
-- DROP TABLE IF EXISTS ai_advisors        CASCADE;
-- DROP TABLE IF EXISTS users              CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS
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

COMMENT ON TABLE users IS 'Utilisateurs — register/login, rôles ADMIN/CLIENT/VENDEUR';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id              BIGSERIAL       PRIMARY KEY,
    nom             VARCHAR(255)    NOT NULL,
    description     VARCHAR(1000)
);

COMMENT ON TABLE categories IS 'Catégories de produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCTS
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

COMMENT ON TABLE products IS 'Catalogue produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PRODUCT_IMAGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE CASCADE,
    url             VARCHAR(1000)   NOT NULL,
    storage_path    VARCHAR(500)    NOT NULL,
    ordre           INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_images IS 'Images multiples par produit (Supabase Storage)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                      BIGSERIAL       PRIMARY KEY,
    user_id                 BIGINT          NOT NULL
                            REFERENCES users(id) ON DELETE CASCADE,
    date_commande           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    statut                  VARCHAR(20)     NOT NULL DEFAULT 'EN_ATTENTE'
                            CONSTRAINT chk_orders_statut
                            CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE')),
    total                   NUMERIC(12, 2)
                            CONSTRAINT chk_orders_total CHECK (total IS NULL OR total >= 0),
    adresse_livraison       VARCHAR(500)    NOT NULL,
    canal                   VARCHAR(20)     NOT NULL DEFAULT 'SITE_WEB'
                            CONSTRAINT chk_orders_canal
                            CHECK (canal IN ('SITE_WEB', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP')),
    client_nom              VARCHAR(255),
    client_telephone        VARCHAR(50),
    reference_facebook      VARCHAR(255),
    reference_instagram     VARCHAR(255),
    reference_whatsapp      VARCHAR(255),
    numero_colis            VARCHAR(64),
    stock_deduit            BOOLEAN         NOT NULL DEFAULT FALSE,
    fidelite_comptabilisee  BOOLEAN         NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE orders IS 'Commandes (site web + Facebook + Instagram)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ORDER_ITEMS
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
                    CONSTRAINT chk_order_items_prix CHECK (prix_unitaire >= 0)
);

COMMENT ON TABLE order_items IS 'Lignes de commande';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REVIEWS
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

COMMENT ON TABLE reviews IS 'Avis produits (note 1-5)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PRODUCT_COMMENTS
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

COMMENT ON TABLE product_comments IS 'Commentaires clients sur les produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PRODUCT_LIKES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_likes (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_likes_user_product UNIQUE (user_id, product_id)
);

COMMENT ON TABLE product_likes IS 'J''aime / favoris produits';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PRODUCT_EVENTS (analytics : vues / clics / add-to-cart)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_events (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL
                    REFERENCES products(id) ON DELETE CASCADE,
    event_type      VARCHAR(32)     NOT NULL
                    CONSTRAINT chk_product_events_type
                    CHECK (event_type IN ('VIEW', 'CLICK', 'ADD_TO_CART')),
    session_id      VARCHAR(128)    NOT NULL,
    user_id         BIGINT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_events IS 'Tracking analytics e-commerce (vues, clics, panier)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. CONTACT_MESSAGES
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

COMMENT ON TABLE contact_messages IS 'Formulaire de contact';

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. DASHBOARD_STATS (+ DateRange embarqué)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id                  BIGSERIAL       PRIMARY KEY,
    date_debut          DATE,           -- DateRange.dateDebut
    date_fin            DATE,           -- DateRange.dateFin
    total_commandes     BIGINT,
    chiffre_affaires    NUMERIC(14, 2),
    profit_brut         NUMERIC(14, 2),
    profit_net          NUMERIC(14, 2),
    top_produits        VARCHAR(5000)
);

COMMENT ON TABLE dashboard_stats IS 'Rapports dashboard sauvegardés';

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. AI_ADVISORS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_advisors (
    id              BIGSERIAL       PRIMARY KEY,
    model_name      VARCHAR(255)    NOT NULL,
    context         VARCHAR(5000),
    historique      VARCHAR(10000)
);

COMMENT ON TABLE ai_advisors IS 'Conseiller IA';

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. NEWS
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

COMMENT ON TABLE news IS 'Actualités boutique';

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. SITE_SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
    id                  BIGSERIAL       PRIMARY KEY,
    terms_version       INTEGER         NOT NULL DEFAULT 1,
    terms_content       TEXT            NOT NULL,
    whatsapp_number     VARCHAR(255)    NOT NULL DEFAULT '212600000000',
    boutique_nom        VARCHAR(255)    DEFAULT 'Luxury Art',
    slogan              VARCHAR(255)    DEFAULT 'Art & Décoration',
    email_contact       VARCHAR(255),
    telephone_contact   VARCHAR(100),
    adresse             VARCHAR(500),
    ville               VARCHAR(100),
    pays                VARCHAR(100),
    support_faq_json    TEXT            NOT NULL,
    updated_at          TIMESTAMPTZ
);

COMMENT ON TABLE site_settings IS 'Paramètres publics du site (CGU, WhatsApp, FAQ)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. LOYALTY_PROGRAMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id                  BIGSERIAL       PRIMARY KEY,
    nom                 VARCHAR(255)    NOT NULL,
    description         VARCHAR(1000),
    commandes_requises  INTEGER         NOT NULL
                        CONSTRAINT chk_loyalty_commandes CHECK (commandes_requises > 0),
    type_recompense     VARCHAR(30)     NOT NULL
                        CONSTRAINT chk_loyalty_type
                        CHECK (type_recompense IN ('FREE_TABLEAU', 'DISCOUNT_DH')),
    valeur_recompense   NUMERIC(12, 2)  NOT NULL,
    actif               BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ
);

COMMENT ON TABLE loyalty_programs IS 'Programmes de fidélité';

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. CLIENT_PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_profiles (
    id                          BIGSERIAL       PRIMARY KEY,
    user_id                     BIGINT          NOT NULL UNIQUE
                                REFERENCES users(id) ON DELETE CASCADE,
    telephone                   VARCHAR(50),
    commandes_cycle             INTEGER         NOT NULL DEFAULT 0,
    total_commandes_livrees     INTEGER         NOT NULL DEFAULT 0,
    total_recompenses           INTEGER         NOT NULL DEFAULT 0,
    tableaux_gratuits           INTEGER         NOT NULL DEFAULT 0,
    reduction_disponible        NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    terms_accepted_at           TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE client_profiles IS 'Profils clients (fidélité + téléphone)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. LOYALTY_REWARDS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id                  BIGSERIAL       PRIMARY KEY,
    client_profile_id   BIGINT          NOT NULL
                        REFERENCES client_profiles(id) ON DELETE CASCADE,
    programme_nom       VARCHAR(255),
    type_recompense     VARCHAR(30)     NOT NULL
                        CONSTRAINT chk_loyalty_rewards_type
                        CHECK (type_recompense IN ('FREE_TABLEAU', 'DISCOUNT_DH')),
    valeur_recompense   NUMERIC(12, 2)  NOT NULL,
    message             VARCHAR(500),
    earned_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE loyalty_rewards IS 'Récompenses fidélité gagnées';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEX
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category_id         ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_statut              ON products(statut);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id    ON product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id               ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_statut                ON orders(statut);
CREATE INDEX IF NOT EXISTS idx_orders_canal                 ON orders(canal);
CREATE INDEX IF NOT EXISTS idx_orders_date_commande         ON orders(date_commande DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id         ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id       ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id           ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id              ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_statut               ON reviews(statut);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_id  ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id     ON product_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_product_likes_product_id     ON product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id        ON product_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_product_events_product_type_created
    ON product_events(product_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_product_events_session       ON product_events(session_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_statut      ON contact_messages(statut);

CREATE INDEX IF NOT EXISTS idx_news_auteur_id               ON news(auteur_id);
CREATE INDEX IF NOT EXISTS idx_news_statut                  ON news(statut);
CREATE INDEX IF NOT EXISTS idx_news_published_at            ON news(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_actif       ON loyalty_programs(actif);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id      ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_client       ON loyalty_rewards(client_profile_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONNÉES INITIALES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO categories (nom, description)
SELECT 'Cuisine', 'Art et décoration pour la cuisine'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(nom) = 'cuisine');

INSERT INTO categories (nom, description)
SELECT 'Enfant', 'Œuvres et objets pour chambre enfant'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(nom) = 'enfant');

INSERT INTO site_settings (terms_version, terms_content, whatsapp_number, support_faq_json, updated_at)
SELECT 1,
       'Conditions générales d''utilisation Luxury Art — à personnaliser.',
       '212600000000',
       '[]',
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

COMMIT;

-- =============================================================================
-- RÉCAPITULATIF — 18 tables
-- =============================================================================
-- users              → User
-- categories         → Category
-- products           → Product
-- product_images     → ProductImage
-- orders             → Order
-- order_items        → OrderItem
-- reviews            → Review
-- product_comments   → ProductComment
-- product_likes      → ProductLike
-- product_events     → ProductEvent (analytics)
-- contact_messages   → ContactMessage
-- dashboard_stats    → DashboardStats
-- ai_advisors        → AIAdvisor
-- news               → News
-- site_settings      → SiteSettings
-- loyalty_programs   → LoyaltyProgram
-- client_profiles    → ClientProfile
-- loyalty_rewards    → LoyaltyReward
-- =============================================================================

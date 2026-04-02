# Olea — Cahier des Charges Back-Office SaaS (v2.0)

> Plateforme tunisienne de vente aux enchères d'huile d'olive  
> Ce document contient **toutes les spécifications** du projet web Back-Office SaaS.

---

## 1. Présentation du Projet

### 1.1 Concept
**Olea** est une plateforme SaaS de mise en relation entre vendeurs et acheteurs d'huile d'olive tunisienne via un système d'enchère en ligne. Le back-office permet l'administration complète de la plateforme : gestion des utilisateurs, enchères, finances, automatisation, et communication.

### 1.2 Public Cible
- **Vendeurs** : Producteurs d'huile d'olive tunisiens (coopératives, agriculteurs, entreprises)
- **Acheteurs** : Grossistes, distributeurs, restaurateurs, exportateurs
- **Administrateurs BO** : Équipe back-office Olea (SUPER_ADMIN, ADMIN, ANALYST, VIEWER, CUSTOM)

### 1.3 Zone Géographique
Tunisie — 24 gouvernorats couverts

---

## 2. Stack Technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework | Next.js (App Router + Turbopack) | 16 |
| Langage | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| UI Components | shadcn/ui (New York style) | — |
| Base de données | **Supabase PostgreSQL** | — |
| ORM | Prisma | 6 |
| State Management | Zustand | 5 |
| Server State | TanStack Query | 5 |
| Graphiques | **ECharts** + echarts-for-react | 6 / 3 |
| Cartes | Leaflet (SSR: false) + react-leaflet | 1.9 |
| PDF | jsPDF + jspdf-autotable | 4.2 / 5 |
| Authentification | Custom (bcryptjs, session cookies) | 3 |
| Password Hashing | bcryptjs | 3 |
| Formulaires | React Hook Form + Zod | 7 / 4 |
| Notifications | Sonner (toasts) | 2 |
| Chat | Polling (fetch setInterval 3s) | — |
| Icons | Lucide React | — |
| Animations | Framer Motion | 12 |
| Dates | date-fns (locale fr) | 4 |
| Markdown | react-markdown | 10 |
| Éditeur MDX | @mdxeditor/editor | 3 |

### 2.1 Architecture

```
┌──────────────────────────────────────────────────────┐
│  Navigateur (SPA)                                    │
│  page.tsx → AdminLayout → PageContent (via Zustand)  │
├──────────────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)                  │
│  /api/auth/*, /api/dashboard/*, /api/wallet/* ...    │
├──────────────────────────────────────────────────────┤
│  Prisma ORM (NO raw SQL — pgbouncer compatible)      │
├──────────────────────────────────────────────────────┤
│  Supabase PostgreSQL (Session Pooler port 5432)      │
└──────────────────────────────────────────────────────┘
```

- **SPA Pattern** : Application monopage, navigation via Zustand (`useNavigation` store)
- **Route unique** : Toutes les pages rendues depuis `/` via `src/app/page.tsx` → `AdminLayout`
- **API Routes** : Backend sous `/api/` (Next.js Route Handlers)
- **Pattern** : `Frontend → fetch(/api/...) → API Route → Prisma Client → Supabase PostgreSQL`
- **Session** : Cookie `session_token` (HttpOnly, Secure, SameSite=Lax, 7 jours)

### 2.2 Contraintes Supabase (pgbouncer)
- **AUCUNE requête SQL brute** (`$queryRaw`, `$executeRaw`) — incompatible avec le transaction pooler
- Toutes les requêtes utilisent exclusivement le Prisma ORM
- Regroupements/agrégations faits en JavaScript côté serveur

### 2.3 Base de Données
- **Hébergement** : Supabase PostgreSQL
- **Connection pooler** : Transaction pooler (port 6543) pour le runtime, Session pooler (port 5432) pour les migrations
- **Mot de passe** : Encodé en URL (`%2F%2F` pour `//`)
- **`datasourceUrl`** : Hardcodé dans `src/lib/db.ts` (Next.js ne charge pas `.env` correctement)

### 2.4 Theme
- Couleur principale : `#45A452` (vert olive)
- Couleur sombre : `#1F6E2B`
- Fond principal : `#f0f7f0` (vert clair)
- Fond sidebar : `#0d1a0e` (vert foncé)
- Viewport : `100dvh` (couverture totale)
- Design : Responsive mobile-first

---

## 3. Modèles de Données (29 modèles, 26 enums)

### 3.1 Enums (26)

| Enum | Valeurs |
|------|---------|
| `UserRole` | SELLER, BUYER, MIXED, ADMIN |
| `UserStatus` | ACTIVE, SUSPENDED, PENDING |
| `AuctionStatus` | DRAFT, ACTIVE, CLOSED, CANCELLED, EXPIRED |
| `BidStatus` | PENDING, WINNING, WON, LOST, WITHDRAWN |
| `TransactionStatus` | PENDING, COMPLETED, CANCELLED, DISPUTED |
| `ReportStatus` | PENDING, IN_REVIEW, RESOLVED, DISMISSED |
| `NotificationType` | NEW_BID, BID_OUTBID, AUCTION_WON, AUCTION_CLOSED, AUCTION_EXPIRED, TRANSACTION, PRICE_ALERT_TRIGGERED, SYSTEM |
| `AlertCondition` | ABOVE, BELOW |
| `BackOfficeRole` | SUPER_ADMIN, ADMIN, ANALYST, VIEWER, CUSTOM |
| `AccountStatus` | PENDING, ACTIVE, SUSPENDED, EXPIRED |
| `SubscriptionType` | MONTHLY, YEARLY, PERMANENT |
| `WalletTransactionType` | CREDIT, DEBIT, REFUND, SUBSCRIPTION |
| `WalletTransactionStatus` | PENDING, COMPLETED, FAILED |
| `BONotificationType` | WALLET, SYSTEM, AUCTION, ALERT, SECURITY, SUBSCRIPTION, ACCOUNT |
| `AutomationRuleType` | AUTO_CLOSE_AUCTION, AUTO_SUSPEND_ACCOUNT, PRICE_ALERT_CHECK, REPORT_GENERATION, DAILY_SUMMARY, WEEKLY_REPORT, CLEANUP_EXPIRED |
| `AutomationRuleStatus` | ACTIVE, PAUSED, DISABLED |
| `AutomationLogStatus` | SUCCESS, FAILED, SKIPPED |
| `PDFReportType` | AUCTIONS_SUMMARY, TRANSACTIONS_REPORT, USERS_ACTIVITY, FINANCIAL_OVERVIEW, DASHBOARD_SNAPSHOT |
| `LabelStatus` | ACTIVE, INACTIVE, PENDING_RENEWAL, EXPIRED |
| `LabelCategory` | AOP, AOC, BIO, NATURE, FAIR_TRADE, TRADITIONNEL, PREMIUM, CUSTOM |
| `CalendarEventType` | AUCTION_START, AUCTION_END, MAINTENANCE, MEETING, REPORT_DUE, SUBSCRIPTION_RENEWAL, CUSTOM |
| `CooperativeStatus` | ACTIVE, SUSPENDED, PENDING, INACTIVE |
| `WebhookEvent` | AUCTION_CREATED, AUCTION_CLOSED, BID_PLACED, TRANSACTION_COMPLETED, USER_REGISTERED, WALLET_CREDIT, WALLET_DEBIT, REPORT_GENERATED |
| `WebhookStatus` | ACTIVE, DISABLED |

### 3.2 Models (29)

| Modèle | Rôle |
|--------|------|
| `User` | Utilisateurs (vendeurs/acheteurs) |
| `OliveType` | Variétés d'olives (Chemlali, Chetoui, etc.) |
| `Region` | Gouvernorats tunisiens (24) + relation coopératives |
| `Auction` | Enchères d'huile d'olive |
| `AuctionImage` | Images des enchères |
| `Bid` | Offres des acheteurs |
| `Transaction` | Transactions après clôture |
| `Review` | Avis entre acheteur/vendeur |
| `Report` | Signalements/litiges |
| `Notification` | Notifications push/in-app (utilisateurs) |
| `PriceAlert` | Alertes de prix |
| `Settings` | Configuration de la plateforme |
| `BackOfficeAccount` | Comptes administrateurs BO |
| `AuditLog` | Journal d'audit |
| `Wallet` | Portefeuille BO (solde, crédits, débits) |
| `WalletTransaction` | Transactions du portefeuille |
| `BONotification` | Notifications BO (7 types) |
| `AutomationRule` | Règles d'automatisation (7 types) |
| `AutomationLog` | Logs d'exécution des règles |
| `GeneratedReport` | Historique des rapports PDF générés |
| `ChatRoom` | Salons de discussion BO |
| `ChatMessage` | Messages du chat |
| `ChatMember` | Membres des salons |
| `QualityLabel` | Labels de qualité (AOP, BIO, etc.) |
| `CalendarEvent` | Événements du calendrier |
| `Cooperative` | Coopératives oléicoles tunisiennes |
| `Webhook` | Configurations webhooks sortants |
| `WebhookDelivery` | Logs de livraison des webhooks |

---

## 4. Modules Back-Office (21 pages)

### 4.1 🔐 Authentification BO (`login`, `forgot-password`)
- **Login** : Email + mot de passe, session cookie 7 jours, "Se souvenir de moi"
- **Mot de passe oublié** : 3 étapes (email → OTP 6 chiffres → nouveau mot de passe)
- **Garde** : Redirection automatique vers login si non authentifié
- **API** : `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### 4.2 📊 Tableau de Bord (`dashboard`)
- 8 KPI cards (utilisateurs, enchères actives, revenus, etc.)
- 5 graphiques ECharts (barres, donut, lignes, area, pie)
- 3 onglets d'activité récente (enchères, offres, utilisateurs)
- **API** : `/api/dashboard/stats`, `/api/dashboard/charts`, `/api/dashboard/recent`

### 4.3 🗺️ Carte Interactive (`map`)
- Carte Leaflet avec marqueurs par région
- Sidebar avec filtre par statut variété
- Tableau des enchères par zone
- **API** : `/api/map/data`, `/api/map/auctions`, `/api/map/nearby`, `/api/regions`

### 4.4 💰 Suivi des Prix (`prices`)
- Prix moyen/min/max par kg
- Tendances mensuelles (12 mois)
- Analyse par variété, région, quantité
- Top deals (meilleurs prix)
- **API** : `/api/prices`

### 4.5 👥 Utilisateurs (`users`)
- CRUD complet (liste, détail, modifier, supprimer)
- Changement de rôle (SELLER/BUYER/MIXED)
- Suspension/activation
- Stats cards, filtres, pagination
- **API** : `/api/users`, `/api/users/[id]`, `/api/users/[id]/role`, `/api/users/[id]/status`

### 4.6 🔨 Enchères (`auctions`)
- CRUD complet
- Changement de statut (DRAFT → ACTIVE → CLOSED)
- Stats cards, filtres, pagination
- **API** : `/api/auctions`, `/api/auctions/[id]`, `/api/auctions/[id]/status`

### 4.7 ⚠️ Litiges (`disputes`)
- Gestion des signalements (PENDING/IN_REVIEW/RESOLVED/DISMISSED)
- Résolution avec note optionnelle
- **API** : `/api/reports`

### 4.8 📈 Rapports & Exports (`reports`)
- 3 types : Ventes, Enchères, Utilisateurs
- Graphiques ECharts détaillés
- Export CSV (UTF-8 BOM, max 5000 lignes)
- Filtres : période, région, variété
- **API** : `/api/analytics`, `/api/export`

### 4.9 🛡️ Comptes Back-Office (`accounts`)
- CRUD complet avec quotas
- Changement de rôle/statut
- Journal d'audit paginé
- Protection du dernier super admin
- **API** : `/api/accounts`, `/api/accounts/[id]`, `/api/accounts/[id]/status`, `/api/accounts/[id]/role`, `/api/accounts/[id]/audit-logs`

### 4.10 🔑 Permissions (`permissions`)
- Matrice 5 rôles × 9 groupes × 25 permissions
- Toggles interactifs, stats par rôle

### 4.11 ⚙️ Paramètres (`settings`)
- 21 paramètres en 5 groupes
- Toggles booléens, champs texte
- Sauvegarde batch

### 4.12 🧠 Intelligence de Marché (`market-intelligence`)
- Analyses avancées du marché
- Heatmap, saisonnalité, prédictions, comparaisons
- **API** : `/api/market/*`

### 4.13 💰 Portefeuille (`wallet`)
- Solde actuel, crédits/débits mensuels
- Graphique ECharts flux de trésorerie (7 jours)
- Actions rapides : créditer/débiter un compte
- Historique des transactions avec filtres (type, statut) et pagination
- Opérations atomiques (`$transaction`)
- **API** : `GET /api/wallet`, `POST /api/wallet/credit`, `POST /api/wallet/debit`, `GET /api/wallet/transactions`, `GET /api/wallet/stats`

### 4.14 🔔 Notifications (`notifications`)
- 7 types : WALLET, SYSTEM, AUCTION, ALERT, SECURITY, SUBSCRIPTION, ACCOUNT
- Liste carte-based avec indicateur non-lu, filtres type/statut
- Marquer lu, supprimer, tout marquer lu
- Bell dropdown header : compteur réel (polling 30s), 5 dernières notifications
- Création admin (cibler un compte)
- **API** : `GET /api/notifications`, `PATCH /api/notifications/[id]`, `DELETE /api/notifications/[id]`, `POST /api/notifications/read-all`, `GET /api/notifications/unread-count`, `POST /api/notifications/create`

### 4.15 ⚙️ Automation (`automation`)
- 7 types de règles : auto-close enchères, suspendre comptes, check alertes prix, rapports, résumé quotidien, rapport hebdomadaire, cleanup
- Table des règles avec badges type/statut
- Exécution manuelle avec résultat live
- Logs d'exécution (collapsible)
- Stats : règles actives, exécutions totales, taux de succès
- **API** : `GET/POST /api/automation/rules`, `GET/PATCH/DELETE /api/automation/rules/[id]`, `POST /api/automation/rules/[id]/run`, `GET /api/automation/logs`, `GET /api/automation/stats`

### 4.16 📄 Rapports PDF (`pdf-reports`)
- 5 templates : Synthèse enchères, Transactions, Utilisateurs, Vue financière, Dashboard snapshot
- Génération client-side (jsPDF + jspdf-autotable)
- PDF professionnel : branding OLEA, en-tête, KPIs, tableaux, pied de page
- Configuration : sélection template, date range, filtres
- Historique des rapports générés (re-télécharger, supprimer)
- **API** : `GET/POST /api/pdf-reports`, `GET/DELETE /api/pdf-reports/[id]`, `GET /api/pdf-reports/data`

### 4.17 💬 Chat BO (`chat`)
- Salons de discussion entre admins
- Création de salon (nom, description, membres)
- Messages temps réel (polling 3s)
- Bulles de chat (envoyées=vert, reçues=gris)
- Indicateur non-lu, auto-scroll
- Gestion des membres (ajouter/supprimer)
- **API** : `GET/POST /api/chat/rooms`, `GET/DELETE /api/chat/rooms/[id]`, `GET/POST /api/chat/rooms/[id]/messages`, `GET/POST/DELETE /api/chat/rooms/[id]/members`

### 4.18 🏷️ Labels de Qualité (`quality-labels`)
- 8 catégories : AOP, AOC, BIO, NATURE, FAIR_TRADE, TRADITIONNEL, PREMIUM, CUSTOM
- 4 statuts : ACTIVE, INACTIVE, PENDING_RENEWAL, EXPIRED
- CRUD complet, filtres catégorie/statut/recherche
- Informations : nom, description, certifieur, période de validité, critères
- **API** : `GET/POST /api/quality-labels`, `GET/PATCH/DELETE /api/quality-labels/[id]`

### 4.19 📅 Calendrier (`calendar`)
- Grille mensuelle custom (7 colonnes, Lun-Dim)
- Événements affichés comme points/barres colorés sur les jours
- 7 types : AUCTION_START, AUCTION_END, MAINTENANCE, MEETING, REPORT_DUE, SUBSCRIPTION_RENEWAL, CUSTOM
- Navigation mois précédent/suivant, surlignage "aujourd'hui"
- Création/édition d'événements (titre, type, dates, couleur, lieu)
- **API** : `GET/POST /api/calendar`, `GET/PATCH/DELETE /api/calendar/[id]`

### 4.20 🏘️ Coopératives (`cooperatives`)
- CRUD complet avec informations détaillées
- Champs : nom, description, région, adresse, téléphone, email, site web, nombre de membres, volume annuel, statut, certification, année de fondation, contact
- Stats : total coopératives, membres totaux, volume total
- Filtres région/statut, recherche par nom
- **API** : `GET/POST /api/cooperatives`, `GET/PATCH/DELETE /api/cooperatives/[id]`

### 4.21 🔗 Webhooks (`webhooks`)
- 8 événements : AUCTION_CREATED, AUCTION_CLOSED, BID_PLACED, TRANSACTION_COMPLETED, USER_REGISTERED, WALLET_CREDIT, WALLET_DEBIT, REPORT_GENERATED
- Configuration : nom, URL, sélection événements, secret auto-généré
- Test d'envoi (payload test + résultat)
- Logs de livraison (statut code, durée, succès/échec)
- Stats : total webhooks, actifs, taux de succès
- **API** : `GET/POST /api/webhooks`, `GET/PATCH/DELETE /api/webhooks/[id]`, `GET /api/webhooks/[id]/deliveries`, `POST /api/webhooks/[id]/test`

---

## 5. API Routes (60+ routes)

### Authentification
- `POST /api/auth/login` — Connexion
- `POST /api/auth/logout` — Déconnexion
- `GET /api/auth/me` — Session courante
- `POST /api/auth/forgot-password` — Envoyer OTP
- `POST /api/auth/reset-password` — Réinitialiser mot de passe

### Dashboard
- `GET /api/dashboard/stats` — KPI globaux
- `GET /api/dashboard/charts` — Données graphiques
- `GET /api/dashboard/recent` — Activité récente

### Utilisateurs
- `GET /api/users` — Liste paginée
- `GET /api/users/[id]` — Détail
- `PATCH /api/users/[id]/role` — Changer rôle
- `PATCH /api/users/[id]/status` — Changer statut

### Enchères
- `GET /api/auctions` — Liste paginée
- `GET /api/auctions/[id]` — Détail
- `PATCH /api/auctions/[id]/status` — Changer statut
- `DELETE /api/auctions/[id]` — Supprimer

### Carte
- `GET /api/map/data` — Données géographiques
- `GET /api/map/auctions` — Enchères par zone
- `GET /api/map/nearby` — Enchères à proximité

### Prix
- `GET /api/prices` — Statistiques prix

### Marché
- `GET /api/market/alerts` — Alertes de prix
- `GET /api/market/alerts/check` — Vérification alertes
- `GET /api/market/seasonality` — Saisonnalité
- `GET /api/market/predictions` — Prédictions
- `GET /api/market/heatmap` — Heatmap
- `GET /api/market/comparison` — Comparaisons

### Litiges
- `GET /api/reports` — Liste
- `PATCH /api/reports/[id]` — Résoudre/Rejeter

### Comptes BO
- `GET /api/accounts` — Liste
- `POST /api/accounts` — Créer
- `GET /api/accounts/[id]` — Détail
- `PATCH /api/accounts/[id]` — Modifier
- `DELETE /api/accounts/[id]` — Supprimer
- `PATCH /api/accounts/[id]/status` — Changer statut
- `PATCH /api/accounts/[id]/role` — Changer rôle
- `GET /api/accounts/[id]/audit-logs` — Journal d'audit

### Rapports & Analytics
- `GET /api/analytics` — Analytics
- `GET /api/export` — Export CSV

### Paramètres
- `GET /api/settings` — Liste
- `POST /api/settings` — Créer
- `PATCH /api/settings` — Mise à jour batch
- `GET /api/settings/[key]` — Détail
- `PUT /api/settings/[key]` — Modifier
- `DELETE /api/settings/[key]` — Supprimer

### Permissions
- `GET /api/permissions` — Matrice

### Référence
- `GET /api/regions` — Liste régions
- `GET /api/olive-types` — Liste variétés

### Portefeuille
- `GET /api/wallet` — Solde global
- `POST /api/wallet/credit` — Créditer
- `POST /api/wallet/debit` — Débiter
- `GET /api/wallet/transactions` — Historique
- `GET /api/wallet/stats` — Statistiques

### Notifications
- `GET /api/notifications` — Liste
- `PATCH /api/notifications/[id]` — Marquer lu
- `DELETE /api/notifications/[id]` — Supprimer
- `POST /api/notifications/read-all` — Tout marquer lu
- `GET /api/notifications/unread-count` — Compteur non-lues
- `POST /api/notifications/create` — Créer (admin)

### Automation
- `GET /api/automation/rules` — Liste règles
- `POST /api/automation/rules` — Créer
- `GET /api/automation/rules/[id]` — Détail
- `PATCH /api/automation/rules/[id]` — Modifier
- `DELETE /api/automation/rules/[id]` — Supprimer
- `POST /api/automation/rules/[id]/run` — Exécuter
- `GET /api/automation/logs` — Logs
- `GET /api/automation/stats` — Statistiques

### Rapports PDF
- `GET /api/pdf-reports` — Liste
- `POST /api/pdf-reports` — Sauvegarder
- `GET /api/pdf-reports/[id]` — Détail
- `DELETE /api/pdf-reports/[id]` — Supprimer
- `GET /api/pdf-reports/data` — Données pour génération

### Chat
- `GET /api/chat/rooms` — Liste salons
- `POST /api/chat/rooms` — Créer salon
- `GET /api/chat/rooms/[id]` — Détail salon
- `DELETE /api/chat/rooms/[id]` — Supprimer salon
- `GET /api/chat/rooms/[id]/messages` — Messages
- `POST /api/chat/rooms/[id]/messages` — Envoyer message
- `GET /api/chat/rooms/[id]/members` — Membres
- `POST /api/chat/rooms/[id]/members` — Ajouter
- `DELETE /api/chat/rooms/[id]/members` — Retirer

### Labels Qualité
- `GET /api/quality-labels` — Liste
- `POST /api/quality-labels` — Créer
- `GET /api/quality-labels/[id]` — Détail
- `PATCH /api/quality-labels/[id]` — Modifier
- `DELETE /api/quality-labels/[id]` — Supprimer

### Calendrier
- `GET /api/calendar` — Liste par mois
- `POST /api/calendar` — Créer
- `GET /api/calendar/[id]` — Détail
- `PATCH /api/calendar/[id]` — Modifier
- `DELETE /api/calendar/[id]` — Supprimer

### Coopératives
- `GET /api/cooperatives` — Liste
- `POST /api/cooperatives` — Créer
- `GET /api/cooperatives/[id]` — Détail
- `PATCH /api/cooperatives/[id]` — Modifier
- `DELETE /api/cooperatives/[id]` — Supprimer

### Webhooks
- `GET /api/webhooks` — Liste
- `POST /api/webhooks` — Créer
- `GET /api/webhooks/[id]` — Détail
- `PATCH /api/webhooks/[id]` — Modifier
- `DELETE /api/webhooks/[id]` — Supprimer
- `GET /api/webhooks/[id]/deliveries` — Logs livraison
- `POST /api/webhooks/[id]/test` — Test envoi

---

## 6. Structure des Fichiers

```
src/
  app/
    page.tsx                     # Point d'entrée unique → AdminLayout
    globals.css                  # Styles globaux + theme olive
    layout.tsx                   # Root layout
    api/                         # 60+ API routes
      auth/                      # 5 routes
      dashboard/                 # 3 routes
      users/                     # 4 routes
      auctions/                  # 4 routes
      map/                       # 3 routes
      prices/                    # 1 route
      market/                    # 6 routes
      reports/                   # 2 routes
      accounts/                  # 8 routes
      analytics/                 # 1 route
      export/                    # 1 route
      settings/                  # 5 routes
      permissions/               # 1 route
      regions/                   # 1 route
      olive-types/               # 1 route
      wallet/                    # 5 routes
      notifications/             # 6 routes
      automation/                # 6 routes
      pdf-reports/               # 5 routes
      chat/rooms/                # 9 routes
      quality-labels/           # 5 routes
      calendar/                  # 5 routes
      cooperatives/              # 5 routes
      webhooks/                  # 7 routes
  components/
    admin-layout.tsx             # Layout principal (sidebar + header + router)
    stats-card.tsx               # Composant KPI réutilisable
    pages/                       # 21 pages du back-office
      login.tsx
      forgot-password.tsx
      dashboard.tsx
      map.tsx
      prices.tsx
      users.tsx
      auctions.tsx
      disputes.tsx
      reports.tsx
      accounts.tsx
      permissions.tsx
      settings.tsx
      market-intelligence.tsx
      mobile-preview.tsx
      wallet.tsx
      notifications.tsx
      automation.tsx
      pdf-reports.tsx
      chat.tsx
      quality-labels.tsx
      calendar.tsx
      cooperatives.tsx
      webhooks.tsx
    ui/                          # Composants shadcn/ui
  store/
    auth.ts                      # Zustand store (authentification BO)
  stores/
    navigation.ts               # Zustand store (SPA navigation)
  lib/
    db.ts                        # Prisma Client (datasourceUrl hardcoded)
    utils.ts                     # Utilitaires (cn, etc.)
prisma/
  schema.prisma                  # 29 modèles, 26 enums
  seed.ts                       # Données seed SQLite (legacy)
  seed-pg.ts                    # Données seed PostgreSQL
db/
  custom.db                      # SQLite legacy (exclu du git)
mini-services/                   # Services externes (websocket, etc.)
```

---

## 7. Stores Zustand

### 7.1 Navigation (`stores/navigation.ts`)
```typescript
type PageKey =
  | 'login' | 'forgot-password' | 'dashboard' | 'map' | 'prices'
  | 'users' | 'auctions' | 'disputes' | 'reports' | 'accounts'
  | 'permissions' | 'settings' | 'market-intelligence' | 'mobile-preview'
  | 'wallet' | 'notifications' | 'automation' | 'pdf-reports'
  | 'chat' | 'quality-labels' | 'calendar' | 'cooperatives' | 'webhooks'
```

### 7.2 Auth (`store/auth.ts`)
- `user` : Utilisateur courant (id, email, name, role, status, etc.)
- `isAuthenticated` : Booléen de session
- `login(email, password)` → Promise<boolean>
- `logout()` → Promise<void>
- `checkSession()` → Promise<boolean>
- `forgotPassword(email)` → Promise<boolean>
- `resetPassword(email, otp, newPassword)` → Promise<boolean>

---

## 8. Langue

- Interface : **Français**
- Noms de données : Anglais (code) / Français (labels)
- Support multilingue : `nameAr`, `nameFr`, `nameEn` sur Region/OliveType
- Format dates : `date-fns` avec locale `fr`

---

## 9. Hébergement & Déploiement

- **Base de données** : Supabase PostgreSQL (cloud)
- **Contrôle de version** : GitHub
- **Variables d'environnement** : `.env` (DATABASE_URL, DIRECT_URL)
- **Build** : `next build` (standalone output)
- **Runtime** : Node.js server

---

*Dernière mise à jour : 2026-06-17 — v2.0 (post-migration Supabase + 10 features SaaS)*

# 📱 Cahier des Charges - Application Mobile Olea

> **Version 2.0** — 24 écrans — Dernière mise à jour : Juin 2025
>
> Plateforme de vente aux enchères d'huile d'olive tunisienne

---

## Table des Matières

1. [Contexte du Projet](#1-contexte-du-projet)
2. [Stack Technique](#2-stack-technique)
3. [Intégration Firebase](#3-intégration-firebase)
4. [WebSocket — Enchères en Temps Réel](#4-websocket--enchères-en-temps-réel)
5. [Système de Design](#5-système-de-design)
6. [Structure de Navigation](#6-structure-de-navigation)
7. [Spécification des 24 Écrans](#7-spécification-des-24-écrans)
   - [Systeme (2)](#71-système-2-écrans)
   - [Authentification (3)](#72-authentification-3-écrans)
   - [Principal (5)](#73-principal-5-écrans)
   - [Vendeur (3)](#74-vendeur-3-écrans)
   - [Acheteur (2)](#75-acheteur-2-écrans)
   - [Communication (2)](#76-communication-2-écrans)
   - [Utilisateur (7)](#77-utilisateur-7-écrans)
   - [Aide (1)](#78-aide--1-écran)
8. [Endpoints API](#8-endpoints-api)
9. [Concordance Base de Données](#9-concordance-base-de-données)
10. [Structure des Fichiers](#10-structure-des-fichiers)
11. [Fonctionnalités Clés](#11-fonctionnalités-clés)

---

## 1. Contexte du Projet

### 1.1 Objectif

Olea est une plateforme SaaS de vente aux enchères d'huile d'olive tunisienne. L'application mobile permet aux vendeurs et acheteurs d'interagir avec la plateforme de manière fluide et en temps réel.

### 1.2 Architecture Existeante

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Back-office** | Next.js 16 + Prisma + SQLite | Administration web |
| **Base de données** | SQLite (Prisma ORM) | Source de vérité partagée |
| **WebSocket** | Socket.io (port 3003) | Enchères en temps réel |
| **Mobile** | React Native + Expo | Application utilisateur |

### 1.3 Principes Fondamentaux

- **Base de données unique** : Le mobile partage le même schéma Prisma que le back-office
- **Rôle MIXED** : Un utilisateur peut être à la fois vendeur ET acheteur simultanément
- **Temps réel** : Les enchères sont vivantes via WebSocket
- **Mobile-first** : L'expérience mobile est prioritaire

---

## 2. Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework** | React Native + Expo | SDK 52+ |
| **Routing** | Expo Router | v4 |
| **State** | Zustand | v5 |
| **WebSocket** | Socket.io-client | v4 |
| **Push** | Firebase Cloud Messaging | — |
| **Storage** | Firebase Storage | — |
| **Analytics** | Firebase Analytics | — |
| **Maps** | react-native-maps (OSM) | — |
| **Charts** | react-native-chart-kit / Victory Native | — |
| **Auth Bio** | expo-local-authentication | — |
| **Camera** | expo-camera / expo-image-picker | — |
| **i18n** | expo-localization + i18next | — |
| **Forms** | react-hook-form + zod | — |
| **HTTP** | axios | — |
| **Cache** | expo-sqlite (local) | — |

---

## 3. Intégration Firebase

### 3.1 Services Utilisés

| Service | Usage |
|---------|-------|
| **Cloud Messaging (FCM)** | Notifications push (nouvelle offre, dépassement, enchère gagnée, messages) |
| **Storage** | Photos d'enchères, avatars, certificats de qualité |
| **Analytics** | Suivi d'événements (vues d'écrans, actions clés) |

### 3.2 Configuration Requise

1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer **Android** et **iOS** dans le projet
3. Télécharger `google-services.json` (Android) et `GoogleService-Info.plist` (iOS)
4. Placer les fichiers de config dans `mobile/` selon la plateforme
5. Activer Cloud Messaging dans la console Firebase

### 3.3 Événements Analytics Tracés

```
screen_view          — Chaque vue d'écran
auction_created      — Création d'enchère
bid_placed           — Offre placée
auction_won          — Enchère gagnée
user_registered      — Nouvelle inscription
notification_opened  — Notification ouverte
chat_message_sent    — Message envoyé
```

### 3.4 Structure Firebase Storage

```
olea-app/
  auctions/
    {auctionId}/
      image1.jpg
      image2.jpg
      ...
  avatars/
    {userId}/
      avatar.jpg
  certificates/
    {auctionId}/
      cert1.pdf
      ...
```

---

## 4. WebSocket — Enchères en Temps Réel

### 4.1 Architecture

Le service WebSocket fonctionne comme un mini-service indépendant sur le **port 3003**. Il est connecté à la fois au mobile ET au back-office.

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Mobile   │◄───►│  Socket.io   │◄───►│  Back-office │
│  (Client) │     │  (Port 3003) │     │   (Client)   │
└──────────┘     └──────┬───────┘     └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  SQLite DB   │
                 │  (Prisma)    │
                 └──────────────┘
```

### 4.2 Événements Émis (Client → Serveur)

| Événement | Payload | Description |
|-----------|---------|-------------|
| `join_auction` | `{ auctionId }` | Rejoindre une room d'enchère |
| `leave_auction` | `{ auctionId }` | Quitter une room d'enchère |
| `place_bid` | `{ auctionId, pricePerKg, quantity }` | Placer une offre |
| `typing_chat` | `{ conversationId }` | Indicateur de frappe |

### 4.3 Événements Reçus (Serveur → Client)

| Événement | Payload | Description |
|-----------|---------|-------------|
| `new_bid` | `{ bid, auctionId }` | Nouvelle offre sur l'enchère |
| `bid_outbid` | `{ bid, auctionId }` | Offre dépassée |
| `auction_ending` | `{ auctionId, timeLeft }` | Alerte fin d'enchère (< 5 min) |
| `auction_closed` | `{ auctionId, winner }` | Enchère clôturée |
| `auction_countdown` | `{ auctionId, timeLeft }` | Mise à jour countdown |
| `new_message` | `{ message, conversationId }` | Nouveau message chat |
| `user_online` | `{ userId }` | Utilisateur en ligne |
| `user_offline` | `{ userId }` | Utilisateur hors ligne |

### 4.4 Gestion de Reconnexion

- Reconnexion automatique avec backoff exponentiel
- Restauration de l'état des rooms rejointes
- Sync des offres manquées lors de la reconnexion

---

## 5. Système de Design

### 5.1 Palette de Couleurs

#### Mode Clair

| Token | Couleur | Hex | Usage |
|-------|---------|-----|-------|
| `primary` | Vert Olive | `#45A452` | Boutons, liens, accent |
| `primary-dark` | Vert Foncé | `#2D6B3A` | Boutons pressés, headers |
| `primary-light` | Vert Clair | `#86EFAC` | Badges, fonds subtils |
| `primary-50` | Vert Pâle | `#F0FDF4` | Fonds de cartes |
| `secondary` | Or / Ambre | `#F59E0B` | Prix, étoiles |
| `background` | Blanc | `#FFFFFF` | Fonds d'écrans |
| `surface` | Gris Clair | `#F9FAFB` | Cartes, sections |
| `border` | Gris Moyen | `#E5E7EB` | Bordures, séparateurs |
| `text-primary` | Gris Foncé | `#111827` | Texte principal |
| `text-secondary` | Gris Moyen | `#6B7280` | Texte secondaire |
| `error` | Rouge | `#EF4444` | Erreurs, alertes |
| `warning` | Ambre | `#F59E0B` | Avertissements |
| `success` | Vert | `#22C55E` | Succès |
| `info` | Bleu | `#3B82F6` | Informations |

#### Mode Sombre

| Token | Couleur | Hex | Usage |
|-------|---------|-----|-------|
| `background` | Gris Très Foncé | `#0F172A` | Fonds d'écrans |
| `surface` | Gris Foncé | `#1E293B` | Cartes |
| `surface-elevated` | Gris Moyen Foncé | `#334155` | Modals, bottom sheets |
| `border` | Gris Foncé | `#334155` | Bordures |
| `text-primary` | Blanc | `#F1F5F9` | Texte principal |
| `text-secondary` | Gris Clair | `#94A3B8` | Texte secondaire |
| `primary` | Vert Olive Clair | `#4ADE80` | Boutons, accent |

### 5.2 Typographie

| Style | Police | Taille | Poids | Usage |
|-------|--------|--------|-------|-------|
| **Latin** | Inter | — | — | Texte principal (FR/EN) |
| **Arabe** | Noto Sans Arabic | — | — | Texte arabe |
| Heading 1 | — | 28sp | Bold | Titres de page |
| Heading 2 | — | 22sp | SemiBold | Sous-titres |
| Heading 3 | — | 18sp | SemiBold | Titres de sections |
| Body | — | 16sp | Regular | Texte courant |
| Caption | — | 13sp | Regular | Légendes, hints |
| Overline | — | 11sp | Medium | Labels, badges |
| Price | — | 24sp | Bold | Montants / Prix |

### 5.3 Support RTL

- Basculement instantané entre LTR (FR/EN) et RTL (AR)
- Utilisation de `expo-localization` pour la détection
- Tous les composants utilisent `I18nManager.isRTL`
- Icônes directionnelles inversées en mode RTL

### 5.4 Icônes & Illustrations

- Bibliothèque : `@expo/vector-icons` (Ionicons)
- Format SVG pour les illustrations
- Icônes cohérentes : 24px par défaut, 20px en mode compact, 32px en mode large

### 5.5 Composants UI Réutilisables

| Composant | Description |
|-----------|-------------|
| **Card** | Carte avec elevation, bordure arrondie (12px) |
| **Badge** | Label avec fond coloré (statut, count) |
| **Chip** | Filtre sélectionnable (multi-select) |
| **FAB** | Bouton flottant (créer enchère, action principale) |
| **BottomSheet** | Panneau glissant (preview carte, filtres) |
| **Skeleton** | Placeholder animé (chargement) |
| **Snackbar** | Message transitoire (bas de l'écran) |
| **EmptyState** | Illustration + texte quand aucune donnée |
| **PriceTag** | Prix formaté en DT/kg |
| **Countdown** | Timer circulaire/linéaire pour enchères |
| **Avatar** | Image ronde avec badge en ligne |
| **Rating** | Étoiles 1-5 (lecture seule / interactive) |
| **BidHistory** | Liste chronologique des offres |
| **PhotoGallery** | Carrousel d'images swipeable |
| **SearchBar** | Barre de recherche avec icône |
| **PullRefresh** | Scroll avec rafraîchissement |

### 5.6 Spécifications Générales

- **Border Radius** : 12px (cartes), 8px (boutons), 24px (chips), 9999px (avatar)
- **Elevation** : 0 (flat), 2 (cards), 4 (FAB), 8 (modals)
- **Spacing** : Multiples de 4px (4, 8, 12, 16, 20, 24, 32, 48)
- **Horizontal padding** : 16px standard, 20px pour les formulaires
- **Safe area** : Respect des notch/home indicator

---

## 6. Structure de Navigation

### 6.1 Navigation Principale (Bottom Tabs)

```
┌─────────────────────────────────────┐
│           [Contenu Écran]           │
│                                     │
│                                     │
│                                     │
├─────┬─────┬─────┬─────┬─────────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤         │
│Home │Ench.│Carte│Prix │ Profil      │
└─────┴─────┴─────┴─────┴─────────────┘
```

| Tab | Écran | Icône (Ionicons) | Nom FR | Nom AR |
|-----|-------|-------------------|--------|--------|
| 1 | `home` | `home-outline` / `home` | Accueil | الرئيسية |
| 2 | `auctions` | `grid-outline` / `grid` | Enchères | المزادات |
| 3 | `map` | `map-outline` / `map` | Carte | الخريطة |
| 4 | `prices` | `trending-up-outline` / `trending-up` | Prix | الأسعار |
| 5 | `profile` | `person-outline` / `person` | Profil | الملف الشخصي |

### 6.2 Stack de Navigation (Expo Router)

```
app/
  (tabs)/
    home.tsx
    auctions.tsx
    map.tsx
    prices.tsx
    profile.tsx
  auction/
    [id].tsx              ← auction-detail
  auction/
    create.tsx            ← create-auction
    edit/[id].tsx         ← create-auction (mode édition)
  seller/
    my-auctions.tsx
    dashboard.tsx
  buyer/
    my-bids.tsx
    transaction/[id].tsx  ← transaction-detail
  chat/
    index.tsx             ← chat-list
    [id].tsx              ← chat
  user/
    edit-profile.tsx
    notifications.tsx
    settings.tsx
    favorites.tsx
    wallet.tsx
    reviews.tsx
  auth/
    login.tsx
    register.tsx
    verify-otp.tsx
  onboarding.tsx
  help.tsx
  _layout.tsx
```

### 6.3 Flux de Navigation

```
                    ┌──────────┐
                    │  Splash   │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │ Token valide ?      │
              ├── Oui ──► Home     │
              └── Non ──┬──────────┘
                         │
              ┌──────────┴──────────┐
              │ Onboarding vu ?     │
              ├── Oui ──► Login     │
              └── Non ──► Onboarding│
                         │
                    ┌────┴─────┐
                    │  Login   │◄──► Register
                    └────┬─────┘
                         │
                    ┌────┴─────┐
                    │ Verify   │
                    │   OTP    │
                    └────┬─────┘
                         │
                         ▼
                ┌────────────────┐
                │  Home (Tabs)  │
                └────────────────┘
```

---

## 7. Spécification des 24 Écrans

---

### 7.1 Système (2 écrans)

---

#### Écran 01 — Splash Screen

| Propriété | Valeur |
|-----------|--------|
| **ID** | `splash` |
| **Nom AR** | شاشة البداية |
| **Icône** | Logo Olea animé |
| **Route** | `/` (racine) |
| **Auth requise** | Non |

**Description** : Écran de chargement initial affichant le logo Olea avec une animation subtile. Vérifie le token d'authentification et redirige vers l'onboarding (première fois), le login, ou l'accueil.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ┌───────────┐          │
│          │           │          │
│          │   🫒      │          │
│          │   OLEA    │          │
│          │           │          │
│          └───────────┘          │
│                                 │
│         L'enchère qui           │
│       révèle la valeur          │
│                                 │
│           ○ ○ ○ ○               │
│                                 │
└─────────────────────────────────┘
```

**Comportement** :

| Étape | Action | Délai |
|-------|--------|-------|
| 1 | Afficher logo animé | 0ms |
| 2 | Vérifier token stocké | 500ms |
| 3 | Token valide → Home | 2000ms |
| 4 | Token invalide → Onboarding (si jamais vu) ou Login | 2000ms |

**Caractéristiques** :
- Animation de logo : fade-in + scale-up (300ms)
- Slogan en version locale
- Dots de chargement animés
- Background : dégradé `primary` → `primary-dark`
- Pas de bouton retour

**API** : Aucune

---

#### Écran 02 — Onboarding

| Propriété | Valeur |
|-----------|--------|
| **ID** | `onboarding` |
| **Nom AR** | مرحبًا بك |
| **Icône** | `hand-wave-outline` |
| **Route** | `/onboarding` |
| **Auth requise** | Non |

**Description** : Carrousel de 3 slides introductives présentant la plateforme. Permet de comprendre rapidement le concept des enchères d'huile d'olive.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│                                 │
│   [ Illustration vectorielle ]  │
│                                 │
│   ══════════════════════════    │
│   Bienvenue sur Olea !         │
│   ══════════════════════════    │
│                                 │
│   Découvrez la première         │
│   plateforme de vente aux       │
│   enchères d'huile d'olive      │
│   tunisienne.                   │
│                                 │
│          ● ○ ○                  │
│                                 │
│  [ Ignorer ]    [ Suivant → ]   │
│                                 │
└─────────────────────────────────┘
```

**Slides :**

| # | Titre | Description | Illustration |
|---|-------|-------------|--------------|
| 1 | Bienvenue sur Olea | Découvrez la première plateforme de vente aux enchères d'huile d'olive tunisienne | Icône olive + mains qui se serrent |
| 2 | Comment ça marche ? | Parcourez les enchères, placez vos offres et finalisez vos achats en toute simplicité | Icône marteau + timeline 3 étapes |
| 3 | Commencez maintenant | Créez votre compte en 30 secondes et rejoignez la communauté Olea | Icône smartphone + check |

**Champs / Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Suivant | `arrow-forward` | text | Slide suivante |
| Ignorer | — | text (ghost) | Passer vers login |
| Précédent | `arrow-back` | text | Slide précédente |
| Commencer | — | primary (full) | Slide 3 uniquement → Login |

**Caractéristiques** :
- Swipe horizontal entre slides
- Indicateurs de pagination (dots)
- Animation de transition : slide + fade
- Mémorisation : `AsyncStorage.setItem('onboarding_seen', 'true')`
- Haptic feedback au changement de slide

**API** : Aucune

---

### 7.2 Authentification (3 écrans)

---

#### Écran 03 — Connexion

| Propriété | Valeur |
|-----------|--------|
| **ID** | `login` |
| **Nom AR** | تسجيل الدخول |
| **Icône** | `log-in-outline` |
| **Route** | `/auth/login` |
| **Auth requise** | Non |

**Description** : Écran de connexion principal. Authentification par numéro de téléphone tunisien (+216) avec envoi OTP. Option biométrique si déjà connecté précédemment. Connexion via Google.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│                                 │
│           ┌─────┐               │
│           │ 🫒 │               │
│           └─────┘               │
│          Connexion              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🇹🇳 +216  ┌──────────┐ │  │
│  │           │ 52 XXX XXX│  │  │
│  │           └──────────┘ │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Continuer            │  │
│  └───────────────────────────┘  │
│                                 │
│  ────── ou ──────              │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔑 Connexion biométrique │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 📧 Continuer avec Google │  │
│  └───────────────────────────┘  │
│                                 │
│     Pas encore de compte ?      │
│        S'inscrire →             │
│                                 │
└─────────────────────────────────┘
```

**Champs :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `phone` | phone | ✅ | `52 XXX XXX` | 8 chiffres tunisiens (commence par 2/5/9) |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Continuer | `arrow-forward` | primary (full) | Envoyer OTP → verify-otp |
| Biométrique | `finger-print` | outline | Connexion par empreinte/face ID |
| Google | `logo-google` | outline | Connexion via Google OAuth |
| S'inscrire | — | link | Navigation vers register |

**Caractéristiques** :
- Préfixe `+216` non modifiable
- Masquage progressif du numéro de téléphone (52•••••X)
- Option biométrique affichée seulement si `SecureStore` contient un token biométrique
- Google Sign-In via `expo-auth-session`
- Haptic feedback sur erreur de validation

**API** : `POST /api/mobile/auth/send-otp`

**Payload** : `{ phone: "+21652XXXXXX" }`  
**Response** : `{ success: true, message: "OTP envoyé" }`

---

#### Écran 04 — Inscription

| Propriété | Valeur |
|-----------|--------|
| **ID** | `register` |
| **Nom AR** | إنشاء حساب |
| **Icône** | `person-add-outline` |
| **Route** | `/auth/register` |
| **Auth requise** | Non |

**Description** : Formulaire complet d'inscription. L'utilisateur saisit ses informations et choisit son rôle (Vendeur, Acheteur, ou Mixte). Après soumission, redirige vers la vérification OTP.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Retour        Inscription   │
│                                 │
│  Nom complet                    │
│  ┌───────────────────────────┐  │
│  │ Ali Ben Ahmed             │  │
│  └───────────────────────────┘  │
│                                 │
│  Numéro de téléphone            │
│  ┌───────────────────────────┐  │
│  │ 🇹🇳 +216  52 XXX XXX     │  │
│  └───────────────────────────┘  │
│                                 │
│  Nom de l'entreprise (option.)  │
│  ┌───────────────────────────┐  │
│  │ Huilerie Ben Ahmed        │  │
│  └───────────────────────────┘  │
│                                 │
│  Je suis un(e)...               │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Vendeur│ │Achete.│ │ Mixte│   │
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  ☑ J'accepte les CGU d'Olea    │
│  ┌───────────────────────────┐  │
│  │       Créer mon compte    │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Champs :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `name` | text | ✅ | `Nom complet` | Min 3 caractères |
| `phone` | phone | ✅ | `52 XXX XXX` | 8 chiffres tunisiens |
| `enterprise` | text | ❌ | `Nom de l'entreprise` | Max 100 caractères |
| `role` | select | ✅ | — | `SELLER` / `BUYER` / `MIXED` |
| `acceptTerms` | checkbox | ✅ | `J'accepte les CGU` | Doit être coché |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Retour | `arrow-back` | ghost | Retour au login |
| Vendeur | `storefront-outline` | chip | Sélection rôle vendeur |
| Acheteur | `cart-outline` | chip | Sélection rôle acheteur |
| Mixte | `swap-horizontal-outline` | chip | Sélection rôle mixte |
| CGU | `document-text-outline` | link | Ouvrir les conditions |
| Créer compte | `arrow-forward` | primary (full) | Soumettre → verify-otp |

**Caractéristiques** :
- Sélection de rôle avec chips (sélection unique, styled)
- CGU lien vers modal/WebView
- Le téléphone est vérifié comme unique
- Haptic feedback sur sélection de rôle
- Scroll automatique vers le premier champ en erreur

**API** : `POST /api/mobile/auth/register`

**Payload** :
```json
{
  "name": "Ali Ben Ahmed",
  "phone": "+21652XXXXXX",
  "enterprise": "Huilerie Ben Ahmed",
  "role": "MIXED"
}
```
**Response** : `{ success: true, userId: "xxx" }`

---

#### Écran 05 — Vérification OTP

| Propriété | Valeur |
|-----------|--------|
| **ID** | `verify-otp` |
| **Nom AR** | تأكيد الرمز |
| **Icône** | `shield-checkmark-outline` |
| **Route** | `/auth/verify-otp` |
| **Auth requise** | Non |

**Description** : Écran de saisie du code OTP à 6 chiffres. Détection automatique du SMS sur Android (via SMS Retriever API). Compte à rebours pour le renvoi.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Retour                       │
│                                 │
│       Vérifiez votre numéro     │
│                                 │
│  Un code de 6 chiffres a été    │
│  envoyé au +216 52•••••89       │
│                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │ 4 │ │ 7 │ │ 2 │ │ 9 │ │ 1 │ │   │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                 │
│  Renvoyer le code dans 00:45    │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Vérifier            │  │
│  └───────────────────────────┘  │
│                                 │
│  Changer de numéro ?            │
│                                 │
└─────────────────────────────────┘
```

**Champs :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `otp` | otp-6 | ✅ | `_ _ _ _ _ _` | Exactement 6 chiffres |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Retour | `arrow-back` | ghost | Modifier le numéro |
| Vérifier | `checkmark` | primary (full) | Vérifier le code OTP |
| Renvoyer | — | text | Renvoyer OTP (après countdown) |
| Changer numéro | — | link | Retour au formulaire téléphone |

**Caractéristiques** :
- Composant OTP : 6 cases séparées, focus auto-avance
- Auto-fill SMS via `expo-sms-retriever` (Android)
- Compte à rebours : 60 secondes avant renvoi
- Limite de 3 tentatives avant blocage temporaire (5 min)
- Rétroaction visuelle : vert (valide), rouge (erreur), shake animation
- Haptic success/fail
- Le bouton "Vérifier" est activé automatiquement quand 6 chiffres saisis

**API** : `POST /api/mobile/auth/verify-otp`

**Payload** : `{ phone: "+21652XXXXXX", otp: "472918" }`  
**Response** :
```json
{
  "success": true,
  "token": "jwt_xxx",
  "user": { "id": "xxx", "name": "Ali", "role": "MIXED" }
}
```

---

### 7.3 Principal (5 écrans)

---

#### Écran 06 — Accueil

| Propriété | Valeur |
|-----------|--------|
| **ID** | `home` |
| **Nom AR** | الرئيسية |
| **Icône** | `home-outline` |
| **Route** | `/(tabs)/home` |
| **Auth requise** | ✅ |

**Description** : Tableau de bord personnalisé affichant les statistiques de l'utilisateur, les enchères mises en avant, un aperçu des prix du marché et des raccourcis rapides.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│ Olea                  🔔  👤    │
│                                 │
│  Bonjour, Ali 👋                │
│                                 │
│ ┌────────┐ ┌────────┐ ┌──────┐ │
│ │ 12     │ │ 3      │ │ 4.8  │ │
│ │Enchères│ │Gagnées │ │ ★    │ │
│ │actives │ │        │ │ Note │ │
│ └────────┘ └────────┘ └──────┘ │
│                                 │
│  Enchères en vedette            │
│  ┌─────────────────────────┐    │
│  │ 📷  Huile Extra Vierge   │    │
│  │      Sfax • 500kg        │    │
│  │      18.500 DT/kg  ⏰ 2h │    │
│  │      5 offres →          │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 📷  Huile Biologique     │    │
│  │      Sousse • 200kg      │    │
│  │      22.000 DT/kg  ⏰ 5h │    │
│  │      3 offres →          │    │
│  └─────────────────────────┘    │
│                                 │
│  Prix du marché (aujourd'hui)   │
│  Extra Vierge : 16-22 DT/kg    │
│  ─────────────────────────────  │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │➕ Nouv│ │🔍 Rech│ │❤️ Fav│      │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
├─────┬─────┬─────┬─────┬─────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤      │
└─────┴─────┴─────┴─────┴─────────┘
```

**Sections :**

| Section | Contenu | Source API |
|---------|---------|------------|
| **Header** | Salutation + avatar | Local + User |
| **Stats rapides** | 3 cartes : enchères actives, offres gagnées, note | Calculées |
| **Enchères vedettes** | Carousel horizontal (3-5 enchères) | `GET /api/mobile/auctions?featured=true` |
| **Prix du marché** | Snippet des prix moyens par type | `GET /api/mobile/prices/summary` |
| **Actions rapides** | 3 raccourcis : créer, chercher, favoris | — |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Notifications | `notifications-outline` | icon-button | Badge non-lus |
| Profil | `person-circle-outline` | icon-button | → Profile |
| Enchère vedette | — | card | → auction-detail |
| Voir tout | — | text | → auctions |
| Nouvelle enchère | `add-circle-outline` | quick-action | → create-auction |
| Rechercher | `search-outline` | quick-action | → auctions (search mode) |
| Favoris | `heart-outline` | quick-action | → favorites |

**Caractéristiques** :
- Pull-to-refresh
- Skeleton loading pour chaque section
- Raccourcis conditionnels (vendeur: créer enchère, acheteur: mes offres)
- Push notification badge sur icône cloche
- Animations d'entrée staggered pour les cartes

**API** :

- `GET /api/mobile/auctions?featured=true&limit=5`
- `GET /api/mobile/prices/summary`
- `GET /api/mobile/users/me/stats`
- `GET /api/mobile/notifications/count` (badge)

---

#### Écran 07 — Enchères

| Propriété | Valeur |
|-----------|--------|
| **ID** | `auctions` |
| **Nom AR** | المزادات |
| **Icône** | `grid-outline` |
| **Route** | `/(tabs)/auctions` |
| **Auth requise** | ✅ |

**Description** : Liste paginée et filtrable de toutes les enchères actives. Recherche textuelle, filtres avancés, tri multi-critères, infinite scroll et pull-to-refresh.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  Enchères                   🔍  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔍 Rechercher une enchère │  │
│  └───────────────────────────┘  │
│                                 │
│  [Tous] [Active] [Bientôt]     │
│  [Extra Vierge] [Lampe] [Mixte]│
│  [Sfax] [Sousse] [Nabeul] +5   │
│                                 │
│  42 résultats • Trier: +récent  │
│                                 │
│  ┌────────────┬────────────────┐│
│  │  📷        │ Huile EV Sfax  ││
│  │            │ 500kg • 18.5DT ││
│  │            │ 5 offres ⏰ 2h ││
│  │            │ ★ 4.8          ││
│  └────────────┴────────────────┘│
│  ┌────────────┬────────────────┐│
│  │  📷        │ Huile Bio      ││
│  │            │ 200kg • 22DT   ││
│  │            │ 3 offres ⏰ 5h ││
│  │            │ ★ 4.5          ││
│  └────────────┴────────────────┘│
│  ┌────────────┬────────────────┐│
│  │  📷        │ Huile Lampe    ││
│  │            │ 1000kg • 12DT  ││
│  │            │ 8 offres ⏰ 1j ││
│  │            │ ★ 4.9          ││
│  └────────────┴────────────────┘│
│                                 │
│  ─── Chargement... ───          │
│                                 │
├─────┬─────┬─────┬─────┬─────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤      │
└─────┴─────┴─────┴─────┴─────────┘
```

**Filtres :**

| Filtre | Type | Options |
|--------|------|---------|
| Statut | chips | Tous, Active, Bientôt terminée, Nouvelle |
| Type d'huile | chips (multi) | Extra Vierge, Vierge, Lampe, Mixte (depuis `OliveType`) |
| Région | chips (multi) | Sfax, Sousse, Nabeul, Mahdia, Kairouan, Béja, etc. (depuis `Region`) |
| Prix | range slider | Min — Max DT/kg |
| Quantité | range slider | Min — Max kg |

**Tri :**

| Option | Valeur | Description |
|--------|--------|-------------|
| Plus récent | `createdAt_desc` | Par date de création |
| Prix croissant | `price_asc` | Prix/kg du bas vers haut |
| Prix décroissant | `price_desc` | Prix/kg du haut vers bas |
| Fin bientôt | `endDate_asc` | Bientôt terminée |
| Plus d'offres | `bidCount_desc` | Plus populaire |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Rechercher | `search` | icon-button | Barre de recherche |
| Filtres | `filter-outline` | icon-button | Bottom sheet de filtres |
| Trier | `swap-vertical` | text button | Menu tri |
| Carte enchère | — | card | → auction-detail |
| Voir photo | — | thumbnail | Galerie → plein écran |

**Caractéristiques** :
- Infinite scroll (pagination cursor-based, 20 items/page)
- Pull-to-refresh
- Skeleton loading (cards placeholders)
- Filtres persistés dans `AsyncStorage`
- Recherche debounce (300ms)
- Empty state : illustration + "Aucune enchère trouvée"

**API** : `GET /api/mobile/auctions`

**Query Params** :
```
?page=1&limit=20&status=ACTIVE&oliveTypeId=xxx&regionId=xxx
&minPrice=10&maxPrice=30&minQty=100&maxQty=5000
&search=huile+biologique&sort=createdAt_desc
```

---

#### Écran 08 — Détail d'Enchère

| Propriété | Valeur |
|-----------|--------|
| **ID** | `auction-detail` |
| **Nom AR** | تفاصيل المزاد |
| **Icône** | `document-text-outline` |
| **Route** | `/auction/[id]` |
| **Auth requise** | ✅ |

**Description** : Page complète d'une enchère avec galerie photo, informations vendeur, historique des offres en temps réel (WebSocket), timer de compte à rebours, formulaire d'enchérir, carte de localisation et options de contact/partage/signalement.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Détail           ❤️  ↗️  ⋮  │
│  ┌─────────────────────────┐    │
│  │   📷 Galerie photo      │    │
│  │   (swipeable)           │    │
│  │     ○ ○ ● ○ ○           │    │
│  └─────────────────────────┘    │
│  Huile Extra Vierge Bio         │
│  ┌──────────┐  ┌──────────────┐ │
│  │ 18.500   │  │  ⏰ 02:14:37│ │
│  │ DT/kg    │  │  LIVE       │ │
│  └──────────┘  └──────────────┘ │
│  ─── Vendeur ──────────────     │
│  👤 Ali Ben Ahmed  ★ 4.8  →    │
│  ─── Offres (5) ─── 🟢 LIVE    │
│  🥇 18.500 DT/kg  Buyer1       │
│  🥈 18.000 DT/kg  Buyer2       │
│  ─── Localisation ────────     │
│  ┌─────────────────────────┐    │
│  │  🗺️  Mini carte OSM     │    │
│  └─────────────────────────┘    │
│  ┌───────────────────────────┐  │
│  │  💰 Votre offre            │  │
│  │  Prix/kg: [________] DT   │  │
│  │  Qté:     [________] kg   │  │
│  │  Message: [________]      │  │
│  │  [    Enchérir    ]       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Champs (formulaire d'enchère) :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `pricePerKg` | number | ✅ | `Prix en DT/kg` | > offre actuelle |
| `quantity` | number | ✅ | `Quantité en kg` | > 0, ≤ quantité dispo |
| `message` | textarea | ❌ | `Message pour le vendeur` | Max 500 car. |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Favoris | `heart-outline` / `heart` | icon-button | Toggle favoris |
| Partager | `share-outline` | icon-button | Partager l'enchère |
| Enchérir | — | primary (full) | Placer offre via WebSocket |
| Chat vendeur | `chatbubble-outline` | secondary | → Conversation |
| Signaler | `flag-outline` | secondary | Signaler l'enchère |

**Caractéristiques** :
- Galerie photo swipeable avec pinch-to-zoom
- Timer LIVE temps réel (clignotant < 5 min, rouge < 1 min)
- Historique offres temps réel via WebSocket
- Calcul auto total = prix/kg × quantité
- Mini carte OpenStreetMap
- Haptic feedback sur surenchère

**API** :

- `GET /api/mobile/auctions/:id` — Détail
- `GET /api/mobile/auctions/:id/bids` — Offres
- `POST /api/mobile/auctions/:id/bids` — Placer offre
- `POST /api/mobile/auctions/:id/favorite` — Toggle favoris
- `POST /api/mobile/reports` — Signaler

**WebSocket** : `join_auction`, `new_bid`, `bid_outbid`, `auction_countdown`, `auction_closed`

---

#### Écran 09 — Carte

| Propriété | Valeur |
|-----------|--------|
| **ID** | `map` |
| **Nom AR** | الخريطة |
| **Icône** | `map-outline` |
| **Route** | `/(tabs)/map` |
| **Auth requise** | ✅ |

**Description** : Carte interactive OpenStreetMap avec clusters d'enchères géolocalisées. Filtres, bottom sheet de preview, géolocalisation et filtre de rayon.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  Carte              📍  🔍  ⚙️  │
│  ┌─────────────────────────┐    │
│  │   🗺️ OpenStreetMap      │    │
│  │      📍 📍              │    │
│  │   📍       📍(5)        │    │
│  │        📍    📍         │    │
│  │   🔵 (ma position)      │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ≋ Glissez vers le haut  │    │
│  │  📷 Huile EV Bio        │    │
│  │     18.500 DT/kg ⏰ 2h  │    │
│  │  [ Voir détails → ]     │    │
│  └─────────────────────────┘    │
├─────┬─────┬─────┬─────┬─────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤      │
└─────┴─────┴─────┴─────┴─────────┘
```

**Filtres :** Type d'huile (chips multi), Statut (chips), Rayon (slider: 5-100km), Prix (range)

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Ma position | `locate-outline` | FAB | Centrer carte |
| Marker tap | — | marker | Bottom sheet preview |
| Voir détails | — | primary | → auction-detail |

**Caractéristiques** :
- OpenStreetMap via `react-native-maps`
- Clustering avec count badge
- Bottom sheet snap points (peek, half, full)
- Cache tiles offline

**API** : `GET /api/mobile/auctions?latitude=xx&longitude=xx&radius=10&status=ACTIVE`

---

#### Écran 10 — Prix du Marché

| Propriété | Valeur |
|-----------|--------|
| **ID** | `prices` |
| **Nom AR** | الأسعار |
| **Icône** | `trending-up-outline` |
| **Route** | `/(tabs)/prices` |
| **Auth requise** | ✅ |

**Description** : Tendances de prix avec graphiques interactifs (ligne/aire) par type et région. Sélecteur de période et alertes de prix.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  Prix du Marché                 │
│  [1S] [1M] [3M] [6M] [1A]      │
│  ┌─────────────────────────┐    │
│  │  📈 Graphique ligne/aire  │    │
│  │  24 ┤     ╭─╮            │    │
│  │  20 ┤   ╭─╯ ╰─╮          │    │
│  │  16 ┤ ╭─╯       ╰─╮      │    │
│  └─────────────────────────┘    │
│  [Extra Vierge ▾] [Sfax ▾]     │
│  ┌──────────┬────────┬───────┐ │
│  │ Type     │ Moyen  │ Trend │ │
│  │ EV       │ 19.2DT │  ↑+5% │ │
│  │ Vierge   │ 15.8DT │  ↓-2% │ │
│  │ Lampe    │ 11.5DT │  →0%  │ │
│  └──────────┴────────┴───────┘ │
│  🔔 Alertes: EV < 18 DT ✅    │
├─────┬─────┬─────┬─────┬─────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤      │
└─────┴─────┴─────┴─────┴─────────┘
```

**Filtres :** Période (tabs: 1S/1M/3M/6M/1A), Type d'huile (dropdown), Région (dropdown)

**Champs (alerte prix) :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `type` | select | ✅ | `Type d'huile` | OliveType actif |
| `condition` | select | ✅ | `Condition` | < (inférieur), > (supérieur) |
| `price` | number | ✅ | `Prix en DT/kg` | > 0 |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Ajouter alerte | `add-outline` | text | Modal création alerte |
| Exporter | `download-outline` | text | Export graphique |

**API** :

- `GET /api/mobile/prices?period=1M&oliveTypeId=xxx&regionId=xxx`
- `GET /api/mobile/prices/summary`
- `POST /api/mobile/prices/alerts` — Créer alerte
- `GET /api/mobile/prices/alerts` — Lister alertes
- `DELETE /api/mobile/prices/alerts/:id` — Supprimer alerte

---

### 7.4 Vendeur (3 écrans)

---

#### Écran 11 — Créer une Enchère

| Propriété | Valeur |
|-----------|--------|
| **ID** | `create-auction` |
| **Nom AR** | إنشاء مزاد |
| **Icône** | `add-circle-outline` |
| **Route** | `/auction/create` (création) `/auction/edit/[id]` (édition) |
| **Auth requise** | ✅ (rôle SELLER ou MIXED) |

**Description** : Formulaire multi-étapes pour créer/modifier une enchère. Photos (caméra/galerie, max 5, compression auto), informations produit, localisation GPS, date de fin, certificats. Sauvegarde brouillon + prévisualisation avant publication.

**Étapes du formulaire :**

| Étape | Titre | Champs |
|-------|-------|--------|
| 1 | Photos | `images` (multi, max 5) |
| 2 | Informations | `title`, `oliveTypeId`, `regionId`, `quantity`, `reservePrice`, `description` |
| 3 | Localisation & Date | `latitude`, `longitude`, `location`, `endDate`, `certificates` |
| 4 | Prévisualisation | Résumé de toutes les données |

**Champs détaillés :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `images` | photos | ✅ | — | Min 1, max 5, JPEG/PNG, max 5MB, auto-compress 1024px |
| `title` | text | ✅ | `Titre de l'enchère` | Min 5, max 100 car. |
| `oliveTypeId` | select | ✅ | `Type d'huile` | OliveType actif |
| `regionId` | select | ✅ | `Région` | Region actif |
| `quantity` | number | ✅ | `Quantité en kg` | > 0, max 50000 |
| `reservePrice` | number | ❌ | `Prix de réserve DT/kg` | > 0 |
| `description` | textarea | ❌ | `Description détaillée` | Max 1000 car. |
| `latitude` | geo | ❌ | Via carte ou GPS | — |
| `longitude` | geo | ❌ | Via carte ou GPS | — |
| `location` | text | ❌ | `Adresse` | Auto reverse geocoding |
| `endDate` | datetime | ✅ | `Date de fin` | Min 1h, max 30 jours |
| `certificates` | files | ❌ | `Certificats (PDF/Images)` | Max 3, max 10MB chacun |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Caméra | `camera-outline` | outline | Prendre photo |
| Galerie | `images-outline` | outline | Choisir depuis galerie |
| Ma position | `locate-outline` | text | Géolocalisation GPS |
| Choisir carte | `map-outline` | map | Picker sur carte |
| Précédent | `arrow-back` | outline | Étape précédente |
| Suivant | `arrow-forward` | primary | Étape suivante (validation) |
| Brouillon | `save-outline` | secondary | Sauvegarder brouillon (DRAFT) |
| Publier | `rocket-outline` | primary (full) | Publier l'enchère (ACTIVE) |

**Caractéristiques** :
- Barre de progression par étape (25% → 50% → 75% → 100%)
- Validation à chaque étape avant passage à la suivante
- Sauvegarde auto brouillon toutes les 30s
- Compression photo auto (expo-image-manipulator)
- Upload progress indicator
- Mode édition : pré-remplir avec données existantes
- Confirmation modale avant publication

**API** :

- `POST /api/mobile/auctions` — Créer enchère (DRAFT ou ACTIVE)
- `PUT /api/mobile/auctions/:id` — Modifier brouillon
- `POST /api/mobile/auctions/:id/publish` — Publier (DRAFT → ACTIVE)
- `POST /api/mobile/upload` — Upload photo/certificat → Firebase Storage
- `GET /api/mobile/olive-types` — Liste types d'huile
- `GET /api/mobile/regions` — Liste régions

---

#### Écran 12 — Mes Enchères

| Propriété | Valeur |
|-----------|--------|
| **ID** | `my-auctions` |
| **Nom AR** | مزاداتي |
| **Icône** | `list-outline` |
| **Route** | `/seller/my-auctions` |
| **Auth requise** | ✅ (rôle SELLER ou MIXED) |

**Description** : Liste des enchères du vendeur. Gestion : publier brouillons, modifier, supprimer, clôturer. Suivi des offres reçues.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Mes Enchères          ➕     │
│  [Actives (5)] [Brouillons (2)] │
│  [Terminées (12)]               │
│  ┌────────────┬────────────────┐│
│  │  📷        │ Huile EV Sfax  ││
│  │            │ 500kg • 18.5DT ││
│  │            │ ⏰ 2h  5 offres││
│  │  [✏️][🔒]  │ ★ 4.8         ││
│  └────────────┴────────────────┘│
│  ┌────────────┬────────────────┐│
│  │  📷        │ Huile Bio      ││
│  │            │ Brouillon      ││
│  │  [✏️][🗑️]  │ [Publier →]   ││
│  └────────────┴────────────────┘│
│                         [➕ New] │
└─────────────────────────────────┘
```

**Tabs :** Actives (`ACTIVE`), Brouillons (`DRAFT`), Terminées (`CLOSED, EXPIRED`)

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Nouvelle | `add` | FAB | → create-auction |
| Modifier | `create-outline` | small | → create-auction (édition, DRAFT) |
| Supprimer | `trash-outline` | small | Supprimer (DRAFT, confirmation) |
| Publier | `send-outline` | small | DRAFT → ACTIVE |
| Clôturer | `lock-closed-outline` | small | Forcer clôture (ACTIVE) |
| Voir offres | `eye-outline` | small | Voir offres reçues |
| Dashboard | `grid-outline` | header | → seller-dashboard |

**Caractéristiques** : FAB flottant, badges count par tab, swipe-to-delete brouillons, pull-to-refresh

**API** :

- `GET /api/mobile/auctions?sellerId=me&status=ACTIVE&page=1`
- `PUT /api/mobile/auctions/:id` — Modifier
- `DELETE /api/mobile/auctions/:id` — Supprimer brouillon
- `POST /api/mobile/auctions/:id/publish` — Publier
- `POST /api/mobile/auctions/:id/close` — Clôturer

---

#### Écran 13 — Tableau de Bord Vendeur

| Propriété | Valeur |
|-----------|--------|
| **ID** | `seller-dashboard` |
| **Nom AR** | لوحة تحكم البائع |
| **Icône** | `stats-chart-outline` |
| **Route** | `/seller/dashboard` |
| **Auth requise** | ✅ (rôle SELLER ou MIXED) |

**Description** : Analytics vendeur : CA total, prix moyen, graphique mensuel, top produits, distribution acheteurs, indicateurs de performance.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Tableau de Bord Vendeur     │
│  ┌─────────┬─────────┬────────┐ │
│  │ 45.000  │ 19.2    │ 23     │ │
│  │ DT total│ DT/kg   │ Ventes │ │
│  │ ↑ +12%  │ → +0%   │ ↑ +8% │ │
│  └─────────┴─────────┴────────┘ │
│  ┌─────────────────────────┐    │
│  │  📊 Bar chart mensuel   │    │
│  └─────────────────────────┘    │
│  Top Produits:                  │
│  1. Extra Vierge Bio (15k DT)  │
│  Taux vente: 78% | Note: 4.8/5 │
└─────────────────────────────────┘
```

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Exporter | `download-outline` | icon-button | Export PDF |
| Période | — | tabs | 6 mois, 1 an, Tout |

**API** :

- `GET /api/mobile/seller/dashboard/stats`
- `GET /api/mobile/seller/dashboard/chart?period=6M`
- `GET /api/mobile/seller/dashboard/top-products`
- `GET /api/mobile/seller/dashboard/buyer-distribution`
- `GET /api/mobile/seller/dashboard/performance`

---

### 7.5 Acheteur (2 écrans)

---

#### Écran 14 — Mes Offres

| Propriété | Valeur |
|-----------|--------|
| **ID** | `my-bids` |
| **Nom AR** | عروضي |
| **Icône** | `gavel-outline` |
| **Route** | `/buyer/my-bids` |
| **Auth requise** | ✅ (rôle BUYER ou MIXED) |

**Description** : Liste des offres placées par l'acheteur. Onglets actives/gagnées/perdues, statut temps réel, alerte dépassement avec re-enchère rapide, lien transaction.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Mes Offres                   │
│  [Actives (3)] [Gagnées (5)]    │
│  [Perdues (8)]                  │
│  ┌─────────────────────────┐    │
│  │ 📷 Huile EV Sfax        │    │
│  │ Mon offre: 18.500 DT/kg │    │
│  │ 🏆 Meilleure offre !   │    │
│  │ [Voir] [⬆️ Surenchérir] │    │
│  ├─────────────────────────┤    │
│  │ 📷 Huile Bio Sousse     │    │
│  │ Mon offre: 20.000 DT/kg │    │
│  │ ⚠️ Dépassée ! 20.500   │    │
│  │ [Voir] [🔄 Re-enchérir] │    │
│  ├─────────────────────────┤    │
│  │ 📷 Huile Lampe ✅ Gagnée │    │
│  │ 12.000 DT/kg • 300kg    │    │
│  │ [→ Transaction]         │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Tabs :** Actives (`PENDING`, `WINNING`), Gagnées (`WON`), Perdues (`LOST`)

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Surenchérir | `arrow-up-outline` | primary | Re-enchérir rapidement (modal) |
| Re-enchérir | `refresh-outline` | warning | Après dépassement |
| Transaction | `receipt-outline` | primary | → transaction-detail |
| Voir enchère | `eye-outline` | outline | → auction-detail |

**Caractéristiques** : Alerte dépassement = carte rouge + vibration + snackbar, tri par urgence (fin proche), empty state par tab

**API** :

- `GET /api/mobile/bids?buyerId=me&status=WINNING,PENDING`
- `GET /api/mobile/bids?buyerId=me&status=WON`
- `GET /api/mobile/bids?buyerId=me&status=LOST`

**WebSocket** : `bid_outbid` (notification temps réel)

---

#### Écran 15 — Détail Transaction

| Propriété | Valeur |
|-----------|--------|
| **ID** | `transaction-detail` |
| **Nom AR** | تفاصيل المعاملة |
| **Icône** | `receipt-outline` |
| **Route** | `/buyer/transaction/[id]` |
| **Auth requise** | ✅ |

**Description** : Suivi complet d'une transaction. Timeline de statuts, infos paiement, coordonnées vendeur/acheteur, documents, option litige et formulaire d'avis.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Détail Transaction           │
│  Transaction #TRX-2025-001      │
│  ┌───────────────────────────┐  │
│  │  Statut: PENDING          │  │
│  │  ● Confirmed              │  │
│  │  │                        │  │
│  │  ○ Preparing              │  │
│  │  ○ Shipped                │  │
│  │  ○ Delivered              │  │
│  └───────────────────────────┘  │
│  Quantité: 300kg • 18.500 DT/kg│
│  Total: 5.550.000 DT           │
│  ─── Vendeur ───────────────    │
│  👤 Ali Ben Ahmed ★ 4.8  💬   │
│  ─── Documents ─────────────    │
│  📄 Facture  📄 Bon livraison   │
│  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │⚠️ Liti│ │⭐ Avis│ │📞 Aid│ │
│  │ ge    │ │       │ │ e    │ │
│  └──────┘  └──────┘  └──────┘ │
└─────────────────────────────────┘
```

**Timeline sous-statuts :** Confirmée → En préparation → Expédiée → Livrée

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Contacter | `chatbubble-outline` | secondary | → chat |
| Télécharger facture | `download-outline` | text | PDF |
| Ouvrir litige | `flag-outline` | outline (warning) | Modal litige |
| Laisser avis | `star-outline` | primary | → review form (si COMPLETED) |
| Aide | `help-circle-outline` | ghost | → help |

**API** :

- `GET /api/mobile/transactions/:id`
- `PUT /api/mobile/transactions/:id/status`
- `POST /api/mobile/reports` — Litige
- `POST /api/mobile/reviews` — Avis

---

### 7.6 Communication (2 écrans)

---

#### Écran 16 — Liste des Conversations

| Propriété | Valeur |
|-----------|--------|
| **ID** | `chat-list` |
| **Nom AR** | المحادثات |
| **Icône** | `chatbubbles-outline` |
| **Route** | `/chat` |
| **Auth requise** | ✅ |

**Description** : Liste des conversations avec aperçu du dernier message, badge non-lus, statut en ligne et recherche.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  Messages                  🔍   │
│  ┌───────────────────────────┐  │
│  │ 👤 Ali Ben Ahmed     🟢   │  │
│  │    "Merci pour l'enchère" │  │
│  │    il y a 5 min    (2)   │  │
│  ├───────────────────────────┤  │
│  │ 👤 Mohamed Trabelsi   ⚫   │  │
│  │    "Est-ce dispo ?"       │  │
│  │    Hier à 14:30           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Actions :** Rechercher (search), Conversation (→ chat), Swipe gauche (supprimer)

**Caractéristiques** : Tri par dernier message, badge non-lus, point en ligne/hors ligne, pull-to-refresh

**API** : `GET /api/mobile/conversations?userId=me`

---

#### Écran 17 — Conversation (Chat)

| Propriété | Valeur |
|-----------|--------|
| **ID** | `chat` |
| **Nom AR** | المحادثة |
| **Icône** | `chatbubble-outline` |
| **Route** | `/chat/[id]` |
| **Auth requise** | ✅ |

**Description** : Messagerie temps réel via WebSocket. Texte, photos, notes vocales. Accusés de lecture, indicateur de frappe, appel, blocage, partage lien enchère.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Ali Ben Ahmed  🟢     📞  ⋮ │
│          Hier, 14:30            │
│         ┌──────────────┐        │
│         │ Bonjour !     │        │
│         └──────┬───────┘        │
│                ✓✓ 14:30         │
│  ┌──────────────────────┐       │
│  │ Oui, dispo !         │       │
│  └──────────────────┬───┘       │
│                    ✓✓ 14:32     │
│                ✋ Tapping...     │
│  ┌─────────────────────────┐    │
│  │ 📎  Saisir un message... │    │
│  │ 🎤      📷     ➤       │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Champs :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `message` | text | ❌ | `Saisir un message...` | Max 2000 car. |
| `photo` | file | ❌ | — | JPEG/PNG, max 5MB |
| `voice` | audio | ❌ | — | Max 60 secondes |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Appeler | `call-outline` | icon-button | Appel téléphonique |
| Joindre photo | `camera-outline` | icon | Galerie/caméra |
| Vocal | `mic-outline` | icon | Hold-to-record |
| Envoyer | `send-outline` | icon-button | Envoyer |
| Partager enchère | `link-outline` | menu | Card preview dans chat |
| Bloquer | `ban-outline` | menu (warning) | Bloquer utilisateur |

**Caractéristiques** :
- Temps réel via WebSocket (`new_message`)
- Accusés : ✓ envoyé, ✓✓ lu
- Indicateur frappe via WebSocket (`typing_chat`)
- Notes vocales : hold-to-record, waveform inline
- Messages groupés par date
- Scroll auto vers bas
- Pagination scroll up

**API** :

- `GET /api/mobile/conversations/:id`
- `POST /api/mobile/conversations/:id/messages`
- `POST /api/mobile/upload` — Photos/voix
- `POST /api/mobile/users/:id/block`

**WebSocket** : `new_message`, `typing_chat`, `message_read`, `user_online`, `user_offline`

---

### 7.7 Utilisateur (7 écrans)

---

#### Écran 18 — Profil (avec mode édition)

| Propriété | Valeur |
|-----------|--------|
| **ID** | `profile` |
| **Nom AR** | الملف الشخصي |
| **Icône** | `person-outline` |
| **Route** | `/(tabs)/profile` |
| **Auth requise** | ✅ |

**Description** : Profil utilisateur (mode consultation par défaut). Avatar, nom, téléphone, email, entreprise, bio, badges vérification, stats, avis récents. Mode édition activé via bouton.

> **Note** : Combine `profile` et `edit-profile` en un seul écran avec mode édition inline.

**Maquette ASCII — Mode Consultation :**

```
┌─────────────────────────────────┐
│  Profil                   ⚙️    │
│         ┌─────────┐             │
│         │  Avatar  │             │
│         └─────────┘             │
│       Ali Ben Ahmed             │
│  📱 ✓  📧 ✗  🪪 ✗              │
│  Huilerie Ben Ahmed             │
│  ┌────────┬────────┬─────────┐  │
│  │ 23     │ 15     │  4.8    │  │
│  │ Ventes │ Achats │  ★★★★☆ │  │
│  └────────┴────────┴─────────┘  │
│  ─── Avis Récents ─────────    │
│  ★★★★★ "Excellent vendeur !"   │
│  ┌───────────────────────────┐  │
│  │      ✏️ Modifier profil   │  │
│  └───────────────────────────┘  │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │🔔 Notif│ │❤️ Fav│ │💰 Port│   │
│  ├──────┤ ├──────┤ ├──────┤   │
│  │⭐ Avis│ │💬 Msg│ │❓ Aid│   │
│  └──────┘ └──────┘ └──────┘   │
├─────┬─────┬─────┬─────┬─────────┤
│ 🏠  │ 🔨  │ 🗺️  │ 📊  │  👤      │
└─────┴─────┴─────┴─────┴─────────┘
```

**Maquette ASCII — Mode Édition :**

```
┌─────────────────────────────────┐
│  ← Modifier le Profil           │
│         ┌─────────┐             │
│         │  Avatar  │   📷      │
│         └─────────┘ Changer    │
│  Nom complet                    │
│  ┌───────────────────────────┐  │
│  │ Ali Ben Ahmed             │  │
│  └───────────────────────────┘  │
│  Téléphone: +216 52... ✅      │
│  Email: ali@example.com   🔗   │
│  Entreprise                    │
│  ┌───────────────────────────┐  │
│  │ Huilerie Ben Ahmed        │  │
│  └───────────────────────────┘  │
│  Bio                            │
│  ┌───────────────────────────┐  │
│  │ Producteur d'huile...     │  │
│  └───────────────────────────┘  │
│  📱 Tél: ✅  📧 Email: 🔗 Vérif│
│  🪪 Identité: 📤 Envoyer       │
│  [💾 Enregistrer] [❌ Annuler]  │
└─────────────────────────────────┘
```

**Champs (mode édition) :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `avatar` | photo | ❌ | — | JPEG/PNG, max 2MB, 400x400 |
| `name` | text | ✅ | `Nom complet` | Min 3 car. |
| `email` | email | ❌ | `Email` | Format email valide |
| `enterprise` | text | ❌ | `Entreprise` | Max 100 car. |
| `bio` | textarea | ❌ | `Bio` | Max 300 car. |

**Badges vérification :** 📱 Téléphone (OTP), 📧 Email (lien), 🪪 Identité (document + admin)

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Paramètres | `settings-outline` | icon-button | → settings |
| Modifier | `create-outline` | primary | Toggle mode édition |
| Changer avatar | `camera-outline` | overlay | Caméra/galerie |
| Vérifier email | `link-outline` | text | Envoyer email vérif |
| Enregistrer | `checkmark` | primary (full) | Sauvegarder |
| Annuler | `close` | ghost | Retour consultation |
| Notifications | `notifications-outline` | menu-item | → notifications |
| Favoris | `heart-outline` | menu-item | → favorites |
| Portefeuille | `wallet-outline` | menu-item | → wallet |
| Avis | `star-outline` | menu-item | → reviews |
| Messages | `chatbubbles-outline` | menu-item | → chat-list |
| Aide | `help-circle-outline` | menu-item | → help |

**API** :

- `GET /api/mobile/users/me`
- `PUT /api/mobile/users/me` — Modifier profil
- `POST /api/mobile/upload` — Upload avatar
- `POST /api/mobile/users/me/verify-email`
- `POST /api/mobile/users/me/verify-id`

---

#### Écran 19 — Notifications

| Propriété | Valeur |
|-----------|--------|
| **ID** | `notifications` |
| **Nom AR** | الإشعارات |
| **Icône** | `notifications-outline` |
| **Route** | `/user/notifications` |
| **Auth requise** | ✅ |

**Description** : Notifications catégorisées (enchères, messages, système). Lu/non-lu, "Tout marquer lu", boutons d'action contextuels.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Notifications    Tout lire ✓ │
│  [Toutes (12)] [Enchères]       │
│  [Messages] [Système]           │
│  ─── Aujourd'hui ──────────    │
│  ┌─────────────────────────┐    │
│  │ 🔨 Nouvelle offre !      │    │
│  │ 18.500 DT/kg sur Huile   │    │
│  │ il y a 5 min  [Voir →]  │    │
│  ├─────────────────────────┤    │
│  │ ⚠️ Offre dépassée !       │    │
│  │ 20.500 > votre 20DT      │    │
│  │ [Surenchérir]            │    │
│  └─────────────────────────┘    │
│  ─── Hier ─────────────────    │
│  ┌─────────────────────────┐    │
│  │ 🏆 Enchère gagnée !       │    │
│  │ [Transaction →]          │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Tabs :** Toutes, Enchères (`NEW_BID, BID_OUTBID, AUCTION_WON, AUCTION_CLOSED`), Messages, Système

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Tout lire | `checkmark-done` | text | Marquer toutes lues |
| Voir / Surenchérir / Transaction | — | notification-cta | Navigation contextuelle |
| Supprimer | `trash-outline` | swipe | Supprimer notification |

**Caractéristiques** : Groupées par jour, non-lu = fond coloré, tap = navigation + marquer lu, pull-to-refresh

**API** :

- `GET /api/mobile/notifications?userId=me&type=NEW_BID`
- `PUT /api/mobile/notifications/read-all`
- `PUT /api/mobile/notifications/:id/read`
- `DELETE /api/mobile/notifications/:id`

---

#### Écran 20 — Paramètres

| Propriété | Valeur |
|-----------|--------|
| **ID** | `settings` |
| **Nom AR** | الإعدادات |
| **Icône** | `settings-outline` |
| **Route** | `/user/settings` |
| **Auth requise** | ✅ |

**Description** : Langue (FR/AR/EN avec RTL instantané), thème (clair/sombre/auto), préférences notifications, confidentialité, aide, CGU, déconnexion, suppression compte.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Paramètres                   │
│  ─── Apparence ─────────────    │
│  Langue                         │
│  ┌─────────────────────────┐    │
│  │ 🇫🇷 Français           ▾  │    │
│  └─────────────────────────┘    │
│  Thème                          │
│  [☀️ Clair] [🌙 Sombre] [🔄Auto]│
│  ─── Notifications ────────    │
│  Nouvelles offres    [🔴 ON]   │
│  Offres dépassées   [🔴 ON]   │
│  Messages            [🔴 ON]   │
│  Alertes prix        [⚪ OFF]  │
│  ─── Confidentialité ───────    │
│  Profil public        [🔴 ON]  │
│  Afficher téléphone   [⚪ OFF] │
│  ─── Support ──────────────    │
│  Centre d'aide              →  │
│  CGU                        →  │
│  Version 2.0.0                 │
│  [🚪 Déconnexion]              │
│  [🗑️ Supprimer mon compte]     │
└─────────────────────────────────┘
```

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Langue | `globe-outline` | dropdown | FR/AR/EN (reload instantané) |
| Thème | `sunny`/`moon`/`auto` | tabs | Clair/Sombre/Auto |
| Toggle | — | switch | Chaque type notification/privacy |
| CGU | `document-text-outline` | row | WebView |
| Déconnexion | `log-out-outline` | outline (danger) | Confirmation modale |
| Supprimer | `trash-outline` | text (danger) | Double confirmation |

**Caractéristiques** :
- Switch langue : `I18nManager.forceRTL()` + reload instantané
- Thème auto : suit paramètres système
- Déconnexion : clear token + FCM token → login
- Suppression : double confirmation + texte à taper

**API** :

- `PUT /api/mobile/users/me/settings`
- `PUT /api/mobile/users/me/language`
- `POST /api/mobile/auth/logout`
- `DELETE /api/mobile/users/me`

---

#### Écran 21 — Favoris

| Propriété | Valeur |
|-----------|--------|
| **ID** | `favorites` |
| **Nom AR** | المفضلات |
| **Icône** | `heart-outline` |
| **Route** | `/user/favorites` |
| **Auth requise** | ✅ |

**Description** : Éléments sauvegardés. Onglets enchères/vendeurs. Statut temps réel des enchères favorites.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Favoris                      │
│  [Enchères (8)] [Vendeurs (3)]  │
│  ┌────────────┬────────────────┐│
│  │  📷  ❤️    │ Huile EV Sfax  ││
│  │            │ 18.5DT ⏰ 2h   ││
│  └────────────┴────────────────┘│
└─────────────────────────────────┘
```

**Tabs :** Enchères, Vendeurs

**Actions :** Retirer favori (heart toggle), Voir enchère (→ auction-detail), Voir vendeur (→ profile)

**API** :

- `GET /api/mobile/favorites?type=auctions|sellers`
- `POST /api/mobile/favorites/:auctionId`
- `DELETE /api/mobile/favorites/:auctionId`

---

#### Écran 22 — Portefeuille

| Propriété | Valeur |
|-----------|--------|
| **ID** | `wallet` |
| **Nom AR** | المحفظة |
| **Icône** | `wallet-outline` |
| **Route** | `/user/wallet` |
| **Auth requise** | ✅ |

**Description** : Solde, résumé revenus/dépenses, historique transactions avec filtres, export PDF, moyens de paiement.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Portefeuille                 │
│  ┌─────────────────────────┐    │
│  │  Solde: 12.500,000 DT   │    │
│  └─────────────────────────┘    │
│  ┌────────────┬────────────┐    │
│  │ +45.000    │ -32.500    │    │
│  │ Revenus    │ Dépenses   │    │
│  └────────────┴────────────┘    │
│  ─── Historique ───────────    │
│  + 9.250 DT  Vente #001  ✅    │
│  - 5.550 DT  Achat #002   ✅    │
│  [Tous] [Revenus] [Dépenses]   │
│  [📥 PDF Export] [💳 Moy. Pai.]│
└─────────────────────────────────┘
```

**Filtres :** Type (Tous/Revenus/Dépenses), Période (semaine/mois/tout)

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Export PDF | `download-outline` | text | Télécharger résumé |
| Moyens paiement | `card-outline` | text | Gérer méthodes |
| Voir transaction | — | row | → transaction-detail |

**API** :

- `GET /api/mobile/wallet/balance`
- `GET /api/mobile/wallet/transactions?type=income&period=month`
- `GET /api/mobile/wallet/export?format=pdf`

---

#### Écran 23 — Avis

| Propriété | Valeur |
|-----------|--------|
| **ID** | `reviews` |
| **Nom AR** | التقييمات |
| **Icône** | `star-outline` |
| **Route** | `/user/reviews` |
| **Auth requise** | ✅ |

**Description** : Distribution des notes, onglets reçus/donnés, cartes d'avis avec réponse, formulaire écriture (1-5 étoiles + commentaire).

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Avis                         │
│  Note globale: 4.8/5            │
│  5★ ████████████ 65%            │
│  4★ ████░░░░░░░ 25%            │
│  3★ ██░░░░░░░░░  7%            │
│  [Reçus (30)] [Donnés (15)]     │
│  ┌───────────────────────────┐  │
│  │ 👤 Mohamed ★★★★★ 15 Juin │  │
│  │ "Excellent vendeur !"     │  │
│  │              [Répondre]   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Formulaire avis (modal) :**

| Champ | Type | Requis | Placeholder | Validation |
|-------|------|--------|-------------|------------|
| `rating` | stars | ✅ | — | 1-5 |
| `comment` | textarea | ❌ | `Votre expérience...` | Max 500 car. |

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Répondre | `return-up-forward-outline` | text | Répondre à un avis |
| Écrire avis | `star-outline` | primary | Modal (si COMPLETED sans avis) |

**API** :

- `GET /api/mobile/reviews?userId=me&type=received|given`
- `POST /api/mobile/reviews` — Créer avis
- `POST /api/mobile/reviews/:id/reply` — Répondre

---

### 7.8 Aide (1 écran)

---

#### Écran 24 — Centre d'Aide

| Propriété | Valeur |
|-----------|--------|
| **ID** | `help` |
| **Nom AR** | المساعدة |
| **Icône** | `help-circle-outline` |
| **Route** | `/help` |
| **Auth requise** | ❌ |

**Description** : FAQ catégorisées, recherche, contact support (chat/email), tutoriels vidéo, version app.

**Maquette ASCII :**

```
┌─────────────────────────────────┐
│  ← Centre d'Aide               │
│  ┌───────────────────────────┐  │
│  │ 🔍 Rechercher dans l'aide │  │
│  └───────────────────────────┘  │
│  ─── Catégories ───────────    │
│  🔨 Comment enchérir ? (3)     │
│  📦 Transactions & Livraison (5)│
│  👤 Mon compte (4)              │
│  💰 Paiements (3)               │
│  ⚠️ Litiges (2)                 │
│  ─── Articles populaires ───   │
│  • Comment placer une offre ?   │
│  • Que faire si dépassé ?       │
│  ─── Contact ───────────────    │
│  [💬 Chat Direct] [📧 Email]    │
│  ─── Tutoriels ────────────    │
│  ▶️ Créer une enchère           │
│  ▶️ Guide acheteur              │
│  Version: 2.0.0                 │
└─────────────────────────────────┘
```

**Actions :**

| Action | Icône | Variante | Description |
|--------|-------|----------|-------------|
| Rechercher | `search` | search-bar | Full-text FAQ |
| Catégorie | — | row | Déplier articles |
| Chat support | `chatbubble-outline` | primary | → chat support |
| Email support | `mail-outline` | outline | Client email |
| Tutoriel | `play-circle-outline` | row | Vidéo |

**API** : `GET /api/mobile/help/faqs?search=enchere` (optionnel, peut être statique)

---

## 8. Endpoints API

> Tous les endpoints utilisent le préfixe `/api/mobile/`. Authentification via `Authorization: Bearer <token>`.

### 8.1 Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/mobile/auth/send-otp` | Envoyer OTP par SMS | ❌ |
| `POST` | `/api/mobile/auth/verify-otp` | Vérifier OTP + login | ❌ |
| `POST` | `/api/mobile/auth/register` | Inscription complète | ❌ |
| `POST` | `/api/mobile/auth/google` | Connexion Google OAuth | ❌ |
| `POST` | `/api/mobile/auth/biometric` | Connexion biométrique | ❌ |
| `POST` | `/api/mobile/auth/refresh` | Rafraîchir JWT | ✅ |
| `POST` | `/api/mobile/auth/logout` | Déconnexion | ✅ |
| `POST` | `/api/mobile/auth/fcm-token` | Enregistrer FCM token | ✅ |

### 8.2 Utilisateur

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/users/me` | Profil connecté | ✅ |
| `PUT` | `/api/mobile/users/me` | Modifier profil | ✅ |
| `GET` | `/api/mobile/users/me/stats` | Statistiques | ✅ |
| `GET` | `/api/mobile/users/:id` | Profil public | ✅ |
| `POST` | `/api/mobile/users/me/verify-email` | Vérifier email | ✅ |
| `POST` | `/api/mobile/users/me/verify-id` | Upload pièce identité | ✅ |
| `PUT` | `/api/mobile/users/me/settings` | Préférences | ✅ |
| `PUT` | `/api/mobile/users/me/language` | Changer langue | ✅ |
| `DELETE` | `/api/mobile/users/me` | Supprimer compte | ✅ |
| `POST` | `/api/mobile/users/:id/block` | Bloquer utilisateur | ✅ |

### 8.3 Enchères

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/auctions` | Liste paginée + filtres | ✅ |
| `GET` | `/api/mobile/auctions/:id` | Détail enchère | ✅ |
| `POST` | `/api/mobile/auctions` | Créer (DRAFT/ACTIVE) | ✅ |
| `PUT` | `/api/mobile/auctions/:id` | Modifier | ✅ |
| `DELETE` | `/api/mobile/auctions/:id` | Supprimer brouillon | ✅ |
| `POST` | `/api/mobile/auctions/:id/publish` | Publier | ✅ |
| `POST` | `/api/mobile/auctions/:id/close` | Clôturer | ✅ |
| `GET` | `/api/mobile/auctions/:id/bids` | Historique offres | ✅ |

### 8.4 Offres

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/bids` | Mes offres (status filter) | ✅ |
| `POST` | `/api/mobile/auctions/:id/bids` | Placer offre | ✅ |

### 8.5 Transactions

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/transactions/:id` | Détail transaction | ✅ |
| `PUT` | `/api/mobile/transactions/:id/status` | MAJ statut (vendeur) | ✅ |
| `GET` | `/api/mobile/wallet/balance` | Solde portefeuille | ✅ |
| `GET` | `/api/mobile/wallet/transactions` | Historique | ✅ |
| `GET` | `/api/mobile/wallet/export` | Export PDF | ✅ |

### 8.6 Avis

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/reviews` | Avis (type filter) | ✅ |
| `POST` | `/api/mobile/reviews` | Créer avis | ✅ |
| `POST` | `/api/mobile/reviews/:id/reply` | Répondre | ✅ |

### 8.7 Notifications

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/notifications` | Liste | ✅ |
| `GET` | `/api/mobile/notifications/count` | Count non-lus | ✅ |
| `PUT` | `/api/mobile/notifications/:id/read` | Marquer lue | ✅ |
| `PUT` | `/api/mobile/notifications/read-all` | Tout lire | ✅ |
| `DELETE` | `/api/mobile/notifications/:id` | Supprimer | ✅ |

### 8.8 Favoris

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/favorites` | Liste favoris | ✅ |
| `POST` | `/api/mobile/favorites/:auctionId` | Ajouter | ✅ |
| `DELETE` | `/api/mobile/favorites/:auctionId` | Retirer | ✅ |

### 8.9 Chat

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/conversations` | Liste conversations | ✅ |
| `GET` | `/api/mobile/conversations/:id` | Historique messages | ✅ |
| `POST` | `/api/mobile/conversations/:id/messages` | Envoyer message | ✅ |

### 8.10 Prix

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/prices` | Tendances | ✅ |
| `GET` | `/api/mobile/prices/summary` | Résumé jour | ✅ |
| `POST` | `/api/mobile/prices/alerts` | Créer alerte | ✅ |
| `GET` | `/api/mobile/prices/alerts` | Lister alertes | ✅ |
| `DELETE` | `/api/mobile/prices/alerts/:id` | Supprimer alerte | ✅ |

### 8.11 Rapports

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/mobile/reports` | Signaler | ✅ |

### 8.12 Upload

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/mobile/upload` | Upload → Firebase Storage | ✅ |

### 8.13 Référentiels

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/olive-types` | Types d'huile | ✅ |
| `GET` | `/api/mobile/regions` | Régions | ✅ |

### 8.14 Vendeur Dashboard

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/mobile/seller/dashboard/stats` | Vue d'ensemble | ✅ |
| `GET` | `/api/mobile/seller/dashboard/chart` | Graphique CA | ✅ |
| `GET` | `/api/mobile/seller/dashboard/top-products` | Top produits | ✅ |
| `GET` | `/api/mobile/seller/dashboard/buyer-distribution` | Distribution | ✅ |
| `GET` | `/api/mobile/seller/dashboard/performance` | Indicateurs | ✅ |

---

## 9. Concordance Base de Données

> Mapping entre les écrans et les modèles Prisma du schéma partagé.

### 9.1 Modèle `User`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `login` | R/W | `phone`, `fcmToken` |
| `register` | Create | `name`, `phone`, `enterprise`, `role` |
| `verify-otp` | Read | `id`, `phone`, `status` |
| `profile` | R/W | `id`, `name`, `phone`, `email`, `enterprise`, `avatar`, `role`, `rating`, `totalRatings`, `language` |
| `settings` | Write | `language`, `fcmToken` |
| `notifications` | Read | `id` (via `notifications.userId`) |
| `my-auctions` | Read | `id` (via `auctions.sellerId`) |
| `my-bids` | Read | `id` (via `bids.buyerId`) |
| `wallet` | Read | `id` (via transactions) |
| `reviews` | R/W | `id`, `rating`, `totalRatings` |

### 9.2 Modèle `Auction`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `home` | Read | `id`, `title`, `status`, `reservePrice`, `quantity`, `endDate`, `highestBidId`, `images`, `seller` |
| `auctions` | Read | Tous (liste paginée + filtres) |
| `auction-detail` | R/W | Tous + `oliveType`, `region`, `images`, `bids`, `seller`, `transaction` |
| `create-auction` | Create/Update | Tous sauf `viewCount`, `highestBidId`, `winningBidId` |
| `my-auctions` | R/W | Tous (filtrés par `sellerId`) |
| `map` | Read | `id`, `title`, `latitude`, `longitude`, `status`, `reservePrice`, `quantity`, `endDate` |
| `favorites` | Read | Tous (enchères favorites) |

**Filtres** : `status`, `oliveTypeId`, `regionId`, `reservePrice` (range), `quantity` (range), `endDate` (tri)

### 9.3 Modèle `Bid`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `auction-detail` | R/W | `id`, `auctionId`, `buyerId`, `pricePerKg`, `totalPrice`, `message`, `status`, `createdAt` |
| `my-bids` | Read | Tous (filtrés par `buyerId`) |

**Logique** : `totalPrice` = `pricePerKg` × `quantity` (de l'enchère). `status` évolue : `PENDING` → `WINNING` → `WON`/`LOST`.

### 9.4 Modèle `Transaction`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `transaction-detail` | R/W | Tous + `auction`, `seller`, `buyer`, `bid`, `reviews` |
| `wallet` | Read | `id`, `finalPrice`, `status`, `createdAt`, `sellerId`, `buyerId` |
| `my-bids` | Read | `id` (via `bid.transactionId`) |

### 9.5 Modèle `Review`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `reviews` | R/W | `id`, `transactionId`, `reviewerId`, `reviewedUserId`, `rating`, `comment` |
| `profile` | Read | `rating`, `comment` (avis reçus) |
| `transaction-detail` | R/W | `id`, `rating`, `comment` (formulaire) |

**Contrainte** : `transactionId` unique → un seul avis par transaction.

### 9.6 Modèle `Notification`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `notifications` | R/W | `id`, `userId`, `type`, `title`, `message`, `data`, `isRead`, `createdAt` |
| `home` | Read | `id` (count non-lus) |

**Types** : `NEW_BID`, `BID_OUTBID`, `AUCTION_WON`, `AUCTION_CLOSED`, `AUCTION_EXPIRED`, `TRANSACTION`, `SYSTEM`

### 9.7 Modèle `Report`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `auction-detail` | Create | `reporterId`, `auctionId`, `reason`, `description` |
| `transaction-detail` | Create | `reporterId`, `auctionId`, `reason`, `description`, `status` |

### 9.8 Modèle `OliveType`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `create-auction` | Read | `id`, `name`, `nameAr`, `nameFr`, `nameEn` |
| `auction-detail` | Read | `name`, `nameAr`, `nameFr`, `nameEn` |
| `prices` | Read | `name` (groupement stats) |
| `auctions` | Read | `id`, `name` (filtre) |

### 9.9 Modèle `Region`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `create-auction` | Read | `id`, `name`, `nameAr`, `nameFr`, `nameEn` |
| `map` | Read | `id`, `name`, `latitude`, `longitude` |
| `auction-detail` | Read | `name`, `nameAr`, `nameFr`, `nameEn` |
| `auctions` | Read | `id`, `name` (filtre) |

### 9.10 Modèle `AuctionImage`

| Écran | Opération | Champs |
|-------|-----------|--------|
| `auction-detail` | Read | `id`, `auctionId`, `url`, `order` |
| `create-auction` | Create | `auctionId`, `url`, `order` |
| `auctions` | Read | `url` (thumbnail) |
| `home` | Read | `url` (vedettes) |

### 9.11 Modèle `BackOfficeAccount`

> Non utilisé côté mobile. Réservé au back-office.

---

## 10. Structure des Fichiers

```
mobile/
├── app/                            # Expo Router — Pages
│   ├── _layout.tsx                 # Layout racine (providers, theme, fonts)
│   ├── splash.tsx                  # 01: Splash Screen
│   ├── onboarding.tsx              # 02: Onboarding
│   ├── auth/
│   │   ├── _layout.tsx
│   │   ├── login.tsx               # 03: Connexion
│   │   ├── register.tsx            # 04: Inscription
│   │   └── verify-otp.tsx          # 05: Vérification OTP
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Layout 5 tabs
│   │   ├── home.tsx                # 06: Accueil
│   │   ├── auctions.tsx            # 07: Enchères
│   │   ├── map.tsx                 # 09: Carte
│   │   ├── prices.tsx              # 10: Prix
│   │   └── profile.tsx             # 18: Profil
│   ├── auction/
│   │   ├── [id].tsx                # 08: Détail enchère
│   │   ├── create.tsx              # 11: Créer enchère
│   │   └── edit/[id].tsx           # 11: Modifier enchère
│   ├── seller/
│   │   ├── my-auctions.tsx         # 12: Mes enchères
│   │   └── dashboard.tsx           # 13: Dashboard vendeur
│   ├── buyer/
│   │   ├── my-bids.tsx             # 14: Mes offres
│   │   └── transaction/[id].tsx    # 15: Détail transaction
│   ├── chat/
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # 16: Liste conversations
│   │   └── [id].tsx                # 17: Conversation
│   ├── user/
│   │   ├── edit-profile.tsx
│   │   ├── notifications.tsx       # 19: Notifications
│   │   ├── settings.tsx            # 20: Paramètres
│   │   ├── favorites.tsx           # 21: Favoris
│   │   ├── wallet.tsx              # 22: Portefeuille
│   │   └── reviews.tsx             # 23: Avis
│   └── help.tsx                    # 24: Centre d'aide
│
├── components/
│   ├── ui/                         # Design system
│   │   ├── Button.tsx, Card.tsx, Badge.tsx, Chip.tsx
│   │   ├── Input.tsx, OTPInput.tsx
│   │   ├── BottomSheet.tsx, Skeleton.tsx, Snackbar.tsx
│   │   ├── EmptyState.tsx, FAB.tsx, Avatar.tsx
│   │   ├── Rating.tsx, PriceTag.tsx, Countdown.tsx
│   │   ├── SearchBar.tsx, PullRefresh.tsx
│   │   └── ProgressBar.tsx
│   ├── auction/
│   │   ├── AuctionCard.tsx, AuctionCarousel.tsx
│   │   ├── PhotoGallery.tsx, BidHistory.tsx
│   │   ├── BidForm.tsx, AuctionFilters.tsx
│   │   └── CreateAuctionStep.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx, MessageInput.tsx
│   │   ├── VoiceRecorder.tsx, TypingIndicator.tsx
│   │   └── ConversationItem.tsx
│   ├── map/
│   │   ├── MapView.tsx, MarkerCluster.tsx
│   │   └── AuctionMarker.tsx
│   ├── charts/
│   │   ├── PriceLineChart.tsx, RevenueBarChart.tsx
│   │   ├── RatingDistribution.tsx, PieChart.tsx
│   └── layout/
│       ├── Header.tsx, BottomNavigation.tsx
│       └── ScreenContainer.tsx
│
├── stores/                         # Zustand state management
│   ├── useAuthStore.ts             # Token, user, login/logout
│   ├── useAuctionStore.ts          # Enchères, filtres, pagination
│   ├── useBidStore.ts              # Offres, statut temps réel
│   ├── useChatStore.ts             # Conversations, messages
│   ├── useNotificationStore.ts     # Notifications, count
│   ├── useThemeStore.ts            # Light/dark/auto
│   ├── useLanguageStore.ts         # FR/AR/EN, RTL
│   ├── useFilterStore.ts           # Filtres persistés
│   └── useSocketStore.ts           # WebSocket connexion, rooms
│
├── services/
│   ├── api/
│   │   ├── client.ts               # Axios instance + interceptors
│   │   ├── auth.service.ts
│   │   ├── auction.service.ts
│   │   ├── bid.service.ts
│   │   ├── transaction.service.ts
│   │   ├── user.service.ts
│   │   ├── chat.service.ts
│   │   ├── notification.service.ts
│   │   ├── price.service.ts
│   │   ├── review.service.ts
│   │   ├── favorite.service.ts
│   │   ├── report.service.ts
│   │   ├── upload.service.ts
│   │   └── seller.service.ts
│   ├── firebase/
│   │   ├── config.ts               # Firebase config
│   │   ├── messaging.ts            # FCM: token, listeners
│   │   ├── storage.ts              # Firebase Storage: upload
│   │   └── analytics.ts            # Events tracking
│   ├── websocket/
│   │   ├── socket.ts               # Socket.io instance
│   │   ├── auction.events.ts
│   │   └── chat.events.ts
│   └── storage/
│       ├── secure-store.ts         # Biometric token
│       ├── async-storage.ts        # Preferences, filters
│       └── local-db.ts             # Offline cache (expo-sqlite)
│
├── i18n/                           # Internationalisation
│   ├── index.ts                    # i18next config
│   ├── fr/ (common, auth, auction, chat, profile, error, validation).json
│   ├── ar/ (même structure)
│   └── en/ (même structure)
│
├── utils/
│   ├── formatters.ts               # Prix (DT), date, nombre
│   ├── validators.ts               # Téléphone, email, OTP
│   ├── constants.ts                # Couleurs, tailles
│   ├── helpers.ts
│   ├── geolocation.ts
│   ├── image-utils.ts              # Compression, resize
│   └── date-utils.ts               # Relative time, countdown
│
├── hooks/
│   ├── useAuth.ts, useAuctions.ts, useBids.ts
│   ├── useChat.ts, useNotifications.ts
│   ├── useWebSocket.ts, useBiometric.ts
│   ├── useLocation.ts, useCamera.ts
│   ├── usePushNotifications.ts, useTheme.ts
│
├── types/
│   ├── api.types.ts, auction.types.ts, bid.types.ts
│   ├── chat.types.ts, user.types.ts, notification.types.ts
│
├── assets/
│   ├── images/ (logo, onboarding, empty-state)
│   └── fonts/ (Inter, NotoSansArabic)
│
├── app.json, eas.json, tsconfig.json
├── babel.config.js, package.json
└── .env
```

---

## 11. Fonctionnalités Clés

### 11.1 Mode Offline-First

- **Cache local** : `expo-sqlite` pour les enchères en cache
- **Stratégie** : Network-first avec fallback sur cache
- **Sync** : Comparaison timestamps, download delta au retour en ligne
- **Indicateur** : Bannière "Mode hors ligne" + données avec timestamp
- **Limites** : Impossible d'enchérir hors ligne, brouillons sauvegardés localement

### 11.2 Enchères Temps Réel (WebSocket)

- Connexion socket.io persistante au serveur port 3003
- Rejoindre une room par enchère (`join_auction`)
- Offres temps réel avec animation d'entrée
- Countdown synchronisé côté serveur
- Notification immédiate en cas de dépassement
- Reconnexion automatique avec restauration d'état

### 11.3 Push Notifications (Firebase)

- Enregistrement FCM token au login et à chaque ouverture
- Permissions demandées au premier lancement
- Notifications configurables par type (settings)
- Deep link : tap notification → écran concerné
- Badge count mis à jour en temps réel

### 11.4 Photos & Upload

- **Source** : Caméra ou galerie (`expo-image-picker`)
- **Compression** : Auto-resize max 1024px, qualité 80%
- **Upload** : Firebase Storage avec progress indicator
- **Limites** : 5 photos max (enchère), 3 certificats max

### 11.5 Authentification Biométrique

- Empreinte digitale (Android) et Face ID (iOS) via `expo-local-authentication`
- Stockage token dans `expo-secure-store`
- Visible uniquement si biométrie configurée
- Fallback OTP si échec 3 fois

### 11.6 Multi-langue (FR/AR/EN) avec RTL

- 3 langues : Français (défaut), Arabe, Anglais
- Basculement instantané sans rechargement complet
- **RTL** : `I18nManager.forceRTL(true)` pour l'arabe
- Polices : Inter (latin) + Noto Sans Arabic (arabe)
- Nombres et dates formatés selon la locale

### 11.7 Dark Mode

- 3 modes : Clair, Sombre, Auto (système)
- Palette complète pour chaque mode (cf. section 5.1)
- Transition animée
- Préférence sauvegardée localement

### 11.8 États de Chargement

- **Skeleton** : Placeholder animé (shimmer) pour chaque type de contenu
- **Spinner** : Actions ponctuelles (boutons, modals)
- **Progress bar** : Uploads et étapes formulaire

### 11.9 Pull-to-Refresh

- Disponible sur toutes les listes
- Animation native `RefreshControl`
- Indicateur dernière mise à jour

### 11.10 Haptic Feedback

| Action | Feedback |
|--------|----------|
| Placer offre | `success` |
| Enchère gagnée | `success` |
| Offre dépassée | `warning` |
| Erreur validation | `error` |
| Sélection chip | `light` |
| Snap bottom sheet | `medium` |

### 11.11 Accessibilité

- Labels `accessibilityLabel` sur tous les composants interactifs
- Contraste WCAG AA minimum
- Taille système respectée (Dynamic Type)
- Touch target minimum 44×44pt
- Ordre de focus logique

### 11.12 Sécurité

- **Token JWT** : Stocké dans `expo-secure-store`
- **HTTPS** : Toutes les requêtes API
- **Sanitization** : Validation client + serveur
- **Rate limiting** : 3 tentatives OTP max
- **Biometric lock** : Option verrouillage app

---

## Annexe A — Glossaire

| Terme | Définition |
|-------|------------|
| **Enchère** | Vente aux enchères d'un lot d'huile d'olive |
| **Offre (Bid)** | Proposition de prix d'un acheteur |
| **Prix de réserve** | Prix minimum accepté par le vendeur |
| **DT** | Dinar tunisien (devise) |
| **Vendeur** | Utilisateur rôle SELLER ou MIXED |
| **Acheteur** | Utilisateur rôle BUYER ou MIXED |
| **MIXED** | Utilisateur à la fois vendeur et acheteur |
| **DRAFT** | Enchère en brouillon |
| **ACTIVE** | Enchère ouverte aux offres |

---

## Annexe B — Matrice Écrans vs Modèles de Données

| Écran | User | Auction | Bid | Transaction | Review | Notif | OliveType | Region | Image | Report |
|-------|------|---------|-----|-------------|--------|-------|-----------|--------|-------|--------|
| 01 splash | — | — | — | — | — | — | — | — | — | — |
| 02 onboarding | — | — | — | — | — | — | — | — | — | — |
| 03 login | ✍R | — | — | — | — | — | — | — | — | — |
| 04 register | ✍C | — | — | — | — | — | — | — | — | — |
| 05 verify-otp | 👁R | — | — | — | — | — | — | — | — | — |
| 06 home | 👁R | 👁R | — | — | — | 👁R | — | — | 👁R | — |
| 07 auctions | — | 👁R | — | — | — | — | 👁R | 👁R | 👁R | — |
| 08 auction-detail | 👁R | 👁R ✍C | 👁R ✍C | 👁R | — | — | 👁R | 👁R | 👁R | ✍C |
| 09 map | — | 👁R | — | — | — | — | 👁R | 👁R | — | — |
| 10 prices | — | — | — | — | — | — | 👁R | 👁R | — | — |
| 11 create-auction | — | ✍C | — | — | — | — | 👁R | 👁R | ✍C | — |
| 12 my-auctions | — | 👁R ✍U ✍D | — | — | — | — | — | — | — | — |
| 13 dashboard | — | 👁R | — | 👁R | — | — | — | — | — | — |
| 14 my-bids | — | — | 👁R | 👁R | — | — | — | — | — | — |
| 15 transaction | 👁R | 👁R | 👁R | 👁R ✍U | ✍C | — | — | — | — | ✍C |
| 16 chat-list | 👁R | — | — | — | — | — | — | — | — | — |
| 17 chat | 👁R | — | — | — | — | — | — | — | — | — |
| 18 profile | 👁R ✍U | — | — | — | 👁R | — | — | — | — | — |
| 19 notifications | — | — | — | — | — | 👁R ✍U | — | — | — | — |
| 20 settings | ✍U | — | — | — | — | — | — | — | — | — |
| 21 favorites | — | 👁R | — | — | — | — | — | — | — | — |
| 22 wallet | — | — | — | 👁R | — | — | — | — | — | — |
| 23 reviews | 👁R | — | — | — | 👁R ✍C | — | — | — | — | — |
| 24 help | — | — | — | — | — | — | — | — | — | — |

> **Légende** : `👁R` = Lecture, `✍C` = Création, `✍U` = Mise à jour, `✍D` = Suppression

---

## Annexe C — Résumé des 24 Écrans

| # | ID | Nom | Nom AR | Catégorie | Route |
|---|-----|-----|--------|-----------|-------|
| 01 | `splash` | Splash Screen | شاشة البداية | Système | `/` |
| 02 | `onboarding` | Onboarding | مرحبًا بك | Système | `/onboarding` |
| 03 | `login` | Connexion | تسجيل الدخول | Auth | `/auth/login` |
| 04 | `register` | Inscription | إنشاء حساب | Auth | `/auth/register` |
| 05 | `verify-otp` | Vérification OTP | تأكيد الرمز | Auth | `/auth/verify-otp` |
| 06 | `home` | Accueil | الرئيسية | Principal | `/(tabs)/home` |
| 07 | `auctions` | Enchères | المزادات | Principal | `/(tabs)/auctions` |
| 08 | `auction-detail` | Détail Enchère | تفاصيل المزاد | Principal | `/auction/[id]` |
| 09 | `map` | Carte | الخريطة | Principal | `/(tabs)/map` |
| 10 | `prices` | Prix du Marché | الأسعار | Principal | `/(tabs)/prices` |
| 11 | `create-auction` | Créer Enchère | إنشاء مزاد | Vendeur | `/auction/create` |
| 12 | `my-auctions` | Mes Enchères | مزاداتي | Vendeur | `/seller/my-auctions` |
| 13 | `seller-dashboard` | Dashboard Vendeur | لوحة تحكم البائع | Vendeur | `/seller/dashboard` |
| 14 | `my-bids` | Mes Offres | عروضي | Acheteur | `/buyer/my-bids` |
| 15 | `transaction-detail` | Détail Transaction | تفاصيل المعاملة | Acheteur | `/buyer/transaction/[id]` |
| 16 | `chat-list` | Conversations | المحادثات | Communication | `/chat` |
| 17 | `chat` | Conversation | المحادثة | Communication | `/chat/[id]` |
| 18 | `profile` | Profil | الملف الشخصي | Utilisateur | `/(tabs)/profile` |
| 19 | `notifications` | Notifications | الإشعارات | Utilisateur | `/user/notifications` |
| 20 | `settings` | Paramètres | الإعدادات | Utilisateur | `/user/settings` |
| 21 | `favorites` | Favoris | المفضلات | Utilisateur | `/user/favorites` |
| 22 | `wallet` | Portefeuille | المحفظة | Utilisateur | `/user/wallet` |
| 23 | `reviews` | Avis | التقييمات | Utilisateur | `/user/reviews` |
| 24 | `help` | Centre d'Aide | المساعدة | Aide | `/help` |

---

*Document généré pour le développement de l'application mobile Olea v2.0*
*Dernière mise à jour : Juin 2025*

'use client'

import { useState, useMemo } from 'react'
import {
  Search, X, ChevronRight, ChevronLeft, Copy, Check, Smartphone,
  Home, Map, BarChart3, User, MessageSquare, Star, Heart,
  Bell, Settings, HelpCircle, Wallet, Plus, Send, Camera,
  ChevronDown, Shield, Globe, Eye, Filter, LocateFixed, Clock,
  ArrowLeft, Leaf, Package, TrendingUp, Award, FileText,
  Phone, Lock, Mail, Fingerprint, ImagePlus, MapPin, Calendar,
  AlertCircle, CheckCircle2, Truck, CircleDollarSign, ChevronUp,
  Share, Pencil
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

// ===================== TYPES =====================
interface InputField {
  name: string
  type: string
  required: boolean
  placeholder: string
}
interface ScreenAction {
  label: string
  type: 'primary' | 'secondary' | 'danger' | 'link' | 'icon'
  method?: string
}
interface MobileScreen {
  id: string
  nameFr: string
  category: string
  description: string
  fullDescription: string
  features: string[]
  apiEndpoint: string
  apiMethod: string
  apiPayload: string
  inputFields: InputField[]
  actions: ScreenAction[]
}
interface Category {
  id: string
  name: string
  icon: string
  color: string
}

// ===================== CONSTANTS =====================
const OLIVE = '#45A452'
const OLIVE_DARK = '#2D6B3A'
const OLIVE_LIGHT = '#86EFAC'
const OLIVE_PALE = '#F0FDF4'
const GOLD = '#F59E0B'
const SURFACE = '#F9FAFB'

// ===================== DATA =====================
const categories: Category[] = [
  { id: 'systeme', name: 'Système', icon: '🚀', color: '#10B981' },
  { id: 'authentification', name: 'Authentification', icon: '🔐', color: '#6366F1' },
  { id: 'principal', name: 'Principal', icon: '📱', color: '#F59E0B' },
  { id: 'vendeur', name: 'Vendeur', icon: '🏪', color: '#EF4444' },
  { id: 'acheteur', name: 'Acheteur', icon: '🛒', color: '#3B82F6' },
  { id: 'communication', name: 'Communication', icon: '💬', color: '#EC4899' },
  { id: 'utilisateur', name: 'Utilisateur', icon: '👤', color: '#8B5CF6' },
  { id: 'aide', name: 'Aide', icon: '❓', color: '#F97316' },
]

const screens: MobileScreen[] = [
  {
    id: 'splash', nameFr: 'Écran de chargement', category: 'systeme',
    description: "Écran d'animation au lancement avec logo et barre de progression",
    fullDescription: "Écran de démarrage affiché pendant le chargement initial de l'application. Présente le logo Olea avec une animation de chargement fluide et le slogan de la plateforme.",
    features: ['Animation logo', 'Barre de progression', 'Transition automatique', 'Slogan dynamique'],
    apiEndpoint: '/api/config', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [], actions: []
  },
  {
    id: 'onboarding', nameFr: 'Onboarding', category: 'systeme',
    description: "Parcours de découverte avec 3 étapes illustrées",
    fullDescription: "Écrans d'onboarding guidant le nouvel utilisateur à travers les fonctionnalités principales de la plateforme. 3 slides avec illustrations, titres et descriptions.",
    features: ['3 slides illustrés', 'Pagination points', 'Bouton Suivant/Skip', 'Animations de transition'],
    apiEndpoint: '/api/onboarding', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [], actions: [{ label: 'Suivant', type: 'primary' }, { label: 'Passer', type: 'secondary' }]
  },
  {
    id: 'login', nameFr: 'Connexion', category: 'authentification',
    description: "Authentification par téléphone avec options Google et biométrie",
    fullDescription: "Page de connexion avec numéro de téléphone tunisien (+216), authentification Google et biométrie (empreinte digitale/Face ID).",
    features: ['OTP téléphone', 'Google Sign-In', 'Biométrie', 'Rappel inscription'],
    apiEndpoint: '/api/auth/login', apiMethod: 'POST',
    apiPayload: '{ "phone": "+216XXXXXXXX" }',
    inputFields: [
      { name: 'phone', type: 'tel', required: true, placeholder: '+216 XX XXX XXX' }
    ],
    actions: [
      { label: 'Continuer', type: 'primary', method: 'POST' },
      { label: 'Google Sign-In', type: 'secondary' },
      { label: 'Biométrie', type: 'secondary' }
    ]
  },
  {
    id: 'register', nameFr: 'Inscription', category: 'authentification',
    description: "Formulaire d'inscription avec choix de rôle",
    fullDescription: "Formulaire complet d'inscription avec nom, téléphone, sélection de rôle (Vendeur/Acheteur/Mixte), informations entreprise et acceptation des CGU.",
    features: ['Choix de rôle', 'Champs entreprise', 'Vérification téléphone', 'CGU obligatoires'],
    apiEndpoint: '/api/auth/register', apiMethod: 'POST',
    apiPayload: '{ "name": "...", "phone": "+216...", "role": "SELLER", "company": "..." }',
    inputFields: [
      { name: 'name', type: 'text', required: true, placeholder: 'Nom complet' },
      { name: 'phone', type: 'tel', required: true, placeholder: '+216 XX XXX XXX' },
      { name: 'role', type: 'select', required: true, placeholder: 'Vendeur / Acheteur / Mixte' },
      { name: 'company', type: 'text', required: false, placeholder: 'Nom entreprise' }
    ],
    actions: [{ label: "S'inscrire", type: 'primary', method: 'POST' }]
  },
  {
    id: 'verify-otp', nameFr: 'Vérification OTP', category: 'authentification',
    description: "Saisie du code à 6 chiffres envoyé par SMS",
    fullDescription: "Écran de vérification du code OTP à 6 chiffres. Timer de renvoi à 60 secondes. Vérification automatique dès que les 6 chiffres sont saisis.",
    features: ['6 chiffres OTP', 'Auto-vérification', 'Timer renvoi', 'Renvoi SMS'],
    apiEndpoint: '/api/auth/verify-otp', apiMethod: 'POST',
    apiPayload: '{ "phone": "+216...", "code": "123456" }',
    inputFields: [
      { name: 'code', type: 'otp', required: true, placeholder: '------' }
    ],
    actions: [{ label: 'Vérifier', type: 'primary', method: 'POST' }]
  },
  {
    id: 'home', nameFr: 'Accueil', category: 'principal',
    description: "Tableau de bord principal avec stats et enchères vedettes",
    fullDescription: "Page d'accueil avec salutation personnalisée, statistiques clés (enchères actives, offres, note vendeur), section enchères vedettes et navigation par tab bar.",
    features: ['Stats rapides', 'Enchères vedettes', 'Navigation tab bar', 'Salutation personnalisée'],
    apiEndpoint: '/api/home', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Voir toutes les enchères', type: 'link' }]
  },
  {
    id: 'auctions', nameFr: 'Liste des enchères', category: 'principal',
    description: "Liste filtrable des enchères avec recherche",
    fullDescription: "Liste complète des enchères avec barre de recherche, filtres par statut (Actives/En attente/Terminées) et cartes d'enchères avec image, titre, prix et timer.",
    features: ['Recherche', 'Filtres statut', 'Cartes enchères', 'Timer compte à rebours'],
    apiEndpoint: '/api/auctions', apiMethod: 'GET', apiPayload: '{ "status": "ACTIVE", "page": 1 }',
    inputFields: [],
    actions: [{ label: 'Filtrer', type: 'secondary' }]
  },
  {
    id: 'auction-detail', nameFr: "Détail d'enchère", category: 'principal',
    description: "Page complète d'une enchère avec galerie et formulaire d'enchérir",
    fullDescription: "Vue détaillée d'une enchère avec galerie photo, titre, prix, timer, informations vendeur, historique des offres et formulaire d'enchérir.",
    features: ['Galerie photos', 'Timer live', 'Formulaire offre', 'Info vendeur'],
    apiEndpoint: '/api/auctions/[id]', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [
      { name: 'bidAmount', type: 'number', required: true, placeholder: 'Montant en DT/kg' }
    ],
    actions: [{ label: 'Enchérir', type: 'primary', method: 'POST' }]
  },
  {
    id: 'map', nameFr: 'Carte', category: 'principal',
    description: "Vue cartographique des enchères avec géolocalisation",
    fullDescription: "Carte interactive affichant les enchères par position géographique. Bottom sheet avec aperçu des enchères proches et filtres de localisation.",
    features: ['Marqueurs carte', 'Bottom sheet', 'Géolocalisation', 'Filtres localisation'],
    apiEndpoint: '/api/auctions/map', apiMethod: 'GET', apiPayload: '{ "lat": 36.8, "lng": 10.1, "radius": 50 }',
    inputFields: [],
    actions: [{ label: 'Ma position', type: 'icon' }]
  },
  {
    id: 'prices', nameFr: 'Prix du marché', category: 'principal',
    description: "Tableau de bord des prix avec graphiques et alertes",
    fullDescription: "Page des prix du marché avec graphique d'évolution, statistiques par type d'olive, tendances et possibilité de créer des alertes de prix.",
    features: ['Graphique prix', 'Stats par type', 'Tendances', 'Alertes prix'],
    apiEndpoint: '/api/prices', apiMethod: 'GET', apiPayload: '{ "period": "1M" }',
    inputFields: [],
    actions: [{ label: 'Créer alerte', type: 'primary' }]
  },
  {
    id: 'create-auction', nameFr: 'Créer une enchère', category: 'vendeur',
    description: "Formulaire multi-étapes de création d'enchère",
    fullDescription: "Formulaire guidé en 4 étapes pour créer une enchère : photos, informations produit (titre, type, région, quantité, prix), localisation GPS et date limite.",
    features: ['Multi-étapes', 'Upload photos', 'GPS localisation', 'Brouillon auto'],
    apiEndpoint: '/api/auctions', apiMethod: 'POST',
    apiPayload: '{ "title": "...", "type": "CHEMLALI", "quantity": 100, "startPrice": 15.5 }',
    inputFields: [
      { name: 'title', type: 'text', required: true, placeholder: "Titre de l'enchère" },
      { name: 'type', type: 'select', required: true, placeholder: "Type d'olive" },
      { name: 'region', type: 'select', required: true, placeholder: 'Région' },
      { name: 'quantity', type: 'number', required: true, placeholder: 'Quantité en kg' },
      { name: 'startPrice', type: 'number', required: true, placeholder: 'Prix de départ DT/kg' }
    ],
    actions: [{ label: 'Publier', type: 'primary', method: 'POST' }, { label: 'Brouillon', type: 'secondary' }]
  },
  {
    id: 'my-auctions', nameFr: 'Mes enchères', category: 'vendeur',
    description: "Gestion des enchères du vendeur avec onglets",
    fullDescription: "Liste des enchères du vendeur avec onglets Actives/Brouillons/Terminées, compteur par statut et actions rapides (modifier, supprimer, dupliquer).",
    features: ['Onglets statut', 'Compteurs', 'Actions rapides', 'FAB nouvelle'],
    apiEndpoint: '/api/seller/auctions', apiMethod: 'GET', apiPayload: '{ "status": "ACTIVE" }',
    inputFields: [],
    actions: [{ label: 'Nouvelle enchère', type: 'primary' }]
  },
  {
    id: 'seller-dashboard', nameFr: 'Tableau de bord vendeur', category: 'vendeur',
    description: "Dashboard statistiques et performance du vendeur",
    fullDescription: "Dashboard du vendeur avec revenus, prix moyen, nombre de ventes, graphique de performance et liste des top produits.",
    features: ['KPIs revenus', 'Graphique perf', 'Top produits', 'Période sélectable'],
    apiEndpoint: '/api/seller/dashboard', apiMethod: 'GET', apiPayload: '{ "period": "1M" }',
    inputFields: [],
    actions: []
  },
  {
    id: 'my-bids', nameFr: 'Mes offres', category: 'acheteur',
    description: "Suivi des offres de l'acheteur avec statuts",
    fullDescription: "Liste des offres de l'acheteur avec onglets Actives/Gagnées/Perdues, indicateur de statut en temps réel (en tête, dépassé, gagné) et possibilité de surenchérir.",
    features: ['Suivi temps réel', 'Statut visuel', 'Surenchérir', 'Historique'],
    apiEndpoint: '/api/buyer/bids', apiMethod: 'GET', apiPayload: '{ "status": "ACTIVE" }',
    inputFields: [],
    actions: [{ label: 'Surenchérir', type: 'primary', method: 'POST' }]
  },
  {
    id: 'transaction-detail', nameFr: 'Détail transaction', category: 'acheteur',
    description: "Détail complet d'une transaction avec timeline",
    fullDescription: "Vue détaillée d'une transaction avec timeline de statut, montants, informations vendeur, documents associés et historique de livraison.",
    features: ['Timeline statut', 'Documents', 'Info vendeur', 'Montants détaillés'],
    apiEndpoint: '/api/transactions/[id]', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: []
  },
  {
    id: 'chat-list', nameFr: 'Liste des messages', category: 'communication',
    description: "Boîte de réception avec conversations récentes",
    fullDescription: "Liste des conversations avec recherche, avatars, derniers messages, timestamps et badges de non-lu. Bouton pour nouvelle conversation.",
    features: ['Recherche', 'Badges non-lu', 'Avatars', 'FAB nouveau'],
    apiEndpoint: '/api/chats', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Nouveau message', type: 'primary' }]
  },
  {
    id: 'chat', nameFr: 'Conversation', category: 'communication',
    description: "Interface de messagerie en temps réel",
    fullDescription: "Interface de chat avec bulles de messages (envoyées à droite, reçues à gauche), timestamps, barre de saisie et bouton d'envoi.",
    features: ['Messages temps réel', 'Bulles stylisées', 'Timestamps', 'Barre saisie'],
    apiEndpoint: '/api/chats/[id]/messages', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [
      { name: 'message', type: 'text', required: true, placeholder: 'Votre message...' }
    ],
    actions: [{ label: 'Envoyer', type: 'primary', method: 'POST' }]
  },
  {
    id: 'edit-profile', nameFr: 'Modifier profil', category: 'utilisateur',
    description: "Formulaire d'édition du profil utilisateur",
    fullDescription: "Formulaire de modification du profil avec avatar modifiable, nom, téléphone, entreprise, bio et bouton de sauvegarde.",
    features: ['Avatar modifiable', 'Champs profil', 'Bio', 'Sauvegarde'],
    apiEndpoint: '/api/user/profile', apiMethod: 'PATCH',
    apiPayload: '{ "name": "...", "phone": "+216...", "bio": "..." }',
    inputFields: [
      { name: 'name', type: 'text', required: true, placeholder: 'Nom complet' },
      { name: 'phone', type: 'tel', required: true, placeholder: '+216 XX XXX XXX' },
      { name: 'company', type: 'text', required: false, placeholder: 'Entreprise' },
      { name: 'bio', type: 'textarea', required: false, placeholder: 'Biographie' }
    ],
    actions: [{ label: 'Sauvegarder', type: 'primary', method: 'PATCH' }]
  },
  {
    id: 'notifications', nameFr: 'Notifications', category: 'utilisateur',
    description: "Centre de notifications avec filtres",
    fullDescription: "Liste des notifications avec onglets (Tous/Enchères/Système), icônes par type, timestamps et marquage comme lu.",
    features: ['Filtres type', 'Marquer lu', 'Timestamps', 'Icônes catégorie'],
    apiEndpoint: '/api/notifications', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Tout marquer lu', type: 'secondary' }]
  },
  {
    id: 'settings', nameFr: 'Paramètres', category: 'utilisateur',
    description: "Paramètres de l'application et du compte",
    fullDescription: "Page de paramètres avec profil, apparence (thème), langue, notifications, confidentialité et informations légales.",
    features: ['Thème sombre/clair', 'Langue', 'Notifications toggle', 'Confidentialité'],
    apiEndpoint: '/api/user/settings', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Déconnexion', type: 'danger' }]
  },
  {
    id: 'favorites', nameFr: 'Favoris', category: 'utilisateur',
    description: "Liste des enchères sauvegardées en favoris",
    fullDescription: "Liste des enchères favorites avec compteur, cartes d'enchères et bouton de suppression des favoris.",
    features: ['Liste favoris', 'Compteur', 'Supprimer', 'Accès rapide enchère'],
    apiEndpoint: '/api/user/favorites', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: []
  },
  {
    id: 'wallet', nameFr: 'Portefeuille', category: 'utilisateur',
    description: "Solde et historique des transactions financières",
    fullDescription: "Portefeuille numérique avec solde affiché en carte, liste des transactions (débit/crédit) et options de rechargement/retrait.",
    features: ['Solde carte', 'Historique transactions', 'Débit/Crédit', 'Rechargement'],
    apiEndpoint: '/api/wallet', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Recharger', type: 'primary' }]
  },
  {
    id: 'reviews', nameFr: 'Avis', category: 'utilisateur',
    description: "Avis et évaluations des transactions",
    fullDescription: "Page des avis avec note globale moyenne, liste des avis avec étoiles, texte, date et avatar de l'auteur.",
    features: ['Note globale', 'Liste avis', 'Étoiles', 'Filtre note'],
    apiEndpoint: '/api/reviews', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: []
  },
  {
    id: 'help', nameFr: "Centre d'aide", category: 'aide',
    description: "FAQ et support utilisateur",
    fullDescription: "Centre d'aide avec barre de recherche, FAQ en accordéon et bouton de contact support.",
    features: ['Recherche FAQ', 'Accordéon', 'Contact support', 'Catégories aide'],
    apiEndpoint: '/api/help/faq', apiMethod: 'GET', apiPayload: '{}',
    inputFields: [],
    actions: [{ label: 'Contacter le support', type: 'primary' }]
  },
]

// ===================== STATUS BAR =====================
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-2 pb-1" style={{ fontSize: '10px' }}>
      <span className="font-semibold text-gray-800">9:41</span>
      <div className="flex items-center gap-1">
        {/* Signal */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="#1f2937" />
          <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="#1f2937" />
          <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="#1f2937" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#1f2937" />
        </svg>
        {/* WiFi */}
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M6 8.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fill="#1f2937" />
          <path d="M3.05 6.95a4 4 0 015.9 0" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1.1 5a7 7 0 019.8 0" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <rect x="0.5" y="0.5" width="16" height="9" rx="2" stroke="#1f2937" strokeWidth="1" />
          <rect x="2" y="2" width="12" height="6" rx="1" fill="#45A452" />
          <path d="M17.5 3v4a2 2 0 000-4z" fill="#1f2937" />
        </svg>
      </div>
    </div>
  )
}

// ===================== HOME INDICATOR =====================
function HomeIndicator() {
  return (
    <div className="flex justify-center pb-2 pt-1">
      <div className="w-24 h-1 bg-gray-300 rounded-full" />
    </div>
  )
}

// ===================== BOTTOM TAB BAR =====================
function BottomTabBar({ active = 0 }: { active?: number }) {
  const tabs = [
    { icon: Home, label: 'Accueil' },
    { icon: Package, label: 'Enchères' },
    { icon: Map, label: 'Carte' },
    { icon: BarChart3, label: 'Prix' },
    { icon: User, label: 'Profil' },
  ]
  return (
    <div className="flex items-center justify-around border-t border-gray-100 bg-white pt-1.5 pb-0.5">
      {tabs.map((tab, i) => {
        const Icon = tab.icon
        const isActive = i === active
        return (
          <div key={i} className="flex flex-col items-center gap-0.5" style={{ minWidth: '36px' }}>
            <Icon size={16} color={isActive ? OLIVE : '#9CA3AF'} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: '8px', color: isActive ? OLIVE : '#9CA3AF', fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ===================== PHONE FRAME =====================
function PhoneFrame({ children, size = 'sm' }: { children: React.ReactNode; size?: 'sm' | 'lg' }) {
  const w = size === 'sm' ? 200 : 375
  const h = size === 'sm' ? 400 : 780
  const innerScale = size === 'sm' ? 0.64 : 1

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: w + 16, height: h + 16 }}
    >
      {/* Outer bezel */}
      <div
        className="absolute inset-0 rounded-[40px]"
        style={{ background: 'linear-gradient(145deg, #2d2d3f, #1a1a2e)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      />
      {/* Inner bezel highlight */}
      <div
        className="absolute rounded-[38px]"
        style={{ inset: 2, background: 'linear-gradient(145deg, #3d3d4f, #2a2a3e)' }}
      />
      {/* Screen area */}
      <div
        className="absolute rounded-[34px] overflow-hidden bg-white flex flex-col"
        style={{
          inset: 6,
          width: w + 4,
          height: h + 4,
        }}
      >
        {/* Dynamic island */}
        <div className="flex justify-center pt-1.5">
          <div className="w-16 h-4 bg-black rounded-full" />
        </div>
        {/* Status bar */}
        <StatusBar />
        {/* Screen content */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ transform: `scale(${innerScale})`, transformOrigin: 'top left', width: `${100 / innerScale}%`, height: `${100 / innerScale}%` }}>
          {children}
        </div>
        {/* Home indicator */}
        <HomeIndicator />
      </div>
    </div>
  )
}

// ===================== SCREEN MOCKUPS =====================

// 1. Splash
function SplashScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: `linear-gradient(160deg, ${OLIVE_DARK}, ${OLIVE}, #2D8B3A)` }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
          <Leaf size={36} color="white" />
        </div>
        <span className="text-white font-bold text-2xl tracking-wider">OLEA</span>
        <span className="text-white/70 text-[9px] tracking-wide">ENCHÈRES D&apos;HUILE D&apos;OLIVE PREMIUM</span>
        <div className="w-32 h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div className="w-2/3 h-full bg-white rounded-full" />
        </div>
      </div>
    </div>
  )
}

// 2. Onboarding
function OnboardingScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Illustration area */}
      <div className="flex-1 flex items-center justify-center" style={{ background: OLIVE_PALE }}>
        <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE_LIGHT}, ${OLIVE})` }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M9 22V12h6v10" /></svg>
        </div>
      </div>
      {/* Content */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <h2 className="font-bold text-sm text-center text-gray-900">Enchérissez en temps réel</h2>
        <p className="text-center text-gray-500" style={{ fontSize: '9px' }}>Participez aux enchères d&apos;huile d&apos;olive premium directement depuis votre téléphone</p>
        {/* Pagination */}
        <div className="flex justify-center gap-1.5">
          <div className="w-5 h-1.5 rounded-full" style={{ background: OLIVE }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
        {/* Buttons */}
        <div className="flex gap-2 mt-1">
          <button className="flex-1 py-2 rounded-xl text-gray-500 font-medium border border-gray-200" style={{ fontSize: '10px' }}>Passer</button>
          <button className="flex-1 py-2 rounded-xl text-white font-medium" style={{ fontSize: '10px', background: OLIVE }}>Suivant</button>
        </div>
      </div>
    </div>
  )
}

// 3. Login
function LoginScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_DARK})` }}>
            <Leaf size={24} color="white" />
          </div>
          <span className="font-bold text-base" style={{ color: OLIVE_DARK }}>OLEA</span>
        </div>
        <h2 className="font-bold text-sm text-center text-gray-900">Connectez-vous</h2>
        {/* Phone input */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
          <span style={{ fontSize: '10px' }}>🇹🇳</span>
          <span className="text-gray-500" style={{ fontSize: '10px' }}>+216</span>
          <div className="w-px h-4 bg-gray-300" />
          <span className="text-gray-400" style={{ fontSize: '10px' }}>XX XXX XXX</span>
        </div>
        {/* Continue button */}
        <button className="w-full py-2.5 rounded-xl text-white font-semibold" style={{ fontSize: '11px', background: OLIVE }}>
          Continuer
        </button>
        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400" style={{ fontSize: '9px' }}>ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        {/* Google */}
        <button className="w-full py-2.5 rounded-xl font-medium border border-gray-200 flex items-center justify-center gap-2" style={{ fontSize: '10px' }}>
          <span style={{ fontSize: '12px' }}>G</span>
          <span className="text-gray-700">Continuer avec Google</span>
        </button>
        {/* Biometry */}
        <button className="w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2" style={{ fontSize: '10px', background: '#F3F4F6' }}>
          <Fingerprint size={14} color="#6B7280" />
          <span className="text-gray-700">Biométrie</span>
        </button>
        {/* Register link */}
        <p className="text-center mt-1" style={{ fontSize: '9px' }}>
          <span className="text-gray-400">Pas de compte ? </span>
          <span className="font-semibold" style={{ color: OLIVE }}>S&apos;inscrire</span>
        </p>
      </div>
    </div>
  )
}

// 4. Register
function RegisterScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Inscription</span>
      </div>
      <div className="flex-1 px-4 flex flex-col gap-2.5 overflow-hidden">
        {/* Fields */}
        {['Nom complet', 'Téléphone'].map((label) => (
          <div key={label}>
            <label className="text-gray-600 font-medium mb-1 block" style={{ fontSize: '9px' }}>{label}</label>
            <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <span className="text-gray-400" style={{ fontSize: '10px' }}>{label === 'Téléphone' ? '+216 XX XXX XXX' : label}</span>
            </div>
          </div>
        ))}
        {/* Role chips */}
        <div>
          <label className="text-gray-600 font-medium mb-1.5 block" style={{ fontSize: '9px' }}>Rôle</label>
          <div className="flex gap-1.5">
            {['Vendeur', 'Acheteur', 'Mixte'].map((role, i) => (
              <span key={role} className="px-3 py-1.5 rounded-full font-medium" style={{
                fontSize: '9px',
                background: i === 0 ? OLIVE : '#F3F4F6',
                color: i === 0 ? 'white' : '#6B7280',
              }}>
                {role}
              </span>
            ))}
          </div>
        </div>
        {/* Company */}
        <div>
          <label className="text-gray-600 font-medium mb-1 block" style={{ fontSize: '9px' }}>Entreprise (optionnel)</label>
          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
            <span className="text-gray-400" style={{ fontSize: '10px' }}>Nom de l&apos;entreprise</span>
          </div>
        </div>
        {/* CGU */}
        <div className="flex items-start gap-2 mt-1">
          <div className="w-3.5 h-3.5 mt-0.5 rounded border-2 flex-shrink-0" style={{ borderColor: OLIVE, background: OLIVE }}>
            <Check size={8} color="white" strokeWidth={3} />
          </div>
          <span className="text-gray-500" style={{ fontSize: '8px' }}>J&apos;accepte les conditions générales d&apos;utilisation</span>
        </div>
        {/* CTA */}
        <button className="w-full py-2.5 rounded-xl text-white font-semibold mt-auto mb-3" style={{ fontSize: '11px', background: OLIVE }}>
          S&apos;inscrire
        </button>
      </div>
    </div>
  )
}

// 5. Verify OTP
function VerifyOTPScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
      </div>
      <div className="flex-1 px-4 flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: OLIVE_PALE }}>
          <Mail size={24} color={OLIVE} />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-sm text-gray-900 mb-1">Vérification</h2>
          <p className="text-gray-500" style={{ fontSize: '9px' }}>Code envoyé au +216 98 765 432</p>
        </div>
        {/* OTP boxes */}
        <div className="flex gap-2">
          {[4, 2, 7, null, null, null].map((digit, i) => (
            <div key={i} className="w-9 h-11 rounded-xl flex items-center justify-center font-bold text-base" style={{
              background: digit !== null ? OLIVE_PALE : '#F9FAFB',
              border: digit !== null ? `2px solid ${OLIVE}` : '2px solid #E5E7EB',
              color: digit !== null ? OLIVE_DARK : '#D1D5DB',
            }}>
              {digit !== null ? digit : ''}
            </div>
          ))}
        </div>
        {/* Resend */}
        <p className="text-gray-400" style={{ fontSize: '9px' }}>Renvoyer dans <span className="font-semibold text-gray-600">0:45</span></p>
        {/* Verify button */}
        <button className="w-full py-2.5 rounded-xl text-white font-semibold mt-auto" style={{ fontSize: '11px', background: OLIVE }}>
          Vérifier
        </button>
      </div>
    </div>
  )
}

// 6. Home
function HomeScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        <span className="font-bold text-base" style={{ color: OLIVE_DARK }}>Olea</span>
        <div className="flex gap-2">
          <Bell size={16} color="#6B7280" />
          <MessageSquare size={16} color="#6B7280" />
        </div>
      </div>
      {/* Greeting */}
      <div className="px-4 pb-2">
        <p className="text-gray-500" style={{ fontSize: '10px' }}>Bonjour Ahmed 👋</p>
      </div>
      {/* Stat cards */}
      <div className="flex gap-2 px-4 pb-3">
        {[
          { label: 'Enchères', value: '24', icon: Package, bg: OLIVE_PALE, color: OLIVE },
          { label: 'Mes offres', value: '8', icon: TrendingUp, bg: '#FEF3C7', color: '#D97706' },
          { label: 'Note', value: '4.8', icon: Star, bg: '#FCE7F3', color: '#DB2777' },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 rounded-xl p-2" style={{ background: stat.bg }}>
            <stat.icon size={14} color={stat.color} />
            <p className="font-bold text-base mt-1" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-gray-500" style={{ fontSize: '8px' }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {/* Featured */}
      <div className="px-4 pb-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-gray-900">Enchères vedettes</span>
          <span className="font-medium" style={{ fontSize: '9px', color: OLIVE }}>Voir tout</span>
        </div>
      </div>
      {/* Auction cards */}
      <div className="flex-1 px-4 flex flex-col gap-2 pb-2 overflow-hidden">
        {[{ title: 'Olive Chemlali Premium', price: '18.500', region: 'Sfax', time: '02:14:37' },
          { title: 'Huile Extra Vierge Bio', price: '22.000', region: 'Sousse', time: '05:30:12' }].map((a) => (
          <div key={a.title} className="flex gap-2.5 p-2 rounded-xl border border-gray-100 bg-gray-50/50">
            <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE_LIGHT}, ${OLIVE})` }}>
              <Leaf size={18} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '10px' }}>{a.title}</p>
              <p className="text-gray-400" style={{ fontSize: '8px' }}>{a.region} • {a.time}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold" style={{ fontSize: '11px', color: GOLD }}>{a.price} DT/kg</span>
                <span className="px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: '7px', background: OLIVE }}>Actif</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar active={0} />
    </div>
  )
}

// 7. Auctions
function AuctionsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        <span className="font-bold text-base text-gray-900">Enchères</span>
        <Search size={16} color="#6B7280" />
      </div>
      {/* Search bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={12} color="#9CA3AF" />
          <span className="text-gray-400" style={{ fontSize: '10px' }}>Rechercher une enchère...</span>
        </div>
      </div>
      {/* Filter chips */}
      <div className="flex gap-1.5 px-4 pb-2.5">
        {['Actives', 'Attente', 'Terminées'].map((f, i) => (
          <span key={f} className="px-3 py-1 rounded-full font-medium" style={{
            fontSize: '9px',
            background: i === 0 ? OLIVE : '#F3F4F6',
            color: i === 0 ? 'white' : '#6B7280',
          }}>{f}</span>
        ))}
      </div>
      {/* Auction list */}
      <div className="flex-1 px-4 flex flex-col gap-2 overflow-hidden">
        {[
          { title: 'Olive Chemlali Premium', price: '18.500', region: 'Sfax', bids: 12, time: '02:14:37' },
          { title: 'Huile Extra Vierge Bio', price: '22.000', region: 'Sousse', bids: 8, time: '05:30:12' },
          { title: 'Olive Chétoui 1er Press', price: '15.200', region: 'Nabeul', bids: 5, time: '08:45:00' },
        ].map((a) => (
          <div key={a.title} className="flex gap-2.5 p-2 rounded-xl border border-gray-100">
            <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE_LIGHT}, ${OLIVE})` }}>
              <Leaf size={18} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '10px' }}>{a.title}</p>
              <p className="text-gray-400" style={{ fontSize: '8px' }}>{a.region} • {a.bids} offres • {a.time}</p>
              <span className="font-bold" style={{ fontSize: '11px', color: GOLD }}>{a.price} DT/kg</span>
            </div>
          </div>
        ))}
      </div>
      <BottomTabBar active={1} />
    </div>
  )
}

// 8. Auction Detail
function AuctionDetailScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <ChevronLeft size={16} color="#6B7280" />
        <div className="flex gap-2">
          <Heart size={16} color="#9CA3AF" />
          <Share size={16} color="#9CA3AF" />
        </div>
      </div>
      {/* Photo */}
      <div className="mx-4 h-28 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE_PALE}, #DCFCE7)` }}>
        <Leaf size={36} color={OLIVE} strokeWidth={1.2} />
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1 py-1.5">
        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? OLIVE : '#D1D5DB' }} />)}
      </div>
      {/* Info */}
      <div className="px-4 flex flex-col gap-2 flex-1 overflow-hidden">
        <div>
          <p className="font-bold text-sm text-gray-900">Olive Chemlali Premium</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full font-bold" style={{ fontSize: '10px', background: '#FEF3C7', color: GOLD }}>18.500 DT/kg</span>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '9px', background: '#FEE2E2', color: '#DC2626' }}>🔴 02:14:37</span>
          </div>
        </div>
        {/* Seller */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '9px', background: OLIVE }}>MB</div>
          <div>
            <p className="font-medium text-gray-900" style={{ fontSize: '10px' }}>Maison Ben Ali</p>
            <p className="text-gray-400" style={{ fontSize: '8px' }}>Sfax • ⭐ 4.8</p>
          </div>
        </div>
        {/* Bid form */}
        <div className="flex gap-2 mt-auto mb-2">
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
            <span className="text-gray-400" style={{ fontSize: '10px' }}>Montant DT/kg</span>
          </div>
          <button className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ fontSize: '10px', background: OLIVE }}>
            Enchérir
          </button>
        </div>
      </div>
    </div>
  )
}

// 9. Map
function MapScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Map placeholder */}
      <div className="flex-1 relative" style={{ background: `linear-gradient(180deg, #E8F5E9, #F1F5F9)` }}>
        {/* Map grid lines */}
        <div className="absolute inset-0" style={{ opacity: 0.15 }}>
          {[...Array(8)].map((_, i) => (
            <div key={`h${i}`} className="absolute w-full border-t border-gray-400" style={{ top: `${(i + 1) * 12}%` }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={`v${i}`} className="absolute h-full border-l border-gray-400" style={{ left: `${(i + 1) * 16}%` }} />
          ))}
        </div>
        {/* Markers */}
        <div className="absolute" style={{ top: '25%', left: '30%' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: OLIVE }}>
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="absolute" style={{ top: '40%', left: '60%' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: GOLD }}>
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="absolute" style={{ top: '55%', left: '35%' }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center shadow-sm" style={{ background: '#EF4444' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
        <div className="absolute" style={{ top: '35%', left: '20%' }}>
          <div className="w-4 h-4 rounded-full flex items-center justify-center shadow-sm" style={{ background: OLIVE }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
        {/* FABs */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center">
            <Filter size={14} color="#6B7280" />
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ background: OLIVE }}>
            <LocateFixed size={14} color="white" />
          </div>
        </div>
      </div>
      {/* Bottom sheet */}
      <div className="bg-white rounded-t-2xl px-4 pt-2 pb-1 border-t border-gray-100" style={{ minHeight: '80px' }}>
        <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${OLIVE_LIGHT}, ${OLIVE})` }} />
          <div className="flex-1">
            <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>Olive Chemlali Premium</p>
            <p className="text-gray-400" style={{ fontSize: '8px' }}>Sfax • 2.3 km</p>
          </div>
          <span className="font-bold" style={{ fontSize: '10px', color: GOLD }}>18.500 DT</span>
        </div>
      </div>
      <BottomTabBar active={2} />
    </div>
  )
}

// 10. Prices
function PricesScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-2 pb-2">
        <span className="font-bold text-base text-gray-900">Prix du marché</span>
      </div>
      {/* Period tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {['1S', '1M', '3M', '6M', '1A'].map((p, i) => (
          <span key={p} className="px-2.5 py-1 rounded-lg font-medium" style={{
            fontSize: '9px',
            background: i === 1 ? OLIVE : '#F3F4F6',
            color: i === 1 ? 'white' : '#6B7280',
          }}>{p}</span>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="mx-4 h-28 rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3 flex flex-col justify-end">
        {/* Y axis labels */}
        <div className="flex items-end justify-between h-full gap-1">
          {[35, 55, 42, 70, 48, 85, 60].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{
                height: `${v}%`,
                background: i === 5 ? `linear-gradient(to top, ${OLIVE}, ${OLIVE_LIGHT})` : `linear-gradient(to top, ${OLIVE}33, ${OLIVE_LIGHT}66)`,
              }} />
            </div>
          ))}
        </div>
      </div>
      {/* Stats rows */}
      <div className="mx-4 flex flex-col gap-1.5 flex-1 overflow-hidden">
        {[
          { type: 'Chemlali', avg: '18.500 DT', trend: '+2.3%', up: true },
          { type: 'Chétoui', avg: '15.200 DT', trend: '-1.1%', up: false },
          { type: 'Olive Noire', avg: '12.800 DT', trend: '+0.5%', up: true },
        ].map((s) => (
          <div key={s.type} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
            <span className="text-gray-700 font-medium" style={{ fontSize: '10px' }}>{s.type}</span>
            <span className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{s.avg}</span>
            <span className="font-medium" style={{ fontSize: '9px', color: s.up ? OLIVE : '#DC2626' }}>
              {s.up ? '↑' : '↓'} {s.trend}
            </span>
          </div>
        ))}
        <button className="w-full py-2 rounded-xl border-2 font-semibold mt-1 mb-2" style={{ fontSize: '10px', borderColor: OLIVE, color: OLIVE }}>
          Créer alerte
        </button>
      </div>
      <BottomTabBar active={3} />
    </div>
  )
}

// 11. Create Auction
function CreateAuctionScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-xs text-gray-900">Créer une enchère</span>
        <span style={{ fontSize: '9px', color: '#9CA3AF' }}>Étape 1/4</span>
      </div>
      {/* Step indicator */}
      <div className="px-4 py-1.5">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="w-1/4 h-full rounded-full" style={{ background: OLIVE }} />
        </div>
      </div>
      {/* Photo slots */}
      <div className="px-4 py-2">
        <p className="font-medium text-gray-700 mb-1.5" style={{ fontSize: '10px' }}>Photos</p>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center" style={{
              borderColor: i === 0 ? OLIVE : '#D1D5DB',
              background: i === 0 ? OLIVE_PALE : '#F9FAFB',
            }}>
              {i === 0 ? (
                <ImagePlus size={18} color={OLIVE} />
              ) : (
                <span style={{ fontSize: '18px', color: '#D1D5DB' }}>+</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Form fields */}
      <div className="flex-1 px-4 flex flex-col gap-1.5 overflow-hidden">
        {[
          { label: 'Titre', placeholder: "Titre de l'enchère" },
          { label: 'Type', placeholder: "Type d'olive" },
          { label: 'Région', placeholder: 'Sélectionner' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-gray-600 mb-0.5 block" style={{ fontSize: '8px' }}>{f.label}</label>
            <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
              <span className="text-gray-400" style={{ fontSize: '9px' }}>{f.placeholder}</span>
            </div>
          </div>
        ))}
        {/* Quantity + Price row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-gray-600 mb-0.5 block" style={{ fontSize: '8px' }}>Quantité</label>
            <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
              <span className="text-gray-400" style={{ fontSize: '9px' }}>kg</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-gray-600 mb-0.5 block" style={{ fontSize: '8px' }}>Prix départ</label>
            <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
              <span className="text-gray-400" style={{ fontSize: '9px' }}>DT/kg</span>
            </div>
          </div>
        </div>
        {/* GPS + Date row */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <MapPin size={10} color="#9CA3AF" />
            <span className="text-gray-400" style={{ fontSize: '9px' }}>Géolocaliser</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Calendar size={10} color="#9CA3AF" />
            <span className="text-gray-400" style={{ fontSize: '9px' }}>Date limite</span>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 mt-auto mb-2">
          <button className="flex-1 py-2 rounded-xl font-medium border border-gray-200" style={{ fontSize: '10px', color: '#6B7280' }}>Brouillon</button>
          <button className="flex-1 py-2 rounded-xl text-white font-semibold" style={{ fontSize: '10px', background: OLIVE }}>Publier</button>
        </div>
      </div>
    </div>
  )
}

// 12. My Auctions
function MyAuctionsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} color="#6B7280" />
          <span className="font-bold text-sm text-gray-900">Mes enchères</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: OLIVE }}>
          <Plus size={14} color="white" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3">
        {[
          { label: 'Actives', count: 5, active: true },
          { label: 'Brouillons', count: 2, active: false },
          { label: 'Terminées', count: 12, active: false },
        ].map(t => (
          <span key={t.label} className="px-3 py-1.5 rounded-full font-medium flex items-center gap-1" style={{
            fontSize: '9px',
            background: t.active ? OLIVE : '#F3F4F6',
            color: t.active ? 'white' : '#6B7280',
          }}>
            {t.label}
            <span className="px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: '7px', background: t.active ? 'rgba(255,255,255,0.3)' : '#D1D5DB' }}>{t.count}</span>
          </span>
        ))}
      </div>
      {/* Auction cards */}
      <div className="flex-1 px-4 flex flex-col gap-2 overflow-hidden">
        {[
          { title: 'Olive Chemlali Premium', price: '18.500 DT', bids: 12, status: 'active' },
          { title: 'Huile Extra Vierge Bio', price: '22.000 DT', bids: 8, status: 'active' },
        ].map(a => (
          <div key={a.title} className="p-2.5 rounded-xl border border-gray-100 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{a.title}</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: '8px' }}>{a.bids} offres • Sfax</p>
                <span className="font-bold mt-1 block" style={{ fontSize: '11px', color: GOLD }}>{a.price}</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"><Pencil size={12} color="#6B7280" /></div>
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"><Eye size={12} color="#6B7280" /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 13. Seller Dashboard
function SellerDashboardScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Tableau de bord</span>
      </div>
      {/* Period tabs */}
      <div className="flex gap-1 px-4 pb-2">
        {['7J', '1M', '3M', '1A'].map((p, i) => (
          <span key={p} className="px-2.5 py-1 rounded-lg font-medium" style={{
            fontSize: '9px',
            background: i === 1 ? OLIVE : '#F3F4F6',
            color: i === 1 ? 'white' : '#6B7280',
          }}>{p}</span>
        ))}
      </div>
      {/* Stat cards */}
      <div className="flex gap-2 px-4 pb-2">
        {[
          { label: 'Revenus', value: '12.450 DT', icon: CircleDollarSign, color: OLIVE },
          { label: 'Prix moy.', value: '17.8 DT', icon: TrendingUp, color: GOLD },
          { label: 'Ventes', value: '28', icon: Package, color: '#6366F1' },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl p-2 bg-gray-50">
            <s.icon size={14} color={s.color} />
            <p className="font-bold text-sm mt-1 text-gray-900">{s.value.split(' ')[0]}</p>
            <p className="text-gray-400" style={{ fontSize: '7px' }}>{s.label}</p>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="mx-4 h-24 rounded-xl bg-gray-50 border border-gray-100 p-2 mb-2 flex items-end gap-1.5">
        {[40, 65, 35, 80, 55, 90, 70].map((v, i) => (
          <div key={i} className="flex-1 rounded-t" style={{
            height: `${v}%`,
            background: i === 5 ? OLIVE : `${OLIVE}44`,
          }} />
        ))}
      </div>
      {/* Top products */}
      <div className="px-4 flex-1 overflow-hidden">
        <p className="font-semibold text-gray-900 mb-1.5" style={{ fontSize: '10px' }}>Top produits</p>
        {[
          { name: 'Chemlali Premium', sold: 8, revenue: '14.800 DT' },
          { name: 'Extra Vierge Bio', sold: 5, revenue: '11.000 DT' },
          { name: 'Olive Noire Kilo', sold: 3, revenue: '3.840 DT' },
        ].map((p, i) => (
          <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '8px', background: i === 0 ? GOLD : i === 1 ? '#9CA3AF' : '#CD7F32' }}>{i + 1}</span>
              <div>
                <p className="text-gray-900 font-medium" style={{ fontSize: '9px' }}>{p.name}</p>
                <p className="text-gray-400" style={{ fontSize: '7px' }}>{p.sold} ventes</p>
              </div>
            </div>
            <span className="font-semibold" style={{ fontSize: '9px', color: OLIVE }}>{p.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 14. My Bids
function MyBidsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Mes offres</span>
      </div>
      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3">
        {[
          { label: 'Actives', active: true },
          { label: 'Gagnées', active: false },
          { label: 'Perdues', active: false },
        ].map(t => (
          <span key={t.label} className="px-3 py-1.5 rounded-full font-medium" style={{
            fontSize: '9px',
            background: t.active ? OLIVE : '#F3F4F6',
            color: t.active ? 'white' : '#6B7280',
          }}>{t.label}</span>
        ))}
      </div>
      {/* Bid cards */}
      <div className="flex-1 px-4 flex flex-col gap-2 overflow-hidden">
        {[
          { title: 'Olive Chemlali', myBid: '18.500 DT', status: 'winning', statusLabel: 'En tête' },
          { title: 'Extra Vierge Bio', myBid: '19.000 DT', status: 'outbid', statusLabel: 'Dépassé' },
          { title: 'Chétoui 1er Press', myBid: '14.200 DT', status: 'won', statusLabel: 'Gagné' },
        ].map(b => (
          <div key={b.title} className="p-2.5 rounded-xl border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{b.title}</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: '8px' }}>Mon offre : <span className="font-semibold text-gray-700">{b.myBid}</span></p>
              </div>
              <span className="px-2 py-0.5 rounded-full font-medium" style={{
                fontSize: '8px',
                background: b.status === 'winning' ? OLIVE_PALE : b.status === 'outbid' ? '#FEE2E2' : '#DBEAFE',
                color: b.status === 'winning' ? OLIVE_DARK : b.status === 'outbid' ? '#DC2626' : '#2563EB',
              }}>
                {b.statusLabel}
              </span>
            </div>
            {b.status === 'outbid' && (
              <button className="mt-2 w-full py-1.5 rounded-lg text-white font-medium" style={{ fontSize: '9px', background: OLIVE }}>
                Surenchérir
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 15. Transaction Detail
function TransactionDetailScreen() {
  const steps = [
    { label: 'Confirmée', icon: CheckCircle2, done: true },
    { label: 'Préparation', icon: Package, done: true },
    { label: 'Expédiée', icon: Truck, done: true },
    { label: 'Livrée', icon: CheckCircle2, done: false },
  ]
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-xs text-gray-900">Détail transaction</span>
      </div>
      {/* Status badge */}
      <div className="px-4 pb-2">
        <span className="px-3 py-1 rounded-full font-medium" style={{ fontSize: '9px', background: '#FEF3C7', color: '#D97706' }}>📦 En transit</span>
      </div>
      {/* Timeline */}
      <div className="px-4 py-2">
        <div className="flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: step.done ? OLIVE : '#E5E7EB' }}>
                  <step.icon size={12} color={step.done ? 'white' : '#9CA3AF'} />
                </div>
                {i < steps.length - 1 && <div className="w-0.5 h-6" style={{ background: step.done ? OLIVE : '#E5E7EB' }} />}
              </div>
              <div className="pb-2">
                <p className="font-medium" style={{ fontSize: '9px', color: step.done ? '#111827' : '#9CA3AF' }}>{step.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Amounts */}
      <div className="mx-4 p-2.5 rounded-xl bg-gray-50 mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-500" style={{ fontSize: '9px' }}>Montant</span>
          <span className="font-bold text-gray-900" style={{ fontSize: '11px' }}>1.850 DT</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500" style={{ fontSize: '9px' }}>Quantité</span>
          <span className="text-gray-700" style={{ fontSize: '9px' }}>100 kg</span>
        </div>
      </div>
      {/* Seller info */}
      <div className="mx-4 p-2.5 rounded-xl border border-gray-100 mb-2">
        <p className="text-gray-500 mb-1" style={{ fontSize: '8px' }}>Vendeur</p>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '9px', background: OLIVE }}>MB</div>
          <div>
            <p className="font-medium text-gray-900" style={{ fontSize: '10px' }}>Maison Ben Ali</p>
            <p className="text-gray-400" style={{ fontSize: '8px' }}>Sfax</p>
          </div>
        </div>
      </div>
      {/* Documents */}
      <div className="mx-4 mb-2">
        <p className="font-semibold text-gray-900 mb-1.5" style={{ fontSize: '10px' }}>Documents</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <FileText size={12} color={OLIVE} />
            <span style={{ fontSize: '9px' }} className="text-gray-700">Facture</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <FileText size={12} color="#6B7280" />
            <span style={{ fontSize: '9px' }} className="text-gray-700">Bon livraison</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 16. Chat List
function ChatListScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} color="#6B7280" />
          <span className="font-bold text-sm text-gray-900">Messages</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: OLIVE }}>
          <Plus size={14} color="white" />
        </div>
      </div>
      {/* Search */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
          <Search size={12} color="#9CA3AF" />
          <span className="text-gray-400" style={{ fontSize: '9px' }}>Rechercher...</span>
        </div>
      </div>
      {/* Conversations */}
      <div className="flex-1 px-4 flex flex-col overflow-hidden">
        {[
          { name: 'Maison Ben Ali', msg: 'Merci pour votre intérêt, la qualité...', time: '14:32', unread: 2 },
          { name: 'Oliviers de Sousse', msg: 'Le lot est disponible, quand souhaitez...', time: 'Hier', unread: 0 },
          { name: 'Ferme El Manar', msg: 'Prix mis à jour : 17.500 DT/kg', time: 'Lun', unread: 1 },
        ].map(c => (
          <div key={c.name} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: '10px', background: c.name === 'Maison Ben Ali' ? OLIVE : c.name === 'Oliviers de Sousse' ? '#6366F1' : GOLD }}>
              {c.name.split(' ').map(w => w[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{c.name}</p>
                <span className="text-gray-400 flex-shrink-0" style={{ fontSize: '8px' }}>{c.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-gray-400 truncate" style={{ fontSize: '8px' }}>{c.msg}</p>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ml-1" style={{ fontSize: '7px', background: OLIVE }}>{c.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 17. Chat
function ChatScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2 border-b border-gray-100">
        <ChevronLeft size={16} color="#6B7280" />
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '9px', background: OLIVE }}>MB</div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>Maison Ben Ali</p>
          <p className="text-green-500" style={{ fontSize: '7px' }}>En ligne</p>
        </div>
        <Phone size={14} color="#6B7280" />
      </div>
      {/* Messages */}
      <div className="flex-1 px-3 py-2 flex flex-col gap-2 overflow-hidden">
        {/* Received */}
        <div className="flex gap-1.5 max-w-[80%]">
          <div className="px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: '#F3F4F6' }}>
            <p className="text-gray-800" style={{ fontSize: '9px' }}>Bonjour, quel est le prix actuel pour le lot Chemlali ?</p>
            <p className="text-gray-400 mt-0.5 text-right" style={{ fontSize: '7px' }}>14:30</p>
          </div>
        </div>
        {/* Sent */}
        <div className="flex gap-1.5 max-w-[80%] self-end">
          <div className="px-3 py-2 rounded-2xl rounded-tr-sm" style={{ background: OLIVE }}>
            <p className="text-white" style={{ fontSize: '9px' }}>18.500 DT/kg, qualité premium certifiée 🌿</p>
            <p className="text-white/60 mt-0.5 text-right" style={{ fontSize: '7px' }}>14:32 ✓✓</p>
          </div>
        </div>
        {/* Received */}
        <div className="flex gap-1.5 max-w-[80%]">
          <div className="px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: '#F3F4F6' }}>
            <p className="text-gray-800" style={{ fontSize: '9px' }}>Merci pour votre intérêt, la qualité est excellente !</p>
            <p className="text-gray-400 mt-0.5 text-right" style={{ fontSize: '7px' }}>14:35</p>
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
        <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5">
          <span className="text-gray-400" style={{ fontSize: '9px' }}>Message...</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: OLIVE }}>
          <Send size={14} color="white" />
        </div>
      </div>
    </div>
  )
}

// 18. Edit Profile
function EditProfileScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Modifier profil</span>
      </div>
      {/* Avatar */}
      <div className="flex flex-col items-center py-3">
        <div className="relative">
          <div className="w-18 h-18 rounded-full flex items-center justify-center text-white font-bold" style={{ width: 68, height: 68, fontSize: '22px', background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_DARK})` }}>
            AA
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: OLIVE, border: '2px solid white' }}>
            <Camera size={11} color="white" />
          </div>
        </div>
      </div>
      {/* Form */}
      <div className="flex-1 px-4 flex flex-col gap-2.5 overflow-hidden">
        {[
          { label: 'Nom complet', value: 'Ahmed Abdelli' },
          { label: 'Téléphone', value: '+216 98 765 432' },
          { label: 'Entreprise', value: 'Tunisian Olives Co.' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-gray-600 font-medium mb-0.5 block" style={{ fontSize: '9px' }}>{f.label}</label>
            <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <span className="text-gray-800" style={{ fontSize: '10px' }}>{f.value}</span>
            </div>
          </div>
        ))}
        {/* Bio */}
        <div>
          <label className="text-gray-600 font-medium mb-0.5 block" style={{ fontSize: '9px' }}>Bio</label>
          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200" style={{ minHeight: '48px' }}>
            <span className="text-gray-800" style={{ fontSize: '9px' }}>Passionné d&apos;huile d&apos;olive tunisienne depuis 15 ans 🌿</span>
          </div>
        </div>
        {/* Save */}
        <button className="w-full py-2.5 rounded-xl text-white font-semibold mt-auto mb-3" style={{ fontSize: '11px', background: OLIVE }}>
          Sauvegarder
        </button>
      </div>
    </div>
  )
}

// 19. Notifications
function NotificationsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Notifications</span>
      </div>
      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-2">
        {['Tous', 'Enchères', 'Système'].map((t, i) => (
          <span key={t} className="px-3 py-1.5 rounded-full font-medium" style={{
            fontSize: '9px',
            background: i === 0 ? OLIVE : '#F3F4F6',
            color: i === 0 ? 'white' : '#6B7280',
          }}>{t}</span>
        ))}
      </div>
      {/* Notification items */}
      <div className="flex-1 px-4 flex flex-col overflow-hidden">
        {[
          { icon: '🔔', title: 'Offre dépassée', desc: 'Votre offre sur Chemlali a été dépassée', time: 'Il y a 5 min', unread: true },
          { icon: '🎉', title: 'Enchère gagnée !', desc: 'Félicitations ! Vous avez remporté...', time: 'Il y a 1h', unread: true },
          { icon: '📦', title: 'Commande expédiée', desc: 'Votre commande #1234 a été expédiée', time: 'Hier', unread: false },
          { icon: '⭐', title: 'Nouvel avis', desc: 'Maison Ben Ali vous a laissé un avis', time: 'Lun', unread: false },
        ].map((n) => (
          <div key={n.title} className="flex gap-2.5 py-2.5 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: n.unread ? OLIVE_PALE : '#F3F4F6', fontSize: '16px' }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{n.title}</p>
                {n.unread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: OLIVE }} />}
              </div>
              <p className="text-gray-400 truncate" style={{ fontSize: '8px' }}>{n.desc}</p>
              <p className="text-gray-300 mt-0.5" style={{ fontSize: '7px' }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 20. Settings
function SettingsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Paramètres</span>
      </div>
      {/* Profile card */}
      <div className="mx-4 mb-3 p-3 rounded-xl flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${OLIVE_PALE}, #DCFCE7)` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '14px', background: OLIVE }}>AA</div>
        <div>
          <p className="font-bold text-gray-900" style={{ fontSize: '11px' }}>Ahmed Abdelli</p>
          <p className="text-gray-500" style={{ fontSize: '9px' }}>ahmed@email.com</p>
        </div>
        <ChevronRight size={14} color="#9CA3AF" className="ml-auto" />
      </div>
      {/* Settings groups */}
      <div className="flex-1 px-4 flex flex-col gap-3 overflow-hidden">
        {[
          { title: 'Apparence', items: [
            { label: 'Mode sombre', type: 'toggle' as const },
            { label: 'Langue', value: 'Français', type: 'arrow' as const },
          ]},
          { title: 'Notifications', items: [
            { label: 'Push notifications', type: 'toggle' as const },
            { label: 'Email', type: 'toggle' as const },
          ]},
          { title: 'Confidentialité', items: [
            { label: 'Localisation', type: 'toggle' as const },
            { label: 'Données personnelles', type: 'arrow' as const },
          ]},
        ].map(group => (
          <div key={group.title}>
            <p className="text-gray-400 font-medium mb-1" style={{ fontSize: '9px' }}>{group.title}</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {group.items.map((item, i) => (
                <div key={item.label} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <span className="text-gray-700" style={{ fontSize: '10px' }}>{item.label}</span>
                  {item.type === 'toggle' ? (
                    <div className="w-8 h-4 rounded-full relative" style={{ background: OLIVE }}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white absolute right-0.5 top-0.5 shadow-sm" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400" style={{ fontSize: '9px' }}>{item.value}</span>
                      <ChevronRight size={12} color="#9CA3AF" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Logout */}
        <button className="w-full py-2 rounded-xl font-medium mt-auto mb-3 text-center" style={{ fontSize: '10px', color: '#DC2626', background: '#FEE2E2' }}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}

// 21. Favorites
function FavoritesScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} color="#6B7280" />
          <span className="font-bold text-sm text-gray-900">Favoris</span>
        </div>
        <span className="px-2 py-0.5 rounded-full font-medium" style={{ fontSize: '9px', background: '#FEF3C7', color: GOLD }}>5</span>
      </div>
      {/* Favorite cards */}
      <div className="flex-1 px-4 flex flex-col gap-2 overflow-hidden">
        {[
          { title: 'Olive Chemlali Premium', price: '18.500 DT/kg', region: 'Sfax', time: '02:14:37' },
          { title: 'Huile Extra Vierge Bio', price: '22.000 DT/kg', region: 'Sousse', time: '05:30:12' },
          { title: 'Olive Chétoui du Nord', price: '15.200 DT/kg', region: 'Nabeul', time: '08:45:00' },
        ].map(a => (
          <div key={a.title} className="flex gap-2.5 p-2.5 rounded-xl border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE_LIGHT}, ${OLIVE})` }}>
              <Leaf size={18} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '10px' }}>{a.title}</p>
              <p className="text-gray-400" style={{ fontSize: '8px' }}>{a.region} • {a.time}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold" style={{ fontSize: '10px', color: GOLD }}>{a.price}</span>
                <Heart size={14} fill="#EF4444" color="#EF4444" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 22. Wallet
function WalletScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Portefeuille</span>
      </div>
      {/* Balance card */}
      <div className="mx-4 p-4 rounded-2xl flex flex-col items-center" style={{ background: `linear-gradient(135deg, ${OLIVE_DARK}, ${OLIVE})` }}>
        <p className="text-white/70" style={{ fontSize: '9px' }}>Solde disponible</p>
        <p className="text-white font-bold text-2xl mt-1">2.450,00 <span className="text-base font-normal">DT</span></p>
        <div className="flex gap-2 mt-3">
          <button className="px-4 py-1.5 rounded-xl bg-white/20 text-white font-medium" style={{ fontSize: '9px' }}>Recharger</button>
          <button className="px-4 py-1.5 rounded-xl bg-white/20 text-white font-medium" style={{ fontSize: '9px' }}>Retirer</button>
        </div>
      </div>
      {/* Transaction list */}
      <div className="flex-1 px-4 mt-3 overflow-hidden">
        <p className="font-semibold text-gray-900 mb-2 text-xs">Transactions</p>
        {[
          { title: "Achat Chemlali", amount: "-185,00 DT", type: "debit", date: "Aujourd'hui" },
          { title: 'Rechargement', amount: '+500,00 DT', type: 'credit', date: 'Hier' },
          { title: 'Vente Extra Vierge', amount: '+220,00 DT', type: 'credit', date: 'Lun' },
          { title: 'Frais plateforme', amount: '-18,50 DT', type: 'debit', date: 'Dim' },
        ].map(t => (
          <div key={t.title} className="flex items-center gap-2.5 py-2 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.type === 'credit' ? OLIVE_PALE : '#FEE2E2' }}>
              {t.type === 'credit' ? (
                <TrendingUp size={14} color={OLIVE} />
              ) : (
                <TrendingUp size={14} color="#DC2626" style={{ transform: 'rotate(180deg)' }} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium" style={{ fontSize: '10px' }}>{t.title}</p>
              <p className="text-gray-400" style={{ fontSize: '8px' }}>{t.date}</p>
            </div>
            <span className="font-bold" style={{ fontSize: '10px', color: t.type === 'credit' ? OLIVE : '#DC2626' }}>{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 23. Reviews
function ReviewsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Avis</span>
      </div>
      {/* Overall rating */}
      <div className="mx-4 p-3 rounded-xl bg-gray-50 flex items-center gap-3 mb-2">
        <div className="text-center">
          <p className="font-bold text-2xl text-gray-900">4.8</p>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={10} fill={s <= 4 ? GOLD : 'none'} color={s <= 4 ? GOLD : '#D1D5DB'} />
            ))}
          </div>
          <p className="text-gray-400 mt-0.5" style={{ fontSize: '7px' }}>24 avis</p>
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          {[{ stars: 5, pct: 75 }, { stars: 4, pct: 17 }, { stars: 3, pct: 4 }, { stars: 2, pct: 2 }, { stars: 1, pct: 2 }].map(r => (
            <div key={r.stars} className="flex items-center gap-1">
              <span className="text-gray-400 w-2" style={{ fontSize: '7px' }}>{r.stars}</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: GOLD }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Review cards */}
      <div className="flex-1 px-4 flex flex-col gap-2 overflow-hidden">
        {[
          { name: 'Mohamed K.', avatar: 'MK', color: OLIVE, stars: 5, text: 'Excellent produit ! Qualité premium conforme à la description. Livraison rapide.', date: 'Il y a 2 jours' },
          { name: 'Sarra L.', avatar: 'SL', color: '#6366F1', stars: 4, text: 'Très bonne huile, goût authentique. Emballage soigné.', date: 'Il y a 5 jours' },
        ].map(r => (
          <div key={r.name} className="p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '8px', background: r.color }}>{r.avatar}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900" style={{ fontSize: '10px' }}>{r.name}</p>
                <p className="text-gray-400" style={{ fontSize: '7px' }}>{r.date}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={8} fill={s <= r.stars ? GOLD : 'none'} color={s <= r.stars ? GOLD : '#D1D5DB'} />
                ))}
              </div>
            </div>
            <p className="text-gray-600" style={{ fontSize: '9px' }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 24. Help
function HelpScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <ChevronLeft size={16} color="#6B7280" />
        <span className="font-bold text-sm text-gray-900">Centre d&apos;aide</span>
      </div>
      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search size={12} color="#9CA3AF" />
          <span className="text-gray-400" style={{ fontSize: '10px' }}>Rechercher dans l&apos;aide...</span>
        </div>
      </div>
      {/* FAQ */}
      <div className="flex-1 px-4 flex flex-col gap-1.5 overflow-hidden">
        <p className="font-semibold text-gray-900 mb-1" style={{ fontSize: '11px' }}>Questions fréquentes</p>
        {[
          { q: 'Comment enchérir ?', open: true, a: 'Sélectionnez une enchère, entrez votre montant et validez. Vous recevrez une notification si vous êtes dépassé.' },
          { q: 'Comment créer une enchère ?', open: false },
          { q: 'Quels sont les frais ?', open: false },
          { q: 'Comment retirer mes gains ?', open: false },
          { q: 'Comment contester une transaction ?', open: false },
        ].map(faq => (
          <div key={faq.q} className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="font-medium text-gray-900" style={{ fontSize: '10px' }}>{faq.q}</span>
              {faq.open ? (
                <ChevronUp size={12} color="#6B7280" />
              ) : (
                <ChevronDown size={12} color="#6B7280" />
              )}
            </div>
            {faq.open && faq.a && (
              <div className="px-3 pb-2.5">
                <p className="text-gray-500" style={{ fontSize: '9px' }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
        {/* Contact button */}
        <button className="w-full py-2.5 rounded-xl text-white font-semibold mt-auto mb-3 flex items-center justify-center gap-2" style={{ fontSize: '10px', background: OLIVE }}>
          <MessageSquare size={14} />
          Contacter le support
        </button>
      </div>
    </div>
  )
}

// ===================== SCREEN RENDERER MAP =====================
const screenComponents: Record<string, React.FC> = {
  'splash': SplashScreen,
  'onboarding': OnboardingScreen,
  'login': LoginScreen,
  'register': RegisterScreen,
  'verify-otp': VerifyOTPScreen,
  'home': HomeScreen,
  'auctions': AuctionsScreen,
  'auction-detail': AuctionDetailScreen,
  'map': MapScreen,
  'prices': PricesScreen,
  'create-auction': CreateAuctionScreen,
  'my-auctions': MyAuctionsScreen,
  'seller-dashboard': SellerDashboardScreen,
  'my-bids': MyBidsScreen,
  'transaction-detail': TransactionDetailScreen,
  'chat-list': ChatListScreen,
  'chat': ChatScreen,
  'edit-profile': EditProfileScreen,
  'notifications': NotificationsScreen,
  'settings': SettingsScreen,
  'favorites': FavoritesScreen,
  'wallet': WalletScreen,
  'reviews': ReviewsScreen,
  'help': HelpScreen,
}

// ===================== SCREEN CARD =====================
function ScreenCard({ screen, onClick }: { screen: MobileScreen; onClick: () => void }) {
  const ScreenComp = screenComponents[screen.id]
  const cat = categories.find(c => c.id === screen.category)

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center gap-3">
        {/* Category badge */}
        <div className="flex items-center justify-between w-full">
          <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: cat?.color, color: cat?.color }}>
            <span>{cat?.icon}</span>
            {cat?.name}
          </Badge>
          <span className="text-[10px] text-gray-400 font-mono">#{screen.id}</span>
        </div>

        {/* Phone mockup */}
        <div className="my-1">
          <PhoneFrame size="sm">
            {ScreenComp && <ScreenComp />}
          </PhoneFrame>
        </div>

        {/* Name & description */}
        <div className="text-center w-full">
          <h3 className="font-semibold text-sm text-gray-900">{screen.nameFr}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{screen.description}</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1 justify-center w-full">
          {screen.features.slice(0, 3).map(f => (
            <span key={f} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: OLIVE_PALE, color: OLIVE_DARK }}>
              {f}
            </span>
          ))}
          {screen.features.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
              +{screen.features.length - 3}
            </span>
          )}
        </div>

        {/* API info */}
        {screen.apiEndpoint && (
          <div className="flex items-center gap-1.5 w-full">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{
              background: screen.apiMethod === 'GET' ? '#3B82F6' : screen.apiMethod === 'POST' ? OLIVE : screen.apiMethod === 'PATCH' ? GOLD : '#EF4444',
            }}>
              {screen.apiMethod}
            </span>
            <span className="text-[9px] text-gray-400 font-mono truncate">{screen.apiEndpoint}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ===================== DETAIL DIALOG =====================
function ScreenDetailDialog({ screen, open, onOpenChange }: { screen: MobileScreen | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const copyText = async (text: string, type: 'endpoint' | 'payload') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'endpoint') { setCopiedEndpoint(true); setTimeout(() => setCopiedEndpoint(false), 2000) }
      else { setCopiedPayload(true); setTimeout(() => setCopiedPayload(false), 2000) }
    } catch { /* no-op */ }
  }

  if (!screen) return null
  const ScreenComp = screenComponents[screen.id]
  const cat = categories.find(c => c.id === screen.category)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-[90vw] h-[90vh] overflow-hidden p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1" style={{ borderColor: cat?.color, color: cat?.color }}>
              <span>{cat?.icon}</span> {cat?.name}
            </Badge>
            <span className="text-xs text-gray-400 font-mono">#{screen.id}</span>
          </div>
          <DialogTitle className="text-xl">{screen.nameFr}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6 pt-2">
            {/* Responsive layout: stacked on small, side-by-side on large */}
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left: phone mockup */}
              <div className="flex-shrink-0 flex justify-center">
                <PhoneFrame size="lg">
                  {ScreenComp && <ScreenComp />}
                </PhoneFrame>
              </div>

              {/* Right: details */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{screen.fullDescription}</p>
                </div>

                {/* API Endpoint */}
                {screen.apiEndpoint && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">API Endpoint</h4>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-white flex-shrink-0" style={{
                        background: screen.apiMethod === 'GET' ? '#3B82F6' : screen.apiMethod === 'POST' ? OLIVE : screen.apiMethod === 'PATCH' ? GOLD : '#EF4444',
                      }}>
                        {screen.apiMethod}
                      </span>
                      <code className="text-xs text-gray-700 flex-1 break-all">{screen.apiEndpoint}</code>
                      <button
                        onClick={() => copyText(screen.apiEndpoint, 'endpoint')}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {copiedEndpoint ? <Check size={14} color={OLIVE} /> : <Copy size={14} color="#6B7280" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* API Payload */}
                {screen.apiPayload && screen.apiPayload !== '{}' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Payload</h4>
                    <div className="relative">
                      <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">{screen.apiPayload}</pre>
                      <button
                        onClick={() => copyText(screen.apiPayload, 'payload')}
                        className="absolute top-2 right-2 p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                      >
                        {copiedPayload ? <Check size={12} color="white" /> : <Copy size={12} color="#9CA3AF" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Fonctionnalités</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {screen.features.map(f => (
                      <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Input fields */}
                {screen.inputFields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Champs de saisie</h4>
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">Nom</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">Type</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">Requis</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">Placeholder</th>
                          </tr>
                        </thead>
                        <tbody>
                          {screen.inputFields.map(field => (
                            <tr key={field.name} className="border-t border-gray-100">
                              <td className="px-3 py-1.5 font-mono font-medium text-gray-900 whitespace-nowrap">{field.name}</td>
                              <td className="px-3 py-1.5 whitespace-nowrap"><Badge variant="outline" className="text-[10px]">{field.type}</Badge></td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                {field.required ? (
                                  <span className="text-green-600 font-medium">Oui</span>
                                ) : (
                                  <span className="text-gray-400">Non</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-gray-500">{field.placeholder}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {screen.actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Actions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {screen.actions.map(action => (
                        <Badge
                          key={action.label}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: action.type === 'primary' ? OLIVE : action.type === 'danger' ? '#EF4444' : '#D1D5DB',
                            color: action.type === 'primary' ? OLIVE : action.type === 'danger' ? '#EF4444' : '#6B7280',
                          }}
                        >
                          {action.method && <span className="font-bold mr-1">{action.method}</span>}
                          {action.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ===================== MAIN PAGE =====================
export default function MobilePreviewPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedScreen, setSelectedScreen] = useState<MobileScreen | null>(null)

  const filteredScreens = useMemo(() => {
    return screens.filter(s => {
      const matchCategory = activeCategory === 'all' || s.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch = !q ||
        s.nameFr.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.features.some(f => f.toLowerCase().includes(q))
      return matchCategory && matchSearch
    })
  }, [search, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: screens.length }
    categories.forEach(c => { counts[c.id] = screens.filter(s => s.category === c.id).length })
    return counts
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${OLIVE}, ${OLIVE_DARK})` }}>
            <Smartphone size={20} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mobile Preview</h1>
            <p className="text-sm text-gray-500">{screens.length} écrans de l&apos;application Olea</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map(cat => (
          <Card key={cat.id} className="border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="text-xl">{cat.icon}</div>
              <div>
                <p className="text-lg font-bold text-gray-900">{categoryCounts[cat.id]}</p>
                <p className="text-xs text-gray-500">{cat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, ID, description ou fonctionnalité..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="cursor-pointer px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
          style={activeCategory === 'all' ? { background: OLIVE_PALE, borderColor: OLIVE, color: OLIVE_DARK } : {}}
          onClick={() => setActiveCategory('all')}
        >
          Tous ({categoryCounts.all})
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat.id}
            variant="outline"
            className="cursor-pointer px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
            style={activeCategory === cat.id ? { background: OLIVE_PALE, borderColor: OLIVE, color: OLIVE_DARK } : {}}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name} ({categoryCounts[cat.id]})
          </Badge>
        ))}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filteredScreens.length}</span> écran{filteredScreens.length > 1 ? 's' : ''} affiché{filteredScreens.length > 1 ? 's' : ''}
          {(search || activeCategory !== 'all') && (
            <span> (filtré{filteredScreens.length > 1 ? 's' : ''})</span>
          )}
        </p>
        {(search || activeCategory !== 'all') && (
          <button
            onClick={() => { setSearch(''); setActiveCategory('all') }}
            className="text-xs font-medium hover:underline"
            style={{ color: OLIVE }}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Screen cards grid */}
      {filteredScreens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredScreens.map(screen => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              onClick={() => setSelectedScreen(screen)}
            />
          ))}
        </div>
      ) : (
        <Card className="border border-gray-100">
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <Search size={40} className="text-gray-300" />
            <p className="text-gray-500 text-center">Aucun écran trouvé pour cette recherche</p>
            <Button variant="outline" onClick={() => { setSearch(''); setActiveCategory('all') }}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <ScreenDetailDialog
        screen={selectedScreen}
        open={!!selectedScreen}
        onOpenChange={(open) => { if (!open) setSelectedScreen(null) }}
      />
    </div>
  )
}

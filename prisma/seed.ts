import { PrismaClient, UserRole, UserStatus, AuctionStatus, BidStatus, TransactionStatus, BackOfficeRole, AccountStatus, SubscriptionType, NotificationType, ReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Régions de Tunisie avec coordonnées GPS
const REGIONS = [
  { name: "Sfax", nameAr: "صفاقس", nameFr: "Sfax", nameEn: "Sfax", latitude: 34.7406, longitude: 10.7603 },
  { name: "Sousse", nameAr: "سوسة", nameFr: "Sousse", nameEn: "Sousse", latitude: 35.8256, longitude: 10.641 },
  { name: "Monastir", nameAr: "المنستير", nameFr: "Monastir", nameEn: "Monastir", latitude: 35.7833, longitude: 10.8 },
  { name: "Mahdia", nameAr: "المهدية", nameFr: "Mahdia", nameEn: "Mahdia", latitude: 35.5047, longitude: 11.0622 },
  { name: "Gabès", nameAr: "قابس", nameFr: "Gabès", nameEn: "Gabès", latitude: 33.8815, longitude: 10.0982 },
  { name: "Médenine", nameAr: "مدنين", nameFr: "Médenine", nameEn: "Medenine", latitude: 33.3544, longitude: 10.5056 },
  { name: "Kairouan", nameAr: "القيروان", nameFr: "Kairouan", nameEn: "Kairouan", latitude: 35.6781, longitude: 10.0964 },
  { name: "Kasserine", nameAr: "القصيرين", nameFr: "Kasserine", nameEn: "Kasserine", latitude: 35.1676, longitude: 8.8353 },
  { name: "Jendouba", nameAr: "جندوبة", nameFr: "Jendouba", nameEn: "Jendouba", latitude: 36.5011, longitude: 8.7803 },
  { name: "Le Kef", nameAr: "الكاف", nameFr: "Le Kef", nameEn: "Le Kef", latitude: 36.1833, longitude: 8.7 },
  { name: "Nabeul", nameAr: "نابل", nameFr: "Nabeul", nameEn: "Nabeul", latitude: 36.4561, longitude: 10.7378 },
  { name: "Bizerte", nameAr: "بنزرت", nameFr: "Bizerte", nameEn: "Bizerte", latitude: 37.2744, longitude: 9.8739 },
  { name: "Tunis", nameAr: "تونس", nameFr: "Tunis", nameEn: "Tunis", latitude: 36.8065, longitude: 10.1815 },
  { name: "Gafsa", nameAr: "قفصة", nameFr: "Gafsa", nameEn: "Gafsa", latitude: 34.425, longitude: 8.7842 },
  { name: "Sidi Bouzid", nameAr: "سيدي بوزيد", nameFr: "Sidi Bouzid", nameEn: "Sidi Bouzid", latitude: 35.0381, longitude: 9.4847 },
  { name: "Tozeur", nameAr: "توزر", nameFr: "Tozeur", nameEn: "Tozeur", latitude: 33.9192, longitude: 8.1339 },
  { name: "Kébili", nameAr: "قبلي", nameFr: "Kébili", nameEn: "Kebili", latitude: 33.705, longitude: 8.9656 },
  { name: "Siliana", nameAr: "سليانة", nameFr: "Siliana", nameEn: "Siliana", latitude: 36.0833, longitude: 9.3667 },
  { name: "Zaghouan", nameAr: "زغوان", nameFr: "Zaghouan", nameEn: "Zaghouan", latitude: 36.4, longitude: 10.15 },
  { name: "Béja", nameAr: "باجة", nameFr: "Béja", nameEn: "Beja", latitude: 36.7256, longitude: 9.1817 },
  { name: "Ben Arous", nameAr: "بن عروس", nameFr: "Ben Arous", nameEn: "Ben Arous", latitude: 36.75, longitude: 10.2167 },
  { name: "Ariana", nameAr: "أريانة", nameFr: "Ariana", nameEn: "Ariana", latitude: 36.8625, longitude: 10.1956 },
  { name: "La Manouba", nameAr: "منوبة", nameFr: "La Manouba", nameEn: "La Manouba", latitude: 36.8089, longitude: 10.1 },
  { name: "Tataouine", nameAr: "تطاوين", nameFr: "Tataouine", nameEn: "Tataouine", latitude: 32.9297, longitude: 10.4517 },
];

// Types d'olives tunisiennes
const OLIVE_TYPES = [
  { name: "Chemlali", nameAr: "شملالي", nameFr: "Chemlali", nameEn: "Chemlali", description: "Variété la plus répandue en Tunisie, huile douce et fruitée. Représente 60% de la production nationale." },
  { name: "Chetoui", nameAr: "شتوي", nameFr: "Chetoui", nameEn: "Chetoui", description: "Variété du nord, huile verte et ardente avec des arômes d'herbe coupée." },
  { name: "Oueslati", nameAr: "وسلاتي", nameFr: "Oueslati", nameEn: "Oueslati", description: "Variété du centre, huile équilibrée avec des notes de tomate et d'amande." },
  { name: "Zalmati", nameAr: "زلمتي", nameFr: "Zalmati", nameEn: "Zalmati", description: "Variété du sud, adaptée aux conditions arides. Huile au fruité intense." },
  { name: "Zarazi", nameAr: "زرازي", nameFr: "Zarazi", nameEn: "Zarazi", description: "Variété du sud, résistante à la sécheresse. Parfaite pour les zones désertiques." },
  { name: "Sayali", nameAr: "سيحالي", nameFr: "Sayali", nameEn: "Sayali", description: "Variété traditionnelle du Cap Bon, double fin. Excellente qualité d'huile." },
  { name: "Meski", nameAr: "مسكي", nameFr: "Meski", nameEn: "Meski", description: "Double fin, huile de haute qualité avec des arômes de pomme verte." },
  { name: "Picholine", nameAr: "بيشولين", nameFr: "Picholine", nameEn: "Picholine", description: "Origine française, adaptée en Tunisie. Huile douce et légère." },
];

// Prénoms tunisiens
const FIRST_NAMES_MALE = [
  "Ahmed", "Mohamed", "Ali", "Hassan", "Youssef", "Khaled", "Fathi", "Samir", "Ridha", "Mounir",
  "Nabil", "Hatem", "Walid", "Karim", "Houssem", "Mehdi", "Amine", "Bassem", "Chokri", "Foued",
  "Habib", "Ibrahim", "Jawher", "Kais", "Lotfi", "Marwen", "Noureddine", "Oussama", "Rami", "Sami",
  "Tarek", "Wassim", "Yassine", "Zied", "Adel", "Bilel", "Chedly", "Dhia", "Elyes", "Farouk"
];

const FIRST_NAMES_FEMALE = [
  "Fatma", "Mariem", "Salma", "Imen", "Nour", "Sarra", "Amel", "Houda", "Leila", "Rania",
  "Sondes", "Wafa", "Yosra", "Asma", "Dalenda", "Emna", "Feriel", "Ghofrane", "Ines", "Jihen"
];

// Noms de famille tunisiens
const LAST_NAMES = [
  "Benali", "Trabelsi", "Bouazizi", "Gharbi", "Hammami", "Jendoubi", "Kchouk", "Mansour", "Sassi", "Riahi",
  "Ayari", "Brahim", "Chakroun", "Dridi", "Fersi", "Guesmi", "Hmida", "Jelassi", "Khelifi", "Louati",
  "Masmoudi", "Nouri", "Ouali", "Rekik", "Saïdi", "Talbi", "Zaouali", "Benamor", "Chebil", "Derouiche",
  "Elleuch", "Ferjani", "Gabsi", "Haddad", "Jouini", "Kriden", "Labidi", "Maatoug", "Nefzi", "Ouertani"
];

// Entreprises du secteur oléicole
const ENTERPRISES = [
  "Huilerie Sfaxienne SARL", "Les Oliviers du Cap Bon", "Sud Olives", "Huilerie Moderne",
  "Étoile du Désert", "Les Palmiers de Djerba", "Domaine de Zarzis", "Or de Tunisie",
  "Coopérative Oléicole de Sfax", "Société des Huiles de Sousse", "Groupement des Producteurs",
  "Huilerie Centrale", "Olives du Sud", "Domaine Cap Bon", "Les Moulins de Tunisie",
  "Société Agricole Mahdia", "Coopérative de Kairouan", "Huilerie du Nord", "Olives Express",
  "Tradex Olives", "Export Olive Tunisia", "Moulin Moderne", "Huilerie Famille Trabelsi",
  "Coopérative Union des Oliviers", "Société Nouvelle d'Huile", null, null, null, null, null
];

// Descriptions d'enchères réalistes
const AUCTION_DESCRIPTIONS = [
  "Olives de première qualité, récoltées à la main. Parcelle située en zone biologique.",
  "Production familiale depuis 3 générations. Olives gorgées de soleil tunisien.",
  "Récolte 2026 exceptionnelle. Rendement huilier prévu de 22%. Très bon état sanitaire.",
  "Vente directe producteur. Traçabilité complète. Certificat phytosanitaire disponible.",
  "Olives triées et calibrées. Idéales pour huile extra vierge. Acidité < 0.5%.",
  "Variété ancienne préservée. Arômes uniques. Production limitée.",
  "Agriculture raisonnée. Sans pesticides. Certification en cours.",
  "Olives de montagne, arômes intenses. Récolte tardive pour plus de maturité.",
  "Parcelle irriguée, rendement optimal. Contrat de partenariat possible.",
  "Stockage en conditions optimales. Livraison possible dans toute la Tunisie."
];

// Messages d'offres
const BID_MESSAGES = [
  "Je suis intéressé par votre lot. Possibilité de visite ?",
  "Offre sérieuse, paiement comptant garanti.",
  "Je souhaiterais une livraison à Sfax, est-ce possible ?",
  "Acheteur régulier, référence disponible sur demande.",
  "Je peux récupérer le lot cette semaine.",
  "Proposition valable 48h. Merci de me contacter.",
  "Huilerie professionnelle, volume important à écouler.",
  "Négociant export, qualité requise pour marché européen.",
  "", // message vide aussi
  ""
];

// Raisons de signalement
const REPORT_REASONS = [
  "Description non conforme au produit",
  "Photos ne correspondant pas à la réalité",
  "Prix anormalement bas - suspicion de fraude",
  "Vendeur injoignable après l'enchère",
  "Produit de qualité inférieure à l'annonce",
  "Tentative de vente hors plateforme",
  "Comportement suspect du vendeur",
  "Informations de contact incorrectes"
];

async function main() {
  console.log("🌱 Début du seed enrichi de la base de données...\n");

  // ==================== NETTOYAGE ====================
  console.log("🧹 Nettoyage des données existantes...");
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionImage.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.backOfficeAccount.deleteMany();
  await prisma.oliveType.deleteMany();
  await prisma.region.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Nettoyage terminé\n");

  // ==================== RÉGIONS ====================
  console.log("📍 Création des régions...");
  const regionRecords = await Promise.all(
    REGIONS.map((region) => prisma.region.create({ data: region }))
  );
  console.log(`✅ ${regionRecords.length} régions créées\n`);

  // ==================== TYPES D'OLIVES ====================
  console.log("🫒 Création des types d'olives...");
  const oliveTypeRecords = await Promise.all(
    OLIVE_TYPES.map((type) => prisma.oliveType.create({ data: type }))
  );
  console.log(`✅ ${oliveTypeRecords.length} types d'olives créés\n`);

  // ==================== UTILISATEURS ====================
  console.log("👥 Création des utilisateurs...");
  const users = [];
  const NUMBER_OF_USERS = 150;

  for (let i = 0; i < NUMBER_OF_USERS; i++) {
    const isMale = Math.random() > 0.4;
    const firstName = isMale 
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const enterprise = ENTERPRISES[Math.floor(Math.random() * ENTERPRISES.length)];
    
    // Générer un numéro unique
    const phoneSuffix = String(i).padStart(6, '0');
    const phone = `+216 ${20 + (i % 80)} ${phoneSuffix.substring(0, 3)} ${phoneSuffix.substring(3)}`;
    
    // Rôle aléatoire pondéré
    let role: UserRole;
    const roleRand = Math.random();
    if (roleRand < 0.4) role = "SELLER";
    else if (roleRand < 0.7) role = "BUYER";
    else role = "MIXED";

    // Statut pondéré
    let status: UserStatus;
    const statusRand = Math.random();
    if (statusRand < 0.85) status = "ACTIVE";
    else if (statusRand < 0.95) status = "PENDING";
    else status = "SUSPENDED";

    const user = await prisma.user.create({
      data: {
        phone,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
        name: `${firstName} ${lastName}`,
        enterprise,
        role,
        status,
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        totalRatings: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      },
    });
    users.push(user);

    if ((i + 1) % 50 === 0) {
      console.log(`   ${i + 1}/${NUMBER_OF_USERS} utilisateurs créés...`);
    }
  }
  console.log(`✅ ${users.length} utilisateurs créés\n`);

  // ==================== ENCHÈRES ====================
  console.log("📦 Création des enchères...");
  const auctions = [];
  const NUMBER_OF_AUCTIONS = 400;
  const sellers = users.filter(u => u.role === "SELLER" || u.role === "MIXED");

  const statuses: AuctionStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "CLOSED", "CLOSED", "DRAFT", "EXPIRED"];

  for (let i = 0; i < NUMBER_OF_AUCTIONS; i++) {
    const seller = sellers[Math.floor(Math.random() * sellers.length)];
    const region = regionRecords[Math.floor(Math.random() * regionRecords.length)];
    const oliveType = oliveTypeRecords[Math.floor(Math.random() * oliveTypeRecords.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const quantity = Math.floor(Math.random() * 5000) + 100; // 100-5100 kg
    const basePrice = 1.8 + Math.random() * 1.7; // 1.8-3.5 DT/kg
    const description = AUCTION_DESCRIPTIONS[Math.floor(Math.random() * AUCTION_DESCRIPTIONS.length)];
    
    // Dates selon le statut
    let endDate: Date;
    let publishedAt: Date | null = null;
    let closedAt: Date | null = null;
    
    const now = new Date();
    if (status === "ACTIVE") {
      endDate = new Date(now.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);
      publishedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    } else if (status === "CLOSED") {
      endDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      publishedAt = new Date(endDate.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      closedAt = endDate;
    } else if (status === "EXPIRED") {
      endDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
      publishedAt = new Date(endDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    } else {
      endDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    }

    const auction = await prisma.auction.create({
      data: {
        sellerId: seller.id,
        oliveTypeId: oliveType.id,
        regionId: region.id,
        title: `${oliveType.name} - ${quantity} kg - ${region.name}`,
        description: `${description} Type: ${oliveType.name}. Région: ${region.name}. Quantité disponible: ${quantity} kg.`,
        quantity,
        reservePrice: Math.random() > 0.3 ? Math.round(basePrice * 0.95 * 100) / 100 : null,
        endDate,
        status,
        publishedAt,
        closedAt,
        viewCount: Math.floor(Math.random() * 200),
        location: `Zone ${Math.floor(Math.random() * 10) + 1}, ${region.name}`,
        latitude: region.latitude ? region.latitude + (Math.random() - 0.5) * 0.2 : null,
        longitude: region.longitude ? region.longitude + (Math.random() - 0.5) * 0.2 : null,
        isOffline: Math.random() > 0.9,
        createdAt: publishedAt || new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    auctions.push(auction);

    if ((i + 1) % 100 === 0) {
      console.log(`   ${i + 1}/${NUMBER_OF_AUCTIONS} enchères créées...`);
    }
  }
  console.log(`✅ ${auctions.length} enchères créées\n`);

  // ==================== OFFRES ====================
  console.log("💰 Création des offres...");
  let bidsCount = 0;
  const buyers = users.filter(u => u.role === "BUYER" || u.role === "MIXED");
  const activeAuctions = auctions.filter(a => a.status === "ACTIVE");
  const closedAuctions = auctions.filter(a => a.status === "CLOSED");

  // Offres sur enchères actives
  for (const auction of activeAuctions) {
    const numBids = Math.floor(Math.random() * 8) + 1; // 1-8 offres
    const basePrice = 1.8 + Math.random() * 0.8;

    for (let j = 0; j < numBids; j++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const pricePerKg = Math.round((basePrice + j * 0.08 + Math.random() * 0.15) * 100) / 100;

      await prisma.bid.create({
        data: {
          auctionId: auction.id,
          buyerId: buyer.id,
          pricePerKg,
          totalPrice: Math.round(pricePerKg * auction.quantity * 100) / 100,
          message: BID_MESSAGES[Math.floor(Math.random() * BID_MESSAGES.length)],
          status: j === numBids - 1 ? "WINNING" : "PENDING",
          createdAt: new Date(auction.createdAt!.getTime() + Math.random() * (Date.now() - auction.createdAt!.getTime())),
        },
      });
      bidsCount++;
    }
  }

  // Offres sur enchères clôturées (avec gagnant)
  for (const auction of closedAuctions) {
    const numBids = Math.floor(Math.random() * 10) + 2; // 2-11 offres
    const basePrice = 1.8 + Math.random() * 0.8;

    for (let j = 0; j < numBids; j++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const pricePerKg = Math.round((basePrice + j * 0.1 + Math.random() * 0.1) * 100) / 100;

      let bidStatus: BidStatus;
      if (j === numBids - 1) bidStatus = "WON";
      else if (j === numBids - 2) bidStatus = "WINNING";
      else bidStatus = "LOST";

      await prisma.bid.create({
        data: {
          auctionId: auction.id,
          buyerId: buyer.id,
          pricePerKg,
          totalPrice: Math.round(pricePerKg * auction.quantity * 100) / 100,
          message: BID_MESSAGES[Math.floor(Math.random() * BID_MESSAGES.length)],
          status: bidStatus,
          createdAt: new Date(auction.createdAt!.getTime() + Math.random() * (auction.closedAt!.getTime() - auction.createdAt!.getTime())),
        },
      });
      bidsCount++;
    }

    if (bidsCount % 200 === 0) {
      console.log(`   ${bidsCount} offres créées...`);
    }
  }
  console.log(`✅ ${bidsCount} offres créées\n`);

  // ==================== TRANSACTIONS ====================
  console.log("🔄 Création des transactions...");
  let transactionsCount = 0;

  for (const auction of closedAuctions.slice(0, 50)) {
    // Trouver l'offre gagnante
    const winningBid = await prisma.bid.findFirst({
      where: { auctionId: auction.id, status: "WON" },
    });

    if (winningBid) {
      const transactionStatus: TransactionStatus = Math.random() > 0.2 ? "COMPLETED" : "PENDING";
      
      await prisma.transaction.create({
        data: {
          auctionId: auction.id,
          sellerId: auction.sellerId,
          buyerId: winningBid.buyerId,
          bidId: winningBid.id,
          finalPrice: winningBid.totalPrice,
          status: transactionStatus,
          completedAt: transactionStatus === "COMPLETED" ? auction.closedAt : null,
          createdAt: auction.closedAt!,
        },
      });
      transactionsCount++;
    }
  }
  console.log(`✅ ${transactionsCount} transactions créées\n`);

  // ==================== NOTIFICATIONS ====================
  console.log("🔔 Création des notifications...");
  let notificationsCount = 0;

  const notificationTypes: NotificationType[] = ["NEW_BID", "BID_OUTBID", "AUCTION_WON", "AUCTION_CLOSED", "SYSTEM"];

  for (const user of users.slice(0, 80)) {
    const numNotifs = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numNotifs; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      let title = "";
      let message = "";

      switch (type) {
        case "NEW_BID":
          title = "Nouvelle offre reçue";
          message = "Une nouvelle offre a été placée sur votre enchère.";
          break;
        case "BID_OUTBID":
          title = "Offre dépassée";
          message = "Quelqu'un a placé une offre supérieure à la vôtre.";
          break;
        case "AUCTION_WON":
          title = "Enchère gagnée !";
          message = "Félicitations ! Vous avez remporté l'enchère.";
          break;
        case "AUCTION_CLOSED":
          title = "Enchère terminée";
          message = "Votre enchère est maintenant terminée.";
          break;
        default:
          title = "Notification système";
          message = "Mise à jour importante de la plateforme.";
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          title,
          message,
          isRead: Math.random() > 0.3,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      notificationsCount++;
    }
  }
  console.log(`✅ ${notificationsCount} notifications créées\n`);

  // ==================== SIGNALEMENTS ====================
  console.log("⚠️ Création des signalements...");
  let reportsCount = 0;

  for (let i = 0; i < 15; i++) {
    const reporter = users[Math.floor(Math.random() * users.length)];
    const auction = auctions[Math.floor(Math.random() * auctions.length)];
    const reason = REPORT_REASONS[Math.floor(Math.random() * REPORT_REASONS.length)];
    
    const reportStatuses: ReportStatus[] = ["PENDING", "PENDING", "IN_REVIEW", "RESOLVED", "DISMISSED"];
    const status = reportStatuses[Math.floor(Math.random() * reportStatuses.length)];

    await prisma.report.create({
      data: {
        reporterId: reporter.id,
        auctionId: auction.id,
        reason,
        description: `Signalement automatique #${i + 1}: ${reason}. Détails supplémentaires sur l'incident signalé.`,
        status,
        resolution: status === "RESOLVED" ? "Problème résolu après vérification." : null,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    });
    reportsCount++;
  }
  console.log(`✅ ${reportsCount} signalements créés\n`);

  // ==================== PARAMÈTRES ====================
  console.log("⚙️ Création des paramètres...");
  const settings = [
    { key: "site_name", value: "Olive Enchères", description: "Nom du site" },
    { key: "currency", value: "DT", description: "Devise utilisée" },
    { key: "min_bid_increment", value: "0.05", description: "Incrément minimum des offres (DT/kg)" },
    { key: "auction_duration_days", value: "7", description: "Durée par défaut des enchères (jours)" },
    { key: "commission_rate", value: "0.02", description: "Commission sur les transactions (2%)" },
    { key: "max_photos_per_auction", value: "5", description: "Nombre maximum de photos par enchère" },
    { key: "max_auction_duration_days", value: "30", description: "Durée maximum d'une enchère (jours)" },
    { key: "show_highest_bid", value: "true", description: "Afficher l'offre la plus haute" },
    { key: "require_buyer_validation", value: "false", description: "Validation manuelle des acheteurs" },
  ];

  for (const setting of settings) {
    await prisma.settings.create({ data: setting });
  }
  console.log(`✅ ${settings.length} paramètres créés\n`);

  // ==================== COMPTES BACKOFFICE ====================
  console.log("🔐 Création des comptes BackOffice...");
  
  const backOfficeAccounts = [
    {
      email: "superadmin@olive-encheres.tn",
      name: "Super Admin",
      phone: "+216 20 000 001",
      role: BackOfficeRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.PERMANENT,
      emailVerified: true,
      loginCount: 450,
      lastLogin: new Date(),
    },
    {
      email: "admin@olive-encheres.tn",
      name: "Admin Principal",
      phone: "+216 20 000 002",
      role: BackOfficeRole.ADMIN,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.PERMANENT,
      emailVerified: true,
      loginCount: 892,
      lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      email: "analyst@huilerie.tn",
      name: "Ahmed Analyste",
      enterprise: "Huilerie Sfaxienne",
      phone: "+216 20 123 456",
      role: BackOfficeRole.ANALYST,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.MONTHLY,
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxRequestsPerDay: 100,
      maxExportsPerDay: 10,
      maxExportsPerMonth: 50,
      requestsToday: 45,
      exportsToday: 3,
      exportsThisMonth: 23,
      emailVerified: true,
      loginCount: 156,
      lastLogin: new Date(),
    },
    {
      email: "viewer@export.com",
      name: "Fatma Viewer",
      enterprise: "Export Olive Int.",
      phone: "+216 98 765 432",
      role: BackOfficeRole.VIEWER,
      status: AccountStatus.PENDING,
      subscriptionType: SubscriptionType.YEARLY,
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxRequestsPerDay: 50,
      maxExportsPerDay: 5,
      maxExportsPerMonth: 20,
      emailVerified: false,
      loginCount: 0,
    },
    {
      email: "suspended@test.tn",
      name: "Ancien Client",
      enterprise: "Test Company",
      phone: "+216 55 111 333",
      role: BackOfficeRole.VIEWER,
      status: AccountStatus.SUSPENDED,
      subscriptionType: SubscriptionType.MONTHLY,
      subscriptionEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      maxRequestsPerDay: 50,
      maxExportsPerDay: 5,
      maxExportsPerMonth: 20,
      emailVerified: true,
      loginCount: 45,
      lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      email: "custom@olive.tn",
      name: "Utilisateur Personnalisé",
      enterprise: "Agro Tunisie",
      phone: "+216 71 234 567",
      role: BackOfficeRole.CUSTOM,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.MONTHLY,
      subscriptionEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      maxRequestsPerDay: 200,
      maxExportsPerDay: 20,
      maxExportsPerMonth: 100,
      customPermissions: JSON.stringify(["view_dashboard", "view_auctions", "view_users", "view_map", "view_prices"]),
      emailVerified: true,
      loginCount: 78,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      email: "analyst2@cooperative.tn",
      name: "Leila Analyste",
      enterprise: "Coopérative du Cap Bon",
      phone: "+216 22 333 444",
      role: BackOfficeRole.ANALYST,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.YEARLY,
      subscriptionEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      maxRequestsPerDay: 150,
      maxExportsPerDay: 15,
      maxExportsPerMonth: 75,
      emailVerified: true,
      loginCount: 234,
      lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      email: "admin2@olive-encheres.tn",
      name: "Karim Admin",
      phone: "+216 25 555 666",
      role: BackOfficeRole.ADMIN,
      status: AccountStatus.ACTIVE,
      subscriptionType: SubscriptionType.PERMANENT,
      emailVerified: true,
      loginCount: 567,
      lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];

  let accountsCount = 0;
  for (const account of backOfficeAccounts) {
    await prisma.backOfficeAccount.create({
      data: {
        ...account,
        passwordHash: "temp_password_to_change",
      },
    });
    accountsCount++;
  }
  console.log(`✅ ${accountsCount} comptes BackOffice créés\n`);

  // ==================== RÉSUMÉ FINAL ====================
  console.log("═".repeat(50));
  console.log("📊 RÉSUMÉ DU SEED");
  console.log("═".repeat(50));
  console.log(`👥 Utilisateurs:        ${users.length}`);
  console.log(`   ├─ Vendeurs:         ${users.filter(u => u.role === "SELLER").length}`);
  console.log(`   ├─ Acheteurs:        ${users.filter(u => u.role === "BUYER").length}`);
  console.log(`   └─ Mixtes:           ${users.filter(u => u.role === "MIXED").length}`);
  console.log(`🗺️  Régions:            ${regionRecords.length}`);
  console.log(`🫒 Types d'olives:     ${oliveTypeRecords.length}`);
  console.log(`📦 Enchères:           ${auctions.length}`);
  console.log(`   ├─ Actives:          ${auctions.filter(a => a.status === "ACTIVE").length}`);
  console.log(`   ├─ Clôturées:        ${auctions.filter(a => a.status === "CLOSED").length}`);
  console.log(`   ├─ Brouillons:       ${auctions.filter(a => a.status === "DRAFT").length}`);
  console.log(`   └─ Expirées:         ${auctions.filter(a => a.status === "EXPIRED").length}`);
  console.log(`💰 Offres:             ${bidsCount}`);
  console.log(`🔄 Transactions:       ${transactionsCount}`);
  console.log(`🔔 Notifications:      ${notificationsCount}`);
  console.log(`⚠️  Signalements:       ${reportsCount}`);
  console.log(`🔐 Comptes BackOffice: ${accountsCount}`);
  console.log("═".repeat(50));
  console.log("\n🎉 Seed enrichi terminé avec succès !\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

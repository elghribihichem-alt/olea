import { PrismaClient, UserRole, UserStatus, AuctionStatus, BidStatus, TransactionStatus, BackOfficeRole, AccountStatus, SubscriptionType, NotificationType, ReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

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

const OLIVE_TYPES = [
  { name: "Chemlali", nameAr: "شملالي", nameFr: "Chemlali", nameEn: "Chemlali", description: "Variété la plus répandue en Tunisie." },
  { name: "Chetoui", nameAr: "شتوي", nameFr: "Chetoui", nameEn: "Chetoui", description: "Variété du nord, huile verte et ardente." },
  { name: "Oueslati", nameAr: "وسلاتي", nameFr: "Oueslati", nameEn: "Oueslati", description: "Variété du centre, huile équilibrée." },
  { name: "Zalmati", nameAr: "زلمتي", nameFr: "Zalmati", nameEn: "Zalmati", description: "Variété du sud, adaptée aux conditions arides." },
  { name: "Zarazi", nameAr: "زرازي", nameFr: "Zarazi", nameEn: "Zarazi", description: "Variété du sud, résistante à la sécheresse." },
  { name: "Sayali", nameAr: "سيحالي", nameFr: "Sayali", nameEn: "Sayali", description: "Variété traditionnelle du Cap Bon." },
  { name: "Meski", nameAr: "مسكي", nameFr: "Meski", nameEn: "Meski", description: "Double fin, huile de haute qualité." },
  { name: "Picholine", nameAr: "بيشولين", nameFr: "Picholine", nameEn: "Picholine", description: "Origine française, adaptée en Tunisie." },
];

const FIRST_NAMES_M = ["Ahmed","Mohamed","Ali","Hassan","Youssef","Khaled","Fathi","Samir","Ridha","Mounir","Nabil","Hatem","Walid","Karim","Houssem","Mehdi","Amine","Bassem","Chokri","Foued","Habib","Ibrahim","Jawher","Kais","Lotfi","Marwen","Noureddine","Oussama","Rami","Sami","Tarek","Wassim","Yassine","Zied","Adel","Bilel","Chedly","Dhia","Elyes","Farouk"];
const FIRST_NAMES_F = ["Fatma","Mariem","Salma","Imen","Nour","Sarra","Amel","Houda","Leila","Rania","Sondes","Wafa","Yosra","Asma","Dalenda","Emna","Feriel","Ghofrane","Ines","Jihen"];
const LAST_NAMES = ["Benali","Trabelsi","Bouazizi","Gharbi","Hammami","Jendoubi","Kchouk","Mansour","Sassi","Riahi","Ayari","Brahim","Chakroun","Dridi","Fersi","Guesmi","Hmida","Jelassi","Khelifi","Louati","Masmoudi","Nouri","Ouali","Rekik","Saïdi","Talbi","Zaouali","Benamor","Chebil","Derouiche","Elleuch","Ferjani","Gabsi","Haddad","Jouini","Kriden","Labidi","Maatoug","Nefzi","Ouertani"];
const ENTERPRISES = ["Huilerie Sfaxienne SARL","Les Oliviers du Cap Bon","Sud Olives","Huilerie Moderne","Étoile du Désert","Les Palmiers de Djerba","Domaine de Zarzis","Or de Tunisie","Coopérative Oléicole de Sfax","Société des Huiles de Sousse","Groupement des Producteurs","Huilerie Centrale","Olives du Sud","Domaine Cap Bon","Les Moulins de Tunisie","Société Agricole Mahdia","Coopérative de Kairouan","Huilerie du Nord","Olives Express","Tradex Olives","Export Olive Tunisia","Moulin Moderne","Huilerie Famille Trabelsi","Coopérative Union des Oliviers","Société Nouvelle d'Huile",null,null,null,null,null];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

async function main() {
  console.log("🌱 Seed PostgreSQL - Début...\n");

  // Clean (use raw SQL to bypass foreign key constraints)
  console.log("🧹 Nettoyage...");
  await prisma.$executeRaw`TRUNCATE TABLE "Review", "Transaction", "Notification", "Report", "Bid", "AuctionImage", "PriceAlert", "Settings", "AuditLog", "BackOfficeAccount", "Auction", "User", "OliveType", "Region" CASCADE`;
  console.log("✅ Nettoyage terminé\n");

  // Regions + Olive types
  console.log("📍 Création des régions...");
  const regions = await prisma.region.createMany({ data: REGIONS, skipDuplicates: true });
  const regionRecords = await prisma.region.findMany();
  console.log(`✅ ${regionRecords.length} régions\n`);

  console.log("🫒 Création des types d'olives...");
  await prisma.oliveType.createMany({ data: OLIVE_TYPES, skipDuplicates: true });
  const oliveTypeRecords = await prisma.oliveType.findMany();
  console.log(`✅ ${oliveTypeRecords.length} types d'olives\n`);

  // Users (batched)
  console.log("👥 Création des utilisateurs...");
  const BATCH = 50;
  for (let batch = 0; batch < 3; batch++) {
    const usersData = [];
    for (let i = 0; i < BATCH; i++) {
      const idx = batch * BATCH + i;
      const isMale = Math.random() > 0.4;
      const firstName = pick(isMale ? FIRST_NAMES_M : FIRST_NAMES_F);
      const lastName = pick(LAST_NAMES);
      const phoneSuffix = String(idx).padStart(6, '0');
      const roleRand = Math.random();
      const role = roleRand < 0.4 ? "SELLER" : roleRand < 0.7 ? "BUYER" : "MIXED";
      const statusRand = Math.random();
      const status = statusRand < 0.85 ? "ACTIVE" : statusRand < 0.95 ? "PENDING" : "SUSPENDED";
      usersData.push({
        phone: `+216 ${20 + (idx % 80)} ${phoneSuffix.substring(0, 3)} ${phoneSuffix.substring(3)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@gmail.com`,
        name: `${firstName} ${lastName}`,
        enterprise: pick(ENTERPRISES),
        role: role as UserRole,
        status: status as UserStatus,
        rating: randF(3, 5),
        totalRatings: rand(0, 100),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.user.createMany({ data: usersData });
    console.log(`   ${(batch + 1) * BATCH}/150 utilisateurs...`);
  }
  const allUsers = await prisma.user.findMany();
  const sellers = allUsers.filter(u => u.role === "SELLER" || u.role === "MIXED");
  const buyers = allUsers.filter(u => u.role === "BUYER" || u.role === "MIXED");
  console.log(`✅ ${allUsers.length} utilisateurs\n`);

  // Auctions (batched)
  console.log("📦 Création des enchères...");
  const statuses: AuctionStatus[] = ["ACTIVE","ACTIVE","ACTIVE","ACTIVE","CLOSED","CLOSED","DRAFT","EXPIRED"];
  const now = new Date();
  const BATCH_A = 100;
  for (let batch = 0; batch < 4; batch++) {
    const auctionsData = [];
    for (let i = 0; i < BATCH_A; i++) {
      const seller = pick(sellers);
      const region = pick(regionRecords);
      const oliveType = pick(oliveTypeRecords);
      const status = pick(statuses);
      const quantity = rand(100, 5100);
      const basePrice = randF(1.8, 3.5);
      let endDate: Date, publishedAt: Date | null = null, closedAt: Date | null = null;
      if (status === "ACTIVE") {
        endDate = new Date(now.getTime() + rand(1, 15) * 24 * 60 * 60 * 1000);
        publishedAt = new Date(now.getTime() - rand(0, 7) * 24 * 60 * 60 * 1000);
      } else if (status === "CLOSED") {
        endDate = new Date(now.getTime() - rand(1, 30) * 24 * 60 * 60 * 1000);
        publishedAt = new Date(endDate.getTime() - rand(1, 14) * 24 * 60 * 60 * 1000);
        closedAt = endDate;
      } else if (status === "EXPIRED") {
        endDate = new Date(now.getTime() - rand(1, 10) * 24 * 60 * 60 * 1000);
        publishedAt = new Date(endDate.getTime() - rand(1, 7) * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date(now.getTime() + rand(1, 30) * 24 * 60 * 60 * 1000);
      }
      auctionsData.push({
        sellerId: seller.id,
        oliveTypeId: oliveType.id,
        regionId: region.id,
        title: `${oliveType.name} - ${quantity} kg - ${region.name}`,
        description: `Lot de ${quantity} kg d'olives ${oliveType.name}. Région: ${region.name}.`,
        quantity,
        reservePrice: Math.random() > 0.3 ? randF(1.5, 3.0) : null,
        endDate,
        status,
        publishedAt,
        closedAt,
        viewCount: rand(0, 200),
        location: `Zone ${rand(1, 10)}, ${region.name}`,
        latitude: region.latitude ? region.latitude + (Math.random() - 0.5) * 0.2 : null,
        longitude: region.longitude ? region.longitude + (Math.random() - 0.5) * 0.2 : null,
        isOffline: Math.random() > 0.9,
        createdAt: publishedAt || new Date(now.getTime() - rand(1, 30) * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.auction.createMany({ data: auctionsData });
    console.log(`   ${(batch + 1) * BATCH_A}/400 enchères...`);
  }
  const allAuctions = await prisma.auction.findMany({ include: { seller: true } });
  const activeAuctions = allAuctions.filter(a => a.status === "ACTIVE");
  const closedAuctions = allAuctions.filter(a => a.status === "CLOSED");
  console.log(`✅ ${allAuctions.length} enchères\n`);

  // Bids (batched)
  console.log("💰 Création des offres...");
  let bidsCount = 0;
  for (const batch of [activeAuctions, closedAuctions]) {
    const bidsData: Array<{
      auctionId: string; buyerId: string; pricePerKg: number; totalPrice: number;
      message: string; status: BidStatus; createdAt: Date;
    }> = [];
    const isClosed = batch === closedAuctions;
    for (const auction of batch) {
      const numBids = rand(isClosed ? 2 : 1, isClosed ? 11 : 8);
      const basePrice = randF(1.8, 2.6);
      for (let j = 0; j < numBids; j++) {
        const pricePerKg = randF(basePrice + j * 0.08, basePrice + j * 0.08 + 0.15);
        let status: BidStatus;
        if (isClosed) {
          status = j === numBids - 1 ? "WON" : j === numBids - 2 ? "WINNING" : "LOST";
        } else {
          status = j === numBids - 1 ? "WINNING" : "PENDING";
        }
        const createdAfter = isClosed && auction.closedAt
          ? auction.closedAt
          : new Date();
        const createdBefore = auction.createdAt;
        bidsData.push({
          auctionId: auction.id,
          buyerId: pick(buyers).id,
          pricePerKg,
          totalPrice: Math.round(pricePerKg * auction.quantity * 100) / 100,
          message: "",
          status,
          createdAt: new Date(createdBefore.getTime() + Math.random() * (createdAfter.getTime() - createdBefore.getTime())),
        });
        bidsCount++;
      }
    }
    // Insert in chunks of 200
    for (let i = 0; i < bidsData.length; i += 200) {
      await prisma.bid.createMany({ data: bidsData.slice(i, i + 200) });
    }
  }
  console.log(`✅ ${bidsCount} offres\n`);

  // Transactions (batched)
  console.log("🔄 Création des transactions...");
  const winningBids = await prisma.bid.findMany({
    where: { status: "WON", auction: { status: "CLOSED" } },
    include: { auction: true },
    take: 50,
  });
  if (winningBids.length > 0) {
    await prisma.transaction.createMany({
      data: winningBids.map(b => {
        const completed = Math.random() > 0.2;
        return {
          auctionId: b.auctionId,
          sellerId: b.auction.sellerId,
          buyerId: b.buyerId,
          bidId: b.id,
          finalPrice: b.totalPrice,
          status: (completed ? "COMPLETED" : "PENDING") as TransactionStatus,
          completedAt: completed ? b.auction.closedAt : null,
          createdAt: b.auction.closedAt!,
        };
      }),
    });
  }
  console.log(`✅ ${winningBids.length} transactions\n`);

  // Notifications (batched)
  console.log("🔔 Création des notifications...");
  const notifsData = [];
  const notifTypes: NotificationType[] = ["NEW_BID","BID_OUTBID","AUCTION_WON","AUCTION_CLOSED","SYSTEM"];
  const notifMessages = [
    { title: "Nouvelle offre reçue", message: "Une nouvelle offre a été placée sur votre enchère." },
    { title: "Offre dépassée", message: "Quelqu'un a placé une offre supérieure à la vôtre." },
    { title: "Enchère gagnée !", message: "Félicitations ! Vous avez remporté l'enchère." },
    { title: "Enchère terminée", message: "Votre enchère est maintenant terminée." },
    { title: "Notification système", message: "Mise à jour importante de la plateforme." },
  ];
  for (const user of allUsers.slice(0, 80)) {
    const numNotifs = rand(0, 4);
    for (let i = 0; i < numNotifs; i++) {
      const nm = notifMessages[notifTypes.indexOf(pick(notifTypes))];
      notifsData.push({
        userId: user.id,
        type: pick(notifTypes),
        title: nm.title,
        message: nm.message,
        isRead: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }
  if (notifsData.length > 0) {
    for (let i = 0; i < notifsData.length; i += 200) {
      await prisma.notification.createMany({ data: notifsData.slice(i, i + 200) });
    }
  }
  console.log(`✅ ${notifsData.length} notifications\n`);

  // Reports
  console.log("⚠️ Création des signalements...");
  const reportReasons = ["Description non conforme","Photos incorrectes","Prix suspect","Vendeur injoignable","Qualité inférieure","Hors plateforme","Comportement suspect","Contact incorrect"];
  const reportStatuses: ReportStatus[] = ["PENDING","PENDING","IN_REVIEW","RESOLVED","DISMISSED"];
  await prisma.report.createMany({
    data: Array.from({ length: 15 }, (_, i) => ({
      reporterId: pick(allUsers).id,
      auctionId: pick(allAuctions).id,
      reason: pick(reportReasons),
      description: `Signalement #${i + 1}: ${pick(reportReasons)}.`,
      status: pick(reportStatuses),
      resolution: Math.random() > 0.5 ? "Problème résolu après vérification." : null,
      createdAt: new Date(Date.now() - rand(1, 14) * 24 * 60 * 60 * 1000),
    })),
  });
  console.log("✅ 15 signalements\n");

  // Settings
  console.log("⚙️ Création des paramètres...");
  await prisma.settings.createMany({
    data: [
      { key: "site_name", value: "Olive Enchères", description: "Nom du site" },
      { key: "currency", value: "DT", description: "Devise utilisée" },
      { key: "min_bid_increment", value: "0.05", description: "Incrément minimum (DT/kg)" },
      { key: "auction_duration_days", value: "7", description: "Durée par défaut (jours)" },
      { key: "commission_rate", value: "0.02", description: "Commission (2%)" },
      { key: "max_photos_per_auction", value: "5", description: "Max photos par enchère" },
      { key: "max_auction_duration_days", value: "30", description: "Durée max enchère (jours)" },
      { key: "show_highest_bid", value: "true", description: "Afficher offre max" },
      { key: "require_buyer_validation", value: "false", description: "Validation acheteurs" },
    ],
  });
  console.log("✅ 9 paramètres\n");

  // BackOffice accounts
  console.log("🔐 Création des comptes BackOffice...");
  const boAccounts = [
    { email: "superadmin@olive-encheres.tn", name: "Super Admin", phone: "+216 20 000 001", role: BackOfficeRole.SUPER_ADMIN, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.PERMANENT, emailVerified: true, loginCount: 450, lastLogin: new Date() },
    { email: "admin@olive-encheres.tn", name: "Admin Principal", phone: "+216 20 000 002", role: BackOfficeRole.ADMIN, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.PERMANENT, emailVerified: true, loginCount: 892, lastLogin: new Date(Date.now() - 3600000) },
    { email: "analyst@huilerie.tn", name: "Ahmed Analyste", enterprise: "Huilerie Sfaxienne", phone: "+216 20 123 456", role: BackOfficeRole.ANALYST, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.MONTHLY, subscriptionEnd: new Date(Date.now() + 30*86400000), maxRequestsPerDay: 100, maxExportsPerDay: 10, maxExportsPerMonth: 50, requestsToday: 45, exportsToday: 3, exportsThisMonth: 23, emailVerified: true, loginCount: 156, lastLogin: new Date() },
    { email: "viewer@export.com", name: "Fatma Viewer", enterprise: "Export Olive Int.", phone: "+216 98 765 432", role: BackOfficeRole.VIEWER, status: AccountStatus.PENDING, subscriptionType: SubscriptionType.YEARLY, subscriptionEnd: new Date(Date.now() + 365*86400000), maxRequestsPerDay: 50, maxExportsPerDay: 5, maxExportsPerMonth: 20, emailVerified: false, loginCount: 0 },
    { email: "suspended@test.tn", name: "Ancien Client", enterprise: "Test Company", phone: "+216 55 111 333", role: BackOfficeRole.VIEWER, status: AccountStatus.SUSPENDED, subscriptionType: SubscriptionType.MONTHLY, subscriptionEnd: new Date(Date.now() - 10*86400000), maxRequestsPerDay: 50, maxExportsPerDay: 5, maxExportsPerMonth: 20, emailVerified: true, loginCount: 45, lastLogin: new Date(Date.now() - 30*86400000) },
    { email: "custom@olive.tn", name: "Utilisateur Personnalisé", enterprise: "Agro Tunisie", phone: "+216 71 234 567", role: BackOfficeRole.CUSTOM, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.MONTHLY, subscriptionEnd: new Date(Date.now() + 60*86400000), maxRequestsPerDay: 200, maxExportsPerDay: 20, maxExportsPerMonth: 100, customPermissions: '["view_dashboard","view_auctions","view_users","view_map","view_prices"]', emailVerified: true, loginCount: 78, lastLogin: new Date(Date.now() - 2*86400000) },
    { email: "analyst2@cooperative.tn", name: "Leila Analyste", enterprise: "Coopérative du Cap Bon", phone: "+216 22 333 444", role: BackOfficeRole.ANALYST, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.YEARLY, subscriptionEnd: new Date(Date.now() + 180*86400000), maxRequestsPerDay: 150, maxExportsPerDay: 15, maxExportsPerMonth: 75, emailVerified: true, loginCount: 234, lastLogin: new Date(Date.now() - 3*3600000) },
    { email: "admin2@olive-encheres.tn", name: "Karim Admin", phone: "+216 25 555 666", role: BackOfficeRole.ADMIN, status: AccountStatus.ACTIVE, subscriptionType: SubscriptionType.PERMANENT, emailVerified: true, loginCount: 567, lastLogin: new Date(Date.now() - 12*3600000) },
  ];
  await prisma.backOfficeAccount.createMany({
    data: boAccounts.map(a => ({ ...a, passwordHash: "temp_password_to_change" })),
  });
  console.log(`✅ ${boAccounts.length} comptes BackOffice\n`);

  // Summary
  console.log("═".repeat(50));
  console.log("📊 SEED COMPLÉTÉ SUR SUPABASE");
  console.log("═".repeat(50));
  console.log(`👥 Utilisateurs:        ${allUsers.length}`);
  console.log(`📍 Régions:            ${regionRecords.length}`);
  console.log(`🫒 Types d'olives:     ${oliveTypeRecords.length}`);
  console.log(`📦 Enchères:           ${allAuctions.length}`);
  console.log(`💰 Offres:             ${bidsCount}`);
  console.log(`🔄 Transactions:       ${winningBids.length}`);
  console.log(`🔔 Notifications:      ${notifsData.length}`);
  console.log(`⚠️  Signalements:       15`);
  console.log(`🔐 Comptes BackOffice: ${boAccounts.length}`);
  console.log("═".repeat(50));
  console.log("\n🎉 Seed terminé avec succès !\n");
}

main()
  .catch((e) => { console.error("❌ Erreur:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

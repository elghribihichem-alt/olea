import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Safe JSON serializer that converts BigInt to Number
function safeJson<T>(data: T): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
}

/** Formats a Date as "YYYY-MM" */
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'sales'
    const period = searchParams.get('period') || '30d'
    const regionId = searchParams.get('regionId') || ''
    const oliveTypeId = searchParams.get('oliveTypeId') || ''

    // Calculate date range from period
    const now = new Date()
    let startDate: Date | null = null
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = null
        break
    }

    const dateFilter = startDate ? { gte: startDate } : undefined

    const regionFilter = regionId ? { regionId } : {}
    const oliveFilter = oliveTypeId ? { oliveTypeId } : {}

    // Fetch reference data
    const [regions, oliveTypes] = await Promise.all([
      db.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      db.oliveType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ])

    // Base result
    const result: Record<string, unknown> = { period, regions, oliveTypes }

    switch (reportType) {
      case 'sales': {
        const txWhere: Record<string, unknown> = { createdAt: dateFilter }
        const auctionWhere: Record<string, unknown> = {
          ...regionFilter,
          ...oliveFilter,
        }

        // --- monthlySales: fetch flat rows, group in JS ---
        const monthlySalesPromise = db.transaction.findMany({
          where: {
            ...txWhere,
            auction: { ...auctionWhere },
          },
          select: { createdAt: true, finalPrice: true },
        }).then(rows => {
          const monthMap = new Map<string, { count: number; revenue: number }>()
          for (const item of rows) {
            const m = toMonthKey(item.createdAt)
            const bucket = monthMap.get(m) ?? { count: 0, revenue: 0 }
            bucket.count++
            bucket.revenue += Number(item.finalPrice ?? 0)
            monthMap.set(m, bucket)
          }
          // Sort DESC, take last 12 months, then reverse for ASC order
          return Array.from(monthMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12)
            .reverse()
            .map(([month, { count, revenue }]) => ({
              month,
              count,
              revenue,
              avgPrice: count > 0 ? revenue / count : 0,
            }))
        })

        // --- byRegion: fetch with auction>region, group in JS ---
        const byRegionPromise = db.transaction.findMany({
          where: {
            createdAt: dateFilter,
            auction: { ...oliveFilter },
          },
          select: {
            finalPrice: true,
            auction: {
              select: {
                regionId: true,
                region: { select: { id: true, name: true } },
              },
            },
          },
        }).then(rows => {
          const regionMap = new Map<string, { name: string; count: number; revenue: number }>()
          for (const item of rows) {
            const region = item.auction.region
            if (!region) continue
            const key = region.id
            const bucket = regionMap.get(key) ?? { name: region.name, count: 0, revenue: 0 }
            bucket.count++
            bucket.revenue += Number(item.finalPrice ?? 0)
            regionMap.set(key, bucket)
          }
          return Array.from(regionMap.entries())
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 10)
            .map(([regionId, data]) => ({ regionId, ...data }))
        })

        // --- byOliveType: fetch with auction>oliveType, group in JS ---
        const byOliveTypePromise = db.transaction.findMany({
          where: {
            createdAt: dateFilter,
            auction: { ...regionFilter },
          },
          select: {
            finalPrice: true,
            auction: {
              select: {
                oliveTypeId: true,
                oliveType: { select: { id: true, name: true } },
              },
            },
          },
        }).then(rows => {
          const oliveMap = new Map<string, { name: string; count: number; revenue: number }>()
          for (const item of rows) {
            const olive = item.auction.oliveType
            if (!olive) continue
            const key = olive.id
            const bucket = oliveMap.get(key) ?? { name: olive.name, count: 0, revenue: 0 }
            bucket.count++
            bucket.revenue += Number(item.finalPrice ?? 0)
            oliveMap.set(key, bucket)
          }
          return Array.from(oliveMap.entries())
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .map(([oliveTypeId, data]) => ({ oliveTypeId, ...data }))
        })

        const [transactions, txStats, monthlySales, byRegion, byOliveType] = await Promise.all([
          // Recent transactions
          db.transaction.findMany({
            where: {
              ...txWhere,
              auction: { ...auctionWhere },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              auction: {
                include: {
                  oliveType: { select: { name: true } },
                  region: { select: { name: true } },
                  seller: { select: { name: true, phone: true, enterprise: true } },
                },
              },
              buyer: { select: { name: true, phone: true, enterprise: true } },
            },
          }),
          // Aggregated stats
          db.transaction.aggregate({
            where: {
              ...txWhere,
              auction: { ...auctionWhere },
            },
            _count: true,
            _sum: { finalPrice: true },
            _avg: { finalPrice: true },
          }),
          monthlySalesPromise,
          byRegionPromise,
          byOliveTypePromise,
        ])

        result.stats = {
          totalTransactions: txStats._count,
          totalRevenue: txStats._sum.finalPrice || 0,
          avgTransaction: txStats._avg.finalPrice || 0,
        }
        result.transactions = transactions
        result.monthlySales = monthlySales
        result.byRegion = byRegion
        result.byOliveType = byOliveType
        break
      }

      case 'auctions': {
        const auctionWhere: Record<string, unknown> = {
          createdAt: dateFilter,
          ...regionFilter,
          ...oliveFilter,
        }

        // --- monthlyAuctions: fetch flat rows, group in JS ---
        const monthlyAuctionsPromise = db.auction.findMany({
          where: auctionWhere,
          select: { createdAt: true, status: true },
        }).then(rows => {
          const monthMap = new Map<string, { total: number; active: number; closed: number }>()
          for (const item of rows) {
            const m = toMonthKey(item.createdAt)
            const bucket = monthMap.get(m) ?? { total: 0, active: 0, closed: 0 }
            bucket.total++
            if (item.status === 'ACTIVE') bucket.active++
            if (item.status === 'CLOSED') bucket.closed++
            monthMap.set(m, bucket)
          }
          // Sort DESC, take last 12 months, then reverse for ASC order
          return Array.from(monthMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12)
            .reverse()
            .map(([month, data]) => ({ month, ...data }))
        })

        // --- topSellers: fetch with seller, group in JS ---
        const topSellersPromise = db.auction.findMany({
          where: auctionWhere,
          select: {
            sellerId: true,
            quantity: true,
            seller: { select: { id: true, name: true, phone: true, enterprise: true } },
          },
        }).then(rows => {
          const sellerMap = new Map<string, { name: string; phone: string; enterprise: string | null; auctionCount: number; totalQuantity: number }>()
          for (const item of rows) {
            const key = item.sellerId
            const bucket = sellerMap.get(key) ?? {
              name: item.seller.name,
              phone: item.seller.phone,
              enterprise: item.seller.enterprise,
              auctionCount: 0,
              totalQuantity: 0,
            }
            bucket.auctionCount++
            bucket.totalQuantity += Number(item.quantity ?? 0)
            sellerMap.set(key, bucket)
          }
          return Array.from(sellerMap.entries())
            .sort((a, b) => b[1].auctionCount - a[1].auctionCount)
            .slice(0, 10)
            .map(([sellerId, data]) => ({ sellerId, ...data }))
        })

        const [auctionStats, statusBreakdown, monthlyAuctions, topSellers] = await Promise.all([
          db.auction.aggregate({
            where: auctionWhere,
            _count: true,
            _sum: { quantity: true, viewCount: true },
          }),
          db.auction.groupBy({
            by: ['status'],
            where: auctionWhere,
            _count: true,
            _sum: { quantity: true },
          }),
          monthlyAuctionsPromise,
          topSellersPromise,
        ])

        result.stats = {
          totalAuctions: auctionStats._count,
          totalQuantity: auctionStats._sum?.quantity || 0,
          totalViews: auctionStats._sum?.viewCount || 0,
        }
        result.statusBreakdown = statusBreakdown
        result.monthlyAuctions = monthlyAuctions
        result.topSellers = topSellers
        break
      }

      case 'users': {
        const userWhere: Record<string, unknown> = startDate ? { createdAt: dateFilter } : {}

        // --- monthlySignups: fetch flat rows, group in JS ---
        const monthlySignupsPromise = db.user.findMany({
          where: userWhere,
          select: { createdAt: true },
        }).then(rows => {
          const monthMap = new Map<string, number>()
          for (const item of rows) {
            const m = toMonthKey(item.createdAt)
            monthMap.set(m, (monthMap.get(m) || 0) + 1)
          }
          // Sort DESC, take last 12 months, then reverse for ASC order
          return Array.from(monthMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 12)
            .reverse()
            .map(([month, count]) => ({ month, count }))
        })

        // --- topBuyers: fetch bids with buyer, group in JS ---
        const topBuyersPromise = db.bid.findMany({
          where: {
            status: { in: ['WON', 'WINNING'] },
            createdAt: dateFilter,
          },
          select: {
            buyerId: true,
            totalPrice: true,
            buyer: { select: { id: true, name: true, phone: true } },
          },
        }).then(rows => {
          const buyerMap = new Map<string, { name: string; phone: string; bidCount: number; totalSpent: number }>()
          for (const item of rows) {
            const key = item.buyerId
            const bucket = buyerMap.get(key) ?? {
              name: item.buyer.name,
              phone: item.buyer.phone,
              bidCount: 0,
              totalSpent: 0,
            }
            bucket.bidCount++
            bucket.totalSpent += Number(item.totalPrice ?? 0)
            buyerMap.set(key, bucket)
          }
          return Array.from(buyerMap.entries())
            .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
            .slice(0, 10)
            .map(([buyerId, data]) => ({ buyerId, ...data }))
        })

        const [userStats, roleBreakdown, statusBreakdown, monthlySignups, topBuyers] = await Promise.all([
          db.user.aggregate({
            where: userWhere,
            _count: true,
            _avg: { rating: true },
          }),
          db.user.groupBy({
            by: ['role'],
            where: userWhere,
            _count: true,
          }),
          db.user.groupBy({
            by: ['status'],
            where: userWhere,
            _count: true,
          }),
          monthlySignupsPromise,
          topBuyersPromise,
        ])

        result.stats = {
          totalUsers: userStats._count,
          avgRating: (userStats._avg.rating || 0).toFixed(1),
        }
        result.roleBreakdown = roleBreakdown
        result.statusBreakdown = statusBreakdown
        result.monthlySignups = monthlySignups
        result.topBuyers = topBuyers
        break
      }

      default:
        return NextResponse.json({ error: 'Type de rapport invalide' }, { status: 400 })
    }

    return new NextResponse(safeJson(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

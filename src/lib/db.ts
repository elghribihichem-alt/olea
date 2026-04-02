import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always use Supabase PostgreSQL — never rely on env vars at runtime
// Port 6543 = Transaction pooler (Prisma-compatible, avoids MaxClientsInSessionMode)
// Port 5432 = Session pooler (NOT suitable for Prisma, connection pool exhaustion)
// pgbouncer=true disables prepared statements (required for transaction pooler)
const SUPABASE_URL = 'postgresql://postgres.akkolhyquypzgireqrsg:Strat19max79free%2F%2F@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: SUPABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

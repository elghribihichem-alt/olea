import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always use Supabase PostgreSQL — never rely on env vars at runtime
const SUPABASE_URL = 'postgresql://postgres.akkolhyquypzgireqrsg:Strat19max79free%2F%2F@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: SUPABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

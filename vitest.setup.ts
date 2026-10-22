import { afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prismaTest = new PrismaClient({ adapter })

afterAll(async () => {
  await prismaTest.$disconnect()
})
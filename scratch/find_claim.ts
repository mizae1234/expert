import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const claims = await prisma.claim.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, claimNo: true, carPlate: true }
    })
    console.log('Recent claims in expert:', claims)
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

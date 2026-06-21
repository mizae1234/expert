import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const claims = await prisma.claim.findMany({
    where: {
      insuranceId: 'ins-002'
    }
  })
  console.log('Claims with insuranceId = ins-002:', claims.length)
  claims.forEach(c => {
    console.log(`- Claim No: ${c.claimNo}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

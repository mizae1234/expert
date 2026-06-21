import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const insurances = await prisma.insurance.findMany()
  const claims = await prisma.claim.findMany()
  const vendors = await prisma.vendor.findMany()
  const company = await prisma.companyProfile.findMany()

  console.log('Searching expert database for C002/c002...')

  insurances.forEach(i => {
    if (JSON.stringify(i).toLowerCase().includes('c002')) {
      console.log('Found in Insurance:', i)
    }
  })

  claims.forEach(c => {
    if (JSON.stringify(c).toLowerCase().includes('c002')) {
      console.log('Found in Claim:', c)
    }
  })

  vendors.forEach(v => {
    if (JSON.stringify(v).toLowerCase().includes('c002')) {
      console.log('Found in Vendor:', v)
    }
  })

  company.forEach(cp => {
    if (JSON.stringify(cp).toLowerCase().includes('c002')) {
      console.log('Found in Company:', cp)
    }
  })

  console.log('Search finished.')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

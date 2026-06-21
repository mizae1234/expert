import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const insurances = await prisma.insurance.findMany()
  console.log('INSURANCES IN EXPERT DB:')
  insurances.forEach(ins => {
    console.log(`- ID: ${ins.id}, Name: ${ins.name}, peakCustomerId: ${ins.peakCustomerId}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const invoices = await prisma.insuranceInvoice.findMany({
    include: {
      claim: {
        include: {
          insurance: true
        }
      }
    }
  })
  console.log('Total Insurance Invoices in Expert DB:', invoices.length)
  invoices.forEach(inv => {
    console.log(`ID: ${inv.id}, invoiceNo: ${inv.invoiceNo}, claimNo: ${inv.claim.claimNo}, insurance: ${inv.claim.insurance.name}, peakCustomerId: ${inv.claim.insurance.peakCustomerId}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const invs = await prisma.supplierInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  })
  console.log(invs.map(i => i.pdfUrl))
}
main().catch(console.error).finally(() => prisma.$disconnect())

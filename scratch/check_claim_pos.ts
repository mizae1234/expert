import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const claims = await prisma.claim.findMany({
      where: {
        OR: [
          { carPlate: { contains: '6490' } },
          { claimNo: { contains: '1690426047' } },
          { receiveNo: { contains: '1690426047' } },
          { transactionNo: { contains: '1690426047' } }
        ]
      },
      include: {
        parts: true,
        labors: true,
        purchaseOrders: {
          include: { items: true }
        }
      }
    })
    console.log(`Found ${claims.length} claims in expert:`)
    for (const claim of claims) {
      console.log('Claim No:', claim.claimNo, 'ID:', claim.id, 'Plate:', claim.carPlate)
      console.log('Parts:')
      for (const p of claim.parts) {
        console.log(`  Part: ${p.partNo} / ${p.partName}, qty: ${p.quantity}, approve: ${p.priceApprove}, status: ${p.paymentStatus}`)
      }
      console.log('Labors:')
      for (const l of claim.labors) {
        console.log(`  Labor: ${l.description}, approve: ${l.priceApprove}, status: ${l.paymentStatus}`)
      }
      console.log('PO count:', claim.purchaseOrders.length)
      for (const po of claim.purchaseOrders) {
        console.log(`  PO: ${po.poNo}, status: ${po.status}, total: ${po.totalAmount}`)
        for (const item of po.items) {
          console.log(`    Item: ${item.partNo} / ${item.description}, qty: ${item.quantity}, price: ${item.unitPrice}`)
        }
      }
    }
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

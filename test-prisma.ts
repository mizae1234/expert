import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const claim = await prisma.claim.findFirst()
    if (!claim) {
      console.log('No claims')
      return
    }
    const res = await prisma.claim.findUnique({
      where: { id: claim.id },
      include: {
        insurance: { select: { id: true, name: true, branch: true, taxId: true, branchCode: true, peakCustomerId: true } },
        garage: { select: { id: true, name: true, phone: true } },
        parts: { include: { partMaster: { select: { id: true, partNo: true, partName: true, standardPrice: true } } } },
        labors: true,
        purchaseOrders: { include: { vendor: { select: { id: true, name: true } }, items: true } },
        supplierInvoices: { include: { vendor: { select: { id: true, name: true } }, items: true, apPayment: { select: { id: true, paidAt: true, amount: true } } } },
        garageInvoices: { include: { garage: { select: { id: true, name: true } }, items: true } },
        insuranceInvoice: { include: { arPayment: { select: { id: true, receivedAt: true, amount: true } } } },
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        quotations: { include: { laborItems: true, partItems: true } },
        expenses: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' }, take: 30 },
        paymentRequests: { 
          include: { 
            supplierInvoice: { select: { id: true, invoiceNo: true, vendor: { select: { id: true, name: true } } } }, 
            garageInvoice: { select: { id: true, invoiceNo: true, garage: { select: { id: true, name: true } } } }, 
            insuranceInvoice: { select: { id: true, invoiceNo: true } }, 
            billReceipt: true 
          } 
        },
      }
    })
    console.log('Success!', res?.id)
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

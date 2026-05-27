import { PrismaClient, VendorType } from '@prisma/client'
import { mockClaims } from '../src/lib/mock/claims'
import { mockVendors } from '../src/lib/mock/vendors'
import { mockInsurances } from '../src/lib/mock/insurances'
import { mockPartsMaster } from '../src/lib/mock/parts-master'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Database...')

  // Clear existing data (optional, but good for clean seed)
  await prisma.supplierInvoiceItem.deleteMany()
  await prisma.pOItem.deleteMany()
  await prisma.supplierInvoice.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.garageInvoiceItem.deleteMany()
  await prisma.garageInvoice.deleteMany()
  await prisma.claimLabor.deleteMany()
  await prisma.claimPart.deleteMany()
  await prisma.quotationPart.deleteMany()
  await prisma.quotationLabor.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.insuranceInvoice.deleteMany()
  await prisma.paymentRequest.deleteMany()
  await prisma.aRPayment.deleteMany()
  await prisma.aPPayment.deleteMany()
  await prisma.claimStatusLog.deleteMany()
  await prisma.extractionLog.deleteMany()
  await prisma.claimExpense.deleteMany()
  await prisma.claimDocument.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.insurance.deleteMany()

  await prisma.partMaster.deleteMany()
  await prisma.user.deleteMany()

  // Seed default admin: admin / admin123
  const crypto = require('crypto')
  const salt = 'd9b7f3eb3c4f526b7d288d6c8b9d2e1c'
  const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex')
  const hashedPassword = `pbkdf2$1000$${salt}$${hash}`

  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบสูงสุด',
      role: 'ADMIN',
      isActive: true,
    }
  })
  console.log('Created default admin: admin / admin123')

  // Seed Insurances
  for (const ins of mockInsurances) {
    await prisma.insurance.create({
      data: {
        id: ins.id,
        name: ins.name,
        branch: ins.branch,
        taxId: ins.taxId,
        contactPerson: ins.contactPerson,
        peakCustomerId: ins.peakCustomerId,
        branchCode: ins.branchCode || '00000',
      }
    })
  }

  // Seed Vendors
  for (const ven of mockVendors) {
    await prisma.vendor.create({
      data: {
        id: ven.id,
        name: ven.name,
        vendorType: ven.vendorType as VendorType,
        taxId: ven.taxId,
        phone: ven.phone,
        zone: ven.zone,
        province: ven.province,
        paymentTerms: ven.paymentTerms,
        isActive: ven.isActive,
        branchCode: ven.branchCode || '00000',
        peakVendorCode: ven.peakVendorCode,
      }
    })
  }

  // Seed default Garage (as a Vendor with type GARAGE)
  const defaultGarage = await prisma.vendor.upsert({
    where: { id: 'garage-1' },
    update: {},
    create: {
      id: 'garage-1',
      name: 'อู่มาตรฐาน 1',
      vendorType: VendorType.GARAGE,
      zone: 'BKK',
    }
  })

  // Seed Part Master
  for (const pm of mockPartsMaster) {
    await prisma.partMaster.create({
      data: {
        id: pm.id,
        partNo: pm.partNo,
        partName: pm.partName,
        partNameAlt: pm.partNameAlt || [],
        category: pm.category,
        unit: pm.unit,
        standardPrice: pm.standardPrice,
        isActive: pm.isActive,
      }
    })
  }

  // Seed Claims (Simplified version first)
  for (const claim of mockClaims) {
    // Ensure insurance exists
    let ins = await prisma.insurance.findUnique({ where: { id: claim.insuranceId } })
    if (!ins && claim.insurance) {
      ins = await prisma.insurance.create({
        data: {
          id: claim.insurance.id,
          name: claim.insurance.name,
        }
      })
    }

    const createdClaim = await prisma.claim.create({
      data: {
        id: claim.id,
        claimNo: claim.claimNo,
        receiveNo: claim.receiveNo,
        transactionNo: claim.transactionNo,
        insuranceId: claim.insuranceId || (ins?.id ?? 'ins-1'),
        garageId: defaultGarage.id,
        carPlate: claim.carPlate,
        carBrand: claim.carBrand,
        carModel: claim.carModel,
        carVin: claim.carVin,
        province: claim.province,
        insuredName: claim.insuredName,
        status: claim.status as any,
        createdAt: new Date(claim.createdAt),
      }
    })

    console.log(`Created Claim: ${createdClaim.claimNo}`)
  }

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

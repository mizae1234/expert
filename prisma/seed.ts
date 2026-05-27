import { PrismaClient, VendorType } from '@prisma/client'
import { mockClaims } from '../src/lib/mock/claims'
import { mockVendors } from '../src/lib/mock/vendors'
import { mockInsurances } from '../src/lib/mock/insurances'
import { mockPartsMaster } from '../src/lib/mock/parts-master'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Database (safe mode - no deletions)...')

  // ⚠️ NEVER use deleteMany() here — it will wipe production data!

  // Seed default admin (only if not exists)
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!existingAdmin) {
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
  } else {
    console.log('Admin user already exists, skipping...')
  }

  // Seed Insurances (upsert - skip if exists)
  for (const ins of mockInsurances) {
    await prisma.insurance.upsert({
      where: { id: ins.id },
      update: {},
      create: {
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

  // Seed Vendors (upsert - skip if exists)
  for (const ven of mockVendors) {
    await prisma.vendor.upsert({
      where: { id: ven.id },
      update: {},
      create: {
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

  // Seed default Garage (upsert)
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

  // Seed Part Master (upsert - skip if exists)
  for (const pm of mockPartsMaster) {
    await prisma.partMaster.upsert({
      where: { id: pm.id },
      update: {},
      create: {
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

  // Seed Claims (upsert - skip if exists)
  for (const claim of mockClaims) {
    // Ensure insurance exists
    let ins = await prisma.insurance.findUnique({ where: { id: claim.insuranceId } })
    if (!ins && claim.insurance) {
      ins = await prisma.insurance.upsert({
        where: { id: claim.insurance.id },
        update: {},
        create: {
          id: claim.insurance.id,
          name: claim.insurance.name,
        }
      })
    }

    await prisma.claim.upsert({
      where: { id: claim.id },
      update: {},
      create: {
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

    console.log(`Upserted Claim: ${claim.claimNo}`)
  }

  console.log('Seeding completed successfully (no data was deleted).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

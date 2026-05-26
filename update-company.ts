import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const companyData = {
    name: "บริษัท เอ็กซ์เพิร์ท บอดี้แอนด์เพนท์ จำกัด",
    taxId: "0105568142253",
    address: "622 ซ.ลาดพร้าว 47 (สะพาน 2)",
    subDistrict: "สะพานสอง",
    district: "วังทองหลาง",
    province: "กรุงเทพฯ",
    postalCode: "10310",
    branchCode: "00000",
    branchName: "สำนักงานใหญ่",
    logoUrl: "/logo_expert.png"
  }

  // Check if a company profile exists
  const existing = await prisma.companyProfile.findFirst()

  if (existing) {
    const updated = await prisma.companyProfile.update({
      where: { id: existing.id },
      data: companyData
    })
    console.log("Updated existing company profile:", updated.name)
  } else {
    const created = await prisma.companyProfile.create({
      data: companyData
    })
    console.log("Created new company profile:", created.name)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

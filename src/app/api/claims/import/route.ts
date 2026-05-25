import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัพโหลด' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as any[]

    const insurances = await prisma.insurance.findMany()
    const vendors = await prisma.vendor.findMany({ where: { vendorType: 'GARAGE' } })
    const cleanName = (name: string) => {
      if (!name) return ''
      return name
        .replace(/บริษัท|จำกัด|มหาชน|บมจ\.|หจก\./g, '')
        .replace(/\s+/g, '')
        .trim()
    }

    const defaultGarage = vendors.find(v => cleanName(v.name).includes('เอ็กซ์เพิร์ท')) || vendors[0]

    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const row of rows) {
      try {
        const claimNo = row['เลข e-claim']
        if (!claimNo) {
          skippedCount++
          continue
        }

        // Check if already exists in DB
        const existing = await prisma.claim.findUnique({
          where: { claimNo: String(claimNo) }
        })
        if (existing) {
          skippedCount++
          continue
        }

        const rawIns = row['ประกัน']
        const rawGar = row['ชื่อศูนย์บริการ']

        const cleanIns = cleanName(rawIns)
        const cleanGar = cleanName(rawGar)

        let matchedIns = insurances.find(ins => {
          const dbClean = cleanName(ins.name)
          return dbClean.includes(cleanIns) || cleanIns.includes(dbClean)
        })

        // Fallback or create default insurance if not matched
        if (!matchedIns && rawIns) {
          matchedIns = await prisma.insurance.create({
            data: { name: rawIns }
          })
          insurances.push(matchedIns)
        }

        let matchedGar = vendors.find(v => {
          const dbClean = cleanName(v.name)
          return dbClean.includes(cleanGar) || cleanGar.includes(dbClean)
        })

        // Fallback or create default garage vendor if not matched
        if (!matchedGar && rawGar) {
          matchedGar = await prisma.vendor.create({
            data: {
              name: rawGar,
              vendorType: 'GARAGE',
              province: row['จังหวัดรถ'] || 'กรุงเทพมหานคร'
            }
          })
          vendors.push(matchedGar)
        }

        const insuranceId = matchedIns?.id || insurances[0]?.id
        const garageId = matchedGar?.id || defaultGarage?.id

        if (!insuranceId || !garageId) {
          console.error(`Skipping row due to missing default insurance/garage for claimNo: ${claimNo}`)
          errorCount++
          continue
        }

        const partsAmount = Number(row['ค่าอะไหล่(ก่อน VAT)']) || 0
        const laborAmount = Number(row['ค่าแรง(ก่อน VAT)']) || 0

        const partsCreate = []
        if (partsAmount > 0) {
          partsCreate.push({
            partNo: 'PARTS',
            partName: 'ค่าอะไหล่',
            priceFullAmt: partsAmount,
            quantity: 1,
            damageType: 'ไม่ระบุ',
            discountPct: 0,
            priceOffer: partsAmount,
            priceApprove: partsAmount,
            supplier: '',
            requireReturn: false
          })
        }

        const laborsCreate = []
        if (laborAmount > 0) {
          laborsCreate.push({
            description: 'ค่าแรง',
            damageLevel: 'ไม่ระบุ',
            discountPct: 0,
            priceOffer: laborAmount,
            priceApprove: laborAmount
          })
        }

        const createdAt = row['วันที่ศูนย์ส่งเคลมไปบริษัทประกันครั้งแรก']
          ? new Date(row['วันที่ศูนย์ส่งเคลมไปบริษัทประกันครั้งแรก'])
          : new Date()
        
        const sentAt = row['วันที่ประกันอนุมัติครั้งแรก']
          ? new Date(row['วันที่ประกันอนุมัติครั้งแรก'])
          : null

        await prisma.claim.create({
          data: {
            claimNo: String(claimNo),
            receiveNo: String(row['เลขที่รับแจ้ง'] || ''),
            transactionNo: String(row['JOBNO'] || ''),
            insuranceId,
            garageId,
            carPlate: String(row['ทะเบียนรถ'] || ''),
            carBrand: String(row['ยี่ห้อรถ'] || ''),
            carModel: String(row['รุ่นรถ'] || ''),
            carVin: '',
            province: String(row['จังหวัดรถ'] || 'กรุงเทพมหานคร'),
            insuredName: '',
            status: 'RECEIVED',
            createdAt,
            sentAt,
            parts: { create: partsCreate },
            labors: { create: laborsCreate }
          }
        })

        importedCount++
      } catch (err) {
        console.error(`Error importing row for claimNo: ${row['เลข e-claim']}`, err)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount
    })
  } catch (error: any) {
    console.error('Import claims API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

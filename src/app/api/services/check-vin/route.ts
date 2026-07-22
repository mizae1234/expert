import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vin = searchParams.get('vin') || ''

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 })
    }

    // Find the name of SV-00003 from ServiceMaster
    const sv00003 = await prisma.serviceMaster.findUnique({
      where: { serviceCode: 'SV-00003' }
    })
    const searchName = sv00003?.name || 'พ่นข้าง'

    // Check if this VIN has done this service before
    const record = await prisma.serviceItem.findFirst({
      where: {
        description: searchName,
        serviceVehicle: {
          carVin: vin
        }
      }
    })

    const hasDone = !!record

    // Also return the catalog info for SV-00001 and SV-00004
    const sv00001 = await prisma.serviceMaster.findUnique({
      where: { serviceCode: 'SV-00001' }
    })
    const sv00004 = await prisma.serviceMaster.findUnique({
      where: { serviceCode: 'SV-00004' }
    })

    return NextResponse.json({
      hasDone,
      sv00001,
      sv00004
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const insuranceId = searchParams.get('insuranceId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search')

  let filtered = [...mockClaims]

  if (status) {
    filtered = filtered.filter(c => c.status === status)
  }
  if (insuranceId) {
    filtered = filtered.filter(c => c.insuranceId === insuranceId)
  }
  if (dateFrom) {
    filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(dateFrom))
  }
  if (dateTo) {
    filtered = filtered.filter(c => new Date(c.createdAt) <= new Date(dateTo))
  }
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(c =>
      c.claimNo.toLowerCase().includes(s) ||
      c.carPlate.toLowerCase().includes(s) ||
      c.insuredName.toLowerCase().includes(s)
    )
  }

  // Return without deep nested data for list view
  const listData = filtered.map(c => ({
    id: c.id,
    claimNo: c.claimNo,
    receiveNo: c.receiveNo,
    carPlate: c.carPlate,
    carBrand: c.carBrand,
    carModel: c.carModel,
    insuredName: c.insuredName,
    province: c.province,
    status: c.status,
    insurance: c.insurance,
    garage: c.garage,
    createdAt: c.createdAt,
    sentAt: c.sentAt,
    partsCount: c.parts?.length || 0,
    laborsCount: c.labors?.length || 0,
  }))

  return NextResponse.json(listData)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // In mock mode, return a fake created claim
  const newClaim = {
    id: `claim-${Date.now()}`,
    claimNo: `CLM-2025${String(mockClaims.length + 1).padStart(4, '0')}`,
    status: 'RECEIVED',
    createdAt: new Date().toISOString(),
    ...body,
  }

  return NextResponse.json(newClaim, { status: 201 })
}

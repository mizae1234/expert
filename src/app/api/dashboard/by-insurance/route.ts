import { NextResponse } from 'next/server'
import { getMockRevenueByInsurance } from '@/lib/mock/dashboard'

export async function GET() {
  return NextResponse.json(getMockRevenueByInsurance())
}

import { NextResponse } from 'next/server'
import { getMockDashboardSummary } from '@/lib/mock/dashboard'

export async function GET() {
  return NextResponse.json(getMockDashboardSummary())
}

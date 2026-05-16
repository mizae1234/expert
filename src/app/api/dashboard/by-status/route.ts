import { NextResponse } from 'next/server'
import { getMockClaimsByStatus } from '@/lib/mock/dashboard'

export async function GET() {
  return NextResponse.json(getMockClaimsByStatus())
}

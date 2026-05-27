import { NextResponse } from 'next/server'
import { signJWT, verifyJWT } from '@/lib/jwt'

// Temporary debug endpoint - DELETE after fixing login
export async function GET() {
  const results: any = { steps: [] }
  
  try {
    // Test 1: crypto.subtle available?
    results.steps.push({ test: 'crypto.subtle', available: typeof crypto?.subtle !== 'undefined' })
    
    // Test 2: Can we sign a JWT?
    const testPayload = { id: 'test', role: 'ADMIN' }
    const token = await signJWT(testPayload, 60)
    results.steps.push({ test: 'signJWT', success: true, tokenLength: token.length })
    
    // Test 3: Can we verify it?
    const verified = await verifyJWT(token)
    results.steps.push({ test: 'verifyJWT', success: !!verified, payload: verified })
    
    // Test 4: Environment
    results.env = {
      NODE_ENV: process.env.NODE_ENV,
      hasDB: !!process.env.DATABASE_URL,
    }
    
    results.ok = true
  } catch (err: any) {
    results.error = err.message
    results.stack = err.stack?.slice(0, 500)
  }
  
  return NextResponse.json(results)
}

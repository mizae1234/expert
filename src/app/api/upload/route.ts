import { NextResponse } from 'next/server'
import { generateUploadUrl } from '@/lib/r2'

export async function POST(req: Request) {
  try {
    const { filename, contentType, folder } = await req.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
    }

    // Default to 'general' if no folder is provided. 
    // Examples: 'claims/claim-001/images', 'settings/company/logo'
    const targetFolder = folder || 'general'

    const uploadData = await generateUploadUrl(targetFolder, filename, contentType)

    return NextResponse.json(uploadData)
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}

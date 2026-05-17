import { NextResponse } from 'next/server'
import { r2, BUCKET_NAME, PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name
    const contentType = file.type

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_ก-๙]/g, '_')
    const uniqueName = `${uuidv4().substring(0, 8)}_${safeName}`
    const key = `${folder}/${uniqueName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await r2.send(command)

    const publicUrl = `${PUBLIC_URL}/${key}`

    return NextResponse.json({ publicUrl, key })
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Failed to upload file to R2' }, { status: 500 })
  }
}

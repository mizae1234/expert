import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
export const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

/**
 * Generate a presigned URL for direct client-side upload to R2
 */
export async function generateUploadUrl(folder: string, originalFilename: string, contentType: string) {
  const ext = originalFilename.split('.').pop()
  const uniqueName = `${uuidv4()}.${ext}`
  const key = `${folder}/${uniqueName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })
  const publicUrl = `${PUBLIC_URL}/${key}`

  return { signedUrl, publicUrl, key }
}

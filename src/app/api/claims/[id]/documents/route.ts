import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all documents for a claim
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docs = await prisma.claimDocument.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(docs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST create a new document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const doc = await prisma.claimDocument.create({
      data: {
        claimId: params.id,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileType: body.fileType || 'other',
        fileSize: body.fileSize || 0,
        description: body.description || null,
        uploadedBy: body.uploadedBy || 'Admin',
      }
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })
    
    await prisma.claimDocument.delete({ where: { id: docId } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

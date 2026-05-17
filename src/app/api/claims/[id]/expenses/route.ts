import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all expenses for a claim
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenses = await prisma.claimExpense.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST create a new expense
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const expense = await prisma.claimExpense.create({
      data: {
        claimId: params.id,
        category: body.category || 'other',
        description: body.description,
        amount: Number(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        receiptUrl: body.receiptUrl || null,
        note: body.note || null,
        billable: body.billable ?? false,
        createdBy: body.createdBy || 'Admin',
      }
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const expenseId = searchParams.get('expenseId')
    if (!expenseId) return NextResponse.json({ error: 'Missing expenseId' }, { status: 400 })
    
    await prisma.claimExpense.delete({ where: { id: expenseId } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

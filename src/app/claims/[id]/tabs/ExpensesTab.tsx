'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Receipt, Upload, Eye, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { uploadToR2 } from '@/lib/upload'
import { ClaimTabProps } from './types'

const CATEGORIES = [
  { value: 'shipping', label: 'ค่าส่งอะไหล่' },
  { value: 'handling', label: 'ค่าขนส่ง/ยก' },
  { value: 'towing', label: 'ค่ายกรถ/ลากรถ' },
  { value: 'paint_material', label: 'ค่าวัสดุสี' },
  { value: 'consumable', label: 'ค่าวัสดุสิ้นเปลือง' },
  { value: 'subcontract', label: 'ค่าจ้างช่วง' },
  { value: 'other', label: 'อื่นๆ' },
]

export default function ExpensesTab({ claim, showToast, setErrorModalMsg, refreshClaim }: ClaimTabProps) {
  const expenses = claim.expenses || []
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('shipping')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [billable, setBillable] = useState(false)
  const [note, setNote] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const billableTotal = expenses.filter((e: any) => e.billable).reduce((s: number, e: any) => s + e.amount, 0)
  const nonBillableTotal = expenses.filter((e: any) => !e.billable).reduce((s: number, e: any) => s + e.amount, 0)
  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0)

  const resetForm = () => {
    setCategory('shipping')
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setBillable(false)
    setNote('')
    setReceiptFile(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!description.trim() || !amount) {
      showToast('กรุณากรอกรายละเอียดและจำนวนเงิน')
      return
    }
    setSaving(true)
    try {
      let receiptUrl = null
      if (receiptFile) {
        receiptUrl = await uploadToR2(receiptFile, 'claim-expenses')
      }
      const res = await fetch(`/api/claims/${claim.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, amount: Number(amount), date, billable, note, receiptUrl })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      showToast('บันทึกค่าใช้จ่ายเรียบร้อย')
      resetForm()
      await refreshClaim()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/claims/${claim.id}/expenses?expenseId=${expenseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      showToast('ลบรายการเรียบร้อย')
      await refreshClaim()
    } catch (err: any) {
      setErrorModalMsg(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-[#94a3b8]">ค่าใช้จ่ายทั้งหมด</p>
          <p className="text-lg font-bold text-[#0f172a] mt-1">฿{formatCurrency(total)}</p>
          <p className="text-[10px] text-[#94a3b8]">{expenses.length} รายการ</p>
        </CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4 text-center">
          <p className="text-xs text-[#94a3b8]">เรียกเก็บจากประกัน</p>
          <p className="text-lg font-bold text-green-600 mt-1">฿{formatCurrency(billableTotal)}</p>
          <p className="text-[10px] text-green-600">รวมในใบวางบิล</p>
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-4 text-center">
          <p className="text-xs text-[#94a3b8]">ค่าใช้จ่ายภายใน</p>
          <p className="text-lg font-bold text-amber-600 mt-1">฿{formatCurrency(nonBillableTotal)}</p>
          <p className="text-[10px] text-amber-600">ไม่เรียกเก็บ</p>
        </CardContent></Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="w-5 h-5 text-[#1d4ed8]" />ค่าใช้จ่ายเพิ่มเติม</CardTitle>
          <Button size="sm" className="bg-[#1d4ed8]" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" />{showForm ? 'ยกเลิก' : 'เพิ่มรายการ'}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add Form */}
          {showForm && (
            <div className="bg-[#f8faff] border border-blue-100 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475569]">ประเภท</label>
                  <select className="w-full mt-1 p-2 text-sm border rounded-md" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569]">จำนวนเงิน (บาท)</label>
                  <Input type="number" className="mt-1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#475569]">รายละเอียด</label>
                <Input className="mt-1" placeholder="เช่น ค่าส่งอะไหล่จาก Bangkok" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475569]">วันที่</label>
                  <Input type="date" className="mt-1" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569]">หมายเหตุ</label>
                  <Input className="mt-1" placeholder="(ไม่บังคับ)" value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  {/* Billable toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]" />
                    <span className="text-sm text-[#475569]">รวมในใบวางบิลประกัน</span>
                  </label>
                  {/* File upload */}
                  <label className="flex items-center gap-1.5 text-sm text-[#1d4ed8] cursor-pointer hover:underline">
                    <Upload className="w-3.5 h-3.5" />
                    {receiptFile ? receiptFile.name : 'แนบหลักฐาน'}
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <Button className="bg-[#1d4ed8]" disabled={saving} onClick={handleSubmit}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8]">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีค่าใช้จ่ายเพิ่มเติม</p>
              <p className="text-xs mt-1">กดปุ่ม "เพิ่มรายการ" เพื่อบันทึกค่าส่ง ค่าขนส่ง หรือค่าใช้จ่ายอื่นๆ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8faff]">
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">ประเภท</TableHead>
                  <TableHead className="text-xs">รายละเอียด</TableHead>
                  <TableHead className="text-xs">วันที่</TableHead>
                  <TableHead className="text-xs text-right">จำนวนเงิน</TableHead>
                  <TableHead className="text-xs text-center">วางบิล</TableHead>
                  <TableHead className="text-xs text-center">หลักฐาน</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp: any, i: number) => (
                  <TableRow key={exp.id} className="hover:bg-blue-50/30">
                    <TableCell className="text-xs text-[#94a3b8]">{i + 1}</TableCell>
                    <TableCell>
                      <Badge className="border-none text-[9px] bg-gray-100 text-gray-700">
                        {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {exp.description}
                      {exp.note && <p className="text-[10px] text-[#94a3b8] mt-0.5">{exp.note}</p>}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">฿{formatCurrency(exp.amount)}</TableCell>
                    <TableCell className="text-center">
                      {exp.billable ? (
                        <Badge className="border-none text-[9px] bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />รวมบิล</Badge>
                      ) : (
                        <Badge className="border-none text-[9px] bg-gray-100 text-gray-500">ไม่รวม</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {exp.receiptUrl ? (
                        <Button variant="ghost" size="sm" className="text-[#1d4ed8] p-1" onClick={() => window.open(exp.receiptUrl)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#94a3b8]">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-red-500 p-1 hover:bg-red-50" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary row */}
                <TableRow className="bg-[#f0f4ff] font-semibold border-t-2 border-[#1d4ed8]">
                  <TableCell colSpan={4} className="text-xs">รวมทั้งหมด ({expenses.length} รายการ)</TableCell>
                  <TableCell className="text-right text-sm">฿{formatCurrency(total)}</TableCell>
                  <TableCell className="text-center text-xs text-green-600">฿{formatCurrency(billableTotal)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Quotation } from '@/lib/types'

interface CreateQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  parts: any[]
  labors: any[]
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  claimId,
  parts,
  labors,
  setQuotations,
  showToast,
  setErrorModalMsg
}: CreateQuotationModalProps) {
  const [qtLabors, setQtLabors] = useState<any[]>([])
  const [qtParts, setQtParts] = useState<any[]>([])
  const [qtDate, setQtDate] = useState('')
  const [qtValidUntil, setQtValidUntil] = useState('')
  const [qtCustomVat, setQtCustomVat] = useState('')
  const [qtCustomGrand, setQtCustomGrand] = useState('')
  const [qtNote, setQtNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQtLabors(labors.map(l => ({ ...l, selected: true })))
      setQtParts(parts.map(p => ({ ...p, selected: true })))
      setQtDate(new Date().toISOString().split('T')[0])
      
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setQtValidUntil(d.toISOString().split('T')[0])
      
      setQtCustomVat('')
      setQtCustomGrand('')
      setQtNote('')
    }
  }, [isOpen, parts, labors])

  if (!isOpen) return null

  const laborTot = qtLabors.filter(l => l.selected).reduce((sum, l) => sum + (Number(l.priceApprove) || 0), 0)
  const partTot = qtParts.filter(p => p.selected).reduce((sum, p) => sum + ((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)), 0)
  const sub = partTot + laborTot
  const vatAmt = qtCustomVat !== '' ? Number(qtCustomVat) : Math.round(sub * 0.07 * 100) / 100
  const grand = qtCustomGrand !== '' ? Number(qtCustomGrand) : (sub + vatAmt)

  const handleCreateQuotation = async () => {
    const qtNo = `QT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`

    const payload = {
      quotationNo: qtNo,
      quotationDate: new Date(qtDate).toISOString(),
      validUntil: new Date(qtValidUntil).toISOString(),
      laborItems: qtLabors.filter(l => l.selected).map(l => ({
        description: l.description,
        damageLevel: l.damageLevel,
        discountPct: l.discountPct,
        unitPrice: l.priceApprove,
        totalPrice: l.priceApprove
      })),
      partItems: qtParts.filter(p => p.selected).map(p => ({
        partNo: p.partNo,
        partName: p.partName,
        quantity: p.quantity,
        unitPrice: p.priceApprove,
        discountPct: p.discountPct,
        totalPrice: p.priceApprove * p.quantity
      })),
      laborTotal: laborTot,
      partsTotal: partTot,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: grand,
      note: qtNote || undefined,
      status: 'DRAFT',
      createdBy: 'Admin',
    }

    try {
      const res = await fetch(`/api/claims/${claimId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create quotation')
      const newQt = await res.json()
      setQuotations(prev => [...prev, newQt])
      showToast(`สร้างใบเสนอราคา ${newQt.quotationNo || qtNo} สำเร็จ`)
      onClose()
    } catch (err) {
      setErrorModalMsg('เกิดข้อผิดพลาดในการสร้างใบเสนอราคา')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-[#f8faff]">
          <h3 className="font-semibold text-lg text-[#0f172a] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1d4ed8]" />
            ออกใบเสนอราคา (Quotation)
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[#94a3b8] hover:text-[#0f172a]">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#475569]">วันที่เสนอราคา</label>
                <Input type="date" className="mt-1" value={qtDate} onChange={e => setQtDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#475569]">วันหมดอายุ</label>
                <Input type="date" className="mt-1" value={qtValidUntil} onChange={e => setQtValidUntil(e.target.value)} />
              </div>
            </div>

            {/* Items Selection Table */}
            <div className="border rounded-lg overflow-hidden mt-4">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="w-20 text-center">จำนวน</TableHead>
                    <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="w-32 text-right">รวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-blue-50/30">
                    <TableCell colSpan={5} className="font-semibold text-sm">รายการค่าแรง</TableCell>
                  </TableRow>
                  {qtLabors.map((l, i) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={l.selected}
                          onChange={e => {
                            const n = [...qtLabors]
                            n[i].selected = e.target.checked
                            setQtLabors(n)
                          }}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          value={l.description}
                          onChange={e => {
                            const n = [...qtLabors]
                            n[i].description = e.target.value
                            setQtLabors(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={l.priceApprove || ''}
                          onChange={e => {
                            const n = [...qtLabors]
                            n[i].priceApprove = Number(e.target.value)
                            setQtLabors(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm pt-3">
                        ฿{formatCurrency(Number(l.priceApprove) || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50/30">
                    <TableCell colSpan={5} className="font-semibold text-sm">รายการอะไหล่</TableCell>
                  </TableRow>
                  {qtParts.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={e => {
                            const n = [...qtParts]
                            n[i].selected = e.target.checked
                            setQtParts(n)
                          }}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          value={p.partName}
                          onChange={e => {
                            const n = [...qtParts]
                            n[i].partName = e.target.value
                            setQtParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-center"
                          value={p.quantity || ''}
                          onChange={e => {
                            const n = [...qtParts]
                            n[i].quantity = Number(e.target.value)
                            setQtParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={p.priceApprove || ''}
                          onChange={e => {
                            const n = [...qtParts]
                            n[i].priceApprove = Number(e.target.value)
                            setQtParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm pt-3">
                        ฿{formatCurrency((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <label className="text-sm font-medium text-[#475569]">หมายเหตุ (แสดงในใบเสนอราคา)</label>
              <Input
                placeholder="เช่น ราคาอะไหล่อ้างอิงราคาศูนย์"
                className="mt-1"
                value={qtNote}
                onChange={e => setQtNote(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t items-end">
              <div><span className="text-xs text-[#94a3b8]">รวมค่าแรง</span><p className="font-semibold">฿{formatCurrency(laborTot)}</p></div>
              <div><span className="text-xs text-[#94a3b8]">รวมค่าอะไหล่</span><p className="font-semibold">฿{formatCurrency(partTot)}</p></div>
              <div>
                <span className="text-xs text-[#94a3b8]">VAT 7% (แก้ไขได้)</span>
                <Input
                  type="number"
                  placeholder={String(Math.round(sub * 0.07 * 100) / 100)}
                  className="h-8 mt-1"
                  value={qtCustomVat}
                  onChange={e => setQtCustomVat(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 text-right">
                <span className="text-xs text-[#94a3b8]">ยอดรวมทั้งสิ้น (แก้ไขได้)</span>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="font-bold text-[#1d4ed8] text-lg">฿</span>
                  <Input
                    type="number"
                    placeholder={String(sub + vatAmt)}
                    className="h-10 w-40 text-right font-bold text-[#1d4ed8] text-lg"
                    value={qtCustomGrand}
                    onChange={e => setQtCustomGrand(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button className="bg-[#1d4ed8]" onClick={handleCreateQuotation}>ยืนยันสร้างใบเสนอราคา</Button>
        </div>
      </div>
    </div>
  )
}

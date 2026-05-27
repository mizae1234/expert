"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Plus, Trash2, AlertTriangle, Download, X } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { ClaimTabProps } from './types'
import { formatDate } from '@/lib/date'
import { CreateQuotationModal } from '../components/CreateQuotationModal'

export default function PartsTab({
  claim,
  parts,
  setParts,
  labors,
  setLabors,
  quotations,
  setQuotations,
  editMode,
  partsTotal,
  laborTotal,
  showToast,
  setErrorModalMsg
}: ClaimTabProps) {
  const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false)
  const [showSupplementModal, setShowSupplementModal] = useState(false)
  const [supplementReason, setSupplementReason] = useState('')
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)

  const handleSendQuotation = async (qtId: string) => {
    try {
      const res = await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qtId, status: 'SENT' })
      })
      if (res.ok) {
        setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
        showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
      } else {
        setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
        showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
      }
    } catch {
      setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
      showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
    }
  }

  const handleCreateSupplement = async () => {
    if (!selectedQuotationId) return
    const oldQt = quotations.find(q => q.id === selectedQuotationId)
    if (!oldQt) return

    const sub = partsTotal + laborTotal
    const vatAmt = Math.round(sub * 0.07 * 100) / 100
    const supNo = `${oldQt.quotationNo}-S${quotations.filter(q => q.quotationNo.startsWith(oldQt.quotationNo)).length}`

    const payload = {
      quotationNo: supNo,
      quotationDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      laborItems: labors.map(l => ({
        description: l.description,
        damageLevel: l.damageLevel,
        discountPct: l.discountPct,
        unitPrice: l.priceApprove,
        totalPrice: l.priceApprove
      })),
      partItems: parts.map(p => ({
        partNo: p.partNo,
        partName: p.partName,
        quantity: p.quantity,
        unitPrice: p.priceApprove,
        discountPct: p.discountPct,
        totalPrice: p.priceApprove * p.quantity
      })),
      laborTotal,
      partsTotal,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: Math.round((sub + vatAmt) * 100) / 100,
      note: supplementReason || 'มีรายการซ่อมเพิ่มเติม',
      status: 'DRAFT',
      createdBy: 'Admin'
    }

    try {
      const res = await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create supplement quotation')
      const newQt = await res.json()

      await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedQuotationId, status: 'SUPERSEDED' })
      }).catch(() => {})

      setQuotations(prev => prev.map(q => q.id === selectedQuotationId ? { ...q, status: 'SUPERSEDED' as const } : q).concat(newQt))

      setShowSupplementModal(false)
      setSupplementReason('')
      showToast(`สร้าง Supplement ${supNo} สำเร็จ`)
    } catch (err) {
      setErrorModalMsg('เกิดข้อผิดพลาดในการสร้าง Supplement')
    }
  }

  return (
    <div className="space-y-6">
      {/* Parts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            อะไหล่ ({parts.length})
          </CardTitle>
          {editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setParts([...parts, {
                id: `new-p-${Date.now()}`,
                claimId: claim.id,
                partNo: '',
                partName: '',
                priceFullAmt: 0,
                quantity: 1,
                damageType: 'เปลี่ยน',
                discountPct: 0,
                priceOffer: 0,
                priceApprove: 0,
                supplier: '',
                requireReturn: false,
                round: 1,
                status: 'approved'
              }])}
            >
              <Plus className="w-4 h-4 mr-1" />เพิ่ม
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่ออะไหล่</TableHead>
                <TableHead className="text-right">ราคาเต็ม</TableHead>
                <TableHead className="text-center">จำนวน</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">ส่วนลด%</TableHead>
                <TableHead className="text-right">ราคาอนุมัติ</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead className="text-center">คืนซาก</TableHead>
                {editMode && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part, idx) => (
                <TableRow key={part.id}>
                  <TableCell>
                    {editMode ? (
                      <Input
                        list="part-no-list"
                        className="h-8 min-w-[120px] font-mono text-xs"
                        value={part.partNo}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], partNo: e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      <span className="font-mono text-xs">{part.partNo}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode ? (
                      <Input
                        list="parts-list"
                        className={cn("h-8 min-w-[200px]", !part.partName?.trim() && "border-red-500 focus-visible:ring-red-500")}
                        value={part.partName}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], partName: e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      <span className="font-medium">{part.partName}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[100px] text-right"
                        value={part.priceFullAmt || ''}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], priceFullAmt: +e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      formatCurrency(part.priceFullAmt)
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[60px] text-center"
                        value={part.quantity || ''}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], quantity: +e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      part.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode ? (
                      <Input
                        list="damage-type-list"
                        className="h-8 min-w-[80px]"
                        value={part.damageType}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], damageType: e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{part.damageType}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[70px] text-right"
                        value={part.discountPct || ''}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], discountPct: +e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      `${part.discountPct}%`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[100px] text-right font-semibold"
                        value={part.priceApprove || ''}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], priceApprove: +e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(part.priceApprove)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode ? (
                      <Input
                        className="h-8 min-w-[120px]"
                        value={part.supplier}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], supplier: e.target.value }
                          setParts(n)
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#475569]">{part.supplier}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editMode ? (
                      <input
                        type="checkbox"
                        checked={part.requireReturn}
                        onChange={e => {
                          const n = [...parts]
                          n[idx] = { ...n[idx], requireReturn: e.target.checked }
                          setParts(n)
                        }}
                        className="w-4 h-4"
                      />
                    ) : part.requireReturn ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                        <AlertTriangle className="w-3 h-3" />คืนซาก
                      </span>
                    ) : null}
                  </TableCell>
                  {editMode && (
                    <TableCell>
                      <button
                        onClick={() => setParts(parts.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Labors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            ค่าแรง ({labors.length})
          </CardTitle>
          {editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLabors([...labors, {
                id: `new-l-${Date.now()}`,
                claimId: claim.id,
                description: '',
                damageLevel: 'ปานกลาง',
                discountPct: 0,
                priceOffer: 0,
                priceApprove: 0,
                round: 1,
                status: 'approved'
              }])}
            >
              <Plus className="w-4 h-4 mr-1" />เพิ่ม
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รายการ</TableHead>
                <TableHead>ระดับ</TableHead>
                <TableHead className="text-right">ส่วนลด%</TableHead>
                <TableHead className="text-right">ราคาเสนอ</TableHead>
                <TableHead className="text-right">ราคาอนุมัติ</TableHead>
                {editMode && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {labors.map((labor, idx) => (
                <TableRow key={labor.id}>
                  <TableCell>
                    {editMode ? (
                      <Input
                        list="labors-list"
                        className={cn("h-8 min-w-[200px]", !labor.description?.trim() && "border-red-500 focus-visible:ring-red-500")}
                        value={labor.description}
                        onChange={e => {
                          const n = [...labors]
                          n[idx] = { ...n[idx], description: e.target.value }
                          setLabors(n)
                        }}
                      />
                    ) : (
                      <span className="font-medium">{labor.description}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode ? (
                      <Input
                        list="damage-level-list"
                        className="h-8 min-w-[100px]"
                        value={labor.damageLevel}
                        onChange={e => {
                          const n = [...labors]
                          n[idx] = { ...n[idx], damageLevel: e.target.value }
                          setLabors(n)
                        }}
                      />
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{labor.damageLevel}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[70px] text-right"
                        value={labor.discountPct || ''}
                        onChange={e => {
                          const n = [...labors]
                          n[idx] = { ...n[idx], discountPct: +e.target.value }
                          setLabors(n)
                        }}
                      />
                    ) : (
                      `${labor.discountPct}%`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[100px] text-right"
                        value={labor.priceOffer || ''}
                        onChange={e => {
                          const n = [...labors]
                          n[idx] = { ...n[idx], priceOffer: +e.target.value }
                          setLabors(n)
                        }}
                      />
                    ) : (
                      formatCurrency(labor.priceOffer)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        className="h-8 min-w-[100px] text-right font-semibold"
                        value={labor.priceApprove || ''}
                        onChange={e => {
                          const n = [...labors]
                          n[idx] = { ...n[idx], priceApprove: +e.target.value }
                          setLabors(n)
                        }}
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(labor.priceApprove)}</span>
                    )}
                  </TableCell>
                  {editMode && (
                    <TableCell>
                      <button
                        onClick={() => setLabors(labors.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quotations */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1d4ed8]" />
            ใบเสนอราคา (Quotation)
          </CardTitle>
          <Button size="sm" className="bg-[#1d4ed8]" onClick={() => setShowCreateQuotationModal(true)}>
            <Plus className="w-4 h-4 mr-1" />ออกใบเสนอราคา
          </Button>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8]">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีใบเสนอราคา</p>
              <p className="text-xs mt-1">กดปุ่มด้านบนเพื่อสร้างจากรายการอะไหล่/ค่าแรง</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...quotations].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(qt => {
                const statusMap: Record<string, { bg: string; label: string }> = {
                  DRAFT: { bg: 'bg-gray-100 text-gray-600', label: 'กำลังร่าง' },
                  SENT: { bg: 'bg-blue-100 text-blue-700', label: 'ส่งให้ประกันแล้ว' },
                  APPROVED: { bg: 'bg-green-100 text-green-700', label: 'อนุมัติแล้ว ✅' },
                  REJECTED: { bg: 'bg-red-100 text-red-700', label: 'ถูกปฏิเสธ' },
                  SUPERSEDED: { bg: 'bg-amber-100 text-amber-700', label: 'มี Supplement แล้ว' },
                }
                const s = statusMap[qt.status] || statusMap.DRAFT
                return (
                  <div key={qt.id} className={`border rounded-lg p-4 ${qt.status === 'APPROVED' ? 'border-green-200 bg-green-50/30' : qt.status === 'SUPERSEDED' ? 'border-amber-200 bg-amber-50/30 opacity-60' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#1d4ed8]">{qt.quotationNo}</span>
                        <Badge className={`border-none text-[10px] ${s.bg}`}>{s.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {qt.status === 'APPROVED' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setSelectedQuotationId(qt.id); setShowSupplementModal(true); }}>
                            <Plus className="w-3 h-3 mr-1" />Supplement
                          </Button>
                        )}
                        {qt.status === 'DRAFT' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-200" onClick={() => handleSendQuotation(qt.id)}>ส่งให้ประกัน</Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/claims/${claim.id}/pdf/quotation?qtId=${qt.id}`)}><Download className="w-3 h-3 mr-1" />PDF</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ar-invoice&qtId=${qt.id}`)}><Download className="w-3 h-3 mr-1" />PEAK</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-[#94a3b8] text-xs">วันที่</span><p className="font-medium">{formatDate(qt.quotationDate)}</p></div>
                      <div><span className="text-[#94a3b8] text-xs">หมดอายุ</span><p className="font-medium">{formatDate(qt.validUntil)}</p></div>
                      <div><span className="text-[#94a3b8] text-xs">ค่าแรง ({(qt.laborItems || []).length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.laborTotal)}</p></div>
                      <div><span className="text-[#94a3b8] text-xs">อะไหล่ ({(qt.partItems || []).length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.partsTotal)}</p></div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-[#475569]">
                        {qt.approvedBy && <span>อนุมัติโดย: <strong>{qt.approvedBy}</strong></span>}
                      </div>
                      <span className="text-base font-bold text-[#1d4ed8]">฿{formatCurrency(qt.grandTotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateQuotationModal
        isOpen={showCreateQuotationModal}
        onClose={() => setShowCreateQuotationModal(false)}
        claimId={claim.id}
        parts={parts}
        labors={labors}
        setQuotations={setQuotations}
        showToast={showToast}
        setErrorModalMsg={setErrorModalMsg}
      />

      {/* Supplement Modal */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50">
              <h3 className="font-semibold text-lg text-amber-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                เปิด Supplement
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSupplementModal(false)} className="h-8 w-8 text-amber-700/50 hover:text-amber-900">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                คุณกำลังจะสร้างใบเสนอราคาฉบับเพิ่มเติม (Supplement) อ้างอิงจากใบเสนอราคาเดิม ระบบจะทำการคัดลอกข้อมูลทั้งหมดไปยังฉบับร่างใหม่ และปรับสถานะฉบับเดิมเป็น &quot;SUPERSEDED&quot;
              </p>
              <div>
                <label className="text-sm font-medium text-[#475569]">เหตุผลที่เปิด Supplement</label>
                <Input
                  placeholder="เช่น มีรายการซ่อมเพิ่มเติม"
                  className="mt-1"
                  value={supplementReason}
                  onChange={e => setSupplementReason(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSupplementModal(false)}>ยกเลิก</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateSupplement}>
                ยืนยันเปิด Supplement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

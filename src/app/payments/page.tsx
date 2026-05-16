'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { mockPaymentRequests } from '@/lib/mock/payment-requests'
import { PaymentRequest } from '@/lib/types'

const statusColor = (s: string) => {
  if (s === 'APPROVED') return 'bg-green-100 text-green-700'
  if (s === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}
const statusLabel = (s: string) => s === 'APPROVED' ? 'อนุมัติแล้ว' : s === 'REJECTED' ? 'ถูกปฏิเสธ' : 'รออนุมัติ'
const typeLabel = (t: string) => t === 'AP_VENDOR' ? 'AP Vendor' : t === 'AP_GARAGE' ? 'AP อู่' : 'AR ประกัน'
const typeBadge = (t: string) => t === 'AR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'

export default function PaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>(mockPaymentRequests)
  const [activeModal, setActiveModal] = useState<{ type: 'approve' | 'reject' | 'bill'; pr: PaymentRequest } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [billForm, setBillForm] = useState({ physicalInvoiceNo: '', receivedBy: '', note: '' })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  const pending = requests.filter(r => r.status === 'PENDING_APPROVAL')
  const approved = requests.filter(r => r.status === 'APPROVED')
  const rejected = requests.filter(r => r.status === 'REJECTED')

  const handleApprove = (pr: PaymentRequest) => {
    setRequests(prev => prev.map(r => r.id === pr.id ? { ...r, status: 'APPROVED' as const, approvedBy: 'Manager', approvedAt: new Date().toISOString() } : r))
    setActiveModal(null)
    showToast(`อนุมัติ ${pr.claimNo} เรียบร้อย`)
  }

  const handleReject = (pr: PaymentRequest) => {
    if (!rejectReason.trim()) return
    setRequests(prev => prev.map(r => r.id === pr.id ? { ...r, status: 'REJECTED' as const, rejectReason, approvedBy: 'Manager' } : r))
    setActiveModal(null); setRejectReason('')
    showToast(`ปฏิเสธ ${pr.claimNo}`)
  }

  const handleBillReceipt = (pr: PaymentRequest) => {
    const sysNo = pr.supplierInvoiceId ? `SINV-${pr.claimNo?.split('CLM-2025')[1]}` : `INV-${pr.claimNo?.split('CLM-2025')[1]}`
    const matched = billForm.physicalInvoiceNo.trim() === sysNo
    setRequests(prev => prev.map(r => r.id === pr.id ? {
      ...r, billReceipt: {
        id: `br-new-${Date.now()}`, paymentRequestId: pr.id, receivedDate: new Date().toISOString(),
        physicalInvoiceNo: billForm.physicalInvoiceNo, invoiceNoMatched: matched,
        receivedBy: billForm.receivedBy, systemInvoiceNo: sysNo,
        poNo: pr.supplierInvoiceId ? `PO-${pr.claimNo?.split('CLM-2025')[1]}` : undefined,
        claimNo: pr.claimNo || '', amount: pr.amount, note: billForm.note, createdAt: new Date().toISOString(),
      }
    } : r))
    setActiveModal(null); setBillForm({ physicalInvoiceNo: '', receivedBy: '', note: '' })
    showToast('บันทึกการรับบิลเรียบร้อย')
  }

  const renderRow = (pr: PaymentRequest) => (
    <TableRow key={pr.id}>
      <TableCell className="text-xs text-[#94a3b8]">{new Date(pr.createdAt).toLocaleDateString('th-TH')}</TableCell>
      <TableCell><Badge className={`${typeBadge(pr.requestType)} border-none text-[10px]`}>{typeLabel(pr.requestType)}</Badge></TableCell>
      <TableCell className="font-semibold text-[#1d4ed8]">{pr.claimNo}</TableCell>
      <TableCell className="text-xs">{pr.carPlate}</TableCell>
      <TableCell className="text-sm">{pr.vendorName || pr.garageName || pr.insuranceName}</TableCell>
      <TableCell className="text-right font-semibold">฿{formatCurrency(pr.amount)}</TableCell>
      <TableCell className="text-xs">{pr.createdBy}</TableCell>
      <TableCell>
        {pr.billReceipt ? (
          pr.billReceipt.invoiceNoMatched
            ? <span className="flex items-center gap-1 text-green-600 text-[10px]"><CheckCircle2 className="w-3 h-3" />บิลตรง</span>
            : <span className="flex items-center gap-1 text-amber-500 text-[10px]"><AlertTriangle className="w-3 h-3" />บิลไม่ตรง</span>
        ) : <span className="text-[10px] text-[#94a3b8]">ยังไม่รับบิล</span>}
      </TableCell>
      <TableCell><Badge className={`${statusColor(pr.status)} border-none text-[10px]`}>{statusLabel(pr.status)}</Badge></TableCell>
      <TableCell>
        <div className="flex gap-1">
          {pr.status === 'PENDING_APPROVAL' && (
            <>
              {!pr.billReceipt && <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => { setBillForm({ physicalInvoiceNo: '', receivedBy: '', note: '' }); setActiveModal({ type: 'bill', pr }) }}>รับบิล</Button>}
              <Button size="sm" className="h-7 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => { setApproveNote(''); setActiveModal({ type: 'approve', pr }) }}>Approve</Button>
              <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => { setRejectReason(''); setActiveModal({ type: 'reject', pr }) }}>Reject</Button>
            </>
          )}
          {pr.status === 'REJECTED' && <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={pr.rejectReason}>{pr.rejectReason}</span>}
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Payment Requests</h1>
          <p className="text-sm text-[#94a3b8]">จัดการคำขออนุมัติจ่ายเงิน / รับเงิน</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'รออนุมัติ', value: pending.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'อนุมัติแล้ว', value: approved.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ถูกปฏิเสธ', value: rejected.length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'ยอดรออนุมัติ', value: `฿${formatCurrency(pending.reduce((s, r) => s + r.amount, 0))}`, icon: FileText, color: 'text-[#1d4ed8]', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <Card key={i} className={s.bg}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div><p className="text-xs text-[#475569]">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList><TabsTrigger value="pending">รออนุมัติ ({pending.length})</TabsTrigger><TabsTrigger value="approved">อนุมัติแล้ว ({approved.length})</TabsTrigger><TabsTrigger value="rejected">ถูกปฏิเสธ ({rejected.length})</TabsTrigger><TabsTrigger value="all">ทั้งหมด ({requests.length})</TabsTrigger></TabsList>
        {['pending', 'approved', 'rejected', 'all'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f8faff]">
                      <TableHead>วันที่</TableHead><TableHead>ประเภท</TableHead><TableHead>Claim No.</TableHead>
                      <TableHead>ทะเบียน</TableHead><TableHead>ผู้รับเงิน</TableHead>
                      <TableHead className="text-right">ยอด</TableHead><TableHead>สร้างโดย</TableHead>
                      <TableHead>บิล</TableHead><TableHead>สถานะ</TableHead><TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : requests).map(renderRow)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Approve Modal */}
      {activeModal?.type === 'approve' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader><CardTitle className="text-lg">อนุมัติคำขอจ่ายเงิน</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#f8faff] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#94a3b8]">ประเภท</span><span className="font-medium">{typeLabel(activeModal.pr.requestType)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">Claim No.</span><span className="font-semibold text-[#1d4ed8]">{activeModal.pr.claimNo}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ทะเบียนรถ</span><span>{activeModal.pr.carPlate}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ผู้รับเงิน</span><span>{activeModal.pr.vendorName || activeModal.pr.garageName || activeModal.pr.insuranceName}</span></div>
                {activeModal.pr.billReceipt && (
                  <div className="flex justify-between items-center"><span className="text-[#94a3b8]">บิลกระดาษ</span>
                    {activeModal.pr.billReceipt.invoiceNoMatched
                      ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />ตรงกัน ({activeModal.pr.billReceipt.physicalInvoiceNo})</span>
                      : <span className="flex items-center gap-1 text-amber-500 text-xs"><AlertTriangle className="w-3.5 h-3.5" />ไม่ตรง (ระบบ: {activeModal.pr.billReceipt.systemInvoiceNo} / กระดาษ: {activeModal.pr.billReceipt.physicalInvoiceNo})</span>}
                  </div>
                )}
                <hr />
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอดจ่าย</span><span className="text-lg font-bold">฿{formatCurrency(activeModal.pr.amount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">WHT</span><span>฿{formatCurrency(activeModal.pr.whtAmount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอดสุทธิ</span><span className="font-bold text-[#1d4ed8]">฿{formatCurrency(activeModal.pr.amount - activeModal.pr.whtAmount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">วิธีจ่าย</span><span>{activeModal.pr.method}</span></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-[#94a3b8]">Note (optional)</label><Input value={approveNote} onChange={e => setApproveNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม" /></div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setActiveModal(null)}>ยกเลิก</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(activeModal.pr)}><CheckCircle2 className="w-4 h-4 mr-1.5" />Approve</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {activeModal?.type === 'reject' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader><CardTitle className="text-lg text-red-600">ปฏิเสธคำขอจ่ายเงิน</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[#94a3b8]">Claim</span><span className="font-semibold">{activeModal.pr.claimNo}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอด</span><span className="font-bold">฿{formatCurrency(activeModal.pr.amount)}</span></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-red-500 font-medium">เหตุผลที่ปฏิเสธ *</label><Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="ระบุเหตุผล..." /></div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setActiveModal(null)}>ยกเลิก</Button>
                <Button variant="destructive" disabled={!rejectReason.trim()} onClick={() => handleReject(activeModal.pr)}><XCircle className="w-4 h-4 mr-1.5" />Reject</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {activeModal?.type === 'bill' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" />รับบิล</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#f8faff] rounded-lg p-4 space-y-2 text-sm">
                <p className="text-xs font-medium text-[#94a3b8] uppercase">ข้อมูลในระบบ (read-only)</p>
                <div className="flex justify-between"><span className="text-[#94a3b8]">Claim No.</span><span className="font-semibold">{activeModal.pr.claimNo}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ผู้รับเงิน</span><span>{activeModal.pr.vendorName || activeModal.pr.garageName || activeModal.pr.insuranceName}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอด</span><span className="font-bold">฿{formatCurrency(activeModal.pr.amount)}</span></div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium text-[#94a3b8] uppercase">บิลที่รับจริง (กรอก)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-xs text-[#94a3b8]">เลขที่บิลกระดาษ *</label><Input value={billForm.physicalInvoiceNo} onChange={e => setBillForm(p => ({ ...p, physicalInvoiceNo: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-xs text-[#94a3b8]">รับโดย *</label><Input value={billForm.receivedBy} onChange={e => setBillForm(p => ({ ...p, receivedBy: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><label className="text-xs text-[#94a3b8]">หมายเหตุ</label><Input value={billForm.note} onChange={e => setBillForm(p => ({ ...p, note: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setActiveModal(null)}>ยกเลิก</Button>
                <Button className="bg-[#1d4ed8]" disabled={!billForm.physicalInvoiceNo.trim() || !billForm.receivedBy.trim()} onClick={() => handleBillReceipt(activeModal.pr)}><Save className="w-4 h-4 mr-1.5" />บันทึก</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

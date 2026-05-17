'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
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
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payments').then(res => res.json()).then(data => {
      setRequests(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])
  const [activeModal, setActiveModal] = useState<{ type: 'approve' | 'reject'; pr: any } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  
  const [searchQuery, setSearchQuery] = useState('')
  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase()
    return (
      (r.claimNo || '').toLowerCase().includes(q) ||
      (r.carPlate || '').toLowerCase().includes(q) ||
      (r.vendorName || '').toLowerCase().includes(q) ||
      (r.garageName || '').toLowerCase().includes(q) ||
      (r.insuranceName || '').toLowerCase().includes(q) ||
      (r.invoiceNo || '').toLowerCase().includes(q)
    )
  })

  const pending = filteredRequests.filter(r => r.status === 'PENDING_APPROVAL')
  const approved = filteredRequests.filter(r => r.status === 'APPROVED')
  const rejected = filteredRequests.filter(r => r.status === 'REJECTED')

  const [isSaving, setIsSaving] = useState(false)

  const handleApprove = async (pr: any) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/payments/${pr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', approvedBy: 'Manager', approvedAt: new Date().toISOString() })
      })
      if (!res.ok) throw new Error('Failed to approve')
      
      setRequests(prev => prev.map(r => r.id === pr.id ? { ...r, status: 'APPROVED' as const, approvedBy: 'Manager', approvedAt: new Date().toISOString() } : r))
      setActiveModal(null)
      showToast(`อนุมัติ ${pr.claimNo} เรียบร้อย`)
    } catch (err: any) {
      console.error(err)
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = async (pr: any) => {
    if (!rejectReason.trim()) return
    try {
      setIsSaving(true)
      const res = await fetch(`/api/payments/${pr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectReason, approvedBy: 'Manager' })
      })
      if (!res.ok) throw new Error('Failed to reject')
      
      setRequests(prev => prev.map(r => r.id === pr.id ? { ...r, status: 'REJECTED' as const, rejectReason, approvedBy: 'Manager' } : r))
      setActiveModal(null); setRejectReason('')
      showToast(`ปฏิเสธ ${pr.claimNo}`)
    } catch (err: any) {
      console.error(err)
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  const renderRow = (pr: any) => (
    <TableRow key={pr.id}>
      <TableCell className="text-xs text-[#94a3b8]">{formatDate(pr.createdAt)}</TableCell>
      <TableCell><Badge className={`${typeBadge(pr.requestType)} border-none text-[10px]`}>{typeLabel(pr.requestType)}</Badge></TableCell>
      <TableCell>
        <a href={`/claims/${pr.claimId}?tab=supplier-inv`} target="_blank" rel="noreferrer" className="font-semibold text-[#1d4ed8] hover:underline">
          {pr.claimNo}
        </a>
      </TableCell>
      <TableCell className="text-xs">{pr.carPlate}</TableCell>
      <TableCell className="text-sm">
        {pr.vendorName || pr.garageName || pr.insuranceName}
      </TableCell>
      <TableCell className="font-mono text-xs">{pr.invoiceNo || '-'}</TableCell>
      <TableCell className="text-right font-semibold">฿{formatCurrency(pr.amount)}</TableCell>
      <TableCell className="text-xs">{pr.createdBy}</TableCell>
      <TableCell><Badge className={`${statusColor(pr.status)} border-none text-[10px]`}>{statusLabel(pr.status)}</Badge></TableCell>
      <TableCell>
        <div className="flex gap-1">
          {pr.status === 'PENDING_APPROVAL' && (
            <>
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
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Payment Requests</h1>
          <p className="text-sm text-[#94a3b8]">จัดการคำขออนุมัติจ่ายเงิน / รับเงิน</p>
        </div>
        <div className="w-full md:w-80">
          <Input 
            placeholder="ค้นหา ใบเคลม, ทะเบียนรถ, Invoice..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white shadow-sm"
          />
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
        <TabsList><TabsTrigger value="pending">รออนุมัติ ({pending.length})</TabsTrigger><TabsTrigger value="approved">อนุมัติแล้ว ({approved.length})</TabsTrigger><TabsTrigger value="rejected">ถูกปฏิเสธ ({rejected.length})</TabsTrigger><TabsTrigger value="all">ทั้งหมด ({filteredRequests.length})</TabsTrigger></TabsList>
        {['pending', 'approved', 'rejected', 'all'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f8faff]">
                      <TableHead>วันที่</TableHead><TableHead>ประเภท</TableHead><TableHead>Claim No.</TableHead>
                      <TableHead>ทะเบียน</TableHead><TableHead>ผู้รับเงิน</TableHead><TableHead>Invoice No.</TableHead>
                      <TableHead className="text-right">ยอด</TableHead><TableHead>สร้างโดย</TableHead>
                      <TableHead>สถานะ</TableHead><TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-[#94a3b8]">กำลังโหลดข้อมูล...</TableCell></TableRow>
                    ) : (tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : filteredRequests).length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-[#94a3b8]">ไม่พบข้อมูล</TableCell></TableRow>
                    ) : (
                      (tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : filteredRequests).map(renderRow)
                    )}
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
                {activeModal.pr.invoiceNo && (
                  <div className="flex justify-between"><span className="text-[#94a3b8]">เลขที่บิล</span><span>{activeModal.pr.invoiceNo}</span></div>
                )}
                {activeModal.pr.invoiceUrl && (
                  <div className="pt-2 pb-1">
                    <Button variant="outline" size="sm" className="w-full text-xs text-purple-600 border-purple-200" onClick={() => window.open(activeModal.pr.invoiceUrl, '_blank')}>
                      <FileText className="w-4 h-4 mr-1.5" />ดูเอกสารบิล / Invoice
                    </Button>
                  </div>
                )}
                <hr />
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอดจ่าย</span><span className="text-lg font-bold">฿{formatCurrency(activeModal.pr.amount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">WHT</span><span>฿{formatCurrency(activeModal.pr.whtAmount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">ยอดสุทธิ</span><span className="font-bold text-[#1d4ed8]">฿{formatCurrency(activeModal.pr.amount - activeModal.pr.whtAmount)}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">วิธีจ่าย</span><span>{activeModal.pr.method}</span></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-[#94a3b8]">Note (optional)</label><Input value={approveNote} onChange={e => setApproveNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม" /></div>
              <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSaving}>ยกเลิก</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(activeModal.pr)} disabled={isSaving}>
                {isSaving ? 'กำลังบันทึก...' : 'ยืนยันอนุมัติจ่ายเงิน'}
              </Button>
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
              <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSaving}>ยกเลิก</Button>
              <Button variant="destructive" onClick={() => handleReject(activeModal.pr)} disabled={!rejectReason.trim() || isSaving}>
                {isSaving ? 'กำลังบันทึก...' : 'ยืนยันการปฏิเสธ'}
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'

interface PaymentRequestDetailProps {
  pr: any
  onClose: () => void
  onApprove: (note: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  isSaving: boolean
  statusColor: (s: string) => string
  statusLabel: (s: string) => string
  typeLabel: (t: string) => string
}

export function PaymentRequestDetail({
  pr,
  onClose,
  onApprove,
  onReject,
  isSaving,
  statusColor,
  statusLabel,
  typeLabel
}: PaymentRequestDetailProps) {
  const [attachmentTab, setAttachmentTab] = useState<'bill' | 'po' | 'ar_invoice' | 'ar_receipt' | 'other'>('bill')
  const [approveNote, setApproveNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  let docUrl = null
  let docTitle = 'เอกสารแนบ'
  if (attachmentTab === 'bill') {
    docUrl = pr.invoiceUrl
    docTitle = 'เอกสารบิล/Invoice ที่อัพโหลดโดยพนักงาน'
  } else if (attachmentTab === 'po') {
    docUrl = `/claims/${pr.claimId}/pdf/purchase-order?poId=${pr.id}`
    docTitle = 'ใบสั่งซื้อ (Purchase Order) ของงานซ่อม'
  } else if (attachmentTab === 'ar_invoice') {
    docUrl = `/claims/${pr.claimId}/pdf/insurance-invoice`
    docTitle = 'ใบวางบิลประกัน (AR Invoice)'
  } else if (attachmentTab === 'ar_receipt') {
    docUrl = `/claims/${pr.claimId}/pdf/insurance-receipt`
    docTitle = 'ใบเสร็จรับเงินประกัน (AR Receipt)'
  }

  const isImage = pr.invoiceUrl && (
    pr.invoiceUrl.endsWith('.jpg') ||
    pr.invoiceUrl.endsWith('.jpeg') ||
    pr.invoiceUrl.endsWith('.png') ||
    pr.invoiceUrl.endsWith('.webp') ||
    pr.invoiceUrl.includes('image')
  )

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Detail Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-slate-500 hover:text-slate-800 bg-white shadow-sm border">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">ตรวจสอบรายละเอียดคำขออนุมัติ</h2>
            <Badge className={`${statusColor(pr.status)} border-none text-xs font-semibold`}>
              {statusLabel(pr.status)}
            </Badge>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            ID: <span className="font-mono">{pr.id}</span> • สร้างเมื่อ {formatDate(pr.createdAt)}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Left Column: PR Info & Actions */}
        <div className="space-y-5">
          {/* PR Info */}
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                ℹ️ ข้อมูลคำขออนุมัติ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs">
              {[
                ['ประเภทรายการ', typeLabel(pr.requestType)],
                ['เลขที่ใบเคลม', (
                  <a href={`/claims/${pr.claimId}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5">
                    {pr.claimNo} <ExternalLink className="w-3 h-3" />
                  </a>
                )],
                ['ทะเบียนรถ / ยี่ห้อ', `${pr.carPlate || '-'} (${pr.carBrand || '-'} ${pr.carModel || ''})`],
                ['ผู้รับเงิน / คู่ค้า', pr.vendorName || pr.garageName || pr.insuranceName || 'ไม่ระบุผู้รับเงิน'],
                ['เลขทะเบียน 13 หลัก / สาขา', `${pr.vendorTaxId || pr.garageTaxId || pr.insuranceTaxId || '-'} / ${pr.vendorBranchCode || pr.garageBranchCode || pr.insuranceBranchCode || '00000'}`],
                ['เลขที่ Invoice/บิล', pr.invoiceNo || '-'],
                ['ยอดเงินก่อนภาษี', `฿${formatCurrency(pr.amount - pr.whtAmount)}`],
                ['ยอดสุทธิที่ทำรายการ', `฿${formatCurrency(pr.amount)}`],
                ['ช่องทางการชำระ', pr.method || 'โอนเงิน'],
                ['ผู้สร้างคำขอ', pr.createdBy]
              ].map(([label, val], idx) => (
                <div key={idx} className="flex justify-between py-2.5 px-4 border-b border-slate-100 last:border-b-0">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-semibold text-slate-800 text-right">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions Panel */}
          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="py-4 border-b bg-green-50/10">
              <CardTitle className="text-sm font-bold text-green-800 flex items-center gap-2">
                📝 การอนุมัติคำขอ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {pr.status === 'PENDING_APPROVAL' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">หมายเหตุ (คำชี้แจงในการอนุมัติ - ไม่บังคับ)</label>
                    <textarea
                      className="w-full min-h-[70px] p-2 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="ใส่ข้อความบันทึกการอนุมัติ..."
                      value={approveNote}
                      onChange={e => setApproveNote(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 h-9 text-xs" 
                    onClick={() => onApprove(approveNote)}
                    disabled={isSaving}
                  >
                    ✓ อนุมัติการชำระเงิน
                  </Button>

                  <div className="border-t pt-3 mt-2">
                    <div className="space-y-1.5 mb-2">
                      <label className="text-[11px] font-semibold text-red-500">เหตุผลในการปฏิเสธ (กรณีต้องการ Reject)</label>
                      <input
                        type="text"
                        className="w-full p-2 text-xs border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="ระบุเหตุผล..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full h-8 text-xs font-semibold"
                      onClick={() => onReject(rejectReason)}
                      disabled={!rejectReason.trim() || isSaving}
                    >
                      ✕ ปฏิเสธคำขอ
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">สถานะ:</span>
                    <span className="font-bold text-slate-800">{statusLabel(pr.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ดำเนินการโดย:</span>
                    <span className="font-semibold text-slate-800">{pr.approvedBy || '-'}</span>
                  </div>
                  {pr.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">วันเวลาที่อนุมัติ:</span>
                      <span className="font-semibold text-slate-850">{formatDate(pr.approvedAt)}</span>
                    </div>
                  )}
                  {pr.status === 'REJECTED' && pr.rejectReason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2.5 mt-2">
                      <div className="font-bold text-red-750">เหตุผลที่ปฏิเสธ:</div>
                      <div className="text-red-650 mt-0.5">{pr.rejectReason}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attachments preview */}
        <Card>
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              📄 เอกสารแนบและหลักฐานอ้างอิง
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b pb-3">
              {[
                { key: 'bill', label: 'บิลคู่ค้า' },
                { key: 'po', label: 'ใบสั่งซื้อ (PO)' },
                { key: 'ar_invoice', label: 'วางบิลประกัน' },
                { key: 'ar_receipt', label: 'ใบกำกับประกัน' },
                { key: 'other', label: 'ไฟล์แนบอื่นๆ' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setAttachmentTab(t.key as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${attachmentTab === t.key ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'border-slate-100 hover:bg-slate-50 text-slate-655'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Title & Open in new window button */}
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-650">{docTitle}</span>
              {docUrl && (
                <a href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> เปิดหน้าใหม่
                </a>
              )}
            </div>

            {/* Frame Box */}
            <div className="border border-slate-200 rounded-lg p-1 bg-slate-100/50 flex justify-center items-center min-h-[600px] relative overflow-hidden">
              {docUrl ? (
                attachmentTab === 'bill' && isImage ? (
                  <div className="max-w-full max-h-[600px] overflow-auto flex justify-center items-center bg-white p-2 rounded-md">
                    <img src={docUrl} alt="Bill attachment" className="max-w-full max-h-[580px] object-contain" />
                  </div>
                ) : (
                  <iframe
                    src={docUrl}
                    className="w-full h-[600px] border-none bg-white rounded-md"
                    title={docTitle}
                  />
                )
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ไม่มีเอกสารในหมวดหมู่นี้
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

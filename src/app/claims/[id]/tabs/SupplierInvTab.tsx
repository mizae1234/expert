"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, CheckCircle2, FileText, Download, CreditCard, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ClaimTabProps } from './types'
import { getPartAmt, getLaborAmt } from '../utils'
import { UploadSupplierInvoiceModal } from '../components/UploadSupplierInvoiceModal'
import { CreatePRModal } from '../components/CreatePRModal'

export default function SupplierInvTab({
  claim,
  parts,
  setParts,
  labors,
  setLabors,
  supplierInvoices,
  setSupplierInvoices,
  garageInvoices,
  purchaseOrders,
  vendors,
  showToast,
  setErrorModalMsg,
  setConfirmModal,
  refreshClaim
}: ClaimTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [pendingPaymentRequest, setPendingPaymentRequest] = useState<{ 
    type: 'AP_VENDOR' | 'AP_GARAGE', 
    invoiceId: string, 
    amount: number,
    whtAmount?: number,
    whtPct?: number
  } | null>(null)

  const poItems = purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED').flatMap((po: any) => po.items.map((item: any) => ({ ...item, poId: po.id, poNo: po.poNo, poStatus: po.status }))) || []
  const allInvItems = supplierInvoices.flatMap((inv: any) => inv.items || [])
  const allGInvItems = garageInvoices.flatMap((gi: any) => gi.items || [])
  
  const totalApproved = parts.reduce((s: number, p: any) => s + getPartAmt(p, purchaseOrders), 0) + labors.reduce((s: number, l: any) => s + getLaborAmt(l, purchaseOrders), 0)
  const totalInvoiced = parts.filter(p => p.paymentStatus === 'INVOICED' || p.paymentStatus === 'PAID').reduce((s, p) => s + getPartAmt(p, purchaseOrders), 0) + labors.filter(l => l.paymentStatus === 'INVOICED' || l.paymentStatus === 'PAID').reduce((s, l) => s + getLaborAmt(l, purchaseOrders), 0)
  const totalPaid = parts.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + getPartAmt(p, purchaseOrders), 0) + labors.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + getLaborAmt(l, purchaseOrders), 0)
  const totalPending = totalApproved - totalInvoiced

  const getCleanName = (url: string) => {
    const rawName = url.split('/').pop() || 'เอกสาร'
    return rawName.includes('_') ? rawName.substring(rawName.indexOf('_') + 1) : rawName
  }

  const allAttachments = [
    ...supplierInvoices.filter((si: any) => si.attachmentUrl || si.pdfUrl).map((si: any) => ({ id: si.id, name: si.attachmentName || (si.pdfUrl ? getCleanName(si.pdfUrl) : 'เอกสาร'), url: si.attachmentUrl || si.pdfUrl || null, invoiceNo: si.invoiceNo, type: 'Supplier Invoice' })),
    ...garageInvoices.filter((gi: any) => gi.attachmentUrl || gi.pdfUrl).map((gi: any) => ({ id: gi.id, name: gi.attachmentName || (gi.pdfUrl ? getCleanName(gi.pdfUrl) : 'เอกสาร'), url: gi.attachmentUrl || gi.pdfUrl || null, invoiceNo: gi.invoiceNo, type: 'Garage Invoice' }))
  ]

  const allInvoices = [
    ...supplierInvoices.map((si: any) => ({ ...si, _type: 'SUPPLIER', name: si.vendor?.name || 'Vendor' })),
    ...garageInvoices.map((gi: any) => ({ ...gi, _type: 'GARAGE', name: gi.garage?.name || 'อู่' }))
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-[#475569]">ยอดอนุมัติทั้งหมด</p>
            <p className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(totalApproved)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-[#475569]">มี Invoice แล้ว</p>
            <p className="text-lg font-bold text-green-700">฿{formatCurrency(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-[#475569]">รอ Invoice</p>
            <p className="text-lg font-bold text-amber-600">฿{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-[#475569]">จ่ายแล้ว</p>
            <p className="text-lg font-bold text-purple-700">฿{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Combined Parts and Labors Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">รายการอะไหล่และค่าแรง</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-1" />อัพโหลด Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8faff]">
                <TableHead>ประเภท</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">ยอดอนุมัติ</TableHead>
                <TableHead className="text-right">ยอด PO</TableHead>
                <TableHead className="text-center">PO / เอกสารอ้างอิง</TableHead>
                <TableHead className="text-center">Invoice</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map(p => {
                const poi = poItems.find((x: any) => x.partNo === p.partNo)
                const inv = allInvItems.find((x: any) => x.claimPartId === p.id)
                const invDoc = inv ? supplierInvoices.find((si: any) => si.items?.some((i: any) => i.id === inv.id)) : null
                return (
                  <TableRow key={p.id} className={p.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">อะไหล่</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{p.partName}</span>
                      <span className="text-xs text-[#94a3b8] ml-2">{p.partNo}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#94a3b8]">
                      ฿{formatCurrency(p.priceApprove)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {poi ? `฿${formatCurrency(poi.unitPrice * poi.quantity)}` : <span className="text-xs text-[#94a3b8]">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {poi ? (
                        <span className={`text-xs flex items-center justify-center gap-0.5 ${poi.poStatus === 'RECEIVED' ? 'text-green-600' : 'text-blue-600'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {poi.poNo}
                        </span>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {invDoc ? (
                        <span className="text-xs text-green-600 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {invDoc.invoiceNo}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500">⏳ รอ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`border-none text-[10px] ${p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : p.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : p.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {labors.map(l => {
                const gItem = allGInvItems.find((gi: any) => gi.claimLaborId === l.id)
                const gDoc = gItem ? garageInvoices.find((g: any) => g.items?.some((i: any) => i.id === gItem.id)) : null
                const sItem = !gDoc ? allInvItems.find((si: any) => si.claimLaborId === l.id || (si.description && si.description.includes(l.description))) : null
                const sDoc = sItem ? supplierInvoices.find((si: any) => si.items?.some((i: any) => i.id === sItem.id)) : null
                const invoiceDoc = gDoc || sDoc
                const poLabor = poItems.find((x: any) => x.description?.includes(l.description))
                return (
                  <TableRow key={l.id} className={l.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700">ค่าแรง</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{l.description}</TableCell>
                    <TableCell className="text-right text-sm text-[#94a3b8]">
                      ฿{formatCurrency(l.priceApprove)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {poLabor ? `฿${formatCurrency(poLabor.unitPrice * (poLabor.quantity || 1))}` : <span className="text-xs text-[#94a3b8]">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {poLabor ? (
                        <span className="text-xs text-blue-600 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {poLabor.poNo}
                        </span>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {invoiceDoc ? (
                        <span className="text-xs text-green-600 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {invoiceDoc.invoiceNo}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500">⏳ รอ</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`border-none text-[10px] ${l.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : l.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {l.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : l.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            เอกสารแนบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allAttachments.length === 0 ? (
            <div className="text-center py-6 text-[#94a3b8]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีเอกสารแนบ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allAttachments.map((att, i) => {
                const isPdf = att.name.toLowerCase().endsWith('.pdf') || att.url?.toLowerCase().includes('.pdf')
                const isImage = att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || att.url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i)
                const isExcel = att.name.toLowerCase().match(/\.(xls|xlsx)$/i) || att.url?.toLowerCase().match(/\.(xls|xlsx)/i)
                const isValid = !!att.url
                return (
                  <div key={att.id + '-' + i} className="bg-[#f8faff] rounded-lg border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${isPdf ? 'bg-red-50' : isImage ? 'bg-blue-50' : isExcel ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <FileText className={`w-4 h-4 ${isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : isExcel ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{att.name}</p>
                          <p className="text-xs text-[#94a3b8]">{att.type} • {att.invoiceNo}</p>
                        </div>
                      </div>
                      {isValid && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-purple-600 border-purple-200" onClick={() => window.open(att.url, '_blank')}>
                          <Download className="w-3 h-3 mr-1" />ดาวน์โหลด
                        </Button>
                      )}
                    </div>
                    {isValid && isPdf && (
                      <div className="px-3 pb-3">
                        <iframe src={att.url} className="w-full rounded-lg border border-gray-200 bg-white" style={{ height: '500px' }} title={att.name} />
                      </div>
                    )}
                    {isValid && isImage && (
                      <div className="px-3 pb-3">
                        <img src={att.url} alt={att.name} className="w-full rounded-lg border border-gray-200 object-contain max-h-[500px] bg-white" />
                      </div>
                    )}
                    {isValid && isExcel && (
                      <div className="px-3 pb-3">
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-green-700 font-medium">ไฟล์ Excel (ดาวน์โหลดเพื่อเปิดดู)</span>
                          <Button size="sm" className="h-6 bg-green-600 hover:bg-green-700 text-[10px] text-white" onClick={() => window.open(att.url, '_blank')}>
                            <Download className="w-3 h-3 mr-1" />ดาวน์โหลด Excel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ใบแจ้งหนี้ & ขอเบิกเงิน */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1d4ed8]" />
            ใบแจ้งหนี้ / ขอเบิกจ่ายเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allInvoices.length === 0 ? (
              <p className="text-sm text-[#94a3b8] text-center py-3">ยังไม่มีใบแจ้งหนี้</p>
            ) : (
              allInvoices.map(inv => {
                const pr = claim.paymentRequests?.find((p: any) => p.supplierInvoiceId === inv.id || p.garageInvoiceId === inv.id)
                const hasParts = inv.items?.some((i: any) => i.claimPartId)
                const hasLabors = inv.items?.some((i: any) => i.claimLaborId || i.description?.startsWith('[ค่าแรง]'))
                const typeLabel = hasParts && hasLabors ? 'อะไหล่+ค่าแรง' : inv._type === 'SUPPLIER' ? 'อะไหล่' : 'ค่าแรง'
                const badgeColor = hasParts && hasLabors ? 'bg-purple-50 text-purple-700' : inv._type === 'SUPPLIER' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                return (
                  <div key={inv.id} className="p-3 bg-[#f8faff] rounded-lg border border-gray-100 hover:border-[#1d4ed8]/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${badgeColor}`}>{typeLabel}</Badge>
                          <span className="text-sm font-medium">{inv.invoiceNo}</span>
                        </div>
                        <div className="text-xs text-[#94a3b8] mt-1">{inv.name} • {(inv.items || []).length} รายการ</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-sm">฿{formatCurrency(inv.totalAmount)}</span>
                        <Badge className={`border-none text-[10px] ${inv.apPayment ? 'bg-green-100 text-green-700' : pr?.status === 'APPROVED' ? 'bg-green-100 text-green-700' : pr?.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {inv.apPayment ? 'จ่ายแล้ว' : pr?.status === 'APPROVED' ? 'อนุมัติแล้ว' : pr?.status === 'PENDING_APPROVAL' ? 'รออนุมัติ' : 'รอเบิกจ่าย'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {!pr && !inv.apPayment && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-[#1d4ed8] border-[#1d4ed8] hover:bg-blue-50"
                          onClick={() => setPendingPaymentRequest({
                            type: inv._type === 'SUPPLIER' ? 'AP_VENDOR' : 'AP_GARAGE',
                            invoiceId: inv.id,
                            amount: inv.totalAmount,
                            whtAmount: inv.whtAmount || 0,
                            whtPct: inv.whtPct || 0
                          })}
                        >
                          <CreditCard className="w-3 h-3 mr-1" />ขอเบิกเงิน
                        </Button>
                      )}
                      {pr?.status === 'REJECTED' && (
                        <Badge className="border-none text-[10px] bg-red-100 text-red-700">ถูกปฏิเสธ: {pr.rejectReason}</Badge>
                      )}
                      {!inv.apPayment && !pr && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setConfirmModal({
                              title: `ลบ Invoice "${inv.invoiceNo}"`,
                              message: 'รายการที่เกี่ยวข้องจะถูก reset กลับเป็น "รอ Invoice"',
                              onConfirm: async () => {
                                try {
                                  const endpoint = inv._type === 'SUPPLIER' ? 'supplier-invoices' : 'garage-invoices'
                                  const res = await fetch(`/api/claims/${claim.id}/${endpoint}?invoiceId=${inv.id}`, { method: 'DELETE' })
                                  if (!res.ok) throw new Error('ลบไม่สำเร็จ')
                                  showToast(`ลบ ${inv.invoiceNo} เรียบร้อย`)
                                  await refreshClaim()
                                } catch (err: any) {
                                  setErrorModalMsg(err.message)
                                }
                              }
                            })
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />ลบ Invoice
                        </Button>
                      )}
                    </div>
                    {/* Inline Preview for Invoice Attachment */}
                    {(() => {
                      const u = inv.attachmentUrl || inv.pdfUrl
                      if (!u) return null
                      const name = inv.attachmentName || u.split('/').pop() || 'เอกสาร'
                      const isPdf = name.toLowerCase().endsWith('.pdf') || u.toLowerCase().includes('.pdf')
                      const isImage = name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || u.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i)
                      const isExcel = name.toLowerCase().match(/\.(xls|xlsx)$/i) || u.toLowerCase().match(/\.(xls|xlsx)/i)

                      return (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#475569] font-medium flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-500" /> {name}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-[#1d4ed8]" onClick={() => window.open(u, '_blank')}>
                              <Download className="w-3 h-3 mr-1" />ดาวน์โหลด
                            </Button>
                          </div>
                          {isPdf && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                              <iframe src={u} className="w-full" style={{ height: '350px' }} title={name} />
                            </div>
                          )}
                          {isImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                              <img src={u} alt={name} className="w-full object-contain max-h-[350px]" />
                            </div>
                          )}
                          {isExcel && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                              <span className="text-xs text-green-700 font-medium">ไฟล์ Excel (ดาวน์โหลดเพื่อเปิดดู)</span>
                              <Button size="sm" className="h-6 bg-green-600 hover:bg-green-700 text-[10px] text-white" onClick={() => window.open(u, '_blank')}>
                                <Download className="w-3 h-3 mr-1" />ดาวน์โหลด Excel
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <UploadSupplierInvoiceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        claimId={claim.id}
        claim={claim}
        vendors={vendors}
        parts={parts}
        setParts={setParts}
        labors={labors}
        setLabors={setLabors}
        purchaseOrders={purchaseOrders}
        setSupplierInvoices={setSupplierInvoices}
        showToast={showToast}
        setErrorModalMsg={setErrorModalMsg}
      />

      <CreatePRModal
        isOpen={!!pendingPaymentRequest}
        onClose={() => setPendingPaymentRequest(null)}
        claimId={claim.id}
        pendingPaymentRequest={pendingPaymentRequest}
        showToast={showToast}
        setErrorModalMsg={setErrorModalMsg}
        refreshClaim={refreshClaim}
      />
    </div>
  )
}

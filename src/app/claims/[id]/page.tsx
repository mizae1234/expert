"use client"

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, ArrowLeft, History, Wrench, ShieldAlert, Car, PackageOpen, Tag, CheckCircle2, ChevronRight, Download, Plus, AlertTriangle, TrendingUp, CreditCard, Save, Upload, X, Edit2, Package, Truck, Trash2, CircleDot, Ban, XCircle, Clock } from 'lucide-react'
import { uploadToR2 } from '@/lib/upload'
import { getStatusColor, getStatusLabel, formatCurrency, getPOStatusLabel, cn } from '@/lib/utils'
import { mockPaymentRequests } from '@/lib/mock/payment-requests'
import { ClaimStatus, PaymentRequest, Quotation, InsuranceInvoice, PurchaseOrder } from '@/lib/types'

const STATUS_FLOW: Record<string, string> = {
  RECEIVED: 'PARTS_CHECK',
  PARTS_CHECK: 'PO_ISSUED',
  PO_ISSUED: 'GOODS_RECEIVED',
  GOODS_RECEIVED: 'INVOICE_SENT',
  INVOICE_SENT: 'AP_PAID',
  AP_PAID: 'AR_RECEIVED',
  AR_RECEIVED: 'CLOSED',
}

const STATUS_FLOW_LABEL: Record<string, string> = {
  RECEIVED: 'เริ่มตรวจสอบอะไหล่',
  PARTS_CHECK: 'ออก PO',
  PO_ISSUED: 'รับของแล้ว',
  GOODS_RECEIVED: 'ส่งวางบิลประกัน',
  INVOICE_SENT: 'จ่าย AP แล้ว',
  AP_PAID: 'รับ AR แล้ว',
  AR_RECEIVED: 'ปิด Claim',
}

export default function ClaimDetailPage() {
  const params = useParams()
  
  const [loading, setLoading] = useState(true)
  const [originalClaim, setOriginalClaim] = useState<any>(null)
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('RECEIVED')
  const [editMode, setEditMode] = useState(false)
  const [parts, setParts] = useState<any[]>([])
  const [labors, setLabors] = useState<any[]>([])
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([])
  const [garageInvoices, setGarageInvoices] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [insuranceInvoice, setInsuranceInvoice] = useState<InsuranceInvoice | undefined>()
  const [quotations, setQuotations] = useState<Quotation[]>([])

  useEffect(() => {
    fetch(`/api/claims/${params.id}`).then(res => res.json()).then(data => {
      setOriginalClaim(data)
      setClaimStatus(data.status || 'RECEIVED')
      setParts(data.parts || [])
      setLabors(data.labors || [])
      setSupplierInvoices(data.supplierInvoices || [])
      setGarageInvoices(data.garageInvoices || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setInsuranceInvoice(data.insuranceInvoice)
      setQuotations(data.quotations || [])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [params.id])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGarageUploadModal, setShowGarageUploadModal] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadMapSelections, setUploadMapSelections] = useState<Record<string, boolean>>({})
  const [garageUploadSelections, setGarageUploadSelections] = useState<Record<string, boolean>>({})
  const [showCreatePRModal, setShowCreatePRModal] = useState(false)
  const [prInvoiceSelections, setPrInvoiceSelections] = useState<Record<string, boolean>>({})
  const [prMethod, setPrMethod] = useState('โอนเงิน')
  const [prNote, setPrNote] = useState('')
  const [claimPRs, setClaimPRs] = useState<PaymentRequest[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false)
  const [showSupplementModal, setShowSupplementModal] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [qtDate, setQtDate] = useState(new Date().toISOString().split('T')[0])
  const [qtValidUntil, setQtValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [qtNote, setQtNote] = useState('')
  const [supplementReason, setSupplementReason] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูล Claim...</p>
      </div>
    )
  }

  if (!originalClaim) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#94a3b8]">ไม่พบ Claim</p>
      </div>
    )
  }

  const claim = { ...originalClaim, status: claimStatus, parts, labors, supplierInvoices, garageInvoices, purchaseOrders, insuranceInvoice }
  const { bg, text } = getStatusColor(claim.status)
  const partsTotal = parts.reduce((s, p) => s + p.priceApprove * p.quantity, 0)
  const laborTotal = labors.reduce((s, l) => s + l.priceApprove, 0)
  const subtotal = partsTotal + laborTotal
  const vat = Math.round(subtotal * 0.07)
  const grand = subtotal + vat
  const apVendor = claim.supplierInvoices?.reduce((s: number, inv: any) => s + inv.totalAmount, 0) || 0
  const arReceived = claim.insuranceInvoice?.grandTotal || 0
  const grossProfit = arReceived - apVendor
  const margin = arReceived > 0 ? (grossProfit / arReceived) * 100 : 0
  const nextStatus = STATUS_FLOW[claimStatus]
  const nextLabel = STATUS_FLOW_LABEL[claimStatus]

  // ─── Action Handlers ───
  const handleCreatePO = () => {
    const approvedParts = parts.filter(p => p.status === 'approved')
    if (approvedParts.length === 0) { showToast('ไม่มีรายการอะไหล่ที่อนุมัติแล้ว'); return }
    const poNo = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, '0')}`
    const poItems = approvedParts.map((p, i) => ({
      id: `poi-${Date.now()}-${i}`,
      poId: `po-${Date.now()}`,
      partNo: p.partNo,
      description: p.partName,
      quantity: p.quantity,
      unitPrice: p.priceApprove,
      totalPrice: p.priceApprove * p.quantity,
    }))
    const total = poItems.reduce((s, i) => s + i.totalPrice, 0)
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      claimId: claim.id,
      vendorId: 'ven-p01',
      vendor: claim.purchaseOrders?.[0]?.vendor || { id: 'ven-p01', name: 'Supplier A', vendorType: 'PARTS', paymentTerms: 30, isActive: true },
      poNo,
      poType: 'PARTS',
      deliveryMode: 'DIRECT_TO_GARAGE',
      totalAmount: total,
      status: 'DRAFT',
      items: poItems,
      createdAt: new Date().toISOString(),
    }
    setPurchaseOrders(prev => [...prev, newPO])
    showToast(`สร้าง ${poNo} สำเร็จ (${approvedParts.length} รายการ, ยอด ฿${formatCurrency(total)})`)
  }

  const handleCreateInsuranceInvoice = () => {
    const sub = partsTotal + laborTotal
    const vatAmt = Math.round(sub * 0.07)
    const invNo = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    const newInv: InsuranceInvoice = {
      id: `inv-${Date.now()}`,
      claimId: claim.id,
      invoiceNo: invNo,
      invoiceDate: new Date().toISOString(),
      laborTotal,
      partsTotal,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: sub + vatAmt,
      deductible: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SENT',
      createdAt: new Date().toISOString(),
    }
    setInsuranceInvoice(newInv)
    showToast(`สร้างใบวางบิลประกัน ${invNo} ยอด ฿${formatCurrency(sub + vatAmt)}`)
  }

  const handleCreateQuotation = () => {
    const qtNo = `QT-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(4, '0')}`
    const sub = partsTotal + laborTotal
    const vatAmt = Math.round(sub * 0.07)
    const newQt: Quotation = {
      id: `qt-${Date.now()}`,
      quotationNo: qtNo,
      claimId: claim.id,
      quotationDate: new Date(qtDate).toISOString(),
      validUntil: new Date(qtValidUntil).toISOString(),
      laborItems: labors.map((l, i) => ({ id: `ql-${Date.now()}-${i}`, description: l.description, damageLevel: l.damageLevel, discountPct: l.discountPct, unitPrice: l.priceApprove, totalPrice: l.priceApprove })),
      partItems: parts.map((p, i) => ({ id: `qp-${Date.now()}-${i}`, partNo: p.partNo, partName: p.partName, quantity: p.quantity, unitPrice: p.priceApprove, discountPct: p.discountPct, totalPrice: p.priceApprove * p.quantity })),
      laborTotal,
      partsTotal,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: sub + vatAmt,
      note: qtNote || undefined,
      status: 'DRAFT',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    }
    setQuotations(prev => [...prev, newQt])
    setShowCreateQuotationModal(false)
    setQtNote('')
    showToast(`สร้างใบเสนอราคา ${qtNo} สำเร็จ`)
  }

  const handleSendQuotation = (qtId: string) => {
    setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
    showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
  }

  const handleCreateSupplement = () => {
    if (!selectedQuotationId) return
    const oldQt = quotations.find(q => q.id === selectedQuotationId)
    if (!oldQt) return
    // Mark old as SUPERSEDED
    setQuotations(prev => prev.map(q => q.id === selectedQuotationId ? { ...q, status: 'SUPERSEDED' as const } : q))
    // Create new supplement from current parts/labors
    const sub = partsTotal + laborTotal
    const vatAmt = Math.round(sub * 0.07)
    const supNo = `${oldQt.quotationNo}-S${quotations.filter(q => q.quotationNo.startsWith(oldQt.quotationNo)).length}`
    const newQt: Quotation = {
      id: `qt-sup-${Date.now()}`,
      quotationNo: supNo,
      claimId: claim.id,
      quotationDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      laborItems: labors.map((l, i) => ({ id: `ql-s-${Date.now()}-${i}`, description: l.description, damageLevel: l.damageLevel, discountPct: l.discountPct, unitPrice: l.priceApprove, totalPrice: l.priceApprove })),
      partItems: parts.map((p, i) => ({ id: `qp-s-${Date.now()}-${i}`, partNo: p.partNo, partName: p.partName, quantity: p.quantity, unitPrice: p.priceApprove, discountPct: p.discountPct, totalPrice: p.priceApprove * p.quantity })),
      laborTotal,
      partsTotal,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: sub + vatAmt,
      note: supplementReason || 'มีรายการซ่อมเพิ่มเติม',
      status: 'DRAFT',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    }
    setQuotations(prev => [...prev, newQt])
    setShowSupplementModal(false)
    setSupplementReason('')
    showToast(`สร้าง Supplement ${supNo} สำเร็จ`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/claims">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0f172a]">{claim.claimNo}</h1>
              <span className={`status-badge ${bg} ${text}`}>{getStatusLabel(claim.status)}</span>
            </div>
            <p className="text-sm text-[#94a3b8] mt-1">
              {claim.carPlate} — {claim.carBrand} {claim.carModel} — {claim.insuredName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setParts(originalClaim.parts || []); setLabors(originalClaim.labors || []); setEditMode(false) }}>
                <X className="w-4 h-4 mr-1.5" />ยกเลิก
              </Button>
              <Button size="sm" onClick={() => { setEditMode(false); showToast('บันทึกข้อมูลเรียบร้อย') }}>
                <Save className="w-4 h-4 mr-1.5" />บันทึก
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="w-4 h-4 mr-1.5" />แก้ไข
              </Button>
              {nextStatus && (
                <Button size="sm" className="bg-[#1d4ed8] hover:bg-[#1e40af]" onClick={() => setShowStatusModal(true)}>
                  <ChevronRight className="w-4 h-4 mr-1.5" />{nextLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && nextStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in" onClick={() => setShowStatusModal(false)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">เปลี่ยนสถานะ Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className={`status-badge ${getStatusColor(claimStatus).bg} ${getStatusColor(claimStatus).text}`}>{getStatusLabel(claimStatus)}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
                <div className="text-center">
                  <span className={`status-badge ${getStatusColor(nextStatus as ClaimStatus).bg} ${getStatusColor(nextStatus as ClaimStatus).text}`}>{getStatusLabel(nextStatus)}</span>
                </div>
              </div>
              <p className="text-sm text-[#475569] text-center">ต้องการเปลี่ยนสถานะเป็น &quot;{getStatusLabel(nextStatus)}&quot; ใช่หรือไม่?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>ยกเลิก</Button>
                <Button className="bg-[#1d4ed8]" onClick={() => { setClaimStatus(nextStatus as ClaimStatus); setShowStatusModal(false); showToast(`เปลี่ยนสถานะเป็น "${getStatusLabel(nextStatus)}" แล้ว`) }}>
                  ยืนยัน
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'อะไหล่', value: `${parts.length} ชิ้น`, sub: `฿${formatCurrency(partsTotal)}` },
          { label: 'ค่าแรง', value: `${labors.length} รายการ`, sub: `฿${formatCurrency(laborTotal)}` },
          { label: 'PO', value: `${claim.purchaseOrders?.length || 0} ใบ`, sub: '' },
          { label: 'ยอดรวม', value: `฿${formatCurrency(grand)}`, sub: 'รวม VAT 7%' },
          { label: 'Margin', value: arReceived > 0 ? `${margin.toFixed(1)}%` : 'N/A', sub: arReceived > 0 ? `฿${formatCurrency(grossProfit)}` : '' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-[#94a3b8] font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-[#0f172a] mt-1">{stat.value}</p>
              {stat.sub && <p className="text-xs text-[#475569] mt-0.5">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info">ข้อมูล Claim</TabsTrigger>
          <TabsTrigger value="parts">อะไหล่/ค่าแรง</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="supplier-inv">ใบเปิดสินค้า</TabsTrigger>
          <TabsTrigger value="insurance-inv">วางบิลประกัน</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Claim Info */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">ข้อมูล Claim</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Claim No.', claim.claimNo],
                  ['Receive No.', claim.receiveNo],
                  ['Transaction No.', claim.transactionNo],
                  ['บ.ประกัน', claim.insurance?.name || ''],
                  ['อู่', claim.garage?.name || ''],
                  ['วันที่รับ', new Date(claim.createdAt).toLocaleDateString('th-TH')],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-[#475569]">{label}</span>
                    <span className="text-sm font-medium text-[#0f172a]">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">ข้อมูลรถยนต์</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['ทะเบียน', claim.carPlate],
                  ['จังหวัด', claim.province],
                  ['ยี่ห้อ', claim.carBrand],
                  ['รุ่น', claim.carModel],
                  ['VIN', claim.carVin],
                  ['ผู้เอาประกัน', claim.insuredName],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-[#475569]">{label}</span>
                    <span className="text-sm font-medium text-[#0f172a]">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Parts & Labor */}
        <TabsContent value="parts">
          <div className="space-y-6">
            {/* Parts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Package className="w-5 h-5 text-[#1d4ed8]" />อะไหล่ ({parts.length})</CardTitle>
                {editMode && (
                  <Button variant="outline" size="sm" onClick={() => setParts([...parts, { id: `new-p-${Date.now()}`, claimId: claim.id, partNo: '', partName: '', priceFullAmt: 0, quantity: 1, damageType: 'เปลี่ยน', discountPct: 0, priceOffer: 0, priceApprove: 0, supplier: '', requireReturn: false, round: 1, status: 'approved' }])}>
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
                        <TableCell>{editMode ? <Input className="h-8 w-28 font-mono text-xs" value={part.partNo} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], partNo: e.target.value }; setParts(n) }} /> : <span className="font-mono text-xs">{part.partNo}</span>}</TableCell>
                        <TableCell>{editMode ? <Input className="h-8 w-32" value={part.partName} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], partName: e.target.value }; setParts(n) }} /> : <span className="font-medium">{part.partName}</span>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-24 text-right" value={part.priceFullAmt} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], priceFullAmt: +e.target.value }; setParts(n) }} /> : formatCurrency(part.priceFullAmt)}</TableCell>
                        <TableCell className="text-center">{editMode ? <Input type="number" className="h-8 w-14 text-center" value={part.quantity} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], quantity: +e.target.value }; setParts(n) }} /> : part.quantity}</TableCell>
                        <TableCell>{editMode ? <Input className="h-8 w-20" value={part.damageType} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], damageType: e.target.value }; setParts(n) }} /> : <Badge variant="outline" className="text-[10px]">{part.damageType}</Badge>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-16 text-right" value={part.discountPct} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], discountPct: +e.target.value }; setParts(n) }} /> : `${part.discountPct}%`}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-24 text-right font-semibold" value={part.priceApprove} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], priceApprove: +e.target.value }; setParts(n) }} /> : <span className="font-semibold">{formatCurrency(part.priceApprove)}</span>}</TableCell>
                        <TableCell>{editMode ? <Input className="h-8 w-24" value={part.supplier} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], supplier: e.target.value }; setParts(n) }} /> : <span className="text-xs text-[#475569]">{part.supplier}</span>}</TableCell>
                        <TableCell className="text-center">
                          {editMode ? (
                            <input type="checkbox" checked={part.requireReturn} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], requireReturn: e.target.checked }; setParts(n) }} className="w-4 h-4" />
                          ) : part.requireReturn ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                              <AlertTriangle className="w-3 h-3" />คืนซาก
                            </span>
                          ) : null}
                        </TableCell>
                        {editMode && (
                          <TableCell>
                            <button onClick={() => setParts(parts.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
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
                <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-5 h-5 text-[#1d4ed8]" />ค่าแรง ({labors.length})</CardTitle>
                {editMode && (
                  <Button variant="outline" size="sm" onClick={() => setLabors([...labors, { id: `new-l-${Date.now()}`, claimId: claim.id, description: '', damageLevel: 'ปานกลาง', discountPct: 0, priceOffer: 0, priceApprove: 0, round: 1, status: 'approved' }])}>
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
                        <TableCell>{editMode ? <Input className="h-8 w-full" value={labor.description} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], description: e.target.value }; setLabors(n) }} /> : <span className="font-medium">{labor.description}</span>}</TableCell>
                        <TableCell>{editMode ? <Input className="h-8 w-24" value={labor.damageLevel} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], damageLevel: e.target.value }; setLabors(n) }} /> : <Badge variant="outline" className="text-[10px]">{labor.damageLevel}</Badge>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-16 text-right" value={labor.discountPct} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], discountPct: +e.target.value }; setLabors(n) }} /> : `${labor.discountPct}%`}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-24 text-right" value={labor.priceOffer} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], priceOffer: +e.target.value }; setLabors(n) }} /> : formatCurrency(labor.priceOffer)}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 w-24 text-right font-semibold" value={labor.priceApprove} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], priceApprove: +e.target.value }; setLabors(n) }} /> : <span className="font-semibold">{formatCurrency(labor.priceApprove)}</span>}</TableCell>
                        {editMode && (
                          <TableCell>
                            <button onClick={() => setLabors(labors.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
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
          </div>

          {/* ─── Quotation Section ─── */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-[#1d4ed8]" />ใบเสนอราคา (Quotation)</CardTitle>
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
                  {quotations.map(qt => {
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
                          <div><span className="text-[#94a3b8] text-xs">วันที่</span><p className="font-medium">{new Date(qt.quotationDate).toLocaleDateString('th-TH')}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">หมดอายุ</span><p className="font-medium">{new Date(qt.validUntil).toLocaleDateString('th-TH')}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">ค่าแรง ({qt.laborItems.length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.laborTotal)}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">อะไหล่ ({qt.partItems.length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.partsTotal)}</p></div>
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
        </TabsContent>

        {/* Tab 3: Purchase Orders */}
        <TabsContent value="po">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Purchase Orders</CardTitle>
              <Button variant="outline" size="sm" disabled={claim.status !== 'PARTS_CHECK'} onClick={handleCreatePO}>
                <Plus className="w-4 h-4 mr-1" />สร้าง PO
              </Button>
            </CardHeader>
            <CardContent>
              {(claim.purchaseOrders?.length || 0) === 0 ? (
                <div className="text-center py-12 text-[#94a3b8]">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ยังไม่มี PO</p>
                  {claim.status !== 'PARTS_CHECK' && <p className="text-xs mt-1">ต้องเปลี่ยน status เป็น ตรวจสอบอะไหล่ ก่อนถึงจะสร้าง PO ได้</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {claim.purchaseOrders?.map((po: any) => (
                    <Card key={po.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-[#0f172a]">{po.poNo}</h4>
                            <Badge variant="outline" className="text-[10px]">{po.poType}</Badge>
                            <Badge className={po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                              {getPOStatusLabel(po.status)}
                            </Badge>
                          </div>
                          <span className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(po.totalAmount)}</span>
                        </div>
                        <div className="text-sm text-[#475569] flex items-center gap-4">
                          <span>Vendor: {po.vendor?.name}</span>
                          <span>•</span>
                          <span>{po.items.length} รายการ</span>
                          {po.goodsReceipt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />รับของแล้ว
                              </span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Supplier Invoices + Payment Readiness */}
        <TabsContent value="supplier-inv">
          <div className="space-y-6">
            {(() => {
              const poItems = claim.purchaseOrders?.flatMap((po: any) => po.items.map((item: any) => ({ ...item, poId: po.id, poNo: po.poNo, poStatus: po.status }))) || []
              const allInvItems = supplierInvoices.flatMap((inv: any) => inv.items || [])
              const allGInvItems = garageInvoices.flatMap((gi: any) => gi.items || [])
              const totalApproved = parts.reduce((s: number, p: any) => s + p.priceApprove * p.quantity, 0) + labors.reduce((s: number, l: any) => s + l.priceApprove, 0)
              const totalInvoiced = parts.filter(p => p.paymentStatus === 'INVOICED' || p.paymentStatus === 'PAID').reduce((s, p) => s + p.priceApprove * p.quantity, 0) + labors.filter(l => l.paymentStatus === 'INVOICED' || l.paymentStatus === 'PAID').reduce((s, l) => s + l.priceApprove, 0)
              const totalPaid = parts.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + p.priceApprove * p.quantity, 0) + labors.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + l.priceApprove, 0)
              const totalPending = totalApproved - totalInvoiced
              return (<>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-blue-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">ยอดอนุมัติทั้งหมด</p><p className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(totalApproved)}</p></CardContent></Card>
                  <Card className="bg-green-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">มี Invoice แล้ว</p><p className="text-lg font-bold text-green-700">฿{formatCurrency(totalInvoiced)}</p></CardContent></Card>
                  <Card className="bg-amber-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">รอ Invoice</p><p className="text-lg font-bold text-amber-600">฿{formatCurrency(totalPending)}</p></CardContent></Card>
                  <Card className="bg-purple-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">จ่ายแล้ว</p><p className="text-lg font-bold text-purple-700">฿{formatCurrency(totalPaid)}</p></CardContent></Card>
                </div>
                {/* Parts Table */}
                <Card><CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">รายการอะไหล่</CardTitle>
                  <Button variant="outline" size="sm" disabled={!claim.purchaseOrders?.length} onClick={() => {
                    const sel: Record<string, boolean> = {}
                    parts.filter(p => p.paymentStatus !== 'INVOICED' && p.paymentStatus !== 'PAID').forEach(p => { sel[p.id] = true })
                    setUploadMapSelections(sel); setShowUploadModal(true)
                  }}><Upload className="w-4 h-4 mr-1" />อัพโหลด Supplier Invoice</Button>
                </CardHeader><CardContent>
                  <Table><TableHeader><TableRow className="bg-[#f8faff]">
                    <TableHead>รายการ</TableHead><TableHead className="text-right">ยอด</TableHead><TableHead className="text-center">PO</TableHead><TableHead className="text-center">Invoice</TableHead><TableHead className="text-center">สถานะ</TableHead>
                  </TableRow></TableHeader><TableBody>
                    {parts.map(p => {
                      const poi = poItems.find((x: any) => x.partNo === p.partNo)
                      const inv = allInvItems.find((x: any) => x.claimPartId === p.id)
                      const invDoc = inv ? supplierInvoices.find((si: any) => si.items?.some((i: any) => i.id === inv.id)) : null
                      return (<TableRow key={p.id} className={p.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                        <TableCell><span className="font-medium">{p.partName}</span><span className="text-xs text-[#94a3b8] ml-2">{p.partNo}</span></TableCell>
                        <TableCell className="text-right font-semibold">฿{formatCurrency(p.priceApprove)}</TableCell>
                        <TableCell className="text-center">{poi ? <span className="text-xs text-green-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{poi.poNo}</span> : <span className="text-xs text-[#94a3b8]">—</span>}</TableCell>
                        <TableCell className="text-center">{invDoc ? <span className="text-xs text-green-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{invDoc.invoiceNo}</span> : <span className="text-xs text-amber-500">⏳ รอ</span>}</TableCell>
                        <TableCell className="text-center"><Badge className={`border-none text-[10px] ${p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : p.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{p.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : p.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}</Badge></TableCell>
                      </TableRow>)
                    })}
                  </TableBody></Table>
                </CardContent></Card>
                {/* Labors Table */}
                <Card><CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">ค่าแรง</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const sel: Record<string, boolean> = {}
                    labors.filter(l => l.paymentStatus !== 'INVOICED' && l.paymentStatus !== 'PAID').forEach(l => { sel[l.id] = true })
                    setGarageUploadSelections(sel); setShowGarageUploadModal(true)
                  }}><Upload className="w-4 h-4 mr-1" />อัพโหลด Garage Invoice</Button>
                </CardHeader><CardContent>
                  <Table><TableHeader><TableRow className="bg-[#f8faff]">
                    <TableHead>รายการ</TableHead><TableHead className="text-right">ยอด</TableHead><TableHead className="text-center">Garage Invoice</TableHead><TableHead className="text-center">สถานะ</TableHead>
                  </TableRow></TableHeader><TableBody>
                    {labors.map(l => {
                      const gItem = allGInvItems.find((gi: any) => gi.claimLaborId === l.id)
                      const gDoc = gItem ? garageInvoices.find((g: any) => g.items?.some((i: any) => i.id === gItem.id)) : null
                      return (<TableRow key={l.id} className={l.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                        <TableCell className="font-medium">{l.description}</TableCell>
                        <TableCell className="text-right font-semibold">฿{formatCurrency(l.priceApprove)}</TableCell>
                        <TableCell className="text-center">{gDoc ? <span className="text-xs text-green-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{gDoc.invoiceNo}</span> : <span className="text-xs text-amber-500">⏳ รอ</span>}</TableCell>
                        <TableCell className="text-center"><Badge className={`border-none text-[10px] ${l.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : l.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{l.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : l.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}</Badge></TableCell>
                      </TableRow>)
                    })}
                  </TableBody></Table>
                </CardContent></Card>
              </>)
            })()}
          </div>
          {/* Upload Supplier Invoice Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowUploadModal(false)}>
              <Card className="w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="w-5 h-5" />อัพโหลด Supplier Invoice</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf, image/png, image/jpeg" 
                      disabled={isUploadingFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsUploadingFile(true)
                          const url = await uploadToR2(file, `claims/${claim.id}/supplier_invoices`)
                          showToast('อัปโหลดไฟล์เข้าระบบสำเร็จ')
                        } catch (err) {
                          alert('Upload failed')
                        } finally {
                          setIsUploadingFile(false)
                        }
                      }} 
                    />
                    {isUploadingFile ? (
                      <div className="text-sm text-[#94a3b8] flex items-center justify-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> กำลังอัปโหลด...</div>
                    ) : (
                      <><Upload className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]" /><p className="text-sm text-[#475569]">คลิกหรือลากไฟล์ PDF/Image มาวาง</p></>
                    )}
                  </label>
                  <div><h4 className="text-sm font-semibold mb-2">Invoice นี้ cover รายการไหนบ้าง?</h4>
                    <Table><TableHeader><TableRow className="bg-[#f8faff]"><TableHead className="w-10"></TableHead><TableHead className="text-xs">รายการ</TableHead><TableHead className="text-xs">Part No.</TableHead><TableHead className="text-xs text-right">ราคา</TableHead></TableRow></TableHeader>
                      <TableBody>{parts.filter(p => p.paymentStatus !== 'INVOICED' && p.paymentStatus !== 'PAID').map(p => (
                        <TableRow key={p.id} className={uploadMapSelections[p.id] ? 'bg-blue-50/50' : ''}>
                          <TableCell><input type="checkbox" checked={!!uploadMapSelections[p.id]} onChange={e => setUploadMapSelections(prev => ({ ...prev, [p.id]: e.target.checked }))} className="w-4 h-4" /></TableCell>
                          <TableCell className="font-medium">{p.partName}</TableCell><TableCell className="font-mono text-xs">{p.partNo}</TableCell><TableCell className="text-right font-semibold">฿{formatCurrency(p.priceApprove)}</TableCell>
                        </TableRow>))}</TableBody></Table>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowUploadModal(false)}>ยกเลิก</Button>
                    <Button className="bg-[#1d4ed8]" onClick={() => {
                      const sel = parts.filter(p => uploadMapSelections[p.id]); if (!sel.length) return
                      const invId = `sinv-new-${Date.now()}`
                      const items = sel.map((p, i) => ({ id: `sinv-item-${Date.now()}-${i}`, supplierInvoiceId: invId, poItemId: `poi-${p.id}`, claimPartId: p.id, partNo: p.partNo, description: p.partName, quantity: p.quantity, unitPrice: p.priceApprove, totalPrice: p.priceApprove * p.quantity }))
                      const sub = items.reduce((s, i) => s + i.totalPrice, 0); const vat = Math.round(sub * 0.07)
                      setSupplierInvoices([...supplierInvoices, { id: invId, claimId: claim.id, vendorId: 'ven-p01', vendor: claim.purchaseOrders?.[0]?.vendor, invoiceNo: `SINV-NEW-${String(supplierInvoices.length + 1).padStart(3, '0')}`, invoiceDate: new Date().toISOString(), subtotal: sub, vatAmount: vat, totalAmount: sub + vat, items, createdAt: new Date().toISOString() }])
                      setParts(parts.map(p => uploadMapSelections[p.id] ? { ...p, paymentStatus: 'INVOICED' as const } : p))
                      setShowUploadModal(false); showToast('บันทึก Supplier Invoice เรียบร้อย')
                    }}><Save className="w-4 h-4 mr-1.5" />ยืนยัน</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Upload Garage Invoice Modal */}
          {showGarageUploadModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowGarageUploadModal(false)}>
              <Card className="w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="w-5 h-5" />อัพโหลด Garage Invoice</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf, image/png, image/jpeg" 
                      disabled={isUploadingFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsUploadingFile(true)
                          const url = await uploadToR2(file, `claims/${claim.id}/garage_invoices`)
                          showToast('อัปโหลดไฟล์เข้าระบบสำเร็จ')
                        } catch (err) {
                          alert('Upload failed')
                        } finally {
                          setIsUploadingFile(false)
                        }
                      }} 
                    />
                    {isUploadingFile ? (
                      <div className="text-sm text-[#94a3b8] flex items-center justify-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> กำลังอัปโหลด...</div>
                    ) : (
                      <><Upload className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]" /><p className="text-sm text-[#475569]">คลิกหรือลากไฟล์ PDF/Image มาวาง</p></>
                    )}
                  </label>
                  <div><h4 className="text-sm font-semibold mb-2">Invoice นี้ cover ค่าแรงไหนบ้าง?</h4>
                    <Table><TableHeader><TableRow className="bg-[#f8faff]"><TableHead className="w-10"></TableHead><TableHead className="text-xs">รายการ</TableHead><TableHead className="text-xs text-right">ราคา</TableHead></TableRow></TableHeader>
                      <TableBody>{labors.filter(l => l.paymentStatus !== 'INVOICED' && l.paymentStatus !== 'PAID').map(l => (
                        <TableRow key={l.id} className={garageUploadSelections[l.id] ? 'bg-blue-50/50' : ''}>
                          <TableCell><input type="checkbox" checked={!!garageUploadSelections[l.id]} onChange={e => setGarageUploadSelections(prev => ({ ...prev, [l.id]: e.target.checked }))} className="w-4 h-4" /></TableCell>
                          <TableCell className="font-medium">{l.description}</TableCell><TableCell className="text-right font-semibold">฿{formatCurrency(l.priceApprove)}</TableCell>
                        </TableRow>))}</TableBody></Table>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowGarageUploadModal(false)}>ยกเลิก</Button>
                    <Button className="bg-[#1d4ed8]" onClick={() => {
                      const sel = labors.filter(l => garageUploadSelections[l.id]); if (!sel.length) return
                      const gId = `ginv-new-${Date.now()}`
                      const items = sel.map((l, i) => ({ id: `ginv-item-${Date.now()}-${i}`, garageInvoiceId: gId, claimLaborId: l.id, description: l.description, unitPrice: l.priceApprove, totalPrice: l.priceApprove }))
                      const sub = items.reduce((s, i) => s + i.totalPrice, 0); const vat = Math.round(sub * 0.07)
                      setGarageInvoices([...garageInvoices, { id: gId, claimId: claim.id, garageId: claim.garageId, garageName: claim.garage?.name, invoiceNo: `GINV-NEW-${String(garageInvoices.length + 1).padStart(3, '0')}`, invoiceDate: new Date().toISOString(), items, subtotal: sub, vatAmount: vat, totalAmount: sub + vat, createdAt: new Date().toISOString() }])
                      setLabors(labors.map(l => garageUploadSelections[l.id] ? { ...l, paymentStatus: 'INVOICED' as const } : l))
                      setShowGarageUploadModal(false); showToast('บันทึก Garage Invoice เรียบร้อย')
                    }}><Save className="w-4 h-4 mr-1.5" />ยืนยัน</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Insurance Invoice — AR/AP แยกชัดเจน */}
        <TabsContent value="insurance-inv">
          <div className="space-y-6">
            {/* ─── Section AR: วางบิลประกัน ─── */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />AR — วางบิลประกัน</CardTitle>
                <div className="flex items-center gap-2">
                  {claim.insuranceInvoice && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ar-invoice`)}><Download className="w-3.5 h-3.5 mr-1" />ตั้งลูกหนี้</Button>
                      {claim.insuranceInvoice.arPayment && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ar-receipt`)}><Download className="w-3.5 h-3.5 mr-1" />รับชำระ</Button>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!claim.insuranceInvoice ? (
                  <div className="space-y-4">
                    {/* Gate check: status >= PARTS_CHECK */}
                    {(() => {
                      const statusFlow = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED']
                      const idx = statusFlow.indexOf(claim.status)
                      const ready = idx >= 1 // >= PARTS_CHECK
                      const sub = partsTotal + laborTotal
                      const vat = Math.round(sub * 0.07)
                      if (!ready) return (
                        <div className="text-center py-8 text-[#94a3b8]">
                          <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
                          <p className="font-medium text-amber-600">ยังออก Invoice ไม่ได้</p>
                          <p className="text-xs mt-1">บ.ประกันยังไม่อนุมัติรายการอะไหล่/ค่าแรง</p>
                        </div>
                      )
                      return (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />พร้อมออกใบวางบิล</p>
                            <p className="text-xs text-green-600 mt-1">บ.ประกันอนุมัติรายการแล้ว — ไม่ต้องรอ Supplier Invoice</p>
                          </div>
                          <div className="bg-[#f8faff] rounded-lg p-4 space-y-2">
                            {[['ค่าอะไหล่', partsTotal], ['ค่าแรง', laborTotal], ['Subtotal', sub], ['VAT 7%', vat], ['Grand Total', sub + vat]].map(([l, v]) => (
                              <div key={String(l)} className="flex justify-between"><span className="text-sm text-[#475569]">{l}</span><span className={`text-sm font-semibold ${l === 'Grand Total' ? 'text-[#1d4ed8] text-base' : 'text-[#0f172a]'}`}>฿{formatCurrency(v as number)}</span></div>
                            ))}
                          </div>
                          <Button className="bg-[#1d4ed8] w-full" onClick={handleCreateInsuranceInvoice}><Plus className="w-4 h-4 mr-1" />สร้างใบวางบิลประกัน</Button>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={`border-none ${claim.insuranceInvoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{claim.insuranceInvoice.status === 'PAID' ? 'รับชำระแล้ว' : 'ส่งวางบิลแล้ว'}</Badge>
                    </div>
                    {[
                      ['เลขที่ใบวางบิล', claim.insuranceInvoice.invoiceNo],
                      ['วันที่', new Date(claim.insuranceInvoice.invoiceDate).toLocaleDateString('th-TH')],
                      ['ค่าแรง', `฿${formatCurrency(claim.insuranceInvoice.laborTotal)}`],
                      ['ค่าอะไหล่', `฿${formatCurrency(claim.insuranceInvoice.partsTotal)}`],
                      ['Subtotal', `฿${formatCurrency(claim.insuranceInvoice.subtotal)}`],
                      ['VAT 7%', `฿${formatCurrency(claim.insuranceInvoice.vatAmount)}`],
                      ['Grand Total', `฿${formatCurrency(claim.insuranceInvoice.grandTotal)}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-[#475569]">{label}</span>
                        <span className="text-sm font-semibold text-[#0f172a]">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(`/claims/${claim.id}/pdf/insurance-invoice`)}><Download className="w-4 h-4 mr-1" />โหลด PDF</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Section AP: สถานะการจ่าย Vendor/อู่ ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-5 h-5 text-red-500" />AP — สถานะการจ่าย Vendor / อู่</CardTitle>
                <p className="text-xs text-[#94a3b8] mt-1">ทำงานอิสระจาก AR — ไม่ block การออก Insurance Invoice</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Supplier Invoices */}
                  {supplierInvoices.length > 0 ? supplierInvoices.map(si => (
                    <div key={si.id} className="p-3 bg-[#f8faff] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div><span className="text-sm font-medium">{si.invoiceNo}</span><span className="text-xs text-[#94a3b8] ml-2">{si.vendor?.name || 'Vendor'}</span></div>
                        <div className="flex items-center gap-3"><span className="font-semibold text-sm">฿{formatCurrency(si.totalAmount)}</span>
                          <Badge className={`border-none text-[10px] ${si.apPayment ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{si.apPayment ? 'จ่ายแล้ว' : 'รอจ่าย'}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ap-purchase`)}><Download className="w-3 h-3 mr-1" />ตั้งเจ้าหนี้</Button>
                        {si.apPayment && <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-200" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ap-expense`)}><Download className="w-3 h-3 mr-1" />จ่ายเงิน</Button>}
                      </div>
                    </div>
                  )) : <p className="text-sm text-[#94a3b8] text-center py-4">ยังไม่มี Supplier Invoice</p>}
                  {/* Garage Invoices */}
                  {garageInvoices.length > 0 && garageInvoices.map(gi => (
                    <div key={gi.id} className="p-3 bg-[#f8faff] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div><span className="text-sm font-medium">{gi.invoiceNo}</span><span className="text-xs text-[#94a3b8] ml-2">{gi.garageName || 'อู่'}</span></div>
                        <div className="flex items-center gap-3"><span className="font-semibold text-sm">฿{formatCurrency(gi.totalAmount)}</span>
                          <Badge className={`border-none text-[10px] ${gi.apPayment ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{gi.apPayment ? 'จ่ายแล้ว' : 'รอจ่าย'}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ap-purchase`)}><Download className="w-3 h-3 mr-1" />ตั้งเจ้าหนี้</Button>
                        {gi.apPayment && <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-200" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ap-expense`)}><Download className="w-3 h-3 mr-1" />จ่ายเงิน</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Payments */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {(() => {
              const claimPRs = mockPaymentRequests.filter(pr => pr.claimId === claim.id)
              if (claimPRs.length === 0) return (
                <Card>
                  <CardContent className="p-0">
                    <div className="text-center py-12 text-[#94a3b8]">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>ยังไม่มี Payment Request</p>
                      <p className="text-xs mt-1">สร้างคำขอจ่ายเงินจากแท็บ &quot;ใบเปิดสินค้า&quot;</p>
                    </div>
                  </CardContent>
                </Card>
              )
              return claimPRs.map(pr => (
                <Card key={pr.id} className={`border ${pr.status === 'APPROVED' ? 'border-green-200' : pr.status === 'REJECTED' ? 'border-red-200' : 'border-amber-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`border-none text-[10px] ${pr.requestType === 'AR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {pr.requestType === 'AP_VENDOR' ? 'AP Vendor' : pr.requestType === 'AP_GARAGE' ? 'AP อู่' : 'AR ประกัน'}
                        </Badge>
                        <span className="font-medium text-sm">{pr.vendorName || pr.garageName || pr.insuranceName}</span>
                      </div>
                      <Badge className={`border-none text-[10px] ${pr.status === 'APPROVED' ? 'bg-green-100 text-green-700' : pr.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {pr.status === 'APPROVED' ? 'อนุมัติแล้ว' : pr.status === 'REJECTED' ? 'ถูกปฏิเสธ' : 'รออนุมัติ'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                      <div><span className="text-[#94a3b8] text-xs block">ยอด</span><span className="font-bold text-[#0f172a]">฿{formatCurrency(pr.amount)}</span></div>
                      <div><span className="text-[#94a3b8] text-xs block">วิธีจ่าย</span><span>{pr.method}</span></div>
                      <div><span className="text-[#94a3b8] text-xs block">สร้างโดย</span><span>{pr.createdBy}</span></div>
                    </div>
                    {pr.billReceipt && (
                      <div className="bg-gray-50 rounded p-2 text-xs flex items-center gap-2 mt-2">
                        {pr.billReceipt.invoiceNoMatched
                          ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">บิลกระดาษตรงกัน ({pr.billReceipt.physicalInvoiceNo})</span></>
                          : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-600">บิลไม่ตรง — ระบบ: {pr.billReceipt.systemInvoiceNo} / กระดาษ: {pr.billReceipt.physicalInvoiceNo}</span></>}
                      </div>
                    )}
                    {pr.status === 'REJECTED' && pr.rejectReason && (
                      <div className="bg-red-50 rounded p-2 text-xs text-red-600 mt-2 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />เหตุผล: {pr.rejectReason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            })()}
          </div>
        </TabsContent>

        {/* Tab 7: P&L */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#1d4ed8]" />P&L Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto space-y-4">
                {[
                  { label: 'AR Received (รับจากประกัน)', value: arReceived, color: 'text-green-600' },
                  { label: 'AP Vendor (จ่าย Supplier)', value: apVendor, color: 'text-red-500' },
                  { label: 'AP Garage (จ่ายอู่)', value: 0, color: 'text-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-sm text-[#475569]">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>฿{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 border-t-2 border-[#1d4ed8]">
                  <span className="font-semibold text-[#0f172a]">Gross Profit</span>
                  <span className={`text-xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ฿{formatCurrency(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-[#475569]">Margin</span>
                  <span className="font-semibold text-[#0f172a]">{margin.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-[#1d4ed8]" />Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="relative pl-8 space-y-6">
                {claim.statusLogs?.map((log: any, i: number) => {
                  const isLast = i === (claim.statusLogs?.length || 0) - 1
                  const logColor = getStatusColor(log.toStatus)
                  return (
                    <div key={log.id} className="relative">
                      {/* Line */}
                      {!isLast && <div className="absolute left-[-20px] top-8 w-0.5 h-full bg-gray-200" />}
                      {/* Dot */}
                      <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full border-2 border-white shadow ${logColor.bg}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`status-badge ${logColor.bg} ${logColor.text}`}>{getStatusLabel(log.toStatus)}</span>
                          {log.fromStatus && (
                            <span className="text-xs text-[#94a3b8]">← {getStatusLabel(log.fromStatus)}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-1">
                          {new Date(log.createdAt).toLocaleString('th-TH')} • {log.changedBy}
                        </p>
                        {log.note && <p className="text-sm text-[#475569] mt-1">{log.note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Create Quotation Modal ─── */}
      {showCreateQuotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-[#f8faff]">
              <h3 className="font-semibold text-lg text-[#0f172a] flex items-center gap-2"><FileText className="w-5 h-5 text-[#1d4ed8]" />ออกใบเสนอราคา (Quotation)</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateQuotationModal(false)} className="h-8 w-8 text-[#94a3b8] hover:text-[#0f172a]"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-700">
                  ระบบจะดึงรายการอะไหล่ ({parts.length} รายการ) และค่าแรง ({labors.length} รายการ) ปัจจุบันมาสร้างเป็นใบเสนอราคาฉบับใหม่
                </div>
                <div>
                  <label className="text-sm font-medium text-[#475569]">วันที่เสนอราคา</label>
                  <Input type="date" className="mt-1" value={qtDate} onChange={e => setQtDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#475569]">วันหมดอายุ</label>
                  <Input type="date" className="mt-1" value={qtValidUntil} onChange={e => setQtValidUntil(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#475569]">หมายเหตุ (แสดงในใบเสนอราคา)</label>
                  <Input placeholder="เช่น ราคาอะไหล่อ้างอิงราคาศูนย์" className="mt-1" value={qtNote} onChange={e => setQtNote(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div><span className="text-xs text-[#94a3b8]">รวมค่าแรง</span><p className="font-semibold">฿{formatCurrency(laborTotal)}</p></div>
                  <div><span className="text-xs text-[#94a3b8]">รวมค่าอะไหล่</span><p className="font-semibold">฿{formatCurrency(partsTotal)}</p></div>
                  <div><span className="text-xs text-[#94a3b8]">VAT 7%</span><p className="font-semibold">฿{formatCurrency(vat)}</p></div>
                  <div><span className="text-xs text-[#94a3b8]">ยอดรวมทั้งสิ้น</span><p className="font-bold text-[#1d4ed8] text-lg">฿{formatCurrency(grand)}</p></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setShowCreateQuotationModal(false)}>ยกเลิก</Button>
              <Button className="bg-[#1d4ed8]" onClick={handleCreateQuotation}>สร้างใบเสนอราคา</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Supplement Modal ─── */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50">
              <h3 className="font-semibold text-lg text-amber-900 flex items-center gap-2"><Plus className="w-5 h-5 text-amber-600" />เปิด Supplement</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSupplementModal(false)} className="h-8 w-8 text-amber-700/50 hover:text-amber-900"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">คุณกำลังจะสร้างใบเสนอราคาฉบับเพิ่มเติม (Supplement) อ้างอิงจากใบเสนอราคาเดิม ระบบจะทำการคัดลอกข้อมูลทั้งหมดไปยังฉบับร่างใหม่ และปรับสถานะฉบับเดิมเป็น &quot;SUPERSEDED&quot;</p>
              <div>
                <label className="text-sm font-medium text-[#475569]">เหตุผลที่เปิด Supplement</label>
                <Input placeholder="เช่น มีรายการซ่อมเพิ่มเติม" className="mt-1" value={supplementReason} onChange={e => setSupplementReason(e.target.value)} />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSupplementModal(false)}>ยกเลิก</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateSupplement}>ยืนยันเปิด Supplement</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

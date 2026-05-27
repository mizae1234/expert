"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Save,
  X,
  Ban,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { ClaimStatus, Quotation, InsuranceInvoice, PurchaseOrder } from '@/lib/types'
import {
  ClaimInfoTab,
  PnLTab,
  TimelineTab,
  PaymentsTab,
  InsuranceInvoiceTab,
  ExpensesTab,
  DocumentsTab,
  PartsTab,
  POTab,
  SupplierInvTab
} from './tabs'
import { StatusChangeModal } from './components/StatusChangeModal'

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tabParam = searchParams.get('tab') || 'info'
  
  const [loading, setLoading] = useState(true)
  const [originalClaim, setOriginalClaim] = useState<any>(null)
  const [partsMaster, setPartsMaster] = useState<any[]>([])
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('RECEIVED')
  const [editMode, setEditMode] = useState(false)
  const [parts, setParts] = useState<any[]>([])
  const [labors, setLabors] = useState<any[]>([])
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([])
  const [garageInvoices, setGarageInvoices] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [insuranceInvoice, setInsuranceInvoice] = useState<InsuranceInvoice | undefined>()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null)
  
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null)
  const [showReceiveARModal, setShowReceiveARModal] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url: string; type: string } | null>(null)
  const [arReceiveDate, setArReceiveDate] = useState(new Date().toISOString().split('T')[0])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const refreshClaim = async () => {
    try {
      const res = await fetch(`/api/claims/${params.id}`)
      const data = await res.json()
      setOriginalClaim(data)
      setClaimStatus(data.status || 'RECEIVED')
      setParts(data.parts || [])
      setLabors(data.labors || [])
      setSupplierInvoices(data.supplierInvoices || [])
      setGarageInvoices(data.garageInvoices || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setInsuranceInvoice(data.insuranceInvoice)
      setQuotations(data.quotations || [])
    } catch (err) {
      console.error('Failed to refresh claim data:', err)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/claims/${params.id}`).then(res => res.json()),
      fetch('/api/vendors').then(res => res.json()).catch(() => []),
      fetch('/api/parts-master?all=true').then(res => res.json()).catch(() => []),
    ]).then(([data, vData, pmData]) => {
      setOriginalClaim(data)
      setClaimStatus(data.status || 'RECEIVED')
      setParts(data.parts || [])
      setLabors(data.labors || [])
      setSupplierInvoices(data.supplierInvoices || [])
      setGarageInvoices(data.garageInvoices || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setInsuranceInvoice(data.insuranceInvoice)
      setQuotations(data.quotations || [])
      
      setVendors(vData)
      if (Array.isArray(pmData)) setPartsMaster(pmData)
      
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [params.id])

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
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  const grand = Math.round((subtotal + vat) * 100) / 100
  const apVendor = claim.supplierInvoices?.reduce((s: number, inv: any) => s + inv.totalAmount, 0) || 0
  const arReceived = claim.insuranceInvoice?.grandTotal || 0
  const grossProfit = arReceived - apVendor
  const margin = arReceived > 0 ? (grossProfit / arReceived) * 100 : 0
  const nextStatus = STATUS_FLOW[claimStatus]
  const nextLabel = STATUS_FLOW_LABEL[claimStatus]

  const handleCreateInsuranceInvoice = async (customData?: {
    laborTotal: number
    partsTotal: number
    subtotal: number
    vatAmount: number
    grandTotal: number
  }) => {
    try {
      const laborTot = customData ? customData.laborTotal : laborTotal
      const partsTot = customData ? customData.partsTotal : partsTotal
      const sub = customData ? customData.subtotal : (laborTot + partsTot)
      const vatAmt = customData ? customData.vatAmount : (Math.round(sub * 0.07 * 100) / 100)
      const grandTotal = customData ? customData.grandTotal : (Math.round((sub + vatAmt) * 100) / 100)

      const res = await fetch(`/api/claims/${claim.id}/insurance-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laborTotal: laborTot,
          partsTotal: partsTot,
          subtotal: sub,
          vatAmount: vatAmt,
          grandTotal: grandTotal
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create insurance invoice')
      }
      const newInvoice = await res.json()
      setInsuranceInvoice(newInvoice)
      showToast('ออกใบวางบิลประกันภัยสำเร็จ')
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการออกใบวางบิล: ${err.message}`)
    }
  }

  const handleDeleteInsuranceInvoice = async () => {
    try {
      const res = await fetch(`/api/claims/${claim.id}/insurance-invoice`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to delete insurance invoice')
      }
      setInsuranceInvoice(undefined)
      showToast('ยกเลิกใบวางบิลสำเร็จ คุณสามารถแก้ไขรายการแล้วสร้างใหม่ได้')
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการยกเลิกใบวางบิล: ${err.message}`)
    }
  }

  const tabProps = {
    claim, parts, labors, setParts, setLabors,
    supplierInvoices, setSupplierInvoices,
    garageInvoices, setGarageInvoices,
    purchaseOrders, setPurchaseOrders,
    insuranceInvoice, setInsuranceInvoice,
    quotations, setQuotations,
    editMode, partsTotal, laborTotal, subtotal, vat, grand,
    arReceived, apVendor, grossProfit, margin,
    showToast, setErrorModalMsg, setConfirmModal, refreshClaim, vendors,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Inline Preview Modal for PDF/Image attachments */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col" onClick={() => setPreviewAttachment(null)}>
          <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 backdrop-blur-sm border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium truncate max-w-[400px]">{previewAttachment.name}</span>
              <Badge className="border-none text-[10px] bg-white/10 text-white/70">{previewAttachment.type.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-8 text-xs" onClick={() => window.open(previewAttachment.url)}>
                <Download className="w-3.5 h-3.5 mr-1" />ดาวน์โหลด
              </Button>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0" onClick={() => setPreviewAttachment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={e => e.stopPropagation()}>
            {previewAttachment.type === 'pdf' ? (
              <iframe src={previewAttachment.url} className="w-full h-full max-w-5xl rounded-lg border border-white/10 bg-white" style={{ minHeight: 'calc(100vh - 80px)' }} title={previewAttachment.name} />
            ) : (
              <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}

      {/* Datalists for Autocomplete */}
      <datalist id="parts-list">
        {partsMaster.filter(p => p.category !== 'LABOR').map(p => <option key={p.partNo} value={p.partName} />)}
      </datalist>
      <datalist id="part-no-list">
        {partsMaster.filter(p => p.category !== 'LABOR').map(p => <option key={p.partNo} value={p.partNo} />)}
      </datalist>
      <datalist id="labors-list">
        {partsMaster.filter(p => p.category === 'LABOR').map(p => <option key={p.partNo} value={p.partName} />)}
      </datalist>
      <datalist id="damage-type-list">
        <option value="เปลี่ยน" />
        <option value="ซ่อม" />
      </datalist>
      <datalist id="damage-level-list">
        <option value="เบา" />
        <option value="ปานกลาง" />
        <option value="หนัก" />
      </datalist>

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
              <Button size="sm" onClick={async () => { 
                if (parts && Array.isArray(parts)) {
                  const emptyPartIndex = parts.findIndex(p => !p.partName?.trim())
                  if (emptyPartIndex !== -1) {
                    showToast(`❌ กรุณาระบุชื่ออะไหล่ให้ครบทุกรายการ (รายการที่ ${emptyPartIndex + 1})`)
                    return
                  }
                }
                if (labors && Array.isArray(labors)) {
                  const emptyLaborIndex = labors.findIndex(l => !l.description?.trim())
                  if (emptyLaborIndex !== -1) {
                    showToast(`❌ กรุณาระบุชื่อรายการค่าแรงให้ครบทุกรายการ (รายการที่ ${emptyLaborIndex + 1})`)
                    return
                  }
                }

                try {
                  const res = await fetch(`/api/claims/${claim.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      parts,
                      labors,
                      claimNo: claim.claimNo,
                      receiveNo: claim.receiveNo,
                      transactionNo: claim.transactionNo,
                      carPlate: claim.carPlate,
                      province: claim.province,
                      carBrand: claim.carBrand,
                      carModel: claim.carModel,
                      carVin: claim.carVin,
                      insuredName: claim.insuredName,
                      insuranceId: claim.insuranceId,
                      garageId: claim.garageId,
                    })
                  })
                  if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.error || 'Failed to save')
                  }
                  const updatedData = await res.json()
                  setOriginalClaim(updatedData)
                  setParts(updatedData.parts || [])
                  setLabors(updatedData.labors || [])
                  setEditMode(false)
                  showToast('บันทึกข้อมูลเรียบร้อย')
                } catch (err: any) {
                  setErrorModalMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
                }
              }}>
                <Save className="w-4 h-4 mr-1.5" />บันทึก
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Save className="w-4 h-4 mr-1.5" />แก้ไข
              </Button>
              {nextStatus && (
                <Button size="sm" className="bg-[#1d4ed8] hover:bg-[#1e40af]" onClick={() => setShowStatusModal(true)}>
                  <ChevronRight className="w-4 h-4 mr-1.5" />{nextLabel}
                </Button>
              )}
              {claimStatus !== 'CLOSED' && claimStatus !== 'CANCELLED' && (
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmModal({
                  title: 'ยกเลิกใบเคลม',
                  message: `ยืนยันยกเลิกเคลม ${claim.claimNo}? เคลมที่ยกเลิกจะไม่ถูกนับในรายงานรายรับ-รายจ่าย`,
                  onConfirm: async () => {
                    try {
                      await fetch(`/api/claims/${claim.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'CANCELLED', note: 'ยกเลิกเคลม' })
                      })
                      showToast('ยกเลิกเคลมเรียบร้อยแล้ว')
                      setConfirmModal(null)
                      await refreshClaim()
                    } catch { setErrorModalMsg('เกิดข้อผิดพลาด') }
                  }
                })}>
                  <Ban className="w-4 h-4 mr-1" />ยกเลิกเคลม
                </Button>
              )}
            </>
          )}
        </div>
      </div>

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
      <Tabs value={tabParam} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info">ข้อมูล Claim</TabsTrigger>
          <TabsTrigger value="parts">อะไหล่/ค่าแรง</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="supplier-inv">ใบเปิดสินค้า</TabsTrigger>
          <TabsTrigger value="insurance-inv">วางบิลประกัน</TabsTrigger>
          <TabsTrigger value="expenses">ค่าใช้จ่ายเพิ่ม</TabsTrigger>
          <TabsTrigger value="documents">เอกสารแนบ</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ClaimInfoTab {...tabProps} />
        </TabsContent>

        <TabsContent value="parts">
          <PartsTab {...tabProps} />
        </TabsContent>

        <TabsContent value="po">
          <POTab {...tabProps} />
        </TabsContent>

        <TabsContent value="supplier-inv">
          <SupplierInvTab {...tabProps} />
        </TabsContent>

        <TabsContent value="insurance-inv">
          <InsuranceInvoiceTab
            {...tabProps}
            handleCreateInsuranceInvoice={handleCreateInsuranceInvoice}
            handleDeleteInsuranceInvoice={handleDeleteInsuranceInvoice}
            setConfirmModal={setConfirmModal}
            setShowReceiveARModal={setShowReceiveARModal}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab {...tabProps} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab {...tabProps} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab {...tabProps} />
        </TabsContent>

        <TabsContent value="pnl">
          <PnLTab {...tabProps} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab {...tabProps} />
        </TabsContent>
      </Tabs>

      <StatusChangeModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        claimId={claim.id}
        claimStatus={claimStatus}
        setClaimStatus={setClaimStatus}
        nextStatus={nextStatus}
        showToast={showToast}
        setErrorModalMsg={setErrorModalMsg}
      />

      {/* Error Modal */}
      {errorModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-red-50 text-red-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-semibold">ข้อผิดพลาด</h3>
            </div>
            <div className="p-6 text-center text-[#475569]">
              {errorModalMsg}
            </div>
            <div className="p-4 border-t flex justify-end bg-gray-50">
              <Button onClick={() => setErrorModalMsg(null)} className="bg-red-600 hover:bg-red-700 text-white w-full">ปิดหน้าต่าง</Button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">{confirmModal.title}</h3>
            </div>
            <div className="p-6 text-center text-[#475569]">{confirmModal.message}</div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>ยกเลิก</Button>
              <Button className="bg-[#1d4ed8]" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}>ยืนยัน</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive AR Payment Modal */}
      {showReceiveARModal && (() => {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReceiveARModal(false)}>
            <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    บันทึกรับเงินจากบ.ประกัน
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowReceiveARModal(false)} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">ยอดรับ: <span className="font-bold text-lg">฿{formatCurrency(claim.insuranceInvoice?.grandTotal || 0)}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#475569]">วันที่รับเงิน</label>
                  <Input type="date" className="mt-1" value={arReceiveDate} onChange={e => setArReceiveDate(e.target.value)} />
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t">
                  <Button variant="outline" onClick={() => setShowReceiveARModal(false)}>ยกเลิก</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                    try {
                      const res = await fetch(`/api/claims/${claim.id}/insurance-invoice/receive-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ method: 'โอนเงิน', receivedAt: arReceiveDate ? new Date(arReceiveDate).toISOString() : undefined })
                      })
                      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
                      setShowReceiveARModal(false)
                      showToast('บันทึกรับเงินจากบ.ประกันเรียบร้อยแล้ว')
                      await refreshClaim()
                    } catch (err: any) { setShowReceiveARModal(false); setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`) }
                  }}><CheckCircle2 className="w-4 h-4 mr-1" />ยืนยันรับเงิน</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}

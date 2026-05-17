import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ClaimTabProps } from './types'

interface PaymentsTabProps extends ClaimTabProps {
  setRejectPRId: (id: string | null) => void
  setRejectReason: (reason: string) => void
}

export default function PaymentsTab({ claim, showToast, setErrorModalMsg, refreshClaim, setRejectPRId, setRejectReason }: PaymentsTabProps) {
  const claimPRs = claim.paymentRequests || []

  if (claimPRs.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="text-center py-12 text-[#94a3b8]">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มี Payment Request</p>
              <p className="text-xs mt-1">สร้างคำขอจ่ายเงินจากแท็บ &quot;ใบเปิดสินค้า&quot;</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {claimPRs.map((pr: any) => (
        <Card key={pr.id} className={`border ${pr.status === 'APPROVED' ? 'border-green-200' : pr.status === 'REJECTED' ? 'border-red-200' : 'border-amber-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`border-none text-[10px] ${pr.requestType === 'AR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {pr.requestType === 'AP_VENDOR' ? 'AP Vendor' : pr.requestType === 'AP_GARAGE' ? 'AP อู่' : 'AR ประกัน'}
                </Badge>
                <span className="font-medium text-sm">
                  {pr.requestType === 'AP_VENDOR' ? pr.supplierInvoice?.vendor?.name 
                    : pr.requestType === 'AP_GARAGE' ? pr.garageInvoice?.garage?.name || claim.garage?.name 
                    : claim.insurance?.name}
                </span>
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
            {pr.status === 'PENDING_APPROVAL' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={async () => {
                  try {
                    const res = await fetch(`/api/payment-requests/${pr.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvedBy: 'การเงิน' }) })
                    if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
                    showToast('อนุมัติจ่ายเงินเรียบร้อย')
                    await refreshClaim()
                  } catch (err: any) { setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`) }
                }}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />อนุมัติจ่ายเงิน</Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setRejectPRId(pr.id); setRejectReason('') }}><XCircle className="w-3.5 h-3.5 mr-1" />ปฏิเสธ</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

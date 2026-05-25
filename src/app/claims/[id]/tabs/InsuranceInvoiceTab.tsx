import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, CheckCircle2, AlertTriangle, Trash2, Plus, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { ClaimTabProps } from './types'
import { useState, useEffect } from 'react'

interface InsuranceInvoiceTabProps extends ClaimTabProps {
  handleCreateInsuranceInvoice: (customData?: { laborTotal: number, partsTotal: number, subtotal: number, vatAmount: number, grandTotal: number }) => Promise<void>
  handleDeleteInsuranceInvoice: () => Promise<void>
  setConfirmModal: (val: { title: string, message: string, onConfirm: () => void } | null) => void
  setShowReceiveARModal: (val: boolean) => void
}

export default function InsuranceInvoiceTab({
  claim,
  partsTotal,
  laborTotal,
  handleCreateInsuranceInvoice,
  handleDeleteInsuranceInvoice,
  setConfirmModal,
  setShowReceiveARModal
}: InsuranceInvoiceTabProps) {
  const [editParts, setEditParts] = useState<number>(partsTotal)
  const [editLabor, setEditLabor] = useState<number>(laborTotal)

  useEffect(() => {
    setEditParts(partsTotal)
    setEditLabor(laborTotal)
  }, [partsTotal, laborTotal])

  // Calculations with 2 decimal places (not rounded to integers)
  const sub = editParts + editLabor
  const vat = Math.round(sub * 0.07 * 100) / 100
  const grand = Math.round((sub + vat) * 100) / 100

  return (
    <div className="space-y-6">
      {/* ─── Section AR: วางบิลประกัน ─── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />AR — วางบิลประกัน</CardTitle>
          <div className="flex items-center gap-2">
            {claim.insuranceInvoice && (
              <>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/claims/${claim.id}/pdf/insurance-invoice`)}><Download className="w-3.5 h-3.5 mr-1" />PDF</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ar-invoice`)}><Download className="w-3.5 h-3.5 mr-1" />PEAK</Button>
                {!claim.insuranceInvoice.arPayment && (
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmModal({ title: 'ยืนยันยกเลิกใบวางบิล', message: 'ข้อมูลการวางบิลจะถูกลบ คุณสามารถแก้ไขรายการแล้วสร้างใหม่ได้', onConfirm: handleDeleteInsuranceInvoice })}><Trash2 className="w-3.5 h-3.5 mr-1" />ยกเลิกบิล</Button>
                )}
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!claim.insuranceInvoice ? (
            <div className="space-y-4">
              {(() => {
                const statusFlow = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED']
                const idx = statusFlow.indexOf(claim.status)
                const ready = idx >= 1 // >= PARTS_CHECK
                
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
                    
                    <div className="bg-[#f8faff] rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-[#475569]">ค่าอะไหล่ (แก้ไขได้)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1.5 p-2 text-sm border rounded-md font-semibold text-[#0f172a]"
                            value={editParts}
                            onChange={e => setEditParts(Number(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#475569]">ค่าแรง (แก้ไขได้)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1.5 p-2 text-sm border rounded-md font-semibold text-[#0f172a]"
                            value={editLabor}
                            onChange={e => setEditLabor(Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm text-[#475569]">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-[#0f172a]">฿{formatCurrency(sub)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#475569]">
                          <span>VAT 7%:</span>
                          <span className="font-semibold text-[#0f172a]">฿{formatCurrency(vat)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-blue-700 pt-2 border-t mt-1">
                          <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
                          <span>฿{formatCurrency(grand)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="bg-[#1d4ed8] w-full" onClick={() => handleCreateInsuranceInvoice({
                      laborTotal: editLabor,
                      partsTotal: editParts,
                      subtotal: sub,
                      vatAmount: vat,
                      grandTotal: grand
                    })}><Plus className="w-4 h-4 mr-1" />สร้างใบวางบิลประกัน</Button>
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
                ['วันที่', formatDate(claim.insuranceInvoice.invoiceDate)],
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

              {/* AR Payment Status */}
              {claim.insuranceInvoice.arPayment ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-green-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />รับชำระเงินจากบ.ประกันแล้ว</p>
                  <div className="mt-2 space-y-1 text-xs text-green-600">
                    <p>ยอดรับ: ฿{formatCurrency(claim.insuranceInvoice.arPayment.amount)}</p>
                    <p>วิธีรับเงิน: {claim.insuranceInvoice.arPayment.method}</p>
                    <p>วันที่รับ: {formatDate(claim.insuranceInvoice.arPayment.receivedAt)}</p>
                    {claim.insuranceInvoice.arPayment.ref && <p>เลขอ้างอิง: {claim.insuranceInvoice.arPayment.ref}</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-amber-700 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />รอรับชำระเงินจากบ.ประกัน</p>
                  <p className="text-xs text-amber-600 mt-1">เมื่อได้รับเงินจากบ.ประกันแล้ว กดปุ่มด้านล่างเพื่อบันทึกการรับเงิน</p>
                  <Button className="bg-green-600 hover:bg-green-700 w-full mt-3" onClick={() => setShowReceiveARModal(true)}><CheckCircle2 className="w-4 h-4 mr-1.5" />บันทึกรับเงินจากบ.ประกัน</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

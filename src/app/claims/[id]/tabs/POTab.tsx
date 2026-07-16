"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit2, Trash2, CheckCircle2, Download, Truck, AlertTriangle } from 'lucide-react'
import { formatCurrency, getPOStatusLabel } from '@/lib/utils'
import { ClaimTabProps } from './types'
import { CreatePOModal } from '../components/CreatePOModal'

export default function POTab({
  claim,
  parts,
  labors,
  purchaseOrders,
  setPurchaseOrders,
  vendors,
  showToast,
  setErrorModalMsg,
  setConfirmModal
}: ClaimTabProps) {
  const [showCreatePOModal, setShowCreatePOModal] = useState(false)
  const [editPOId, setEditPOId] = useState<string | null>(null)

  const handleCancelPO = (poId: string, poNo: string) => {
    setConfirmModal({
      title: 'ยกเลิกใบสั่งซื้อ',
      message: `คุณต้องการยกเลิกใบสั่งซื้อ ${poNo} ใช่หรือไม่? (สถานะจะถูกเปลี่ยนเป็น "ยกเลิก")`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/claims/${claim.id}/pos/${poId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CANCELLED' })
          })
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || 'Failed to cancel PO')
          }
          const updatedPO = await res.json()
          setPurchaseOrders(prev => prev.map(p => p.id === poId ? updatedPO : p))
          showToast('ยกเลิกใบสั่งซื้อสำเร็จ')
        } catch (err: any) {
          setErrorModalMsg(`เกิดข้อผิดพลาดในการยกเลิก PO: ${err.message}`)
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Purchase Orders</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditPOId(null)
              setShowCreatePOModal(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1" />สร้าง PO
          </Button>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12 text-[#94a3b8]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มี PO</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...purchaseOrders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(po => (
                <Card key={po.id} className="border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-[#0f172a]">{po.poNo}</h4>
                        <Badge variant="outline" className="text-[10px]">{po.poType}</Badge>
                        <Badge className={po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : po.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                          {po.status === 'CANCELLED' ? 'ยกเลิก' : getPOStatusLabel(po.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(po.totalAmount)}</span>
                        <span className="text-[10px] text-gray-500">
                          {(() => {
                            const parts = []
                            const sub = po.items.reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)
                            const diff = Math.round((po.totalAmount - sub) * 100) / 100
                            if (diff > 0 || po.includeVat !== false) parts.push(`VAT ${po.vatPct || 7}%`)
                            if (po.includeWht) parts.push(`หัก ณ ${po.whtPct || 3}%`)
                            return parts.length > 0 ? `(${parts.join(', ')})` : ''
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {po.status === 'DRAFT' && (
                          <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-blue-600"
                              onClick={() => {
                                setEditPOId(po.id)
                                setShowCreatePOModal(true)
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-red-600"
                              onClick={() => handleCancelPO(po.id, po.poNo)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                        {po.status !== 'DRAFT' && po.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-red-600"
                              onClick={() => handleCancelPO(po.id, po.poNo)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-[#475569] flex items-center gap-4">
                      <span>Vendor: {po.vendor?.name}</span>
                      <span>•</span>
                      <span>{(po.items || []).length} รายการ</span>
                      {po.goodsReceipt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />รับของแล้ว
                          </span>
                        </>
                      )}
                    </div>
                    {po.status !== 'CANCELLED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        {po.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/claims/${claim.id}/pos/${po.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'SENT' })
                                })
                                if (!res.ok) throw new Error()
                                const updated = await res.json()
                                setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updated : p))
                                showToast(`${po.poNo} อนุมัติแล้ว`)
                              } catch {
                                setErrorModalMsg('เกิดข้อผิดพลาด')
                              }
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />อนุมัติ / ส่ง PO
                          </Button>
                        )}
                        {po.status === 'SENT' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-7"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/claims/${claim.id}/pos/${po.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'RECEIVED' })
                                })
                                if (!res.ok) throw new Error()
                                const updated = await res.json()
                                setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updated : p))
                                showToast(`${po.poNo} รับอะไหล่แล้ว`)
                              } catch {
                                setErrorModalMsg('เกิดข้อผิดพลาด')
                              }
                            }}
                          >
                            <Package className="w-3 h-3 mr-1" />รับอะไหล่แล้ว
                          </Button>
                        )}
                        <Link href={`/claims/${claim.id}/pdf/purchase-order?poId=${po.id}&vatPct=${po.includeVat !== false ? (po.vatPct || 7) : 0}&whtPct=${po.includeWht ? (po.whtPct || 3) : 0}`} target="_blank">
                          <Button variant="outline" size="sm" className="text-xs h-7">
                            <Download className="w-3 h-3 mr-1" />ดาวน์โหลด PO
                          </Button>
                        </Link>
                        <Link href={`/claims/${claim.id}/pdf/delivery-note?poId=${po.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="text-xs h-7">
                            <Truck className="w-3 h-3 mr-1" />ใบส่งของ
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
 
      <CreatePOModal
        isOpen={showCreatePOModal}
        onClose={() => {
          setShowCreatePOModal(false)
          setEditPOId(null)
        }}
        claimId={claim.id}
        claim={claim}
        vendors={vendors}
        parts={parts}
        labors={labors}
        editPOId={editPOId}
        purchaseOrders={purchaseOrders}
        setPurchaseOrders={setPurchaseOrders}
        showToast={showToast}
        setErrorModalMsg={setErrorModalMsg}
      />
    </div>
  )
}

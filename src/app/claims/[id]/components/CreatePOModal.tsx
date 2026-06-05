"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart, X, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PurchaseOrder } from '@/lib/types'
import { SearchableSelect } from './SearchableSelect'

interface CreatePOModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  claim: any
  vendors: any[]
  parts: any[]
  labors: any[]
  editPOId: string | null
  purchaseOrders: PurchaseOrder[]
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
}

export function CreatePOModal({
  isOpen,
  onClose,
  claimId,
  claim,
  vendors,
  parts,
  labors,
  editPOId,
  purchaseOrders,
  setPurchaseOrders,
  showToast,
  setErrorModalMsg
}: CreatePOModalProps) {
  const [poVendorId, setPoVendorId] = useState('')
  const [poVendorName, setPoVendorName] = useState('')
  const [poDeliveryAddress, setPoDeliveryAddress] = useState('')
  const [poModalParts, setPoModalParts] = useState<any[]>([])
  const [poModalLabors, setPoModalLabors] = useState<any[]>([])
  const [poManualItems, setPoManualItems] = useState<{ id: string; description: string; quantity: number; unitPrice: number }[]>([])
  const [poIncludeVat, setPoIncludeVat] = useState(true)
  const [poVatPct, setPoVatPct] = useState(7)
  const [poCustomVat, setPoCustomVat] = useState<string>('')
  const [poCustomGrand, setPoCustomGrand] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      if (editPOId) {
        const po = purchaseOrders.find(p => p.id === editPOId)
        if (po) {
          setPoVendorId(po.vendorId)
          setPoVendorName(po.vendor?.name || '')
          setPoDeliveryAddress(po.deliveryAddress || '')
          setPoModalParts(parts.map((p: any) => {
            const existingPoItem = po.items.find((pi: any) => pi.partNo === p.partNo || pi.description === p.partName)
            if (existingPoItem) {
              return { ...p, selected: true, partName: existingPoItem.description, quantity: existingPoItem.quantity, priceApprove: existingPoItem.unitPrice }
            }
            return { ...p, selected: false }
          }))
          setPoModalLabors(labors.map((l: any) => {
            const existingPoItem = po.items.find((pi: any) => pi.description === `[ค่าแรง] ${l.description}`)
            if (existingPoItem) {
              return { ...l, selected: true, description: existingPoItem.description.replace('[ค่าแรง] ', ''), priceApprove: existingPoItem.unitPrice }
            }
            return { ...l, selected: false }
          }))
          setPoManualItems([])
          setPoIncludeVat(po.includeVat ?? true)
          setPoVatPct(po.vatPct || 7)

          // Calculate subtotal of existing items to derive custom/saved VAT amount
          const subtotal = po.items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0)
          const savedVat = Math.round((po.totalAmount - subtotal) * 100) / 100
          setPoCustomVat(savedVat > 0 ? String(savedVat) : '')
          setPoCustomGrand(String(po.totalAmount))
        }
      } else {
        setPoVendorId('')
        setPoVendorName('')
        setPoDeliveryAddress(claim.garage?.name ? `${claim.garage.name}\n${claim.garage.address || ''} ${claim.garage.province || ''}`.trim() : '')
        setPoModalParts(parts.map(p => ({ ...p, selected: p.status === 'approved' })))
        setPoModalLabors(labors.map(l => ({ ...l, selected: false })))
        setPoManualItems([])
        setPoIncludeVat(true)
        setPoVatPct(7)
        setPoCustomVat('')
        setPoCustomGrand('')
      }
    }
  }, [isOpen, editPOId, purchaseOrders, parts, labors, claim])

  if (!isOpen) return null

  const poPartsTot = poModalParts.filter(p => p.selected).reduce((sum, p) => {
    const price = Number(p.priceApprove) || 0
    const qty = (p.quantity === undefined || p.quantity === null || (p.quantity as any) === '') ? 1 : Number(p.quantity)
    return sum + (price * qty)
  }, 0)
  const poLaborsTot = poModalLabors.filter(l => l.selected).reduce((sum, l) => sum + (Number(l.priceApprove) || 0), 0)
  const poManualTot = poManualItems.reduce((sum, m) => {
    const price = Number(m.unitPrice) || 0
    const qty = (m.quantity === undefined || m.quantity === null || (m.quantity as any) === '') ? 1 : Number(m.quantity)
    return sum + (price * qty)
  }, 0)
  const poTot = poPartsTot + poLaborsTot + poManualTot
  const calculatedVatAmt = poIncludeVat ? Math.round(poTot * (poVatPct / 100) * 100) / 100 : 0
  const vatAmt = poIncludeVat ? (poCustomVat !== '' ? Number(poCustomVat) : calculatedVatAmt) : 0
  const grandTotal = poCustomGrand !== '' ? Number(poCustomGrand) : (poTot + vatAmt)

  const submitCreatePO = async () => {
    const selectedParts = poModalParts.filter(p => p.selected)
    const selectedLabors = poModalLabors.filter(l => l.selected)
    if (selectedParts.length === 0 && selectedLabors.length === 0 && poManualItems.length === 0) {
      showToast('กรุณาเลือกรายการอย่างน้อย 1 รายการ')
      return
    }
    const poNo = editPOId ? purchaseOrders.find(p => p.id === editPOId)?.poNo : undefined

    const partItems = selectedParts.map(p => ({
      partNo: p.partNo,
      description: p.partName,
      quantity: Number(p.quantity) || 1,
      unitPrice: Number(p.priceApprove) || 0,
      totalPrice: (Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)
    }))
    const laborItems = selectedLabors.map(l => ({
      partNo: '',
      description: `[ค่าแรง] ${l.description}`,
      quantity: 1,
      unitPrice: Number(l.priceApprove) || 0,
      totalPrice: Number(l.priceApprove) || 0
    }))
    const manualItems = poManualItems.filter(m => m.description.trim()).map(m => ({
      partNo: '',
      description: m.description,
      quantity: Number(m.quantity) || 1,
      unitPrice: Number(m.unitPrice) || 0,
      totalPrice: (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1)
    }))

    const payload = {
      poNo,
      vendorId: poVendorId,
      deliveryAddress: poDeliveryAddress,
      includeVat: poIncludeVat,
      vatPct: poIncludeVat ? poVatPct : 0,
      totalAmount: grandTotal,
      items: [...partItems, ...laborItems, ...manualItems]
    }

    try {
      const url = editPOId ? `/api/claims/${claimId}/pos/${editPOId}` : `/api/claims/${claimId}/pos`
      const method = editPOId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save PO')
      }
      const savedPO = await res.json()
      if (!savedPO.vendor) savedPO.vendor = { id: poVendorId, name: poVendorName }

      if (editPOId) {
        setPurchaseOrders(prev => prev.map(p => p.id === editPOId ? savedPO : p))
        showToast(`แก้ไข ${savedPO.poNo || poNo} สำเร็จ`)
      } else {
        setPurchaseOrders(prev => [...prev, savedPO])
        showToast(`สร้าง ${savedPO.poNo || poNo} สำเร็จ (${selectedParts.length} รายการ)`)
      }
      onClose()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการ${editPOId ? 'แก้ไข' : 'สร้าง'} PO: ${err.message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-[#f8faff]">
          <h3 className="font-semibold text-lg text-[#0f172a] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            {editPOId ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อ'} (PO)
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[#94a3b8] hover:text-[#0f172a]">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#475569]">เลือกผู้จัดจำหน่าย (Vendor)</label>
                <SearchableSelect
                  options={vendors.map(v => ({
                    value: v.id,
                    label: `${v.name} (${v.vendorType === 'PARTS' ? 'ผู้จำหน่ายอะไหล่' : 'อู่'})`
                  }))}
                  value={poVendorId}
                  onChange={(val) => {
                    setPoVendorId(val)
                    const selected = vendors.find(v => v.id === val)
                    setPoVendorName(selected ? selected.name : '')
                  }}
                  placeholder="เลือกผู้จัดจำหน่าย..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#475569]">ที่อยู่สำหรับจัดส่ง (ใบส่งของ)</label>
                <SearchableSelect
                  options={vendors.map(v => ({
                    value: v.id,
                    label: `${v.name} (${v.province || 'ไม่ระบุจังหวัด'})`
                  }))}
                  value=""
                  onChange={(val) => {
                    const selected = vendors.find(v => v.id === val)
                    if (selected) {
                      setPoDeliveryAddress(`${selected.name}\n${selected.address || ''} ${selected.province || ''}`.trim())
                    }
                  }}
                  placeholder="ค้นหาและเลือกที่อยู่อู่/คู่ค้า..."
                />
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={2}
                  value={poDeliveryAddress}
                  onChange={e => setPoDeliveryAddress(e.target.value)}
                  placeholder="พิมพ์ชื่ออู่ / ศูนย์บริการ / ที่อยู่จัดส่งเพิ่มเติม"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden mt-4">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={poModalParts.length > 0 && poModalParts.every(p => p.selected)}
                        ref={el => {
                          if (el) {
                            el.indeterminate = poModalParts.some(p => p.selected) && !poModalParts.every(p => p.selected)
                          }
                        }}
                        onChange={e => {
                          setPoModalParts(poModalParts.map(p => ({ ...p, selected: e.target.checked })))
                        }}
                        className="w-4 h-4"
                      />
                    </TableHead>
                    <TableHead className="w-12 text-center">ลำดับ</TableHead>
                    <TableHead>รายการอะไหล่</TableHead>
                    <TableHead className="w-20 text-center">จำนวน</TableHead>
                    <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="w-32 text-right">รวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poModalParts.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={e => {
                            const n = [...poModalParts]
                            n[i].selected = e.target.checked
                            setPoModalParts(n)
                          }}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500 font-medium">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          value={p.partName}
                          onChange={e => {
                            const n = [...poModalParts]
                            n[i].partName = e.target.value
                            setPoModalParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-center"
                          value={p.quantity || ''}
                          onChange={e => {
                            const n = [...poModalParts]
                            n[i].quantity = Number(e.target.value)
                            setPoModalParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={p.priceApprove || ''}
                          onChange={e => {
                            const n = [...poModalParts]
                            n[i].priceApprove = Number(e.target.value)
                            setPoModalParts(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm pt-3">
                        ฿{formatCurrency((Number(p.priceApprove) || 0) * ((p.quantity === undefined || p.quantity === null || (p.quantity as any) === '') ? 1 : Number(p.quantity)))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {poModalParts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">ไม่มีรายการอะไหล่</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Labor items */}
            <div className="border rounded-lg overflow-hidden mt-4">
              <div className="bg-amber-50 px-4 py-2 border-b">
                <h4 className="text-sm font-semibold text-amber-800">ค่าแรง</h4>
              </div>
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={poModalLabors.length > 0 && poModalLabors.every(l => l.selected)}
                        ref={el => {
                          if (el) {
                            el.indeterminate = poModalLabors.some(l => l.selected) && !poModalLabors.every(l => l.selected)
                          }
                        }}
                        onChange={e => {
                          setPoModalLabors(poModalLabors.map(l => ({ ...l, selected: e.target.checked })))
                        }}
                        className="w-4 h-4"
                      />
                    </TableHead>
                    <TableHead className="w-12 text-center">ลำดับ</TableHead>
                    <TableHead>รายการค่าแรง</TableHead>
                    <TableHead className="w-32 text-right">ราคา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poModalLabors.map((l: any, i: number) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={l.selected}
                          onChange={e => {
                            const n = [...poModalLabors]
                            n[i].selected = e.target.checked
                            setPoModalLabors(n)
                          }}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500 font-medium">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          value={l.description}
                          onChange={e => {
                            const n = [...poModalLabors]
                            n[i].description = e.target.value
                            setPoModalLabors(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="h-8 text-sm text-right w-28 ml-auto"
                          value={l.priceApprove || ''}
                          onChange={e => {
                            const n = [...poModalLabors]
                            n[i].priceApprove = Number(e.target.value)
                            setPoModalLabors(n)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {poModalLabors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">ไม่มีรายการค่าแรง</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Manual Items */}
            <div className="border rounded-lg overflow-hidden mt-4">
              <div className="bg-green-50 px-4 py-2 border-b flex items-center justify-between">
                <h4 className="text-sm font-semibold text-green-800">รายการเพิ่มเติม (Manual)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-100"
                  onClick={() => setPoManualItems([...poManualItems, { id: `manual-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }])}
                >
                  <Plus className="w-3 h-3 mr-1" />เพิ่มรายการ
                </Button>
              </div>
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">ลำดับ</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="w-20 text-center">จำนวน</TableHead>
                    <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="w-32 text-right">รวม</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poManualItems.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-center text-sm text-gray-500 font-medium">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          placeholder="ชื่อรายการ เช่น ค่าขนส่ง"
                          value={m.description}
                          onChange={e => {
                            const n = [...poManualItems]
                            n[i].description = e.target.value
                            setPoManualItems(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-center"
                          value={m.quantity || ''}
                          onChange={e => {
                            const n = [...poManualItems]
                            n[i].quantity = Number(e.target.value)
                            setPoManualItems(n)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8 text-sm text-right"
                          value={m.unitPrice || ''}
                          onChange={e => {
                            const n = [...poManualItems]
                            n[i].unitPrice = Number(e.target.value)
                            setPoManualItems(n)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm pt-3">
                        ฿{formatCurrency((Number(m.unitPrice) || 0) * ((m.quantity === undefined || m.quantity === null || (m.quantity as any) === '') ? 1 : Number(m.quantity)))}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setPoManualItems(poManualItems.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {poManualItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-400 text-sm">
                        ยังไม่มีรายการเพิ่มเติม — กดปุ่ม "เพิ่มรายการ" ด้านบน
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <div className="flex flex-col items-end gap-2 w-72 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between w-full text-sm text-gray-500">
                  <span>ยอดรวมก่อน VAT:</span><span>฿{formatCurrency(poTot)}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={poIncludeVat}
                      onChange={e => setPoIncludeVat(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-600">รวม VAT</span>
                  </label>
                  {poIncludeVat && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="h-7 w-16 text-sm text-right"
                        value={poVatPct}
                        onChange={e => {
                          setPoVatPct(Number(e.target.value) || 0)
                          setPoCustomVat('') // Reset custom VAT when percentage changes
                        }}
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>
                {poIncludeVat && (
                  <div className="flex items-center justify-between w-full text-sm text-gray-500">
                    <span>VAT {poVatPct}%:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 w-28 text-sm text-right font-medium"
                        value={poCustomVat}
                        onChange={e => setPoCustomVat(e.target.value)}
                        placeholder={String(calculatedVatAmt)}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between w-full text-base font-bold text-blue-700 pt-2 border-t mt-1">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 text-lg">฿</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-40 text-right font-bold text-blue-700 text-lg"
                      value={poCustomGrand}
                      onChange={e => setPoCustomGrand(e.target.value)}
                      placeholder={String(poTot + vatAmt)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={submitCreatePO}>
            {editPOId ? 'บันทึกการแก้ไข PO' : 'ยืนยันสร้าง PO'}
          </Button>
        </div>
      </div>
    </div>
  )
}

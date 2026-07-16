"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { uploadToR2 } from '@/lib/upload'
import { getPartAmt, getLaborAmt } from '../utils'

interface UploadSupplierInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  claim: any
  vendors: any[]
  parts: any[]
  setParts: React.Dispatch<React.SetStateAction<any[]>>
  labors: any[]
  setLabors: React.Dispatch<React.SetStateAction<any[]>>
  purchaseOrders: any[]
  setSupplierInvoices: React.Dispatch<React.SetStateAction<any[]>>
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
}

export function UploadSupplierInvoiceModal({
  isOpen,
  onClose,
  claimId,
  claim,
  vendors,
  parts,
  setParts,
  labors,
  setLabors,
  purchaseOrders,
  setSupplierInvoices,
  showToast,
  setErrorModalMsg
}: UploadSupplierInvoiceModalProps) {
  const [uploadedFile, setUploadedFile] = useState<{ name: string, url: string, type: string, file?: File } | null>(null)
  const [customInvoiceNo, setCustomInvoiceNo] = useState('')
  const [uploadMapSelections, setUploadMapSelections] = useState<Record<string, boolean>>({})
  const [uploadItemPrices, setUploadItemPrices] = useState<Record<string, number>>({})
  const [invoiceIncludeVat, setInvoiceIncludeVat] = useState(true)
  const [invoiceVatPct, setInvoiceVatPct] = useState(7)
  const [invoiceCustomVat, setInvoiceCustomVat] = useState<string>('')
  const [invoiceIncludeWht, setInvoiceIncludeWht] = useState(false)
  const [invoiceWhtPct, setInvoiceWhtPct] = useState(3)
  const [invoiceCustomWht, setInvoiceCustomWht] = useState<string>('')
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const allPOsForFilter = purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED') || []
  const globalPoItemsForFilter = allPOsForFilter.flatMap((po: any) => po.items.map((item: any) => ({ ...item, poNo: po.poNo })))

  const partsWithPO = parts.filter(p => p.paymentStatus !== 'INVOICED' && p.paymentStatus !== 'PAID')
                            .filter(p => globalPoItemsForFilter.some((x: any) => x.partNo === p.partNo))

  const laborsWithPO = labors.filter(l => l.paymentStatus !== 'INVOICED' && l.paymentStatus !== 'PAID')
                              .filter(l => globalPoItemsForFilter.some((x: any) => x.description?.includes(l.description)))

  useEffect(() => {
    if (isOpen) {
      const sel: Record<string, boolean> = {}
      const prices: Record<string, number> = {}

      partsWithPO.forEach(p => {
        sel[p.id] = true
        prices[p.id] = getPartAmt(p, purchaseOrders)
      })

      laborsWithPO.forEach(l => {
        sel[l.id] = true
        prices[l.id] = getLaborAmt(l, purchaseOrders)
      })

      setUploadMapSelections(sel)
      setUploadItemPrices(prices)
      setInvoiceIncludeVat(true)
      setInvoiceVatPct(7)
      setInvoiceCustomVat('')
      setInvoiceIncludeWht(false)
      setInvoiceWhtPct(3)
      setInvoiceCustomWht('')
      setCustomInvoiceNo('')
      setUploadedFile(null)
    }
  }, [isOpen, parts, labors, purchaseOrders])

  if (!isOpen) return null

  const sub = partsWithPO.filter(p => uploadMapSelections[p.id]).reduce((s, p) => s + (uploadItemPrices[p.id] ?? getPartAmt(p, purchaseOrders)), 0) +
              laborsWithPO.filter(l => uploadMapSelections[l.id]).reduce((s, l) => s + (uploadItemPrices[l.id] ?? getLaborAmt(l, purchaseOrders)), 0)
  const calculatedVat = invoiceIncludeVat ? Math.round(sub * (invoiceVatPct / 100) * 100) / 100 : 0
  const vat = invoiceIncludeVat ? (invoiceCustomVat !== '' ? Number(invoiceCustomVat) : calculatedVat) : 0
  const calculatedWht = invoiceIncludeWht ? Math.round(sub * (invoiceWhtPct / 100) * 100) / 100 : 0
  const wht = invoiceIncludeWht ? (invoiceCustomWht !== '' ? Number(invoiceCustomWht) : calculatedWht) : 0
  const validPOs = purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED') || []
  const poForVendor = validPOs[0] || purchaseOrders?.[0]
  const vendorData = poForVendor?.vendorId ? vendors.find((v: any) => v.id === poForVendor.vendorId) : vendors[0]
  const billingPct = vendorData?.billingPct ?? 100
  const expectedBilling = Math.round(sub * billingPct / 100)

  const handleUploadSubmit = async () => {
    const selParts = partsWithPO.filter(p => uploadMapSelections[p.id])
    const selLabors = laborsWithPO.filter(l => uploadMapSelections[l.id])
    if (!selParts.length && !selLabors.length) {
      showToast('กรุณาเลือกอย่างน้อย 1 รายการ')
      return
    }

    try {
      setIsUploadingFile(true)
      let pdfUrlToSave = null
      if (uploadedFile?.file) {
        pdfUrlToSave = await uploadToR2(uploadedFile.file, `claims/${claimId}/invoices`)
      }

      let hasError = false
      const invoiceNo = customInvoiceNo.trim() || undefined
      const allPOs = purchaseOrders || []

      // Determine the correct vendorId from the selected items' PO
      let determinedVendorId = null
      if (selParts.length > 0) {
        const p = selParts[0]
        const po = validPOs.find((po: any) => po.items.some((pi: any) => pi.partNo === p.partNo)) ||
                   allPOs.find((po: any) => po.items.some((pi: any) => pi.partNo === p.partNo))
        if (po) determinedVendorId = po.vendorId
      } else if (selLabors.length > 0) {
        const l = selLabors[0]
        const po = validPOs.find((po: any) => po.items.some((pi: any) => pi.description?.includes(l.description))) ||
                   allPOs.find((po: any) => po.items.some((pi: any) => pi.description?.includes(l.description)))
        if (po) determinedVendorId = po.vendorId
      }

      const finalVendorId = determinedVendorId || validPOs[0]?.vendorId || purchaseOrders?.[0]?.vendorId || vendors[0]?.id || claim.garageId || 'ven-p01'

      const partItems = selParts.map(p => {
        const editedPrice = uploadItemPrices[p.id]
        // Filter PO items to only match finalVendorId to ensure correct PO linkage
        const vendorPOs = allPOs.filter((po: any) => po.vendorId === finalVendorId)
        const vendorValidPOs = validPOs.filter((po: any) => po.vendorId === finalVendorId)

        const poItem = vendorValidPOs.flatMap((po: any) => po.items).find((pi: any) => pi.partNo === p.partNo) ||
                       vendorPOs.flatMap((po: any) => po.items).find((pi: any) => pi.partNo === p.partNo) ||
                       validPOs.flatMap((po: any) => po.items).find((pi: any) => pi.partNo === p.partNo) ||
                       allPOs.flatMap((po: any) => po.items).find((pi: any) => pi.partNo === p.partNo)

        const unitPrice = editedPrice !== undefined ? editedPrice / p.quantity : (poItem ? poItem.unitPrice : p.priceApprove)
        return {
          poItemId: poItem?.id || validPOs[0]?.items?.[0]?.id || allPOs[0]?.items?.[0]?.id,
          claimPartId: p.id,
          partNo: p.partNo,
          description: p.partName,
          quantity: p.quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * p.quantity
        }
      })
      
      const laborItems = selLabors.map(l => {
        const editedPrice = uploadItemPrices[l.id]
        const vendorPOs = allPOs.filter((po: any) => po.vendorId === finalVendorId)
        const vendorValidPOs = validPOs.filter((po: any) => po.vendorId === finalVendorId)

        const poLabor = vendorValidPOs.flatMap((po: any) => po.items).find((pi: any) => pi.description?.includes(l.description)) ||
                        vendorPOs.flatMap((po: any) => po.items).find((pi: any) => pi.description?.includes(l.description)) ||
                        validPOs.flatMap((po: any) => po.items).find((pi: any) => pi.description?.includes(l.description)) ||
                        allPOs.flatMap((po: any) => po.items).find((pi: any) => pi.description?.includes(l.description))

        const unitPrice = editedPrice !== undefined ? editedPrice : (poLabor ? poLabor.unitPrice : l.priceApprove)
        return {
          claimPartId: null,
          claimLaborId: l.id,
          partNo: '',
          description: `[ค่าแรง] ${l.description}`,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: unitPrice
        }
      })

      const computedVat = invoiceIncludeVat ? (invoiceCustomVat !== '' ? Number(invoiceCustomVat) : Math.round(sub * (invoiceVatPct / 100) * 100) / 100) : 0
      const computedWht = invoiceIncludeWht ? (invoiceCustomWht !== '' ? Number(invoiceCustomWht) : Math.round(sub * (invoiceWhtPct / 100) * 100) / 100) : 0
      const allItems = [...partItems, ...laborItems]

      const res = await fetch(`/api/claims/${claimId}/supplier-invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: finalVendorId,
          invoiceNo,
          items: allItems,
          pdfUrl: pdfUrlToSave,
          vatAmount: computedVat,
          whtAmount: computedWht,
          whtPct: invoiceIncludeWht ? invoiceWhtPct : 0,
          laborIds: selLabors.map(l => l.id)
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server returned status ${res.status}`)
      }
      
      const newInv = await res.json()
      newInv.attachmentUrl = uploadedFile?.url || null
      newInv.attachmentName = uploadedFile?.name || null
      setSupplierInvoices(prev => {
        const exists = prev.some(inv => inv.id === newInv.id)
        if (exists) {
          return prev.map(inv => inv.id === newInv.id ? newInv : inv)
        }
        return [...prev, newInv]
      })
      if (selParts.length > 0) {
        setParts(prev => prev.map(p => uploadMapSelections[p.id] ? { ...p, paymentStatus: 'INVOICED' as const } : p))
      }
      if (selLabors.length > 0) {
        setLabors(prev => prev.map(l => uploadMapSelections[l.id] ? { ...l, paymentStatus: 'INVOICED' as const } : l))
      }

      showToast('บันทึก Invoice เรียบร้อย')
      onClose()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setIsUploadingFile(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <Card className="w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            อัพโหลด Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
            <input
              type="file"
              className="hidden"
              accept="application/pdf, image/png, image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const url = URL.createObjectURL(file)
                setUploadedFile({ name: file.name, url, type: file.type, file })
              }}
            />
            {uploadedFile ? (
              <div className="flex items-center gap-3 justify-center">
                {uploadedFile.type.startsWith('image/') ? (
                  <img src={uploadedFile.url} alt="preview" className="w-16 h-16 object-cover rounded border" />
                ) : (
                  <div className="w-16 h-16 bg-red-50 rounded border flex items-center justify-center">
                    <FileText className="w-8 h-8 text-red-500" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-[#0f172a]">{uploadedFile.name}</p>
                  <p className="text-xs text-green-600">แนบไฟล์เรียบร้อย • คลิกเพื่อเปลี่ยนไฟล์</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]" />
                <p className="text-sm text-[#475569]">คลิกเพื่อแนบไฟล์ PDF/Image</p>
              </>
            )}
          </label>
          <div>
            <label className="text-sm font-medium text-[#475569]">เลขที่ใบวางบิล (Invoice No.)</label>
            <Input
              className="mt-1"
              placeholder="ใส่เลขที่จริงจากผู้จัดจำหน่าย หรือเว้นว่างระบบสร้างให้อัตโนมัติ"
              value={customInvoiceNo}
              onChange={e => setCustomInvoiceNo(e.target.value)}
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Invoice นี้ cover รายการไหนบ้าง?</h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8faff]">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={
                        (() => {
                          const activeParts = partsWithPO
                          const activeLabors = laborsWithPO
                          const totalCount = activeParts.length + activeLabors.length
                          if (totalCount === 0) return false
                          const allChecked = [...activeParts, ...activeLabors].every(item => !!uploadMapSelections[item.id])
                          return allChecked
                        })()
                      }
                      ref={el => {
                        if (el) {
                          const activeParts = partsWithPO
                          const activeLabors = laborsWithPO
                          const checkedCount = [...activeParts, ...activeLabors].filter(item => !!uploadMapSelections[item.id]).length
                          const totalCount = activeParts.length + activeLabors.length
                          el.indeterminate = checkedCount > 0 && checkedCount < totalCount
                        }
                      }}
                      onChange={e => {
                        const activeParts = partsWithPO
                        const activeLabors = laborsWithPO
                        const newSelections = { ...uploadMapSelections }
                        const isChecked = e.target.checked
                        activeParts.forEach(p => { newSelections[p.id] = isChecked })
                        activeLabors.forEach(l => { newSelections[l.id] = isChecked })
                        setUploadMapSelections(newSelections)
                      }}
                      className="w-4 h-4"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center text-xs">ลำดับ</TableHead>
                  <TableHead className="text-xs">ประเภท</TableHead>
                  <TableHead className="text-xs">รายการ</TableHead>
                  <TableHead className="text-xs text-right w-36">ราคา (แก้ไขได้)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partsWithPO.map((p, i) => (
                  <TableRow key={p.id} className={uploadMapSelections[p.id] ? 'bg-blue-50/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={!!uploadMapSelections[p.id]}
                        onChange={e => setUploadMapSelections(prev => ({ ...prev, [p.id]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500 font-medium">
                      {i + 1}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">อะไหล่</Badge></TableCell>
                    <TableCell className="font-medium">
                      {p.partName} <span className="text-xs text-[#94a3b8] font-mono">{p.partNo}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="h-8 text-sm text-right w-32 ml-auto"
                        value={uploadItemPrices[p.id] ?? getPartAmt(p, purchaseOrders)}
                        onChange={e => setUploadItemPrices(prev => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {laborsWithPO.map((l, i) => (
                  <TableRow key={l.id} className={uploadMapSelections[l.id] ? 'bg-blue-50/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={!!uploadMapSelections[l.id]}
                        onChange={e => setUploadMapSelections(prev => ({ ...prev, [l.id]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500 font-medium">
                      {partsWithPO.length + i + 1}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">ค่าแรง</Badge></TableCell>
                    <TableCell className="font-medium">{l.description}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="h-8 text-sm text-right w-32 ml-auto"
                        value={uploadItemPrices[l.id] ?? getLaborAmt(l, purchaseOrders)}
                        onChange={e => setUploadItemPrices(prev => ({ ...prev, [l.id]: Number(e.target.value) || 0 }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col items-end gap-2 mt-4 p-4 bg-gray-50 rounded-lg w-full max-w-sm ml-auto">
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between border-b pb-2 mb-2 w-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoiceIncludeVat}
                      onChange={e => setInvoiceIncludeVat(e.target.checked)}
                      className="w-4 h-4 rounded animate-fade-in"
                    />
                    <span className="text-sm text-gray-600 font-medium">คิด VAT</span>
                  </label>
                  {invoiceIncludeVat && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="h-8 w-16 text-sm text-right"
                        value={invoiceVatPct}
                        onChange={e => {
                          setInvoiceVatPct(Number(e.target.value) || 0)
                          setInvoiceCustomVat('') // Reset custom VAT when percentage changes
                        }}
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-b pb-2 mb-2 w-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoiceIncludeWht}
                      onChange={e => setInvoiceIncludeWht(e.target.checked)}
                      className="w-4 h-4 rounded animate-fade-in"
                    />
                    <span className="text-sm text-gray-600 font-medium">หัก ณ ที่จ่าย (WHT)</span>
                  </label>
                  {invoiceIncludeWht && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="h-8 w-16 text-sm text-right"
                        value={invoiceWhtPct}
                        onChange={e => {
                          setInvoiceWhtPct(Number(e.target.value) || 0)
                          setInvoiceCustomWht('') // Reset custom WHT when percentage changes
                        }}
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between w-full text-sm text-gray-500">
                  <span>มูลค่าก่อนภาษี:</span><span>฿{formatCurrency(sub)}</span>
                </div>
                {invoiceIncludeVat && (
                  <div className="flex items-center justify-between w-full text-sm text-gray-500">
                    <span>VAT {invoiceVatPct}%:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 w-28 text-sm text-right font-medium"
                        value={invoiceCustomVat}
                        onChange={e => setInvoiceCustomVat(e.target.value)}
                        placeholder={String(calculatedVat)}
                      />
                    </div>
                  </div>
                )}
                {invoiceIncludeWht && (
                  <div className="flex items-center justify-between w-full text-sm text-gray-500">
                    <span>หัก ณ ที่จ่าย {invoiceWhtPct}%:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">฿</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 w-28 text-sm text-right font-medium"
                        value={invoiceCustomWht}
                        onChange={e => setInvoiceCustomWht(e.target.value)}
                        placeholder={String(calculatedWht)}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between w-full text-base font-bold text-blue-700 pt-2 border-t mt-1">
                  <span>รวมทั้งสิ้น:</span><span>฿{formatCurrency(sub + vat - wht)}</span>
                </div>
                {billingPct < 100 && (
                  <div className="w-full mt-2 pt-2 border-t border-dashed">
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Vendor วางบิล {billingPct}%:</span><span>฿{formatCurrency(expectedBilling)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">({vendorData?.name})</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button className="bg-[#1d4ed8]" disabled={isUploadingFile} onClick={handleUploadSubmit}>
              {isUploadingFile ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 mr-1.5 border-2 border-t-white border-white/30 rounded-full animate-spin"></span>
                  อัพโหลด...
                </span>
              ) : (
                <span className="flex items-center"><Save className="w-4 h-4 mr-1.5" />ยืนยัน</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

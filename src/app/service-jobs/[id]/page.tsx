"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { 
  ArrowLeft, Wrench, Calendar, User, FileText, Cloud, 
  Printer, Trash2, CheckCircle2, AlertTriangle, Play, Check 
} from 'lucide-react'
import { 
  getServiceStatusColor, getServiceStatusLabel, 
  formatCurrency, formatDateShort 
} from '@/lib/utils'

export default function ServiceJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isPrintView, setIsPrintView] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
    } catch (err: any) {
      console.error(err)
      showToast('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/service-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const updated = await res.json()
      setOrder(updated)
      showToast('✅ อัปเดตสถานะสำเร็จ')
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/service-orders/${id}/invoice`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice')
      setOrder(data)
      showToast('✅ ออกใบวางบิล/ใบเสร็จสำเร็จ')
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleExportPEAK = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/peak/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ar', ids: [order.id] })
      })
      if (!res.ok) throw new Error('Failed to export AR')
      const data = await res.json()

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "AR_Invoice")
      XLSX.writeFile(wb, `AR_Service_${order.invoiceNo}.xlsx`)

      showToast('✅ Export Excel สำหรับ PEAK สำเร็จ')
      fetchOrder() // Reload to show synced status
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบใบสั่งงานบริการนี้ใช่หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้')) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/service-orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete order')
      router.push('/service-jobs')
    } catch (err: any) {
      showToast('❌ ' + err.message)
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดรายละเอียดใบสั่งงาน...</div>
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลใบสั่งงานบริการ</div>
  }

  const statusColor = getServiceStatusColor(order.status)

  // RENDER PRINT VIEW (A4 INVOICE SHEET)
  if (isPrintView) {
    return (
      <div className="bg-white min-h-screen p-8 text-black print:p-0">
        {/* Print Buttons Bar (hidden when printing) */}
        <div className="flex gap-2 mb-6 border-b pb-4 print:hidden">
          <Button variant="outline" size="sm" onClick={() => setIsPrintView(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับหน้ารายละเอียด
          </Button>
          <Button size="sm" className="bg-[#1d4ed8]" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />
            พิมพ์เอกสาร
          </Button>
        </div>

        {/* A4 Invoice Layout */}
        <div className="max-w-[800px] mx-auto border p-8 print:border-none print:p-0 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">EXPERT BODY &amp; PAINT</h1>
              <p className="text-xs text-gray-500 mt-1">
                บริษัท เอ็กซ์เพิร์ท บอดี้ แอนด์ เพ้นท์ จำกัด<br />
                เลขประจำตัวผู้เสียภาษี: 0105566000000<br />
                โทร: 081-234-5678
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-700">ใบแจ้งหนี้ / ใบเสร็จรับเงิน</h2>
              <p className="text-xs text-gray-500 mt-1">
                เลขที่ใบเสร็จ: <span className="font-mono font-semibold">{order.invoiceNo || order.orderNo}</span><br />
                วันที่เอกสาร: {formatDateShort(order.invoiceDate || order.createdAt)}<br />
                กำหนดชำระ: {order.dueDate ? formatDateShort(order.dueDate) : '-'}
              </p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-gray-700 mb-1">ข้อมูลลูกค้า / ผู้ว่าจ้าง:</h3>
              <p className="text-gray-600 space-y-0.5">
                <strong>{order.customer.name}</strong><br />
                {order.customer.address && <>{order.customer.address}<br /></>}
                {order.customer.taxId && <>เลขผู้เสียภาษี: {order.customer.taxId}<br /></>}
                {order.customer.phone && <>โทร: {order.customer.phone}</>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                จำนวนรถทั้งหมด: {order.vehicles?.length || 0} คัน
              </p>
            </div>
          </div>

          {/* Items Table grouped by vehicle */}
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-200 bg-gray-50/50">
                <th className="py-2 px-3 font-semibold text-gray-700 w-12 text-center">#</th>
                <th className="py-2 px-3 font-semibold text-gray-700">รายการบริการ</th>
                <th className="py-2 px-3 font-semibold text-gray-700 w-20 text-center">จำนวน</th>
                <th className="py-2 px-3 font-semibold text-gray-700 w-32 text-right">ราคาต่อหน่วย</th>
                <th className="py-2 px-3 font-semibold text-gray-700 w-32 text-right">ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {order.vehicles?.map((vehicle: any, vIdx: number) => (
                <optgroup key={vehicle.id} label={`คันที่ ${vIdx + 1}`}>
                  {/* Header Row for Vehicle */}
                  <tr className="bg-gray-50/40 border-b border-gray-200">
                    <td colSpan={5} className="py-2 px-3 font-semibold text-[#1d4ed8] text-xs">
                      คันที่ {vIdx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''} - {vehicle.carBrand} {vehicle.carModel} (VIN: {vehicle.carVin})
                    </td>
                  </tr>
                  {vehicle.items?.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-center text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-2 px-3 text-gray-800 text-xs pl-6">{item.description}</td>
                      <td className="py-2 px-3 text-center text-gray-600 text-xs">{item.quantity}</td>
                      <td className="py-2 px-3 text-right text-gray-600 text-xs">฿{formatCurrency(item.priceUnit)}</td>
                      <td className="py-2 px-3 text-right text-gray-800 font-semibold text-xs">฿{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </optgroup>
              ))}
            </tbody>
          </table>

          {/* Pricing Summary */}
          <div className="flex flex-col items-end space-y-1 text-sm font-medium text-gray-700 pt-4">
            <div className="flex justify-between w-full max-w-[280px]">
              <span>ราคารวม:</span>
              <span>฿{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between w-full max-w-[280px] text-gray-500">
              <span>ภาษีมูลค่าเพิ่ม (7%):</span>
              <span>฿{formatCurrency(order.vatAmount)}</span>
            </div>
            <div className="flex justify-between w-full max-w-[280px] text-base font-bold text-gray-900 border-t pt-1.5 mt-1">
              <span>ยอดเงินรวมสุทธิ:</span>
              <span>฿{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {/* Signature Sections */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
            <div className="space-y-16">
              <p>ผู้รับบริการ / ลูกค้าอนุมัติ...........................................</p>
              <p>วันที่........./........./.........</p>
            </div>
            <div className="space-y-16">
              <p>ผู้ให้บริการ / ผู้รับมอบเงิน...........................................</p>
              <p>วันที่........./........./.........</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STANDARD DETAIL VIEW
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/service-jobs">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0f172a]">{order.orderNo}</h1>
              <Badge className={`${statusColor.bg} ${statusColor.text} px-2.5 py-0.5 border-none shadow-none`}>
                {getServiceStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              สร้างเมื่อ {formatDateShort(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Actions */}
          <Button 
            variant="outline" 
            className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => setIsPrintView(true)}
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร
          </Button>

          {!order.invoiceNo && (
            <Button 
              className="bg-[#1d4ed8] hover:bg-[#1e40af] gap-1.5 text-white"
              onClick={handleGenerateInvoice}
              disabled={updating}
            >
              <FileText className="w-4 h-4" />
              ออกใบวางบิล
            </Button>
          )}

          {order.invoiceNo && !order.isSynced && (
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-1.5 text-white"
              onClick={handleExportPEAK}
              disabled={syncing}
            >
              <Cloud className="w-4 h-4" />
              {syncing ? 'กำลังส่ง...' : 'Export Excel สำหรับ PEAK'}
            </Button>
          )}

          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5"
            onClick={handleDelete}
            disabled={updating}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Center Details (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* List of Vehicles Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0f172a]">รายการรถยนต์ ({order.vehicles?.length || 0} คัน)</h2>
            
            {order.vehicles?.map((vehicle: any, idx: number) => (
              <Card key={vehicle.id} className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="font-bold text-[#0f172a] text-sm">
                      คันที่ {idx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''} - {vehicle.carBrand} {vehicle.carModel}
                    </span>
                    <span className="font-mono text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">
                      VIN: {vehicle.carVin}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>รายการสั่งงาน</TableHead>
                        <TableHead className="w-20 text-center">จำนวน</TableHead>
                        <TableHead className="w-32 text-right">ราคาต่อหน่วย</TableHead>
                        <TableHead className="w-32 text-right">ราคารวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicle.items?.map((item: any, iIdx: number) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center text-gray-400 text-xs">{iIdx + 1}</TableCell>
                          <TableCell className="font-semibold text-gray-700 text-sm">{item.description}</TableCell>
                          <TableCell className="text-center text-gray-600 text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-gray-600 text-sm">฿{formatCurrency(item.priceUnit)}</TableCell>
                          <TableCell className="text-right font-bold text-gray-800 text-sm">฿{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Details (1 Column) */}
        <div className="space-y-6">
          {/* Status & Billing Status */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-bold text-[#0f172a]">การจัดการสถานะ &amp; บิล</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">เปลี่ยนสถานะงาน</span>
                <Select
                  value={order.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="w-full bg-white border-gray-200 mt-1"
                >
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังทำสี</option>
                  <option value="COMPLETED">เสร็จสิ้น/ออกบิล</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </Select>
              </div>

              {/* Pricing Summary */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm font-medium text-gray-700">
                <div className="flex justify-between w-full">
                  <span className="text-gray-400">ราคารวมสินค้า:</span>
                  <span>฿{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full text-gray-500 text-xs">
                  <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <span>฿{formatCurrency(order.vatAmount)}</span>
                </div>
                <div className="flex justify-between w-full text-base font-bold text-[#0f172a] border-t border-gray-100 pt-2 mt-1">
                  <span>ยอดสุทธิทั้งหมด:</span>
                  <span>฿{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">เอกสารใบวางบิล</span>
                {order.invoiceNo ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 mt-1 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">เลขใบวางบิล:</span>
                      <span className="font-bold text-[#0f172a]">{order.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันที่ออกบิล:</span>
                      <span className="text-gray-600">{formatDateShort(order.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันกำหนดชำระ:</span>
                      <span className="text-gray-600">{formatDateShort(order.dueDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 mt-1 text-xs text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ยังไม่ได้ออกใบวางบิลเพื่อเรียกชำระเงิน
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase block">การซิงค์ข้อมูลบัญชี PEAK</span>
                {order.isSynced ? (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <strong>ซิงค์เรียบร้อยแล้ว</strong>
                      <span className="block text-[10px] text-green-600/75 mt-0.5">
                        เมื่อ {formatDateShort(order.syncedAt)}
                      </span>
                    </div>
                  </div>
                ) : order.invoiceNo ? (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    พร้อมสำหรับส่งออกเพื่ออัปโหลดเข้าระบบ PEAK
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ต้องออกใบวางบิลก่อน จึงจะซิงค์ข้อมูลได้
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                ข้อมูลผู้ว่าจ้าง / ลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm space-y-3.5">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">ชื่อลูกค้า/บริษัท</span>
                <p className="font-semibold text-gray-900 mt-0.5">{order.customer.name}</p>
              </div>

              {order.customer.taxId && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">เลขประจำตัวผู้เสียภาษี</span>
                  <p className="text-gray-800 mt-0.5">{order.customer.taxId}</p>
                </div>
              )}

              {order.customer.phone && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">เบอร์โทรศัพท์</span>
                  <p className="text-gray-800 mt-0.5">{order.customer.phone}</p>
                </div>
              )}

              {order.customer.address && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">ที่อยู่</span>
                  <p className="text-gray-700 mt-0.5 text-xs leading-relaxed">{order.customer.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

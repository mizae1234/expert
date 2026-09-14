"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Wrench,
  Download,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  Car,
  FileSpreadsheet,
  Cloud,
  ChevronDown,
  RefreshCw,
  Eye,
  Percent,
  Receipt,
  RotateCcw,
  BarChart3,
  Layers,
} from 'lucide-react'
import { formatCurrency, getServiceStatusColor, getServiceStatusLabel, formatDateShort } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton'

export default function ServiceJobsReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  // Master data
  const [customers, setCustomers] = useState<any[]>([])

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [dateField, setDateField] = useState('operationDate')
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('')
  const [isSynced, setIsSynced] = useState('')
  const [search, setSearch] = useState('')

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'vehicles'>('orders')

  // Load Customers
  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data)
        }
      })
      .catch(console.error)
  }, [])

  // Load Report Data
  const fetchReport = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (dateField) params.set('dateField', dateField)
    if (customerId) params.set('customerId', customerId)
    if (status) params.set('status', status)
    if (isSynced) params.set('isSynced', isSynced)
    if (search) params.set('search', search)

    fetch(`/api/reports/service-jobs?${params}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch service jobs report:', err)
        setLoading(false)
      })
  }, [dateFrom, dateTo, dateField, customerId, status, isSynced, search])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleResetFilters = () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    setDateFrom(d.toISOString().split('T')[0])
    setDateTo(new Date().toISOString().split('T')[0])
    setDateField('operationDate')
    setCustomerId('')
    setStatus('')
    setIsSynced('')
    setSearch('')
  }

  // Flattened vehicle items for Tab 2
  const vehicleRows = useMemo(() => {
    if (!data?.orders) return []
    const rows: any[] = []
    data.orders.forEach((order: any) => {
      if (order.vehicles && order.vehicles.length > 0) {
        order.vehicles.forEach((vehicle: any) => {
          const itemsTotal = vehicle.items?.reduce((sum: number, item: any) => sum + (item.totalPrice || item.quantity * item.priceUnit), 0) || 0
          rows.push({
            orderId: order.id,
            orderNo: order.orderNo,
            operationDate: order.operationDate,
            createdAt: order.createdAt,
            customerName: order.customer?.name || '-',
            invoiceNo: order.invoiceNo || '-',
            orderStatus: order.status,
            vehicleId: vehicle.id,
            carPlate: vehicle.carPlate,
            carProvince: vehicle.carProvince,
            carBrand: vehicle.carBrand,
            carModel: vehicle.carModel,
            carVin: vehicle.carVin,
            vehicleStatus: vehicle.status,
            completedAt: vehicle.completedAt,
            items: vehicle.items || [],
            vehicleTotal: itemsTotal,
          })
        })
      }
    })
    return rows
  }, [data])

  // ─── Excel Export Functions ───
  const getOrdersSheetData = () => {
    if (!data?.orders) return []
    return data.orders.map((order: any, idx: number) => {
      const plates = order.vehicles?.map((v: any) => v.carPlate).filter(Boolean).join(', ') || '-'
      const vins = order.vehicles?.map((v: any) => v.carVin).filter(Boolean).join(', ') || '-'
      return {
        'ลำดับ': idx + 1,
        'เลขที่สั่งงาน': order.orderNo,
        'วันที่สร้าง': formatDate(order.createdAt),
        'วันที่ปฏิบัติงาน': order.operationDate ? formatDate(order.operationDate) : '-',
        'ชื่อลูกค้า': order.customer?.name || '-',
        'เลขประจำตัวผู้เสียภาษี': order.customer?.taxId || '-',
        'จำนวนรถ (คัน)': order.vehicles?.length || 0,
        'เลขตัวถัง (VIN ทั้งหมด)': vins,
        'ทะเบียนรถทั้งหมด': plates,
        'ยอดก่อนภาษี (บาท)': order.subtotal || 0,
        'ภาษีมูลค่าเพิ่ม 7% (บาท)': order.vatAmount || 0,
        'ยอดรวมสุทธิ (บาท)': order.grandTotal || 0,
        'สถานะงาน': getServiceStatusLabel(order.status),
        'เลขที่ใบกำกับภาษี/ใบวางบิล': order.invoiceNo || '-',
        'วันที่ออกบิล': order.invoiceDate ? formatDate(order.invoiceDate) : '-',
        'วันครบกำหนดชำระ': order.dueDate ? formatDate(order.dueDate) : '-',
        'สถานะ PEAK': order.isSynced ? 'ซิงค์แล้ว' : 'ยังไม่ซิงค์',
      }
    })
  }

  const getVehiclesSheetData = () => {
    if (!data?.orders) return []
    const rows: any[] = []
    let seq = 1
    data.orders.forEach((order: any) => {
      if (order.vehicles && order.vehicles.length > 0) {
        order.vehicles.forEach((v: any) => {
          if (v.items && v.items.length > 0) {
            v.items.forEach((item: any) => {
              rows.push({
                'ลำดับ': seq++,
                'เลขตัวถัง (VIN)': v.carVin || '-',
                'ทะเบียนรถ': v.carPlate || '-',
                'จังหวัด': v.carProvince || '-',
                'ยี่ห้อ': v.carBrand || '-',
                'รุ่น': v.carModel || '-',
                'เลขที่สั่งงาน': order.orderNo,
                'วันที่ปฏิบัติงาน': order.operationDate ? formatDate(order.operationDate) : formatDate(order.createdAt),
                'ชื่อลูกค้า': order.customer?.name || '-',
                'รหัสบริการ': item.serviceCode || '-',
                'รายการบริการ': item.description || '-',
                'จำนวน': item.quantity || 1,
                'ราคาต่อหน่วย (บาท)': item.priceUnit || 0,
                'ราคารวม (บาท)': item.totalPrice || (item.quantity * item.priceUnit),
                'สถานะรถ': getServiceStatusLabel(v.status),
                'วันที่เสร็จ': v.completedAt ? formatDate(v.completedAt) : '-',
                'เลขที่ใบวางบิล': order.invoiceNo || '-',
              })
            })
          } else {
            // Vehicle without items
            rows.push({
              'ลำดับ': seq++,
              'เลขตัวถัง (VIN)': v.carVin || '-',
              'ทะเบียนรถ': v.carPlate || '-',
              'จังหวัด': v.carProvince || '-',
              'ยี่ห้อ': v.carBrand || '-',
              'รุ่น': v.carModel || '-',
              'เลขที่สั่งงาน': order.orderNo,
              'วันที่ปฏิบัติงาน': order.operationDate ? formatDate(order.operationDate) : formatDate(order.createdAt),
              'ชื่อลูกค้า': order.customer?.name || '-',
              'รหัสบริการ': '-',
              'รายการบริการ': '-',
              'จำนวน': 0,
              'ราคาต่อหน่วย (บาท)': 0,
              'ราคารวม (บาท)': 0,
              'สถานะรถ': getServiceStatusLabel(v.status),
              'วันที่เสร็จ': v.completedAt ? formatDate(v.completedAt) : '-',
              'เลขที่ใบวางบิล': order.invoiceNo || '-',
            })
          }
        })
      }
    })
    return rows
  }

  const exportAllToExcel = async () => {
    try {
      setExporting(true)
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Sheet 1: Vehicles & Items Detail (VIN & License Plate - Open First!)
      const vehiclesData = getVehiclesSheetData()
      const wsVehicles = XLSX.utils.json_to_sheet(vehiclesData)
      XLSX.utils.book_append_sheet(wb, wsVehicles, 'รายละเอียดรถ (VIN & ทะเบียน)')

      // Sheet 2: Orders Summary
      const ordersData = getOrdersSheetData()
      const wsOrders = XLSX.utils.json_to_sheet(ordersData)
      XLSX.utils.book_append_sheet(wb, wsOrders, 'สรุปใบสั่งงาน')

      const filename = `JobService_Report_Full_${dateFrom}_${dateTo}.xlsx`
      XLSX.writeFile(wb, filename)
      setExportMenuOpen(false)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const exportOrdersSummaryExcel = async () => {
    try {
      setExporting(true)
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ordersData = getOrdersSheetData()
      const ws = XLSX.utils.json_to_sheet(ordersData)
      XLSX.utils.book_append_sheet(wb, ws, 'สรุปใบสั่งงาน')
      XLSX.writeFile(wb, `JobService_Orders_${dateFrom}_${dateTo}.xlsx`)
      setExportMenuOpen(false)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const exportVehiclesDetailExcel = async () => {
    try {
      setExporting(true)
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const vehiclesData = getVehiclesSheetData()
      const ws = XLSX.utils.json_to_sheet(vehiclesData)
      XLSX.utils.book_append_sheet(wb, ws, 'รายละเอียดรถ (VIN & ทะเบียน)')
      XLSX.writeFile(wb, `JobService_Detail_VIN_Plate_${dateFrom}_${dateTo}.xlsx`)
      setExportMenuOpen(false)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary || {
    totalOrders: 0,
    totalVehicles: 0,
    completedVehicles: 0,
    inProgressVehicles: 0,
    pendingVehicles: 0,
    cancelledVehicles: 0,
    totalSubtotal: 0,
    totalVat: 0,
    totalGrandTotal: 0,
    invoicedTotal: 0,
    pendingInvoiceTotal: 0,
    syncedCount: 0,
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* ─── Top Header & Navigation Switcher ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
              รายงานระบบ (Reports)
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">งานบริการทั่วไป (Service Jobs)</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2.5 mt-1">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            รายงานงานบริการ (Service Jobs Report)
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            สรุปยอดบริการ รายได้ จำนวนรถ และรายละเอียดบริการพร้อมส่งออก Excel
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Submenu Link to Claims & PnL Report */}
          <Link href="/reports">
            <Button variant="outline" size="sm" className="gap-2 text-xs border-gray-300 hover:bg-gray-100">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              รายงานเคลม & บัญชี
            </Button>
          </Link>

          {/* Direct 1-Click Export: Detail with VIN & Plate */}
          <Button
            onClick={exportVehiclesDetailExcel}
            disabled={exporting || loading || !data?.orders?.length}
            className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
          >
            <Car className="w-4 h-4" />
            Export รายละเอียด (VIN &amp; ทะเบียน)
          </Button>

          {/* Export Dropdown for Full 2-Sheets or Summary */}
          <div className="relative">
            <Button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={exporting || loading || !data?.orders?.length}
              variant="outline"
              className="gap-1.5 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              {exporting ? 'กำลังส่งออก...' : 'ตัวเลือก Export'}
              <ChevronDown className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
            </Button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1.5 animate-fade-in text-xs">
                <button
                  onClick={exportAllToExcel}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 font-medium text-gray-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Export ทั้งหมด (2 Sheets)</p>
                    <p className="text-[10px] text-gray-400">สรุปใบสั่งงาน + รายคันและบริการ</p>
                  </div>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={exportOrdersSummaryExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>เฉพาะสรุปใบสั่งงาน (Orders)</span>
                </button>
                <button
                  onClick={exportVehiclesDetailExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                >
                  <Car className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span>เฉพาะรายคันและรายการ (Vehicles)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Global Filter Card ─── */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            {/* Date Field Type */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                กรองวันที่ตาม
              </label>
              <Select
                value={dateField}
                onChange={e => setDateField(e.target.value)}
                className="w-full text-xs h-9 bg-gray-50 border-gray-200"
              >
                <option value="operationDate">วันที่ปฏิบัติงาน</option>
                <option value="createdAt">วันที่สร้างใบสั่งงาน</option>
                <option value="invoiceDate">วันที่ออกใบกำกับ/บิล</option>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                ตั้งแต่วันที่
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-xs h-9 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                ถึงวันที่
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-xs h-9 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                ลูกค้า
              </label>
              <Select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full text-xs h-9 bg-gray-50 border-gray-200"
              >
                <option value="">ทุกลูกค้า</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                สถานะงาน
              </label>
              <Select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full text-xs h-9 bg-gray-50 border-gray-200"
              >
                <option value="">ทุกสถานะ</option>
                <option value="PENDING">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังทำสี</option>
                <option value="COMPLETED">เสร็จสิ้น/ออกบิล</option>
                <option value="CANCELLED">ยกเลิก</option>
              </Select>
            </div>

            {/* Sync Status & Reset */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  PEAK Sync
                </label>
                <Select
                  value={isSynced}
                  onChange={e => setIsSynced(e.target.value)}
                  className="w-full text-xs h-9 bg-gray-50 border-gray-200"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="true">ซิงค์แล้ว</option>
                  <option value="false">ยังไม่ซิงค์</option>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-transparent mb-1">
                  รีเซ็ต
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  title="รีเซ็ตตัวกรอง"
                  className="h-9 px-2.5 border-gray-200 text-gray-500 hover:text-gray-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search bar row */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาเลขที่สั่งงาน, ทะเบียนรถ, VIN, ยี่ห้อ, หรือชื่อลูกค้า..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-white border-gray-200"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
              <span>พบข้อมูล <b>{data?.orders?.length || 0}</b> ใบสั่งงาน (<b>{vehicleRows.length}</b> คัน)</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchReport}
                className="h-7 px-2 text-xs gap-1.5 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={loading ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ใบสั่งงาน</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : `${summary.totalOrders} งาน`}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              ซิงค์ PEAK แล้ว {summary.syncedCount} งาน
            </p>
          </CardContent>
        </Card>

        {/* Total Vehicles */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">จำนวนรถทั้งหมด</span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : `${summary.totalVehicles} คัน`}
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">
              เสร็จแล้ว {summary.completedVehicles} คัน ({summary.totalVehicles > 0 ? Math.round((summary.completedVehicles / summary.totalVehicles) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        {/* Subtotal */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ยอดก่อนภาษี</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mt-2">
              {loading ? <Skeleton className="h-7 w-20" /> : `฿${formatCurrency(summary.totalSubtotal)}`}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              ไม่รวมงานที่ยกเลิก
            </p>
          </CardContent>
        </Card>

        {/* VAT 7% */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ภาษีมูลค่าเพิ่ม 7%</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mt-2">
              {loading ? <Skeleton className="h-7 w-20" /> : `฿${formatCurrency(summary.totalVat)}`}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              คำนวณจากยอดก่อน VAT
            </p>
          </CardContent>
        </Card>

        {/* Grand Total */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">ยอดรวมสุทธิ</span>
              <div className="p-1.5 bg-blue-600 text-white rounded-md">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-blue-700 mt-2">
              {loading ? <Skeleton className="h-7 w-24" /> : `฿${formatCurrency(summary.totalGrandTotal)}`}
            </h3>
            <p className="text-[10px] text-blue-600/80 font-medium mt-1">
              รายได้สุทธิทั้งสิ้น
            </p>
          </CardContent>
        </Card>

        {/* Invoiced Status */}
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">สถานะการออกบิล</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-base font-bold text-emerald-700 mt-2">
              {loading ? <Skeleton className="h-6 w-20" /> : `฿${formatCurrency(summary.invoicedTotal)}`}
            </h3>
            <p className="text-[10px] text-amber-600 mt-0.5">
              รอออกบิล: ฿{formatCurrency(summary.pendingInvoiceTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Breakdown & Visual Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer Share */}
        <Card className="border-gray-200 shadow-sm lg:col-span-1">
          <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              ยอดตามลูกค้า (Top Customers)
            </CardTitle>
            <span className="text-[11px] text-gray-400">
              {data?.byCustomer?.length || 0} ราย
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !data?.byCustomer || data.byCustomer.length === 0 ? (
              <p className="text-xs text-center py-6 text-gray-400">ไม่มีข้อมูลลูกค้า</p>
            ) : (
              data.byCustomer.slice(0, 5).map((c: any) => {
                const maxRevenue = Math.max(...data.byCustomer.map((x: any) => x.grandTotal), 1)
                const pct = Math.min(100, Math.round((c.grandTotal / maxRevenue) * 100))
                return (
                  <div key={c.customerId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800 truncate max-w-[160px]">{c.customerName}</span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">฿{formatCurrency(c.grandTotal)}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">({c.vehicleCount} คัน)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-gray-200 shadow-sm lg:col-span-1">
          <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              สถานะใบสั่งงาน (Status Breakdown)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !data?.byStatus ? (
              <p className="text-xs text-center py-6 text-gray-400">ไม่มีข้อมูลสถานะ</p>
            ) : (
              data.byStatus.map((s: any) => {
                const color = getServiceStatusColor(s.status)
                const label = getServiceStatusLabel(s.status)
                const total = summary.totalOrders || 1
                const pct = Math.round((s.count / total) * 100)
                return (
                  <div key={s.status} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Badge className={`${color.bg} ${color.text} text-[10px] font-semibold border-none shadow-none`}>
                        {label}
                      </Badge>
                      <span className="text-xs text-gray-500">({pct}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-800">{s.count} งาน</span>
                      <p className="text-[10px] text-gray-400">฿{formatCurrency(s.grandTotal)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="border-gray-200 shadow-sm lg:col-span-1">
          <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              แนวโน้มรายเดือน (Monthly Trend)
            </CardTitle>
            <span className="text-[11px] text-gray-400">พ.ศ.</span>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-end gap-2 h-36">
                <Skeleton className="h-16 w-8" />
                <Skeleton className="h-24 w-8" />
                <Skeleton className="h-20 w-8" />
                <Skeleton className="h-32 w-8" />
              </div>
            ) : !data?.byMonth || data.byMonth.length === 0 ? (
              <p className="text-xs text-center py-10 text-gray-400">ไม่มีข้อมูลแนวโน้ม</p>
            ) : (
              <div>
                <div className="flex items-end justify-between gap-1.5 h-36 pt-4">
                  {data.byMonth.map((m: any) => {
                    const maxVal = Math.max(...data.byMonth.map((x: any) => x.grandTotal), 1)
                    const barHeight = Math.max(8, Math.round((m.grandTotal / maxVal) * 90))
                    return (
                      <div key={m.yearMonth} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ฿{Math.round(m.grandTotal / 1000)}k
                        </span>
                        <div
                          className="w-full max-w-[28px] bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${barHeight}px` }}
                          title={`${m.month}: ฿${formatCurrency(m.grandTotal)} (${m.orderCount} งาน, ${m.vehicleCount} คัน)`}
                        />
                        <span className="text-[10px] text-gray-600 font-medium truncate w-full text-center">
                          {m.month.split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
                  <span>ยอดสุทธิรวมรายเดือน (บาท)</span>
                  <span>ความสูงกราฟคำนวณตามสัดส่วน</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Detailed Table Section with Tabs ─── */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 px-4 pt-3 pb-2 gap-3 bg-gray-50/70">
            <TabsList className="bg-gray-200/80 p-0.5">
              <TabsTrigger value="orders" className="text-xs gap-2 py-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                สรุปตามใบสั่งงาน ({data?.orders?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="text-xs gap-2 py-1.5 font-medium">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                แจกแจงรายคัน (VIN &amp; ทะเบียน) ({vehicleRows.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={activeTab === 'orders' ? exportOrdersSummaryExcel : exportVehiclesDetailExcel}
                className="h-8 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export ตารางนี้ ({activeTab === 'orders' ? 'สรุปงาน' : 'รายคัน VIN & ทะเบียน'})
              </Button>
            </div>
          </div>

          {/* ─── TAB 1: By Orders ─── */}
          <TabsContent value="orders" className="m-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10 text-center text-[11px] font-semibold text-gray-500 py-2.5">#</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">เลขที่สั่งงาน</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">วันที่ปฏิบัติงาน</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">ลูกค้า</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">จำนวนรถ</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">ทะเบียนรถ</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold text-gray-500 py-2.5">ยอดก่อน VAT</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold text-gray-500 py-2.5">VAT 7%</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold text-gray-500 py-2.5">ยอดสุทธิ</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">สถานะงาน</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">เลขที่ใบวางบิล</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">PEAK</TableHead>
                    <TableHead className="w-12 text-center text-[11px] font-semibold text-gray-500 py-2.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={8} cols={13} />
                  ) : !data?.orders || data.orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-10 text-gray-400">
                        ไม่พบข้อมูลตามเงื่อนไขที่กำหนด
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.orders.map((order: any, idx: number) => {
                      const statusColor = getServiceStatusColor(order.status)
                      const vehicleCount = order.vehicles?.length || 0
                      const firstVehicle = order.vehicles?.[0]
                      const plateDisplay = firstVehicle
                        ? `${firstVehicle.carPlate}${vehicleCount > 1 ? ` (+ ${vehicleCount - 1} คัน)` : ''}`
                        : '-'

                      return (
                        <TableRow key={order.id} className="hover:bg-gray-50/80 transition-colors">
                          <TableCell className="text-center text-[11px] text-gray-400 py-2 px-2">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-[11px] text-blue-700 py-2">
                            <Link href={`/service-jobs/${order.id}`} className="hover:underline">
                              {order.orderNo}
                            </Link>
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-600 py-2">
                            {order.operationDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-500" />
                                <span className="font-medium text-gray-900">{formatDateShort(order.operationDate)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] font-medium text-gray-800 py-2">
                            {order.customer?.name || '-'}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge className="bg-gray-100 text-gray-700 text-[10px] font-semibold border-none">
                              {vehicleCount} คัน
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-700 font-medium py-2">
                            {plateDisplay}
                          </TableCell>
                          <TableCell className="text-right text-[11px] text-gray-600 font-mono py-2">
                            ฿{formatCurrency(order.subtotal || 0)}
                          </TableCell>
                          <TableCell className="text-right text-[11px] text-gray-600 font-mono py-2">
                            ฿{formatCurrency(order.vatAmount || 0)}
                          </TableCell>
                          <TableCell className="text-right text-[11px] font-bold text-gray-900 font-mono py-2">
                            ฿{formatCurrency(order.grandTotal || 0)}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge className={`${statusColor.bg} ${statusColor.text} text-[10px] font-semibold border-none shadow-none`}>
                              {getServiceStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-[11px] font-mono text-gray-700 font-semibold py-2">
                            {order.invoiceNo || <span className="text-gray-300 font-normal">-</span>}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <div className="flex justify-center">
                              <Cloud className={`w-4 h-4 ${order.isSynced ? 'text-emerald-500 fill-emerald-500/10' : 'text-gray-300'}`} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-2 px-2">
                            <Link href={`/service-jobs/${order.id}`}>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Table Footer Summary */}
            {data?.orders && data.orders.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-gray-600">
                <span>รวมทั้งหมด: <b>{data.orders.length}</b> ใบสั่งงาน ({summary.totalVehicles} คัน)</span>
                <div className="flex items-center gap-6 font-mono">
                  <span>ยอดก่อน VAT: <b className="text-gray-900">฿{formatCurrency(summary.totalSubtotal)}</b></span>
                  <span>VAT 7%: <b className="text-gray-900">฿{formatCurrency(summary.totalVat)}</b></span>
                  <span>ยอดสุทธิรวม: <b className="text-blue-700 text-sm">฿{formatCurrency(summary.totalGrandTotal)}</b></span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── TAB 2: By Vehicles & Items ─── */}
          <TabsContent value="vehicles" className="m-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-10 text-center text-[11px] font-semibold text-gray-500 py-2.5">#</TableHead>
                    <TableHead className="text-[11px] font-bold text-blue-700 py-2.5">เลขตัวถัง (VIN)</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-900 py-2.5">ทะเบียนรถ</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">ยี่ห้อ / รุ่น</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">เลขที่สั่งงาน</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">วันที่ปฏิบัติงาน</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">ลูกค้า</TableHead>
                    <TableHead className="text-[11px] font-semibold text-gray-500 py-2.5">รายการบริการ (ชิ้นงาน)</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold text-gray-500 py-2.5">รวมค่าบริการรถ</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">สถานะรถ</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold text-gray-500 py-2.5">เลขที่ใบวางบิล</TableHead>
                    <TableHead className="w-10 text-center py-2.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={8} cols={12} />
                  ) : vehicleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-10 text-gray-400">
                        ไม่พบข้อมูลรถตามเงื่อนไขที่กำหนด
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicleRows.map((v: any, idx: number) => {
                      const vStatusColor = getServiceStatusColor(v.vehicleStatus)
                      return (
                        <TableRow key={`${v.orderId}-${v.vehicleId}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                          <TableCell className="text-center text-[11px] text-gray-400 py-2 px-2">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-[11px] font-mono font-bold text-blue-700 py-2">
                            <span className="bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200">
                              {v.carVin || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-[11px] font-bold text-gray-900 py-2 whitespace-nowrap">
                            {v.carPlate}
                            {v.carProvince && <span className="text-[10px] text-gray-400 font-normal ml-1">({v.carProvince})</span>}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-700 py-2 whitespace-nowrap">
                            {v.carBrand} {v.carModel}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-[11px] text-gray-700 py-2">
                            <Link href={`/service-jobs/${v.orderId}`} className="hover:underline hover:text-blue-600">
                              {v.orderNo}
                            </Link>
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-600 py-2">
                            {v.operationDate ? formatDateShort(v.operationDate) : formatDateShort(v.createdAt)}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-800 font-medium py-2 max-w-[140px] truncate">
                            {v.customerName}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-700 py-2 max-w-[220px]">
                            {v.items && v.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {v.items.map((item: any) => (
                                  <div key={item.id} className="text-[10px] text-gray-600 flex items-center justify-between gap-1">
                                    <span className="truncate">{item.description}</span>
                                    <span className="text-gray-400 flex-shrink-0">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-[11px] font-bold text-gray-900 font-mono py-2">
                            ฿{formatCurrency(v.vehicleTotal)}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Badge className={`${vStatusColor.bg} ${vStatusColor.text} text-[10px] font-semibold border-none shadow-none`}>
                              {getServiceStatusLabel(v.vehicleStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-[11px] font-mono font-semibold text-gray-700 py-2">
                            {v.invoiceNo}
                          </TableCell>
                          <TableCell className="text-center py-2 px-2">
                            <Link href={`/service-jobs/${v.orderId}`}>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Tab 2 Footer */}
            {vehicleRows.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-600">
                <span>รวมทั้งสิ้น <b>{vehicleRows.length}</b> คัน</span>
                <span className="font-mono">
                  รวมค่าบริการเฉพาะรถ: <b className="text-blue-700">฿{formatCurrency(vehicleRows.reduce((s, r) => s + (r.vehicleTotal || 0), 0))}</b>
                </span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

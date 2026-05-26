"use client"
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { TrendingUp, Clock, Users, BarChart3, Download, Search, Filter, FileSpreadsheet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { Skeleton, SkeletonTableRows } from '@/components/ui/skeleton'

export default function ReportsPage() {
  const [data, setData] = useState<{ pnlByMonth: any[], arAging: any[], apOutstanding: any[], vendorPerf: any[], incomeExpense: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters — date range
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [insuranceId, setInsuranceId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [insurances, setInsurances] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])

  // Search filters per tab
  const [searchAR, setSearchAR] = useState('')
  const [searchAP, setSearchAP] = useState('')
  const [searchVendor, setSearchVendor] = useState('')
  const [searchIE, setSearchIE] = useState('')

  // Load master data
  useEffect(() => {
    Promise.all([
      fetch('/api/insurances').then(res => res.json()),
      fetch('/api/vendors').then(res => res.json()),
    ]).then(([ins, vnd]) => {
      setInsurances(ins)
      setVendors(vnd)
    }).catch(console.error)
  }, [])

  // Load report data
  const fetchReport = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (insuranceId) params.set('insuranceId', insuranceId)
    if (vendorId) params.set('vendorId', vendorId)

    fetch(`/api/reports?${params}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [dateFrom, dateTo, insuranceId, vendorId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // ─── Export Helpers ───
  const exportToExcel = async (sheetData: any[], filename: string) => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, filename)
  }

  const exportPnL = () => {
    if (!data) return
    const rows = data.pnlByMonth.map(p => ({
      'เดือน': p.month,
      'จำนวน Claims': p.claims,
      'AR (รายรับ)': p.ar,
      'AP (รายจ่าย)': p.ap,
      'กำไร': p.profit,
      'Margin (%)': Number(p.margin.toFixed(1)),
    }))
    const suffix = `${dateFrom}_${dateTo}`
    exportToExcel(rows, `PnL_${suffix}.xlsx`)
  }

  const exportARAging = () => {
    if (!data) return
    const filtered = data.arAging.filter(a =>
      !searchAR || a.insurance.toLowerCase().includes(searchAR.toLowerCase())
    )
    const rows = filtered.map(a => ({
      'บ.ประกัน': a.insurance,
      'เคลม': a.claimNo,
      'ทะเบียนรถ': a.carPlate,
      'เลขที่วางบิล': a.invoiceNo,
      'วันที่วางบิล': formatDate(a.invoiceDate),
      'ยอดค้างชำระ': a.amount,
      'Aging (วัน)': a.agingDays,
      'สถานะ': a.agingDays > 45 ? 'เกินกำหนด' : 'ปกติ',
    }))
    exportToExcel(rows, `AR_Aging_${dateFrom}_${dateTo}.xlsx`)
  }

  const exportAPOutstanding = () => {
    if (!data) return
    const filtered = data.apOutstanding.filter(a =>
      !searchAP || a.vendor.toLowerCase().includes(searchAP.toLowerCase())
    )
    const rows = filtered.map(a => ({
      'Vendor': a.vendor,
      'ประเภท': a.type,
      'เลขที่ Invoice': a.invoiceNo,
      'เคลม': a.claimNo,
      'ทะเบียนรถ': a.carPlate,
      'วันที่รับเอกสาร': formatDate(a.invoiceDate),
      'ยอดค้างจ่าย': a.amount,
    }))
    exportToExcel(rows, `AP_Outstanding_${dateFrom}_${dateTo}.xlsx`)
  }

  const exportVendorPerf = () => {
    if (!data) return
    const filtered = data.vendorPerf.filter(v =>
      !searchVendor || v.name.toLowerCase().includes(searchVendor.toLowerCase())
    )
    const rows = filtered.map(v => ({
      'Vendor': v.name,
      'ประเภท': v.vendorType === 'PARTS' ? 'อะไหล่' : 'อู่',
      'จำนวน PO': v.poCount,
      'มูลค่ารวม': v.totalValue,
      'เครดิต (วัน)': v.paymentTerms,
    }))
    exportToExcel(rows, `Vendor_Performance_${dateFrom}_${dateTo}.xlsx`)
  }

  // ─── Filtered data for each tab ───
  const filteredAR = data?.arAging?.filter(a =>
    !searchAR || a.insurance.toLowerCase().includes(searchAR.toLowerCase())
  ) || []

  const filteredAP = data?.apOutstanding?.filter(a =>
    !searchAP || a.vendor.toLowerCase().includes(searchAP.toLowerCase())
  ) || []

  const filteredVendor = data?.vendorPerf?.filter(v =>
    !searchVendor || v.name.toLowerCase().includes(searchVendor.toLowerCase())
  ) || []

  const filteredIE = data?.incomeExpense?.filter(ie =>
    !searchIE || ie.claimNo.toLowerCase().includes(searchIE.toLowerCase()) || ie.insurance.toLowerCase().includes(searchIE.toLowerCase()) || ie.carPlate.toLowerCase().includes(searchIE.toLowerCase())
  ) || []



  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Reports</h1>
          <p className="text-sm text-[#94a3b8] mt-1">รายงานสรุปการเงินและผลประกอบการ</p>
        </div>
      </div>

      {/* ─── Global Filter Bar ─── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#94a3b8]" />
              <span className="text-sm font-medium text-[#475569]">ช่วงเวลา:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40 h-9 bg-white text-sm" />
              <span className="text-xs text-[#94a3b8]">ถึง</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40 h-9 bg-white text-sm" />
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <Select value={insuranceId} onChange={e => setInsuranceId(e.target.value)} className="w-48">
              <option value="">ทุกบ.ประกัน</option>
              {insurances.map((ins: any) => (
                <option key={ins.id} value={ins.id}>{ins.name}</option>
              ))}
            </Select>
            <Select value={vendorId} onChange={e => setVendorId(e.target.value)} className="w-48">
              <option value="">ทุก Vendor</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
            {(insuranceId || vendorId) && (
              <Button variant="ghost" size="sm" onClick={() => { setInsuranceId(''); setVendorId('') }}>
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardHeader className="pb-2"><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent className="space-y-6">
            {/* Fake bar chart */}
            <div className="flex items-end justify-center gap-4 h-36 mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Skeleton className="w-5 rounded-t" style={{ height: `${40 + Math.random() * 60}px` }} />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonTableRows rows={6} cols={6} />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (!data || (data as any).error) ? (
        <div className="p-8 text-center text-red-500">ไม่สามารถโหลดข้อมูลได้: {(data as any)?.error || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}</div>
      ) : (
        <Tabs defaultValue="pnl">
          <TabsList>
            <TabsTrigger value="pnl" className="gap-2"><TrendingUp className="w-4 h-4" />P&L by Month</TabsTrigger>
            <TabsTrigger value="ie" className="gap-2"><FileSpreadsheet className="w-4 h-4" />รายรับ-รายจ่าย</TabsTrigger>
            <TabsTrigger value="ar-aging" className="gap-2"><Clock className="w-4 h-4" />AR Aging</TabsTrigger>
            <TabsTrigger value="ap" className="gap-2"><Users className="w-4 h-4" />AP Outstanding</TabsTrigger>
            <TabsTrigger value="vendor-perf" className="gap-2"><BarChart3 className="w-4 h-4" />Vendor Performance</TabsTrigger>
          </TabsList>

          {/* P&L by Month */}
          <TabsContent value="pnl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">กำไร/ขาดทุน รายเดือน</CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportPnL}>
                  <Download className="w-3.5 h-3.5" />Export Excel
                </Button>
              </CardHeader>
              <CardContent>
                {/* Visual Bar Chart */}
                {data.pnlByMonth.length > 0 && (
                  <div className="mb-8">
                    <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.pnlByMonth.length, 12)}, 1fr)` }}>
                      {data.pnlByMonth.map(item => {
                        const maxVal = Math.max(...data.pnlByMonth.map(p => Math.max(p.ar, p.ap)), 1)
                        const arH = (item.ar / maxVal) * 120
                        const apH = (item.ap / maxVal) * 120
                        return (
                          <div key={item.month} className="text-center">
                            <div className="h-[140px] flex items-end justify-center gap-1">
                              <div className="w-5 bg-gradient-to-t from-[#1d4ed8] to-[#3b82f6] rounded-t transition-all" style={{ height: arH }} title={`AR: ${formatCurrency(item.ar)}`} />
                              <div className="w-5 bg-gradient-to-t from-red-400 to-red-300 rounded-t transition-all" style={{ height: apH }} title={`AP: ${formatCurrency(item.ap)}`} />
                            </div>
                            <p className="text-xs font-medium mt-2 text-[#475569]">{item.month}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-6 text-xs text-[#475569]">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#1d4ed8]" />AR (รายรับ)</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" />AP (รายจ่าย)</div>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เดือน</TableHead>
                      <TableHead className="text-center">Claims</TableHead>
                      <TableHead className="text-right">AR (รายรับ)</TableHead>
                      <TableHead className="text-right">AP (รายจ่าย)</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pnlByMonth.map(item => (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell className="text-center">{item.claims}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">฿{formatCurrency(item.ar)}</TableCell>
                        <TableCell className="text-right text-red-500">฿{formatCurrency(item.ap)}</TableCell>
                        <TableCell className={`text-right font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ฿{formatCurrency(item.profit)}
                        </TableCell>
                        <TableCell className="text-right">{item.margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                    {/* Summary Row */}
                    {data.pnlByMonth.length > 1 && (() => {
                      const totAR = data.pnlByMonth.reduce((s, p) => s + p.ar, 0)
                      const totAP = data.pnlByMonth.reduce((s, p) => s + p.ap, 0)
                      const totProfit = totAR - totAP
                      return (
                        <TableRow className="bg-[#f8faff] font-bold border-t-2">
                          <TableCell>รวมทั้งปี</TableCell>
                          <TableCell className="text-center">{data.pnlByMonth.reduce((s, p) => s + p.claims, 0)}</TableCell>
                          <TableCell className="text-right text-green-600">฿{formatCurrency(totAR)}</TableCell>
                          <TableCell className="text-right text-red-500">฿{formatCurrency(totAP)}</TableCell>
                          <TableCell className={`text-right ${totProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>฿{formatCurrency(totProfit)}</TableCell>
                          <TableCell className="text-right">{totAR > 0 ? ((totProfit / totAR) * 100).toFixed(1) : '0.0'}%</TableCell>
                        </TableRow>
                      )
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AR Aging */}
          <TabsContent value="ar-aging">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">ลูกหนี้ค้างชำระ (AR Aging)</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="ค้นหา บ.ประกัน..." value={searchAR} onChange={e => setSearchAR(e.target.value)} className="pl-9 h-9 bg-gray-50" />
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportARAging}>
                    <Download className="w-3.5 h-3.5" />Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAR.length === 0 ? (
                  <div className="text-center py-12 text-[#94a3b8]"><p>ไม่มีลูกหนี้ค้างชำระ</p></div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-amber-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-[#475569]">ยอดรวมค้างชำระ</p>
                        <p className="text-xl font-bold text-amber-600">฿{formatCurrency(filteredAR.reduce((s, a) => s + a.amount, 0))}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-[#475569]">จำนวนบิลรวม</p>
                        <p className="text-xl font-bold text-blue-600">{filteredAR.length} ใบ</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-[#475569]">เกินกำหนด</p>
                        <p className="text-xl font-bold text-red-600">{filteredAR.filter(a => a.agingDays > 45).length} รายการ</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>บ.ประกัน</TableHead>
                          <TableHead>เคลม / ทะเบียนรถ</TableHead>
                          <TableHead>เลขที่วางบิล / วันที่</TableHead>
                          <TableHead className="text-right">ยอดค้างชำระ</TableHead>
                          <TableHead className="text-right">Aging (วัน)</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAR.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.insurance}</TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{item.claimNo}</div>
                              <div className="text-xs text-[#64748b]">{item.carPlate}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{item.invoiceNo || '-'}</div>
                              <div className="text-xs text-[#64748b]">{formatDate(item.invoiceDate)}</div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-amber-600">฿{formatCurrency(item.amount)}</TableCell>
                            <TableCell className="text-right">{item.agingDays} วัน</TableCell>
                            <TableCell>
                              <Badge className={item.agingDays > 45 ? 'bg-red-100 text-red-700 border-none' : 'bg-green-100 text-green-700 border-none'}>
                                {item.agingDays > 45 ? 'เกินกำหนด' : 'ปกติ'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AP Outstanding */}
          <TabsContent value="ap">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">เจ้าหนี้ค้างจ่าย (AP Outstanding)</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="ค้นหา Vendor..." value={searchAP} onChange={e => setSearchAP(e.target.value)} className="pl-9 h-9 bg-gray-50" />
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportAPOutstanding}>
                    <Download className="w-3.5 h-3.5" />Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAP.length === 0 ? (
                  <div className="text-center py-12 text-[#94a3b8]"><p>ไม่มีเจ้าหนี้ค้างจ่าย</p></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-[#475569]">ยอดรวมค้างจ่าย</p>
                        <p className="text-xl font-bold text-red-600">฿{formatCurrency(filteredAP.reduce((s, a) => s + a.amount, 0))}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-[#475569]">จำนวน Invoice รวม</p>
                        <p className="text-xl font-bold text-blue-600">{filteredAP.length} ใบ</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>ประเภท</TableHead>
                          <TableHead>Invoice / วันที่รับเอกสาร</TableHead>
                          <TableHead>เคลม / ทะเบียนรถ</TableHead>
                          <TableHead className="text-right">ยอดค้างจ่าย</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAP.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.vendor}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{item.invoiceNo || '-'}</div>
                              <div className="text-xs text-[#64748b]">{formatDate(item.invoiceDate)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{item.claimNo}</div>
                              <div className="text-xs text-[#64748b]">{item.carPlate}</div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-500">฿{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Performance */}
          <TabsContent value="vendor-perf">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">Vendor Performance</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="ค้นหา Vendor..." value={searchVendor} onChange={e => setSearchVendor(e.target.value)} className="pl-9 h-9 bg-gray-50" />
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportVendorPerf}>
                    <Download className="w-3.5 h-3.5" />Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredVendor.length === 0 ? (
                  <div className="text-center py-12 text-[#94a3b8]"><p>ไม่มีข้อมูล Vendor Performance</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead className="text-center">จำนวน PO</TableHead>
                        <TableHead className="text-right">มูลค่ารวม</TableHead>
                        <TableHead className="text-center">เครดิต (วัน)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendor.map(v => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{v.vendorType === 'PARTS' ? 'อะไหล่' : 'อู่'}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{v.poCount}</TableCell>
                          <TableCell className="text-right font-semibold">฿{formatCurrency(v.totalValue)}</TableCell>
                          <TableCell className="text-center">{v.paymentTerms}</TableCell>
                        </TableRow>
                      ))}
                      {/* Summary Row */}
                      {filteredVendor.length > 1 && (
                        <TableRow className="bg-[#f8faff] font-bold border-t-2">
                          <TableCell colSpan={2}>รวม</TableCell>
                          <TableCell className="text-center">{filteredVendor.reduce((s, v) => s + v.poCount, 0)}</TableCell>
                          <TableCell className="text-right">฿{formatCurrency(filteredVendor.reduce((s, v) => s + v.totalValue, 0))}</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income / Expense Detail */}
          <TabsContent value="ie">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">รายรับ-รายจ่ายรายเคลม</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="ค้นหา Claim / ทะเบียน..." className="pl-9 h-9 text-sm bg-white" value={searchIE} onChange={e => setSearchIE(e.target.value)} />
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => {
                    const rows = filteredIE.map((ie, i) => ({
                      'ลำดับ': i + 1,
                      'Claim No.': ie.claimNo,
                      'ทะเบียน': ie.carPlate,
                      'บ.ประกัน': ie.insurance,
                      'วันที่': formatDate(ie.date),
                      'เลขที่ Invoice': ie.invoiceNo,
                      'รายรับ (AR)': ie.arTotal,
                      'ค่าอะไหล่ (AP)': ie.apParts,
                      'ค่าแรง (AP)': ie.apLabor,
                      'รวมรายจ่าย (AP)': ie.apTotal,
                      'กำไร/ขาดทุน': ie.profit,
                    }))
                    const totalRow = {
                      'ลำดับ': '',
                      'Claim No.': 'รวมทั้งหมด',
                      'ทะเบียน': '',
                      'บ.ประกัน': `${filteredIE.length} เคลม`,
                      'วันที่': '',
                      'เลขที่ Invoice': '',
                      'รายรับ (AR)': filteredIE.reduce((s, ie) => s + ie.arTotal, 0),
                      'ค่าอะไหล่ (AP)': filteredIE.reduce((s, ie) => s + ie.apParts, 0),
                      'ค่าแรง (AP)': filteredIE.reduce((s, ie) => s + ie.apLabor, 0),
                      'รวมรายจ่าย (AP)': filteredIE.reduce((s, ie) => s + ie.apTotal, 0),
                      'กำไร/ขาดทุน': filteredIE.reduce((s, ie) => s + ie.profit, 0),
                    }
                    rows.push(totalRow as any)
                    exportToExcel(rows, `Income_Expense_${dateFrom}_${dateTo}.xlsx`)
                  }}>
                    <Download className="w-3.5 h-3.5" />Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {[
                    { label: 'จำนวนเคลม', value: filteredIE.length, format: false, color: 'text-[#0f172a]' },
                    { label: 'รวมรายรับ (AR)', value: filteredIE.reduce((s, ie) => s + ie.arTotal, 0), format: true, color: 'text-green-600' },
                    { label: 'รวมค่าอะไหล่ (AP)', value: filteredIE.reduce((s, ie) => s + ie.apParts, 0), format: true, color: 'text-red-500' },
                    { label: 'รวมค่าแรง (AP)', value: filteredIE.reduce((s, ie) => s + ie.apLabor, 0), format: true, color: 'text-red-500' },
                    { label: 'กำไรสุทธิ', value: filteredIE.reduce((s, ie) => s + ie.profit, 0), format: true, color: filteredIE.reduce((s, ie) => s + ie.profit, 0) >= 0 ? 'text-green-600' : 'text-red-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#f8faff] rounded-lg p-3 text-center">
                      <p className="text-xs text-[#94a3b8]">{s.label}</p>
                      <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.format ? `฿${formatCurrency(s.value)}` : s.value}</p>
                    </div>
                  ))}
                </div>

                {filteredIE.length === 0 ? (
                  <div className="text-center py-8 text-[#94a3b8]"><FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f8faff]">
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Claim No.</TableHead>
                        <TableHead className="text-xs">ทะเบียน</TableHead>
                        <TableHead className="text-xs">บ.ประกัน</TableHead>
                        <TableHead className="text-xs">วันที่</TableHead>
                        <TableHead className="text-xs text-right">รายรับ (AR)</TableHead>
                        <TableHead className="text-xs text-right">ค่าอะไหล่</TableHead>
                        <TableHead className="text-xs text-right">ค่าแรง</TableHead>
                        <TableHead className="text-xs text-right">รวม AP</TableHead>
                        <TableHead className="text-xs text-right">กำไร/ขาดทุน</TableHead>
                        <TableHead className="text-xs text-center">สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIE.map((ie, i) => (
                        <TableRow key={ie.claimId} className="hover:bg-blue-50/30">
                          <TableCell className="text-xs text-[#94a3b8]">{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs font-medium text-[#1d4ed8]">{ie.claimNo}</TableCell>
                          <TableCell className="text-xs">{ie.carPlate}</TableCell>
                          <TableCell className="text-xs">{ie.insurance}</TableCell>
                          <TableCell className="text-xs">{formatDate(ie.date)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-green-600">{ie.arTotal > 0 ? `฿${formatCurrency(ie.arTotal)}` : '-'}</TableCell>
                          <TableCell className="text-right text-xs">{ie.apParts > 0 ? `฿${formatCurrency(ie.apParts)}` : '-'}</TableCell>
                          <TableCell className="text-right text-xs">{ie.apLabor > 0 ? `฿${formatCurrency(ie.apLabor)}` : '-'}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-red-500">{ie.apTotal > 0 ? `฿${formatCurrency(ie.apTotal)}` : '-'}</TableCell>
                          <TableCell className={`text-right text-xs font-bold ${ie.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>฿{formatCurrency(ie.profit)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`border-none text-[9px] ${ie.invoiceStatus === 'PAID' ? 'bg-green-100 text-green-700' : ie.invoiceStatus === 'SENT' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {ie.invoiceStatus === 'PAID' ? 'ชำระแล้ว' : ie.invoiceStatus === 'SENT' ? 'วางบิลแล้ว' : ie.invoiceStatus === 'NONE' ? 'ยังไม่วางบิล' : ie.invoiceStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Summary Row */}
                      <TableRow className="bg-[#f0f4ff] font-semibold border-t-2 border-[#1d4ed8]">
                        <TableCell></TableCell>
                        <TableCell className="text-xs">รวมทั้งหมด</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-xs">{filteredIE.length} เคลม</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-xs text-green-600">฿{formatCurrency(filteredIE.reduce((s, ie) => s + ie.arTotal, 0))}</TableCell>
                        <TableCell className="text-right text-xs">฿{formatCurrency(filteredIE.reduce((s, ie) => s + ie.apParts, 0))}</TableCell>
                        <TableCell className="text-right text-xs">฿{formatCurrency(filteredIE.reduce((s, ie) => s + ie.apLabor, 0))}</TableCell>
                        <TableCell className="text-right text-xs text-red-500">฿{formatCurrency(filteredIE.reduce((s, ie) => s + ie.apTotal, 0))}</TableCell>
                        <TableCell className={`text-right text-xs font-bold ${filteredIE.reduce((s, ie) => s + ie.profit, 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>฿{formatCurrency(filteredIE.reduce((s, ie) => s + ie.profit, 0))}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}
    </div>
  )
}

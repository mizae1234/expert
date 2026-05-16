"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Users, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [data, setData] = useState<{ pnlByMonth: any[], arAging: any[], apOutstanding: any[], vendorPerf: any[] } | null>(null)

  useEffect(() => {
    fetch('/api/reports').then(res => res.json()).then(resData => {
      setData(resData)
    }).catch(err => {
      console.error(err)
    })
  }, [])

  if (!data) return <div className="p-8 text-center text-[#94a3b8]">กำลังโหลดรายงาน...</div>

  const { pnlByMonth, arAging, apOutstanding, vendorPerf } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Reports</h1>
        <p className="text-sm text-[#94a3b8] mt-1">รายงานสรุปการเงินและผลประกอบการ</p>
      </div>

      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl" className="gap-2"><TrendingUp className="w-4 h-4" />P&L by Month</TabsTrigger>
          <TabsTrigger value="ar-aging" className="gap-2"><Clock className="w-4 h-4" />AR Aging</TabsTrigger>
          <TabsTrigger value="ap" className="gap-2"><Users className="w-4 h-4" />AP Outstanding</TabsTrigger>
          <TabsTrigger value="vendor-perf" className="gap-2"><BarChart3 className="w-4 h-4" />Vendor Performance</TabsTrigger>
        </TabsList>

        {/* P&L by Month */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader><CardTitle className="text-base">กำไร/ขาดทุน รายเดือน</CardTitle></CardHeader>
            <CardContent>
              {/* Visual Bar Chart */}
              <div className="grid grid-cols-6 gap-3 mb-8">
                {pnlByMonth.map(item => {
                  const maxVal = Math.max(...pnlByMonth.map(p => p.ar), 1)
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
              <div className="flex items-center gap-6 text-xs text-[#475569] mb-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#1d4ed8]" />AR (รายรับ)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" />AP (รายจ่าย)</div>
              </div>

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
                  {pnlByMonth.map(item => (
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AR Aging */}
        <TabsContent value="ar-aging">
          <Card>
            <CardHeader><CardTitle className="text-base">ลูกหนี้ค้างชำระ (AR Aging)</CardTitle></CardHeader>
            <CardContent>
              {arAging.length === 0 ? (
                <div className="text-center py-12 text-[#94a3b8]"><p>ไม่มีลูกหนี้ค้างชำระ</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>บ.ประกัน</TableHead>
                      <TableHead className="text-center">จำนวนใบ</TableHead>
                      <TableHead className="text-right">ยอดค้างชำระ</TableHead>
                      <TableHead className="text-right">เฉลี่ย (วัน)</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arAging.map(item => (
                      <TableRow key={item.insurance}>
                        <TableCell className="font-medium">{item.insurance}</TableCell>
                        <TableCell className="text-center">{item.count}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">฿{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-right">{item.avgDays} วัน</TableCell>
                        <TableCell>
                          <Badge className={item.avgDays > 45 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {item.avgDays > 45 ? 'เกินกำหนด' : 'ปกติ'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AP Outstanding */}
        <TabsContent value="ap">
          <Card>
            <CardHeader><CardTitle className="text-base">เจ้าหนี้ค้างจ่าย (AP Outstanding)</CardTitle></CardHeader>
            <CardContent>
              {apOutstanding.length === 0 ? (
                <div className="text-center py-12 text-[#94a3b8]"><p>ไม่มีเจ้าหนี้ค้างจ่าย</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-center">จำนวนใบ</TableHead>
                      <TableHead className="text-right">ยอดค้างจ่าย</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apOutstanding.map(item => (
                      <TableRow key={item.vendor}>
                        <TableCell className="font-medium">{item.vendor}</TableCell>
                        <TableCell className="text-center">{item.invoices}</TableCell>
                        <TableCell className="text-right font-semibold text-red-500">฿{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Performance */}
        <TabsContent value="vendor-perf">
          <Card>
            <CardHeader><CardTitle className="text-base">Vendor Performance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-center">จำนวน PO</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead className="text-center">เครดิต (วัน)</TableHead>
                    <TableHead>โซน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorPerf.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{v.vendorType === 'PARTS' ? 'อะไหล่' : 'อู่'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{Math.floor(Math.random() * 10) + 1}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(Math.floor(Math.random() * 500000) + 50000)}</TableCell>
                      <TableCell className="text-center">{v.paymentTerms}</TableCell>
                      <TableCell>{v.zone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

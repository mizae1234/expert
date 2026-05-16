"use client"

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Building2 } from 'lucide-react'
import { mockInsurances } from '@/lib/mock/insurances'
import { mockClaims } from '@/lib/mock/claims'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function InsuranceDetailPage() {
  const params = useParams()
  const insurance = useMemo(() => mockInsurances.find(i => i.id === params.id), [params.id])
  const claims = useMemo(() => mockClaims.filter(c => c.insuranceId === params.id), [params.id])

  if (!insurance) return <div className="text-center py-12 text-[#94a3b8]">ไม่พบข้อมูล</div>

  const totalRevenue = claims.filter(c => c.insuranceInvoice).reduce((s, c) => s + (c.insuranceInvoice?.grandTotal || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/insurances"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">{insurance.name}</h1>
          <p className="text-sm text-[#94a3b8] mt-1">{insurance.branch}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'จำนวน Claim', value: claims.length },
              { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-[#94a3b8]">{s.label}</p><p className="text-lg font-bold mt-1">{s.value}</p></CardContent></Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">ข้อมูลบริษัทและภาษี</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ชื่อผู้ติดต่อ</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={insurance.contactPerson || ''} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เลขผู้เสียภาษี 13 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={insurance.taxId || ''} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">รหัสสาขา 5 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={insurance.branchCode || '00000'} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ออกใบกำกับภาษี</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={insurance.peakCustomerId ? 'border-green-200' : 'border-amber-200'}>
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-base flex items-center justify-between">
                PEAK Integration
                {insurance.peakCustomerId ? 
                  <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม Export</Badge> : 
                  <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <label className="text-xs text-[#94a3b8] font-medium">PEAK Customer Code</label>
              <input type="text" placeholder="เช่น C00001" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" defaultValue={insurance.peakCustomerId || ''} />
              <p className="text-[10px] text-gray-500 mt-2">
                *รหัสลูกค้า/ลูกหนี้ ในระบบบัญชี PEAK จำเป็นต้องระบุเพื่อส่งออกเอกสาร AR
              </p>
            </CardContent>
          </Card>

          <Button className="w-full bg-[#1d4ed8]">บันทึกข้อมูล</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ประวัติ Claim</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead>ผู้เอาประกัน</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(c => {
                const sc = getStatusColor(c.status)
                return (
                  <TableRow key={c.id}>
                    <TableCell><Link href={`/claims/${c.id}`} className="text-[#1d4ed8] hover:underline font-semibold">{c.claimNo}</Link></TableCell>
                    <TableCell>{c.carPlate}</TableCell>
                    <TableCell>{c.insuredName}</TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell><span className={`status-badge ${sc.bg} ${sc.text}`}>{getStatusLabel(c.status)}</span></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

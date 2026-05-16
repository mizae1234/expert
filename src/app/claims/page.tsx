"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Filter, Eye, MoreHorizontal, AlertTriangle, FileText } from 'lucide-react'
import { getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { mockClaims } from '@/lib/mock/claims'
import { mockInsurances } from '@/lib/mock/insurances'
import { ClaimStatus } from '@/lib/types'

const statuses: ClaimStatus[] = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED']

export default function ClaimsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [insuranceFilter, setInsuranceFilter] = useState<string>('')

  const filtered = useMemo(() => {
    let list = [...mockClaims]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.claimNo.toLowerCase().includes(s) ||
        c.carPlate.toLowerCase().includes(s) ||
        c.insuredName.toLowerCase().includes(s)
      )
    }
    if (statusFilter) list = list.filter(c => c.status === statusFilter)
    if (insuranceFilter) list = list.filter(c => c.insuranceId === insuranceFilter)
    return list
  }, [search, statusFilter, insuranceFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Claims</h1>
          <p className="text-sm text-[#94a3b8] mt-1">จัดการ Claim ทั้งหมด ({mockClaims.length} รายการ)</p>
        </div>
        <Link href="/claims/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            รับ Claim ใหม่
          </Button>
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {statuses.map(status => {
          const count = mockClaims.filter(c => c.status === status).length
          const { bg, text } = getStatusColor(status)
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? '' : status)}
              className={`p-2.5 rounded-xl border text-center transition-all duration-200 ${
                isActive
                  ? 'border-[#1d4ed8] bg-[#eff6ff] shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-bold text-[#0f172a]">{count}</div>
              <div className="text-[10px] font-medium text-[#475569] mt-0.5 truncate">{getStatusLabel(status)}</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหา Claim No. / ทะเบียน / ชื่อผู้เอาประกัน..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={insuranceFilter} onChange={e => setInsuranceFilter(e.target.value)} className="w-48">
              <option value="">ทุกบ.ประกัน</option>
              {mockInsurances.map(ins => (
                <option key={ins.id} value={ins.id}>{ins.name}</option>
              ))}
            </Select>
            {(search || statusFilter || insuranceFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setInsuranceFilter('') }}>
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead>ผู้เอาประกัน</TableHead>
                <TableHead>บ.ประกัน</TableHead>
                <TableHead>อู่</TableHead>
                <TableHead>วันที่รับ</TableHead>
                <TableHead>อะไหล่</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(claim => {
                const { bg, text } = getStatusColor(claim.status)
                const hasReturnParts = claim.parts?.some(p => p.requireReturn)
                return (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <Link href={`/claims/${claim.id}`} className="text-[#1d4ed8] hover:underline font-semibold">
                        {claim.claimNo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{claim.carPlate}</div>
                      <div className="text-xs text-[#94a3b8]">{claim.carBrand} {claim.carModel}</div>
                    </TableCell>
                    <TableCell className="text-[#475569]">{claim.insuredName}</TableCell>
                    <TableCell className="text-[#475569] text-sm">{claim.insurance?.name}</TableCell>
                    <TableCell className="text-[#475569] text-sm">{claim.garage?.name}</TableCell>
                    <TableCell className="text-[#475569] text-sm">
                      {new Date(claim.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{claim.parts?.length || 0} ชิ้น</span>
                        {hasReturnParts && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            คืนซาก
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${bg} ${text}`}>
                        {getStatusLabel(claim.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/claims/${claim.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4 text-[#475569]" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#94a3b8]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่พบ Claim ที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

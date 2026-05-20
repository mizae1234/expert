"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Filter, Eye, MoreHorizontal, AlertTriangle, FileText } from 'lucide-react'
import { getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { ClaimStatus } from '@/lib/types'
import { Skeleton, SkeletonStatusPill, SkeletonTableRows } from '@/components/ui/skeleton'

const statuses: ClaimStatus[] = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED', 'CANCELLED']

export default function ClaimsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [insuranceFilter, setInsuranceFilter] = useState<string>('')
  const [claims, setClaims] = useState<any[]>([])
  const [insurances, setInsurances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, insuranceFilter])

  useEffect(() => {
    Promise.all([
      fetch('/api/claims').then(res => res.json()),
      fetch('/api/insurances').then(res => res.json())
    ]).then(([claimsData, insurancesData]) => {
      setClaims(claimsData)
      setInsurances(insurancesData)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = [...claims]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        c.claimNo?.toLowerCase().includes(s) ||
        c.carPlate?.toLowerCase().includes(s) ||
        c.insuredName?.toLowerCase().includes(s)
      )
    }
    if (statusFilter) list = list.filter(c => c.status === statusFilter)
    if (insuranceFilter) list = list.filter(c => c.insuranceId === insuranceFilter)
    return list
  }, [claims, search, statusFilter, insuranceFilter])

  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Claims</h1>
          <p className="text-sm text-[#94a3b8] mt-1">จัดการ Claim ทั้งหมด ({claims.length} รายการ)</p>
        </div>
        <Link href="/claims/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            รับ Claim ใหม่
          </Button>
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <SkeletonStatusPill key={i} />)
        ) : statuses.map(status => {
          const count = claims.filter(c => c.status === status).length
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
              {insurances.map(ins => (
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
                <TableHead>บ.ประกัน</TableHead>
                <TableHead>อู่</TableHead>
                <TableHead>วันที่บันทึก</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={8} cols={7} />
              ) : paginatedClaims.map(claim => {
                const { bg, text } = getStatusColor(claim.status)
                const hasReturnParts = claim.parts?.some((p: any) => p.requireReturn)
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
                    <TableCell className="text-[#475569] text-sm">{claim.insurance?.name}</TableCell>
                    <TableCell className="text-[#475569] text-sm">{claim.garage?.name}</TableCell>
                    <TableCell className="text-[#475569] text-sm">
                      <div>{formatDate(claim.createdAt)}</div>
                      <div className="text-xs text-gray-400">{new Date(claim.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
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

          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="text-sm text-[#94a3b8]">
                แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filtered.length)} จากทั้งหมด {filtered.length} รายการ
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                <div className="flex items-center gap-1 text-sm font-medium text-[#475569] px-2">
                  หน้า
                  <select 
                    className="border rounded p-1 mx-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    value={currentPage}
                    onChange={e => setCurrentPage(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  จาก {Math.ceil(filtered.length / itemsPerPage)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(filtered.length / itemsPerPage)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

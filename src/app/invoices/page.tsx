'use client'
import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Receipt, Search, Download, Eye, DollarSign, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import Link from 'next/link'

type ARTab = 'all' | 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'

export default function InvoicesPage() {
  const [tab, setTab] = useState<ARTab>('all')
  const [search, setSearch] = useState('')
  const [allInvoices, setAllInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<{ type: 'send' | 'pay', inv: any } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [bulkModal, setBulkModal] = useState<'pay' | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Column-specific Filters
  const [filterInvoiceNo, setFilterInvoiceNo] = useState('')
  const [filterInsurance, setFilterInsurance] = useState('')
  const [filterClaimNo, setFilterClaimNo] = useState('')
  const [filterCarPlate, setFilterCarPlate] = useState('')

  const fetchInvoices = () => {
    setLoading(true)
    fetch('/api/invoices').then(res => res.json()).then(data => {
      setAllInvoices(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleSend = async (inv: any) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/invoices/${inv.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' })
      })
      if (!res.ok) throw new Error('Failed')
      fetchInvoices()
      setActiveModal(null)
    } catch (e) {
      showToast('❌ เกิดข้อผิดพลาด')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePay = async (inv: any) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/invoices/${inv.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      })
      if (!res.ok) throw new Error('Failed')
      fetchInvoices()
      setActiveModal(null)
    } catch (e) {
      showToast('❌ เกิดข้อผิดพลาด')
    } finally {
      setIsSaving(false)
    }
  }

  const today = new Date()

  const getDisplayStatus = (inv: (typeof allInvoices)[0]) => {
    if (inv.status === 'CANCELLED') return 'CANCELLED'
    if (inv.status === 'PAID') return 'PAID'
    const computedDueDate = inv.dueDate ? new Date(inv.dueDate) : (() => {
      const termDays = inv.claim?.insurance?.creditTermArDays ?? 30
      const d = new Date(inv.invoiceDate)
      d.setDate(d.getDate() + termDays)
      return d
    })()
    if (computedDueDate < today) return 'OVERDUE'
    if (inv.status === 'SENT') return 'SENT'
    return 'DRAFT'
  }

  const filtered = useMemo(() => {
    let list = allInvoices.map(inv => ({ ...inv, displayStatus: getDisplayStatus(inv) }))
    if (tab === 'draft') list = list.filter(i => i.displayStatus === 'DRAFT')
    else if (tab === 'sent') list = list.filter(i => i.displayStatus === 'SENT')
    else if (tab === 'overdue') list = list.filter(i => i.displayStatus === 'OVERDUE')
    else if (tab === 'paid') list = list.filter(i => i.displayStatus === 'PAID')
    else if (tab === 'cancelled') list = list.filter(i => i.displayStatus === 'CANCELLED')
    
    // Global search (safe navigation included)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(i => 
        (i.invoiceNo?.toLowerCase() || '').includes(s) || 
        (i.claim?.claimNo?.toLowerCase() || '').includes(s) || 
        (i.claim?.carPlate?.toLowerCase() || '').includes(s) || 
        (i.claim?.insurance?.name?.toLowerCase() || '').includes(s)
      )
    }

    // Column-specific filters
    if (filterInvoiceNo) {
      const s = filterInvoiceNo.toLowerCase()
      list = list.filter(i => (i.invoiceNo?.toLowerCase() || '').includes(s))
    }
    if (filterInsurance) {
      const s = filterInsurance.toLowerCase()
      list = list.filter(i => (i.claim?.insurance?.name?.toLowerCase() || '').includes(s))
    }
    if (filterClaimNo) {
      const s = filterClaimNo.toLowerCase()
      list = list.filter(i => (i.claim?.claimNo?.toLowerCase() || '').includes(s))
    }
    if (filterCarPlate) {
      const s = filterCarPlate.toLowerCase()
      list = list.filter(i => (i.claim?.carPlate?.toLowerCase() || '').includes(s))
    }

    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allInvoices, tab, search, filterInvoiceNo, filterInsurance, filterClaimNo, filterCarPlate])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds({})
  }, [tab, search, filterInvoiceNo, filterInsurance, filterClaimNo, filterCarPlate])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const displayPages = useMemo(() => {
    const pageNumbers = []
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
    if (totalPages <= 5) return pageNumbers
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    return pageNumbers.slice(start - 1, end)
  }, [totalPages, currentPage])

  const selectedCount = Object.keys(selectedIds).filter(id => selectedIds[id]).length
  const selectedList = Object.keys(selectedIds).filter(id => selectedIds[id])

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => ({ ...prev, [id]: checked }))
  }

  const handleToggleAll = (checked: boolean) => {
    setSelectedIds(prev => {
      const newSel = { ...prev }
      paginatedData.forEach(inv => {
        if (checked) {
          newSel[inv.id] = true
        } else {
          delete newSel[inv.id]
        }
      })
      return newSel
    })
  }

  const handlePrintBillingNote = () => {
    window.open(`/invoices/print-billing-note?ids=${selectedList.join(',')}`, '_blank')
  }

  const handleBulkPay = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/invoices/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedList, status: 'PAID' })
      })
      if (!res.ok) throw new Error('Failed to update status')
      showToast(`✅ บันทึกรับชำระเงิน ${selectedCount} ใบ สำเร็จ`)
      setSelectedIds({})
      setBulkModal(null)
      fetchInvoices()
    } catch (e) {
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  const all = allInvoices.map(inv => ({ ...inv, displayStatus: getDisplayStatus(inv) }))
  const pendingCount = all.filter(i => i.displayStatus === 'SENT').length
  const pendingAmount = all.filter(i => i.displayStatus === 'SENT').reduce((s, i) => s + i.grandTotal, 0)
  const overdueCount = all.filter(i => i.displayStatus === 'OVERDUE').length
  const overdueAmount = all.filter(i => i.displayStatus === 'OVERDUE').reduce((s, i) => s + i.grandTotal, 0)
  const paidThisMonth = all.filter(i => i.displayStatus === 'PAID').reduce((s, i) => s + i.grandTotal, 0)
  const totalAR = pendingAmount + overdueAmount

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100 text-gray-600', label: 'ร่าง' },
      SENT: { bg: 'bg-blue-100 text-blue-700', label: 'รอรับชำระ' },
      OVERDUE: { bg: 'bg-red-100 text-red-700', label: 'เกินกำหนด' },
      PAID: { bg: 'bg-green-100 text-green-700', label: 'รับชำระแล้ว' },
      CANCELLED: { bg: 'bg-gray-200 text-gray-500', label: 'ยกเลิก' },
    }
    const s = map[status] || map.DRAFT
    return <Badge className={`border-none text-[10px] ${s.bg}`}>{s.label}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">ใบแจ้งหนี้ (AR)</h1>
          <p className="text-sm text-[#94a3b8]">จัดการใบแจ้งหนี้ประกันภัย (Accounts Receivable)</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-600" /><span className="text-xs text-[#475569]">รอรับชำระ</span></div>
            <p className="text-xl font-bold text-blue-700">{pendingCount} ใบ</p>
            <p className="text-sm text-blue-600">฿{formatCurrency(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-xs text-[#475569]">เกินกำหนด</span></div>
            <p className="text-xl font-bold text-red-700">{overdueCount} ใบ</p>
            <p className="text-sm text-red-600">฿{formatCurrency(overdueAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs text-[#475569]">รับชำระเดือนนี้</span></div>
            <p className="text-xl font-bold text-green-700">฿{formatCurrency(paidThisMonth)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-purple-600" /><span className="text-xs text-[#475569]">AR Aging รวม</span></div>
            <p className="text-xl font-bold text-purple-700">฿{formatCurrency(totalAR)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Card>
        <CardHeader className="pb-3 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Tabs value={tab} onValueChange={v => setTab(v as ARTab)}>
              <TabsList className="bg-white border">
                <TabsTrigger value="all">ทั้งหมด ({all.length})</TabsTrigger>
                <TabsTrigger value="draft">ร่าง</TabsTrigger>
                <TabsTrigger value="sent">รอรับชำระ ({pendingCount})</TabsTrigger>
                <TabsTrigger value="overdue" className="text-red-600">เกินกำหนด ({overdueCount})</TabsTrigger>
                <TabsTrigger value="paid">รับชำระแล้ว</TabsTrigger>
                <TabsTrigger value="cancelled">ยกเลิก</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <Input placeholder="ค้นหาด่วนทั้งหมด..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64 bg-white" />
            </div>
          </div>

          {/* Column-specific Filters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">เลขที่ Invoice</label>
              <Input 
                placeholder="ค้นหาเลขที่ Invoice..." 
                value={filterInvoiceNo} 
                onChange={e => setFilterInvoiceNo(e.target.value)} 
                className="h-8 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white mt-1 border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">บ.ประกัน</label>
              <Input 
                placeholder="ค้นหาบริษัทประกัน..." 
                value={filterInsurance} 
                onChange={e => setFilterInsurance(e.target.value)} 
                className="h-8 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white mt-1 border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Claim No.</label>
              <Input 
                placeholder="ค้นหา Claim No..." 
                value={filterClaimNo} 
                onChange={e => setFilterClaimNo(e.target.value)} 
                className="h-8 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white mt-1 border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">ทะเบียน</label>
              <Input 
                placeholder="ค้นหาทะเบียนรถ..." 
                value={filterCarPlate} 
                onChange={e => setFilterCarPlate(e.target.value)} 
                className="h-8 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white mt-1 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {selectedCount > 0 && (
            <div className="bg-blue-50/70 border-b border-blue-100 p-3 px-6 flex items-center justify-between animate-fade-in">
              <span className="text-sm font-medium text-blue-800">เลือกแล้ว {selectedCount} รายการ</span>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5" onClick={handlePrintBillingNote}>
                  <Download className="w-3.5 h-3.5" />
                  ออกใบวางบิลรวม
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs gap-1.5" onClick={() => setBulkModal('pay')}>
                  <DollarSign className="w-3.5 h-3.5" />
                  บันทึกรับชำระเงินกลุ่ม
                </Button>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8faff]">
                <TableHead className="w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300"
                    onChange={e => handleToggleAll(e.target.checked)}
                    checked={paginatedData.length > 0 && paginatedData.every(inv => selectedIds[inv.id])}
                  />
                </TableHead>
                <TableHead className="text-center w-[70px]">ลำดับที่</TableHead>
                <TableHead>เลขที่ Invoice</TableHead>
                <TableHead>บ.ประกัน</TableHead>
                <TableHead>Claim No.</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead>วันที่ออก</TableHead>
                <TableHead>กำหนดรับชำระ</TableHead>
                <TableHead className="text-right">มูลค่า</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-[#94a3b8]">กำลังโหลดข้อมูล...</TableCell></TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-[#94a3b8]"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>ไม่พบข้อมูล</p></TableCell></TableRow>
              ) : paginatedData.map((inv, index) => (
                <TableRow key={inv.id} className={`hover:bg-blue-50/30 cursor-pointer ${inv.displayStatus === 'OVERDUE' ? 'bg-red-50/30' : ''}`}>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      checked={!!selectedIds[inv.id]}
                      onChange={e => handleToggleSelect(inv.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="text-center text-xs font-medium text-[#475569]">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell className="font-mono font-medium text-[#1d4ed8]">{inv.invoiceNo}</TableCell>
                  <TableCell className="text-sm">{inv.claim.insurance.name}</TableCell>
                  <TableCell><Link href={`/claims/${inv.claimId}`} className="text-[#1d4ed8] hover:underline text-sm">{inv.claim.claimNo}</Link></TableCell>
                  <TableCell className="text-sm">{inv.claim.carPlate}</TableCell>
                  <TableCell className="text-sm">{formatDate(inv.invoiceDate)}</TableCell>
                   <TableCell className={`text-sm ${inv.displayStatus === 'OVERDUE' ? 'text-red-600 font-semibold' : ''}`}>
                    {formatDate(inv.dueDate || (() => {
                      const termDays = inv.claim?.insurance?.creditTermArDays ?? 30
                      const d = new Date(inv.invoiceDate)
                      d.setDate(d.getDate() + termDays)
                      return d
                    })())}
                  </TableCell>
                  <TableCell className="text-right font-semibold">฿{formatCurrency(inv.grandTotal)}</TableCell>
                  <TableCell className="text-center">{statusBadge(inv.displayStatus)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="ดูข้อมูล" onClick={() => window.location.href = `/claims/${inv.claimId}?tab=insurance-inv`}><Eye className="w-3.5 h-3.5" /></Button>
                      {inv.displayStatus === 'DRAFT' && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" title="ส่งใบแจ้งหนี้" onClick={() => setActiveModal({ type: 'send', inv })}><Receipt className="w-3.5 h-3.5" /></Button>
                      )}
                      {(inv.displayStatus === 'SENT' || inv.displayStatus === 'OVERDUE') && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" title="รับชำระเงิน" onClick={() => setActiveModal({ type: 'pay', inv })}><DollarSign className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
              <div className="text-xs text-[#64748b]">
                แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filtered.length)} จาก {filtered.length} รายการ
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                {displayPages.map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 text-xs ${currentPage === page ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white"}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {activeModal?.type === 'send' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle className="text-lg text-blue-600">ส่งใบแจ้งหนี้ (วางบิล)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm mb-4">ยืนยันการส่งใบแจ้งหนี้ <span className="font-bold">{activeModal.inv.invoiceNo}</span> ให้บริษัทประกันภัยใช่หรือไม่? สถานะจะถูกเปลี่ยนเป็น "รอรับชำระ"</p>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSaving}>ยกเลิก</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleSend(activeModal.inv)} disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeModal?.type === 'pay' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle className="text-lg text-green-600">บันทึกรับชำระเงิน</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm mb-4">ยืนยันว่าได้รับเงินค่าใบแจ้งหนี้ <span className="font-bold">{activeModal.inv.invoiceNo}</span> จำนวน <span className="font-bold text-green-600">฿{formatCurrency(activeModal.inv.grandTotal)}</span> แล้วใช่หรือไม่?</p>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSaving}>ยกเลิก</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handlePay(activeModal.inv)} disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'ยืนยันรับชำระแล้ว'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {bulkModal === 'pay' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader><CardTitle className="text-lg text-green-600">บันทึกรับชำระเงินกลุ่ม</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm mb-4">ยืนยันว่าได้รับเงินค่าใบแจ้งหนี้จำนวน <span className="font-bold text-green-600">{selectedCount} ใบ</span> แล้วใช่หรือไม่?</p>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" onClick={() => setBulkModal(null)} disabled={isSaving}>ยกเลิก</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleBulkPay} disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'ยืนยันรับชำระเงินทั้งหมด'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

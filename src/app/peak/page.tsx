'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Cloud, CheckCircle2, AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/date'

export default function PeakSyncPage() {
  const [loading, setLoading] = useState(true)
  const [arInvoices, setArInvoices] = useState<any[]>([])
  const [apInvoices, setApInvoices] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  
  // Selections
  const [arSelections, setArSelections] = useState<Record<string, boolean>>({})
  const [apSelections, setApSelections] = useState<Record<string, boolean>>({})
  const [expenseSelections, setExpenseSelections] = useState<Record<string, boolean>>({})
  
  const [searchAR, setSearchAR] = useState('')
  const [searchAP, setSearchAP] = useState('')
  const [searchExpense, setSearchExpense] = useState('')
  
  const [toast, setToast] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const [currentPageAR, setCurrentPageAR] = useState(1)
  const [currentPageAP, setCurrentPageAP] = useState(1)
  const [currentPageExpense, setCurrentPageExpense] = useState(1)
  const itemsPerPage = 15

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const refreshData = async () => {
    try {
      const res = await fetch('/api/peak')
      const data = await res.json()
      setArInvoices(data.arInvoices || [])
      setApInvoices(data.apInvoices || [])
      setExpenses(data.expenses || [])
    } catch (err) {
      console.error('Failed to refresh data:', err)
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')
  const [editingType, setEditingType] = useState<'AR' | 'SUPPLIER' | 'GARAGE' | null>(null)

  const handleSaveDocNo = async (id: string, type: 'AR' | 'SUPPLIER' | 'GARAGE') => {
    if (!editingVal.trim()) {
      showToast('❌ เลขที่เอกสารห้ามว่าง')
      return
    }
    try {
      const res = await fetch('/api/peak/update-doc-no', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, invoiceNo: editingVal })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      showToast('✅ แก้ไขเลขที่เอกสารสำเร็จ')
      setEditingId(null)
      refreshData()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    }
  }

  useEffect(() => {
    refreshData().finally(() => setLoading(false))
  }, [])


  const handleSyncAR = async () => {
    const selectedIds = Object.keys(arSelections).filter(k => arSelections[k])
    if (selectedIds.length === 0) {
      showToast('❌ กรุณาเลือกรายการที่ต้องการ Export')
      return
    }
    
    try {
      setIsSyncing(true)
      const res = await fetch('/api/peak/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ar', ids: selectedIds })
      })
      if (!res.ok) throw new Error('Failed to export AR')
      const data = await res.json()
      
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "AR_Invoice")
      XLSX.writeFile(wb, data.filename)
      
      setArSelections({})
      showToast(`✅ Export ข้อมูล ${selectedIds.length} รายการ สำเร็จ`)
      refreshData()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncAP = async () => {
    const selectedIds = Object.keys(apSelections).filter(k => apSelections[k])
    if (selectedIds.length === 0) {
      showToast('❌ กรุณาเลือกรายการที่ต้องการ Export')
      return
    }
    
    try {
      setIsSyncing(true)
      const res = await fetch('/api/peak/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ap', ids: selectedIds })
      })
      if (!res.ok) throw new Error('Failed to export AP')
      const data = await res.json()
      
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "AP_Purchase")
      XLSX.writeFile(wb, data.filename)
      
      setApSelections({})
      showToast(`✅ Export ข้อมูล ${selectedIds.length} รายการ สำเร็จ`)
      refreshData()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncExpense = async () => {
    const selectedIds = Object.keys(expenseSelections).filter(k => expenseSelections[k])
    if (selectedIds.length === 0) {
      showToast('❌ กรุณาเลือกรายการที่ต้องการ Export')
      return
    }
    
    try {
      setIsSyncing(true)
      const res = await fetch('/api/peak/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expense', ids: selectedIds })
      })
      if (!res.ok) throw new Error('Failed to export Expense')
      const data = await res.json()
      
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Expense")
      XLSX.writeFile(wb, data.filename)
      
      setExpenseSelections({})
      showToast(`✅ Export ข้อมูล ${selectedIds.length} รายการ สำเร็จ`)
      refreshData()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  // Filtered Lists
  const filteredAR = arInvoices.filter(i => {
    const s = searchAR.toLowerCase()
    return (i.invoiceNo || '').toLowerCase().includes(s) || 
           (i.claimNo || '').toLowerCase().includes(s) || 
           (i.insuranceName || '').toLowerCase().includes(s)
  })

  const filteredAP = apInvoices.filter(i => {
    const s = searchAP.toLowerCase()
    return (i.invoiceNo || '').toLowerCase().includes(s) || 
           (i.claimNo || '').toLowerCase().includes(s) || 
           (i.vendorName || '').toLowerCase().includes(s)
  })

  const filteredExpense = expenses.filter(i => {
    const s = searchExpense.toLowerCase()
    return (i.claimNo || '').toLowerCase().includes(s) || 
           (i.description || '').toLowerCase().includes(s) || 
           (i.createdBy || '').toLowerCase().includes(s)
  })

  useEffect(() => {
    setCurrentPageAR(1)
  }, [searchAR])

  useEffect(() => {
    setCurrentPageAP(1)
  }, [searchAP])

  useEffect(() => {
    setCurrentPageExpense(1)
  }, [searchExpense])

  // Paginated AR
  const paginatedAR = useMemo(() => {
    const start = (currentPageAR - 1) * itemsPerPage
    return filteredAR.slice(start, start + itemsPerPage)
  }, [filteredAR, currentPageAR])
  const totalPagesAR = Math.ceil(filteredAR.length / itemsPerPage)
  const displayPagesAR = useMemo(() => {
    const pageNumbers = []
    for (let i = 1; i <= totalPagesAR; i++) pageNumbers.push(i)
    if (totalPagesAR <= 5) return pageNumbers
    let start = Math.max(1, currentPageAR - 2)
    let end = Math.min(totalPagesAR, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    return pageNumbers.slice(start - 1, end)
  }, [totalPagesAR, currentPageAR])

  // Paginated AP
  const paginatedAP = useMemo(() => {
    const start = (currentPageAP - 1) * itemsPerPage
    return filteredAP.slice(start, start + itemsPerPage)
  }, [filteredAP, currentPageAP])
  const totalPagesAP = Math.ceil(filteredAP.length / itemsPerPage)
  const displayPagesAP = useMemo(() => {
    const pageNumbers = []
    for (let i = 1; i <= totalPagesAP; i++) pageNumbers.push(i)
    if (totalPagesAP <= 5) return pageNumbers
    let start = Math.max(1, currentPageAP - 2)
    let end = Math.min(totalPagesAP, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    return pageNumbers.slice(start - 1, end)
  }, [totalPagesAP, currentPageAP])

  // Paginated Expense
  const paginatedExpense = useMemo(() => {
    const start = (currentPageExpense - 1) * itemsPerPage
    return filteredExpense.slice(start, start + itemsPerPage)
  }, [filteredExpense, currentPageExpense])
  const totalPagesExpense = Math.ceil(filteredExpense.length / itemsPerPage)
  const displayPagesExpense = useMemo(() => {
    const pageNumbers = []
    for (let i = 1; i <= totalPagesExpense; i++) pageNumbers.push(i)
    if (totalPagesExpense <= 5) return pageNumbers
    let start = Math.max(1, currentPageExpense - 2)
    let end = Math.min(totalPagesExpense, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    return pageNumbers.slice(start - 1, end)
  }, [totalPagesExpense, currentPageExpense])

  const toggleAllAR = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredAR.forEach(i => newSel[i.id] = true)
    }
    setArSelections(newSel)
  }

  const toggleAllAP = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredAP.forEach(i => newSel[i.id] = true)
    }
    setApSelections(newSel)
  }

  const toggleAllExpense = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredExpense.forEach(i => newSel[i.id] = true)
    }
    setExpenseSelections(newSel)
  }

  const categoryLabels: Record<string, string> = {
    shipping: 'ค่าส่งอะไหล่',
    handling: 'ค่าขนส่ง/ยก',
    towing: 'ค่ายกรถ/ลากรถ',
    paint_material: 'ค่าวัสดุสี',
    consumable: 'ค่าวัสดุสิ้นเปลือง',
    subcontract: 'ค่าจ้างช่วง',
    other: 'อื่นๆ',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Cloud className="w-6 h-6 text-[#1d4ed8]" />
            PEAK Interface
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">จัดการส่งข้อมูลบัญชีเข้าสู่ระบบ PEAK Account (Batch Sync)</p>
        </div>
      </div>

      <Tabs defaultValue="ar" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="ar" className="flex items-center gap-1.5">
            ใบแจ้งหนี้ (AR Invoices)
            <Badge className="ml-1 bg-blue-100 text-blue-700 border-none">{arInvoices.filter(i => !i.isSynced).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ap" className="flex items-center gap-1.5">
            ใบรับสินค้า (AP Invoices)
            <Badge className="ml-1 bg-amber-100 text-amber-700 border-none">{apInvoices.filter(i => !i.isSynced).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-1.5">
            ค่าใช้จ่าย (Expenses)
            <Badge className="ml-1 bg-violet-100 text-violet-700 border-none">{expenses.filter(i => !i.isSynced).length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: AR Invoices */}
        <TabsContent value="ar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base flex items-center gap-2">
                รายการรอส่งตั้งลูกหนี้ (AR)
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="ค้นหา Invoice, Claim, ลูกค้า..." 
                    value={searchAR}
                    onChange={(e) => setSearchAR(e.target.value)}
                    className="pl-9 h-9 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button size="sm" className="bg-[#1d4ed8]" disabled={isSyncing} onClick={handleSyncAR}>
                  {isSyncing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Cloud className="w-4 h-4 mr-1.5" />}
                  Export Excel ({Object.keys(arSelections).filter(k => arSelections[k]).length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8faff]">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        onChange={e => toggleAllAR(e.target.checked)}
                        checked={filteredAR.length > 0 && Object.keys(arSelections).filter(k => arSelections[k]).length === filteredAR.length}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[70px]">ลำดับที่</TableHead>
                    <TableHead>เลขที่เอกสาร</TableHead>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>ลูกค้า (บ.ประกัน)</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead className="text-right">ยอดรวม (บาท)</TableHead>
                    <TableHead className="text-center">สถานะ PEAK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAR.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={8} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการใบแจ้งหนี้</TableCell>
                     </TableRow>
                  ) : paginatedAR.map((inv: any, index: number) => (
                    <TableRow key={inv.id} className={arSelections[inv.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={!!arSelections[inv.id]}
                          onChange={e => setArSelections(prev => ({ ...prev, [inv.id]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-[#475569]">
                        {(currentPageAR - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-[#1d4ed8]">
                        {editingId === inv.id && editingType === 'AR' ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingVal}
                              onChange={(e) => setEditingVal(e.target.value)}
                              className="h-8 w-36 font-mono text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDocNo(inv.id, 'AR')
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => handleSaveDocNo(inv.id, 'AR')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => setEditingId(null)}
                            >
                              <span className="text-xs">✕</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{inv.invoiceNo}</span>
                            <button
                              onClick={() => {
                                setEditingId(inv.id)
                                setEditingVal(inv.invoiceNo || '')
                                setEditingType('AR')
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-1"
                              title="แก้ไขเลขที่เอกสาร"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#475569]">{inv.claimNo}</TableCell>
                      <TableCell>{inv.insuranceName}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{formatDate(inv.invoiceDate)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(inv.grandTotal)}</TableCell>
                      <TableCell className="text-center">
                        {inv.isSynced ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                            {inv.syncedAt && (
                              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{formatDateTime(inv.syncedAt)}</span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesAR > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
                  <div className="text-xs text-[#64748b]">
                    แสดง {(currentPageAR - 1) * itemsPerPage + 1} ถึง {Math.min(currentPageAR * itemsPerPage, filteredAR.length)} จาก {filteredAR.length} รายการ
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageAR(prev => Math.max(prev - 1, 1))}
                      disabled={currentPageAR === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    {displayPagesAR.map(page => (
                      <Button
                        key={page}
                        variant={currentPageAR === page ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 text-xs ${currentPageAR === page ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white"}`}
                        onClick={() => setCurrentPageAR(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageAR(prev => Math.min(prev + 1, totalPagesAR))}
                      disabled={currentPageAR === totalPagesAR}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: AP Invoices */}
        <TabsContent value="ap">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base flex items-center gap-2">
                รายการรอส่งตั้งเจ้าหนี้ (AP)
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="ค้นหา Invoice, Claim, ผู้จำหน่าย..." 
                    value={searchAP}
                    onChange={(e) => setSearchAP(e.target.value)}
                    className="pl-9 h-9 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button size="sm" className="bg-[#1d4ed8]" disabled={isSyncing} onClick={handleSyncAP}>
                  {isSyncing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Cloud className="w-4 h-4 mr-1.5" />}
                  Export Excel ({Object.keys(apSelections).filter(k => apSelections[k]).length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8faff]">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        onChange={e => toggleAllAP(e.target.checked)}
                        checked={filteredAP.length > 0 && Object.keys(apSelections).filter(k => apSelections[k]).length === filteredAP.length}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[70px]">ลำดับที่</TableHead>
                    <TableHead>เลขที่ Invoice</TableHead>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>ผู้จำหน่าย (Vendor)</TableHead>
                    <TableHead>วันที่รับของ</TableHead>
                    <TableHead className="text-right">ยอดรวม (บาท)</TableHead>
                    <TableHead className="text-center">สถานะ PEAK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAP.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={8} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการใบรับสินค้า (AP)</TableCell>
                     </TableRow>
                  ) : paginatedAP.map((inv: any, index: number) => (
                    <TableRow key={inv.id} className={apSelections[inv.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={!!apSelections[inv.id]}
                          onChange={e => setApSelections(prev => ({ ...prev, [inv.id]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-[#475569]">
                        {(currentPageAP - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-[#1d4ed8]">
                        {editingId === inv.id && (editingType === 'SUPPLIER' || editingType === 'GARAGE') ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingVal}
                              onChange={(e) => setEditingVal(e.target.value)}
                              className="h-8 w-36 font-mono text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDocNo(inv.id, inv.type)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => handleSaveDocNo(inv.id, inv.type)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => setEditingId(null)}
                            >
                              <span className="text-xs">✕</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{inv.invoiceNo}</span>
                            <button
                              onClick={() => {
                                setEditingId(inv.id)
                                setEditingVal(inv.invoiceNo || '')
                                setEditingType(inv.type)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-1"
                              title="แก้ไขเลขที่ Invoice"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#475569]">{inv.claimNo}</TableCell>
                      <TableCell>{inv.vendorName}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{formatDate(inv.invoiceDate || inv.createdAt)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-center">
                        {inv.isSynced ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                            {inv.syncedAt && (
                              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{formatDateTime(inv.syncedAt)}</span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesAP > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
                  <div className="text-xs text-[#64748b]">
                    แสดง {(currentPageAP - 1) * itemsPerPage + 1} ถึง {Math.min(currentPageAP * itemsPerPage, filteredAP.length)} จาก {filteredAP.length} รายการ
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageAP(prev => Math.max(prev - 1, 1))}
                      disabled={currentPageAP === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    {displayPagesAP.map(page => (
                      <Button
                        key={page}
                        variant={currentPageAP === page ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 text-xs ${currentPageAP === page ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white"}`}
                        onClick={() => setCurrentPageAP(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageAP(prev => Math.min(prev + 1, totalPagesAP))}
                      disabled={currentPageAP === totalPagesAP}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Expenses */}
        <TabsContent value="expense">
          <Card>
                   <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8faff]">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        onChange={e => toggleAllExpense(e.target.checked)}
                        checked={filteredExpense.length > 0 && Object.keys(expenseSelections).filter(k => expenseSelections[k]).length === filteredExpense.length}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[70px]">ลำดับที่</TableHead>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ผู้บันทึก</TableHead>
                    <TableHead className="text-right">ยอดเงิน (บาท)</TableHead>
                    <TableHead className="text-center">สถานะ PEAK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpense.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={9} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการค่าใช้จ่าย</TableCell>
                     </TableRow>
                  ) : paginatedExpense.map((exp: any, index: number) => (
                    <TableRow key={exp.id} className={expenseSelections[exp.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={!!expenseSelections[exp.id]}
                          onChange={e => setExpenseSelections(prev => ({ ...prev, [exp.id]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-[#475569]">
                        {(currentPageExpense - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-[#1d4ed8]">{exp.claimNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {categoryLabels[exp.category] || exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#475569]">{exp.description}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{formatDate(exp.date)}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{exp.createdBy}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(exp.amount)}</TableCell>
                      <TableCell className="text-center">
                        {exp.isSynced ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                            {exp.syncedAt && (
                              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{formatDateTime(exp.syncedAt)}</span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPagesExpense > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
                  <div className="text-xs text-[#64748b]">
                    แสดง {(currentPageExpense - 1) * itemsPerPage + 1} ถึง {Math.min(currentPageExpense * itemsPerPage, filteredExpense.length)} จาก {filteredExpense.length} รายการ
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageExpense(prev => Math.max(prev - 1, 1))}
                      disabled={currentPageExpense === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    {displayPagesExpense.map(page => (
                      <Button
                        key={page}
                        variant={currentPageExpense === page ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 text-xs ${currentPageExpense === page ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-white"}`}
                        onClick={() => setCurrentPageExpense(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white"
                      onClick={() => setCurrentPageExpense(prev => Math.min(prev + 1, totalPagesExpense))}
                      disabled={currentPageExpense === totalPagesExpense}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

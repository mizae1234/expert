'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Cloud, CheckCircle2, AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'

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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetch('/api/peak')
      .then(res => res.json())
      .then(data => {
        setArInvoices(data.arInvoices || [])
        setApInvoices(data.apInvoices || [])
        setExpenses(data.expenses || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

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

  const toggleAllAR = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredAR.filter(i => !i.isSynced).forEach(i => newSel[i.id] = true)
    }
    setArSelections(newSel)
  }

  const toggleAllAP = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredAP.filter(i => !i.isSynced).forEach(i => newSel[i.id] = true)
    }
    setApSelections(newSel)
  }

  const toggleAllExpense = (checked: boolean) => {
    const newSel: Record<string, boolean> = {}
    if (checked) {
      filteredExpense.filter(i => !i.isSynced).forEach(i => newSel[i.id] = true)
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
                        checked={filteredAR.filter(i => !i.isSynced).length > 0 && Object.keys(arSelections).filter(k => arSelections[k]).length === filteredAR.filter(i => !i.isSynced).length}
                      />
                    </TableHead>
                    <TableHead>เลขที่เอกสาร</TableHead>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>ลูกค้า (บ.ประกัน)</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead className="text-right">ยอดรวม (บาท)</TableHead>
                    <TableHead className="text-center">สถานะ PEAK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAR.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการใบแจ้งหนี้</TableCell>
                     </TableRow>
                  ) : filteredAR.map((inv: any) => (
                    <TableRow key={inv.id} className={arSelections[inv.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          disabled={inv.isSynced}
                          checked={!!arSelections[inv.id] || inv.isSynced}
                          onChange={e => setArSelections(prev => ({ ...prev, [inv.id]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium text-[#1d4ed8]">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{inv.claimNo}</TableCell>
                      <TableCell>{inv.insuranceName}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{formatDate(inv.invoiceDate)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(inv.grandTotal)}</TableCell>
                      <TableCell className="text-center">
                        {inv.isSynced ? (
                          <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                        checked={filteredAP.filter(i => !i.isSynced).length > 0 && Object.keys(apSelections).filter(k => apSelections[k]).length === filteredAP.filter(i => !i.isSynced).length}
                      />
                    </TableHead>
                    <TableHead>เลขที่ Invoice</TableHead>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>ผู้จำหน่าย (Vendor)</TableHead>
                    <TableHead>วันที่รับของ</TableHead>
                    <TableHead className="text-right">ยอดรวม (บาท)</TableHead>
                    <TableHead className="text-center">สถานะ PEAK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAP.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการใบรับสินค้า (AP)</TableCell>
                     </TableRow>
                  ) : filteredAP.map((inv: any) => (
                    <TableRow key={inv.id} className={apSelections[inv.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          disabled={inv.isSynced}
                          checked={!!apSelections[inv.id] || inv.isSynced}
                          onChange={e => setApSelections(prev => ({ ...prev, [inv.id]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium text-[#1d4ed8]">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{inv.claimNo}</TableCell>
                      <TableCell>{inv.vendorName}</TableCell>
                      <TableCell className="text-xs text-[#475569]">{formatDate(inv.invoiceDate || inv.createdAt)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-center">
                        {inv.isSynced ? (
                          <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Expenses */}
        <TabsContent value="expense">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base flex items-center gap-2">
                รายการค่าใช้จ่ายเพิ่มเติม (Expenses)
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="ค้นหา Claim, รายละเอียด, ผู้บันทึก..." 
                    value={searchExpense}
                    onChange={(e) => setSearchExpense(e.target.value)}
                    className="pl-9 h-9 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button size="sm" className="bg-[#1d4ed8]" disabled={isSyncing} onClick={handleSyncExpense}>
                  {isSyncing ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Cloud className="w-4 h-4 mr-1.5" />}
                  Export Excel ({Object.keys(expenseSelections).filter(k => expenseSelections[k]).length})
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
                        onChange={e => toggleAllExpense(e.target.checked)}
                        checked={filteredExpense.filter(i => !i.isSynced).length > 0 && Object.keys(expenseSelections).filter(k => expenseSelections[k]).length === filteredExpense.filter(i => !i.isSynced).length}
                      />
                    </TableHead>
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
                  {filteredExpense.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={8} className="text-center py-12 text-[#94a3b8]">ไม่มีรายการค่าใช้จ่าย</TableCell>
                     </TableRow>
                  ) : filteredExpense.map((exp: any) => (
                    <TableRow key={exp.id} className={expenseSelections[exp.id] ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          disabled={exp.isSynced}
                          checked={!!expenseSelections[exp.id] || exp.isSynced}
                          onChange={e => setExpenseSelections(prev => ({ ...prev, [exp.id]: e.target.checked }))}
                        />
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
                          <Badge className="bg-green-100 text-green-700 border-none gap-1"><CheckCircle2 className="w-3 h-3" />Synced</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none gap-1"><AlertTriangle className="w-3 h-3" />รอส่ง</Badge>
                        )}
                      </TableCell>
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

'use client'

import { useMemo, useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { Printer, ArrowLeft, Mail, Phone, Globe, User, ShieldCheck, FileText, CreditCard, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Fallback values matching mockup exactly if database settings are empty
const DEFAULT_COMPANY = {
  name: 'บริษัท เอ็กซ์เพิร์ท บอดี้แอนด์เพนท์ จำกัด',
  address: 'เลขที่ 622 ซอย ลาดพร้าว 47 (สะพาน2) แขวงสะพานสอง เขตวังทองหลาง กรุงเทพมหานคร 10310',
  taxId: '0105568142253',
  branchCode: '00000',
  branchName: 'สำนักงานใหญ่',
  phone: '082-160-6773',
  email: 'admin@expertbodypaint.com',
  website: '-',
  logoUrl: '',
  authorizedName: 'Vilaiphon Vamagun',
  authorizedPhone: '0624818114',
  authorizedEmail: 'vamagunv@gmail.com',
}

interface InvoiceRow {
  id: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  grandTotal: number
  billingAmount: number
  wht: string | number
  subtotal?: number
  vatAmount?: number
  deductible?: number
  claim: {
    claimNo: string
    carPlate: string
    carBrand: string
    carModel: string
    insuredName: string
    insurance: {
      id: string
      name: string
      address: string
      taxId: string
      branchCode: string
      creditTermArDays: number
    }
  }
}

// Thai Baht Text Generator
function bahtText(num: number): string {
  const numberText = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const unitText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  
  if (num === 0 || isNaN(num)) return 'ศูนย์บาทถ้วน'
  
  const str = num.toFixed(2).split('.')
  const baht = str[0]
  const satang = str[1]
  
  let bahtTextStr = ''
  
  const convert = (val: string) => {
    let result = ''
    const length = val.length
    for (let i = 0; i < length; i++) {
      const digit = parseInt(val.charAt(i), 10)
      const place = length - i - 1
      
      if (digit !== 0) {
        if (place === 1 && digit === 2) {
          result += 'ยี่'
        } else if (place === 1 && digit === 1) {
          result += ''
        } else if (place === 0 && digit === 1 && length > 1 && val.charAt(length - 2) !== '0') {
          result += 'เอ็ด'
        } else {
          result += numberText[digit]
        }
        result += unitText[place]
      }
    }
    return result
  }
  
  const convertBaht = (bahtStr: string) => {
    let result = ''
    const chunks = []
    let temp = bahtStr
    while (temp.length > 0) {
      const size = Math.min(6, temp.length)
      chunks.unshift(temp.substring(temp.length - size))
      temp = temp.substring(0, temp.length - size)
    }
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      result += convert(chunk)
      if (i < chunks.length - 1 && parseInt(chunk, 10) !== 0) {
        result += 'ล้าน'
      }
    }
    return result
  }
  
  bahtTextStr = convertBaht(baht)
  
  if (bahtTextStr !== '') {
    bahtTextStr += 'บาท'
  }
  
  if (satang === '00' || satang === '0') {
    bahtTextStr += 'ถ้วน'
  } else {
    bahtTextStr += convert(satang) + 'สตางค์'
  }
  
  return bahtTextStr
}

function BillingNoteContent() {
  const searchParams = useSearchParams()
  const idsStr = searchParams.get('ids')
  
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(DEFAULT_COMPANY)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  
  // Document Metadata State
  const [docNo, setDocNo] = useState('')
  const [docDate, setDocDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [reference, setReference] = useState('-')
  const [creditDays, setCreditDays] = useState(30)
  
  // Contact Back Info
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  
  // Customer Info
  const [custName, setCustName] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custTaxId, setCustTaxId] = useState('')
  const [custAttention, setCustAttention] = useState('-')
  
  // Footer Summary & Signature State
  const [exemptAmount, setExemptAmount] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [issuerName, setIssuerName] = useState('')
  const [approverName, setApproverName] = useState('')
  const [issuerDate, setIssuerDate] = useState('')
  const [approverDate, setApproverDate] = useState('')
  
  const hasTriggeredStatusUpdate = useRef(false)

  // Initialize page & load data
  useEffect(() => {
    if (!idsStr) {
      setLoading(false)
      return
    }

    const todayStr = new Date().toISOString().substring(0, 10)
    setDocDate(todayStr)
    
    // Default 30-day credit term initially
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    setDueDate(thirtyDaysLater.toISOString().substring(0, 10))

    Promise.all([
      fetch(`/api/invoices/batch?ids=${idsStr}`).then(res => res.json()),
      fetch('/api/settings/company').then(res => res.json()).catch(() => ({})),
      fetch('/api/invoices/next-bn', { method: 'POST' }).then(res => res.json()).catch(() => ({}))
    ]).then(([invoiceData, compData, nextBnData]) => {
      // Setup Company Profile
      const mergedCompany = { ...DEFAULT_COMPANY, ...compData }
      setCompany(mergedCompany)
      
      // Default Seller/Contact Info
      setContactName(mergedCompany.authorizedName || DEFAULT_COMPANY.authorizedName)
      setContactPhone(mergedCompany.authorizedPhone || mergedCompany.phone || DEFAULT_COMPANY.authorizedPhone)
      setContactEmail(mergedCompany.authorizedEmail || mergedCompany.email || DEFAULT_COMPANY.authorizedEmail)
      
      // Setup Signatures Name fallbacks
      setIssuerName(mergedCompany.authorizedName || DEFAULT_COMPANY.authorizedName)
      setApproverName(mergedCompany.authorizedName || DEFAULT_COMPANY.authorizedName)
      
      // Setup Remarks
      const bankName = mergedCompany.bankName || 'ธ.กสิกรไทย'
      const bankAccName = mergedCompany.bankAccountName || 'บจก. เอ็กซ์เพิร์ท บอดี้แอนด์เพนท์'
      const bankAcc = mergedCompany.bankAccount || '214-1-55266-2'
      const defaultRemarks = `กรุณาโอนเข้าบัญชี ${bankAccName}\n${bankName} สาขาเดอะ คริสตัล พาร์ค ออมทรัพย์ #${bankAcc}`
      setRemarks(defaultRemarks)
      
      // Setup Invoices List
      if (invoiceData && Array.isArray(invoiceData) && invoiceData.length > 0) {
        const mapped = invoiceData.map((inv: any) => ({
          ...inv,
          billingAmount: inv.grandTotal,
          wht: '-'
        }))
        setInvoices(mapped)
        
        // Calculate and set default exempt amount from invoice deductibles (as a negative value)
        const totalDeductible = invoiceData.reduce((sum: number, inv: any) => sum + (inv.deductible || 0), 0)
        setExemptAmount(-totalDeductible)
        
        // Setup Customer Info (from first invoice)
        const firstInv = mapped[0]
        let termDays = 30
        if (firstInv.claim && firstInv.claim.insurance) {
          const ins = firstInv.claim.insurance
          setCustName(ins.name || '')
          setCustAddress(ins.address || '')
          setCustTaxId(ins.taxId ? `${ins.taxId} (${ins.branchCode === '00000' || !ins.branchCode ? 'สำนักงานใหญ่' : `สาขา ${ins.branchCode}`})` : '')
          
          if (ins.creditTermArDays !== undefined && ins.creditTermArDays !== null) {
            termDays = Number(ins.creditTermArDays)
          }
        }
        setCreditDays(termDays)
        
        // Calculate due date based on termDays
        const d = new Date()
        d.setDate(d.getDate() + termDays)
        setDueDate(d.toISOString().substring(0, 10))
        
        // Setup Reference field (e.g. claim numbers list or single claim number)
        const claimNos = Array.from(new Set(mapped.map(i => i.claim?.claimNo).filter(Boolean)))
        setReference(claimNos.join(', ') || '-')
      }
      
      // Setup Document Number
      if (nextBnData && nextBnData.documentNo) {
        setDocNo(nextBnData.documentNo)
      } else {
        // Fallback document number format if API fails
        const yyyymm = new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0')
        setDocNo(`BN-${yyyymm}00001`)
      }
      
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [idsStr])

  // Trigger batch status update to SENT once loaded successfully
  useEffect(() => {
    if (!loading && invoices.length > 0 && !hasTriggeredStatusUpdate.current && idsStr) {
      hasTriggeredStatusUpdate.current = true
      const ids = idsStr.split(',')
      
      fetch('/api/invoices/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'SENT' })
      })
      .then(res => {
        if (!res.ok) console.error('Failed to auto-update invoices status to SENT')
      })
      .catch(err => console.error('Error updating status:', err))
    }
  }, [loading, invoices, idsStr])

  // Update signature dates when docDate changes
  useEffect(() => {
    if (docDate) {
      const formatted = formatDate(docDate)
      setIssuerDate(formatted)
      setApproverDate(formatted)
    }
  }, [docDate])

  // Calculations
  const totalAmount = useMemo(() => invoices.reduce((sum, inv) => sum + inv.grandTotal, 0), [invoices])
  const totalBilling = useMemo(() => invoices.reduce((sum, inv) => sum + Number(inv.billingAmount || 0), 0), [invoices])
  
  const taxableAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      if (Number(inv.billingAmount) === inv.grandTotal) {
        return sum + (inv.subtotal || 0)
      }
      const ratio = inv.grandTotal > 0 ? (Number(inv.billingAmount || 0) / inv.grandTotal) : 0
      return sum + ((inv.subtotal || 0) * ratio)
    }, 0)
  }, [invoices])

  const vatAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      if (Number(inv.billingAmount) === inv.grandTotal) {
        return sum + (inv.vatAmount || 0)
      }
      const ratio = inv.grandTotal > 0 ? (Number(inv.billingAmount || 0) / inv.grandTotal) : 0
      return sum + ((inv.vatAmount || 0) * ratio)
    }, 0)
  }, [invoices])

  const grandTotalAmount = taxableAmount + vatAmount + exemptAmount

  const totalWht = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const val = Number(inv.wht)
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }, [invoices])

  const netAmount = grandTotalAmount - totalWht
  const netAmountBahtText = useMemo(() => bahtText(grandTotalAmount), [grandTotalAmount])



  // Inline changes handlers
  const handleRowChange = (id: string, field: 'billingAmount' | 'wht', value: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv
      if (field === 'billingAmount') {
        return { ...inv, billingAmount: value === '' ? 0 : Number(value) }
      } else {
        return { ...inv, wht: value === '' ? '-' : (isNaN(Number(value)) ? value : Number(value)) }
      }
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    window.close()
    // Fallback if not opened in a new tab
    window.location.href = '/invoices'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3 font-sans">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">กำลังเตรียมพิมพ์ใบวางบิล...</p>
      </div>
    )
  }

  if (!idsStr || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 font-sans">
        <div className="text-red-500 font-bold text-lg">⚠️ ไม่พบข้อมูลสำหรับออกใบวางบิล</div>
        <button onClick={handleBack} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">
          ย้อนกลับไปหน้า Invoice
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800 antialiased print:bg-white print:p-0 print:py-0">
      
      {/* Google Font link inside the component to ensure it loads */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-sans {
          font-family: 'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Printable area custom overrides */
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-shadow {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .print-container {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            width: 100% !important;
            resize: none !important;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none;
          }
          .print-border-hide {
            border: none !important;
          }
          .badge-print {
            border: none !important;
            background: transparent !important;
            color: black !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Control Panel (Hidden on print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-sky-50 text-sky-800 px-3 py-1.5 rounded-full border border-sky-100">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>ใบแจ้งหนี้ถูกปรับเป็น "รอรับชำระ" แล้วอัตโนมัติ</span>
          </div>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร
          </button>
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <div className="print-container print-shadow max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-xl border border-slate-200/60 min-h-[297mm] flex flex-col justify-between relative">
        
        {/* TOP SECTION: Logo and Title */}
        <div>
          <div className="flex justify-between items-start mb-6">
            
            {/* Logo area */}
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 flex items-center justify-center rounded overflow-hidden bg-slate-50 border border-slate-100">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  // Custom clean fallback logo matching "EXPERT BODY PAINT" theme
                  <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 55C20 55 24 45 40 40C56 35 78 40 85 45C92 50 90 55 90 55H20Z" fill="#0284c7" />
                    <circle cx="35" cy="55" r="8" fill="#f97316" stroke="white" strokeWidth="2" />
                    <circle cx="75" cy="55" r="8" fill="#f97316" stroke="white" strokeWidth="2" />
                    <text x="50%" y="85" dominantBaseline="middle" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">EXPERT</text>
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">EXPERT BODY PAINT</h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider">CO., LTD.</p>
              </div>
            </div>

            {/* Document Header Text */}
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium no-print">หน้า 1/1 (ต้นฉบับ)</div>
              <div className="text-xs text-slate-700 font-semibold hidden print:block">หน้า 1/1 (ต้นฉบับ)</div>
              <h2 className="text-3xl font-bold text-[#0284c7] tracking-wide mt-1">ใบวางบิล</h2>
            </div>
          </div>

          {/* Seller / Header Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 border-b border-slate-200 pb-6 mb-6">
            
            {/* Seller Info (Left) */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 w-16 shrink-0">ผู้ขาย :</span>
                <input 
                  type="text" 
                  value={company.name} 
                  onChange={e => setCompany({...company, name: e.target.value})} 
                  className="w-full font-bold text-slate-800 bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-slate-800 w-16 shrink-0 mt-0.5">ที่อยู่ :</span>
                <textarea 
                  rows={2}
                  value={company.address} 
                  onChange={e => setCompany({...company, address: e.target.value})} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 w-16 shrink-0">เลขที่ภาษี :</span>
                <input 
                  type="text" 
                  value={`${company.taxId} (${company.branchName || 'สำนักงานใหญ่'})`} 
                  onChange={e => setCompany({...company, taxId: e.target.value})} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
            </div>

            {/* Seller Contact Info (Right column of Seller Block) */}
            <div className="flex flex-col justify-end space-y-1.5 text-xs text-slate-600 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={company.phone} 
                  onChange={e => setCompany({...company, phone: e.target.value})} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={company.email} 
                  onChange={e => setCompany({...company, email: e.target.value})} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={company.website} 
                  onChange={e => setCompany({...company, website: e.target.value})} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
            </div>
          </div>

          {/* Customer & Document Metadata Info Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start mb-6">
            
            {/* Customer Details */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 w-16 shrink-0">ลูกค้า :</span>
                <input 
                  type="text" 
                  value={custName} 
                  onChange={e => setCustName(e.target.value)} 
                  className="w-full font-bold text-slate-800 bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-slate-800 w-16 shrink-0 mt-0.5">ที่อยู่ :</span>
                <textarea 
                  rows={2}
                  value={custAddress} 
                  onChange={e => setCustAddress(e.target.value)} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 w-16 shrink-0">เลขที่ภาษี :</span>
                <input 
                  type="text" 
                  value={custTaxId} 
                  onChange={e => setCustTaxId(e.target.value)} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 w-16 shrink-0">เรียน :</span>
                <input 
                  type="text" 
                  value={custAttention} 
                  onChange={e => setCustAttention(e.target.value)} 
                  className="w-full bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
            </div>

            {/* Document Metadata Panel (Styled Light Blue Box) */}
            <div className="bg-[#e0f2fe]/60 border border-sky-100 rounded-xl p-4 space-y-2 text-xs print:bg-[#e0f2fe]/30">
              <div className="grid grid-cols-[90px_1fr] items-baseline gap-1.5">
                <span className="font-semibold text-slate-800">เลขที่เอกสาร :</span>
                <input 
                  type="text" 
                  value={docNo} 
                  onChange={e => setDocNo(e.target.value)} 
                  className="font-bold text-slate-900 bg-white/70 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
              <div className="grid grid-cols-[90px_1fr] items-baseline gap-1.5">
                <span className="font-semibold text-slate-800">วันที่ออก :</span>
                <input 
                  type="date" 
                  value={docDate} 
                  onChange={e => {
                    const newDate = e.target.value
                    setDocDate(newDate)
                    if (newDate) {
                      const d = new Date(newDate)
                      d.setDate(d.getDate() + creditDays)
                      setDueDate(d.toISOString().substring(0, 10))
                    }
                  }} 
                  className="font-medium text-slate-800 bg-white/70 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide w-full"
                />
              </div>
              <div className="grid grid-cols-[90px_1fr] items-baseline gap-1.5">
                <span className="font-semibold text-slate-800">วันที่ครบกำหนด :</span>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  className="font-medium text-slate-800 bg-white/70 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide w-full"
                />
              </div>
              <div className="grid grid-cols-[90px_1fr] items-baseline gap-1.5">
                <span className="font-semibold text-slate-800">อ้างอิง :</span>
                <input 
                  type="text" 
                  value={reference} 
                  onChange={e => setReference(e.target.value)} 
                  className="font-medium text-slate-800 bg-white/70 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide"
                />
              </div>
            </div>
          </div>

          {/* Contact Person Back Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-b border-slate-200/80 py-3 mb-6 gap-3">
            <div className="text-xs font-semibold text-[#0284c7] flex items-center gap-1.5">
              <span>ติดต่อกลับที่ :</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={contactName} 
                  onChange={e => setContactName(e.target.value)} 
                  placeholder="ผู้ติดต่อ"
                  className="w-36 bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={contactPhone} 
                  onChange={e => setContactPhone(e.target.value)} 
                  placeholder="เบอร์โทรศัพท์"
                  className="w-28 bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={contactEmail} 
                  onChange={e => setContactEmail(e.target.value)} 
                  placeholder="อีเมล"
                  className="w-48 bg-slate-50/50 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* TABLE OF INVOICES */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#e0f2fe] text-slate-800 border-b border-sky-200 font-semibold print:bg-[#e0f2fe]/40">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3">เลขที่เอกสาร</th>
                  <th className="py-2.5 px-3 text-center w-24">วันที่เอกสาร</th>
                  <th className="py-2.5 px-3 text-center w-24">วันที่ครบกำหนด</th>
                  <th className="py-2.5 px-3 text-right w-28">จำนวนเงินทั้งสิ้น</th>
                  <th className="py-2.5 px-3 text-right w-28">จำนวนเงินวางบิล</th>
                  <th className="py-2.5 px-3 text-center w-20">WHT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{inv.invoiceNo}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {formatDate(inv.dueDate || (() => {
                        const termDays = inv.claim?.insurance?.creditTermArDays ?? 30
                        const d = new Date(inv.invoiceDate)
                        d.setDate(d.getDate() + termDays)
                        return d
                      })())}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">฿{formatCurrency(inv.grandTotal)}</td>
                    
                    {/* Editable Billing Amount */}
                    <td className="py-1 px-3 text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-400 mr-0.5">฿</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={inv.billingAmount === 0 ? '' : inv.billingAmount}
                          onChange={e => handleRowChange(inv.id, 'billingAmount', e.target.value)}
                          className="w-24 text-right bg-slate-50/70 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide font-semibold text-slate-800"
                        />
                      </div>
                    </td>

                    {/* Editable WHT */}
                    <td className="py-1 px-3 text-center">
                      <input 
                        type="text" 
                        value={inv.wht}
                        onChange={e => handleRowChange(inv.id, 'wht', e.target.value)}
                        className="w-16 text-center bg-slate-50/70 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-medium text-slate-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION: Totals and Signatures */}
        <div className="mt-8 space-y-8">
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
            .font-signature {
              font-family: 'Dancing Script', cursive;
            }
          ` }} />

          {/* 1. สรุป (Summary Block) */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-[120px_1fr] gap-4 items-start">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>สรุป</span>
            </div>
            <div className="grid grid-cols-[1fr_320px] gap-6">
              {/* Left calculations */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">มูลค่าไม่มีหรือยกเว้นภาษี</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={exemptAmount === 0 ? '' : exemptAmount}
                      onChange={e => setExemptAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-28 text-right bg-slate-50/70 focus:bg-white hover:bg-slate-50 focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5 border border-dashed border-slate-300 print-border-hide font-semibold text-slate-800"
                      placeholder="0.00"
                    />
                    <span className="text-slate-500">บาท</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">มูลค่าที่คำนวณภาษี 7%</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(taxableAmount)} บาท</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ภาษีมูลค่าเพิ่ม 7%</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(vatAmount)} บาท</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
                  <span className="text-slate-650">จำนวนเงินทั้งสิ้น</span>
                  <span className="text-slate-650 italic">({netAmountBahtText})</span>
                </div>
              </div>

              {/* Right blue box */}
              <div className="bg-sky-50/60 border border-sky-100/80 rounded-lg p-4 space-y-2.5 text-xs print:bg-sky-50/10 print:border-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">จำนวนเงินทั้งสิ้น</span>
                  <span className="text-base font-bold text-sky-900 print:text-black">{formatCurrency(grandTotalAmount)} บาท</span>
                </div>
                <div className="flex justify-between border-t border-sky-100 pt-2">
                  <span className="text-slate-500">จำนวนเงินที่ถูกหัก ณ ที่จ่าย</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(totalWht)} บาท</span>
                </div>
                <div className="flex justify-between font-bold text-sky-900 border-t border-sky-200 pt-2 text-sm print:text-black">
                  <span>จำนวนเงินที่ชำระ</span>
                  <span>{formatCurrency(netAmount)} บาท</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ชำระเงิน (Payment Options) */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-[120px_1fr] gap-4 items-start">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>ชำระเงิน</span>
            </div>
            <div className="flex items-center gap-4 bg-slate-50/50 rounded-lg p-3 border border-slate-100 max-w-xl print:bg-transparent print:p-0 print:border-none">
              {(company.bankName?.includes('กสิกร') || company.bankName?.toLowerCase().includes('kasikorn')) ? (
                <div className="w-10 h-10 rounded-full bg-[#138f2d] border-2 border-[#e01b22] flex items-center justify-center text-white font-bold text-lg select-none shadow-sm flex-shrink-0">
                  K
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-800 text-[13px]">{company.bankName || 'ธนาคารกสิกรไทย'}</p>
                <p className="text-slate-650 font-medium">ออมทรัพย์ &nbsp;{company.bankAccount || '214-1-55266-2'}</p>
                <p className="text-slate-500 font-semibold">{company.bankAccountName || 'บริษัท เอ็กซ์เพิร์ท บอดี้แอนด์เพนท์ จำกัด'}</p>
              </div>
            </div>
          </div>

          {/* 3. หมายเหตุ (Remarks) */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-[120px_1fr] gap-4 items-start">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>หมายเหตุ</span>
            </div>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full text-xs text-slate-600 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-2 py-1.5 border border-dashed border-slate-300 print-border-hide resize-none leading-relaxed max-w-xl"
              placeholder="กรอกหมายเหตุเพิ่มเติม..."
            />
          </div>

          {/* 4. รับรอง (Signatures Row) */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-[120px_1fr] gap-4 items-start">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>รับรอง</span>
            </div>
            <div className="grid grid-cols-[1.1fr_1.1fr_90px_1.5fr_90px] gap-4 items-end text-xs">
              {/* Issuer Signature Block */}
              <div className="text-center flex flex-col justify-end h-full">
                <span className="text-[9px] font-semibold text-slate-500 mb-2 leading-none block">ผู้ออกเอกสาร (ผู้ขาย)</span>
                <div className="h-10 flex items-center justify-center relative">
                  {company.signatureUrl ? (
                    <img src={company.signatureUrl} alt="Signature" className="max-h-10 object-contain mix-blend-multiply" />
                  ) : (
                    <span className="font-signature text-2xl text-sky-800 italic select-none">{issuerName.split(' ')[0]}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={issuerName}
                  onChange={e => setIssuerName(e.target.value)}
                  className="w-full text-center bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-semibold text-slate-850 mt-1 text-[11px]"
                  placeholder="ชื่อผู้ออกเอกสาร"
                />
                <input
                  type="text"
                  value={issuerDate}
                  onChange={e => setIssuerDate(e.target.value)}
                  className="w-full text-center bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide text-slate-450 mt-0.5 text-[9px]"
                  placeholder="วันที่"
                />
              </div>

              {/* Approver Signature Block */}
              <div className="text-center flex flex-col justify-end h-full">
                <span className="text-[9px] font-semibold text-slate-500 mb-2 leading-none block">ผู้อนุมัติเอกสาร (ผู้ขาย)</span>
                <div className="h-10 flex items-center justify-center relative">
                  {company.signatureUrl ? (
                    <img src={company.signatureUrl} alt="Signature" className="max-h-10 object-contain mix-blend-multiply" />
                  ) : (
                    <span className="font-signature text-2xl text-sky-800 italic select-none">{approverName.split(' ')[0]}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  className="w-full text-center bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide font-semibold text-slate-850 mt-1 text-[11px]"
                  placeholder="ชื่อผู้อนุมัติ"
                />
                <input
                  type="text"
                  value={approverDate}
                  onChange={e => setApproverDate(e.target.value)}
                  className="w-full text-center bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-sky-500 rounded px-1 py-0.5 border border-dashed border-slate-300 print-border-hide text-slate-450 mt-0.5 text-[9px]"
                  placeholder="วันที่"
                />
              </div>

              {/* Seller Stamp Block */}
              <div className="text-center flex flex-col items-center justify-end h-full">
                <span className="text-[9px] font-semibold text-slate-500 mb-2 leading-none block">ตราประทับ (ผู้ขาย)</span>
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 select-none bg-slate-50/20">
                  ตราประทับ
                </div>
              </div>

              {/* Recipient Signature Block */}
              <div className="text-center flex flex-col justify-end h-full">
                <span className="text-[9px] font-semibold text-slate-500 mb-2 leading-none block">ผู้รับเอกสาร (ลูกค้า)</span>
                <div className="h-10 flex items-end justify-center pb-1 border-b border-dashed border-slate-300">
                  <span className="text-slate-300 text-[10px] select-none">ลงชื่อผู้รับเอกสาร</span>
                </div>
                <p className="font-semibold text-slate-700 mt-2 text-[10px] line-clamp-2 max-w-[130px] mx-auto leading-tight min-h-[24px]">{custName || 'บริษัทประกันภัย'}</p>
                <div className="text-[9px] text-slate-450 mt-0.5 font-medium">วันที่นัดรับ / นัดชำระ</div>
              </div>

              {/* Customer Stamp Block */}
              <div className="text-center flex flex-col items-center justify-end h-full">
                <span className="text-[9px] font-semibold text-slate-500 mb-2 leading-none block">ตราประทับ (ลูกค้า)</span>
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 select-none bg-slate-50/20">
                  ตราประทับ
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}


export default function PrintBillingNotePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3 font-sans">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">กำลังเตรียมข้อมูล...</p>
      </div>
    }>
      <BillingNoteContent />
    </Suspense>
  )
}

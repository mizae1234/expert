'use client'

import { useMemo, useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'

const DEFAULT_COMPANY = {
  name: '',
  nameEn: '',
  taxId: '',
  branchCode: '00000',
  branchName: 'สำนักงานใหญ่',
  address: '',
  phone: '',
  email: '',
  logoUrl: '',
  authorizedName: '',
  authorizedTitle: '',
  signatureUrl: '',
}

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

export default function PDFMockPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const claimId = params.id as string
  const type = params.type as string
  const qtId = searchParams.get('qtId')
  const poId = searchParams.get('poId')
  const preview = searchParams.get('preview') === 'true'

  const [claim, setClaim] = useState<any>(null)
  const [quotation, setQuotation] = useState<any>(null)
  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(DEFAULT_COMPANY)

  useEffect(() => {
    Promise.all([
      fetch(`/api/claims/${claimId}`).then(res => res.json()),
      fetch('/api/settings/company').then(res => res.json()).catch(() => ({}))
    ]).then(([data, compData]) => {
      setClaim(data.error ? null : data)
      if (qtId && data.quotations) {
        setQuotation(data.quotations.find((q: any) => q.id === qtId))
      }
      if (poId && data.purchaseOrders) {
        setPo(data.purchaseOrders.find((p: any) => p.id === poId))
      }
      if (compData && compData.id) {
        setCompany(compData)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [claimId, qtId])

  const hasPrinted = useRef(false)

  useEffect(() => {
    // Auto print when loaded — only once, and if not in preview mode
    if (claim && !loading && !hasPrinted.current && !preview) {
      hasPrinted.current = true
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [claim, loading, preview])

  if (loading) return <div className="p-8 text-center animate-pulse">กำลังโหลดเอกสาร...</div>
  if (!claim) return <div className="p-8 text-center">ไม่พบข้อมูล Claim</div>

  const renderHeader = (title: string, docNo: string, date: string) => (
    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 flex items-center justify-center font-bold text-gray-400 rounded overflow-hidden">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            'LOGO'
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-xs text-gray-600 mt-1">{company.address}</p>
          <p className="text-xs text-gray-600">โทร. {company.phone} | เลขประจำตัวผู้เสียภาษี: {company.taxId} ({company.branchName})</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="text-right">เลขที่เอกสาร:</span>
          <span className="font-semibold text-gray-900">{docNo}</span>
          <span className="text-right">วันที่:</span>
          <span className="font-semibold text-gray-900">{formatDate(date)}</span>
        </div>
      </div>
    </div>
  )

  const renderCustomerInfo = () => (
    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2 border-b pb-1">ข้อมูลลูกค้า / ผู้เอาประกัน</h3>
        <p><span className="text-gray-500 w-24 inline-block">ชื่อ-นามสกุล:</span> {claim.insuredName}</p>
        <p><span className="text-gray-500 w-24 inline-block">ทะเบียนรถ:</span> {claim.carPlate}</p>
        <p><span className="text-gray-500 w-24 inline-block">ยี่ห้อ/รุ่น:</span> {claim.carBrand} {claim.carModel}</p>
        <p><span className="text-gray-500 w-24 inline-block">บริษัทประกัน:</span> {claim.insurance?.name}</p>
      </div>
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2 border-b pb-1">อ้างอิง</h3>
        <p><span className="text-gray-500 w-24 inline-block">Claim No:</span> {claim.claimNo}</p>
        <p><span className="text-gray-500 w-24 inline-block">วันที่รับรถ:</span> {formatDate(claim.createdAt)}</p>
      </div>
    </div>
  )

  if (type === 'quotation') {
    if (!quotation) return <div className="p-8 text-center">ไม่พบใบเสนอราคา</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบเสนอราคา', quotation.quotationNo, quotation.quotationDate)}
        {renderCustomerInfo()}

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2">ลำดับ</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-center">ประเภท</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-right">ราคา/หน่วย</th>
              <th className="py-2 px-2 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50"><td colSpan={6} className="py-1 px-2 font-semibold">รายการค่าแรง</td></tr>
            {(quotation.laborItems || []).map((l: any, i: number) => (
              <tr key={l.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2">{l.description}</td>
                <td className="py-2 px-2 text-center">ค่าแรง</td>
                <td className="py-2 px-2 text-right">1</td>
                <td className="py-2 px-2 text-right">{formatCurrency(l.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(l.totalPrice)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50"><td colSpan={6} className="py-1 px-2 font-semibold">รายการค่าอะไหล่</td></tr>
            {(quotation.partItems || []).map((p: any, i: number) => (
              <tr key={p.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2">{p.partName} <span className="text-gray-400 text-xs">({p.partNo})</span></td>
                <td className="py-2 px-2 text-center">อะไหล่</td>
                <td className="py-2 px-2 text-right">{p.quantity}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(p.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(p.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm border rounded p-4">
            <div className="flex justify-between"><span className="text-gray-600">รวมค่าแรง</span><span>{formatCurrency(quotation.laborTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">รวมค่าอะไหล่</span><span>{formatCurrency(quotation.partsTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">มูลค่าก่อนภาษี</span><span>{formatCurrency(quotation.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7%</span><span>{formatCurrency(quotation.vatAmount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>ยอดรวมทั้งสิ้น</span><span>{formatCurrency(quotation.grandTotal)}</span></div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้เสนอราคา</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้อนุมัติ (บริษัทประกัน)</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'insurance-invoice') {
    const inv = claim.insuranceInvoice
    if (!inv) return <div className="p-8 text-center">ยังไม่ได้ออกใบวางบิล</div>

    const companyName = company.name || '-'
    const companyAddress = [
      company.address,
      company.subDistrict,
      company.district,
      company.province,
      company.postalCode
    ].filter(Boolean).join(' ').trim() || '-'
    const companyTaxId = company.taxId || '-'
    const companyPhone = company.phone || '-'
    const companyEmail = company.email || '-'
    const companyWebsite = company.website || '-'

    // Prepare table items from claim.labors and claim.parts
    const tableItems: any[] = []
    
    if (claim.labors && claim.labors.length > 0) {
      claim.labors.forEach((l: any) => {
        const discountAmount = l.priceOffer > l.priceApprove ? (l.priceOffer - l.priceApprove) : 0
        tableItems.push({
          title: 'ค่าแรงซ่อมศูนย์GI (P00034)',
          description: l.description,
          quantity: 1,
          price: l.priceOffer || l.priceApprove,
          discount: discountAmount,
          vat: '7%',
          total: l.priceApprove
        })
      })
    } else if (inv.laborTotal > 0) {
      tableItems.push({
        title: 'ค่าแรงซ่อมศูนย์GI (P00034)',
        description: 'ค่าแรงซ่อมรถยนต์',
        quantity: 1,
        price: inv.laborTotal,
        discount: 0,
        vat: '7%',
        total: inv.laborTotal
      })
    }

    if (claim.parts && claim.parts.length > 0) {
      claim.parts.forEach((p: any) => {
        const discountAmount = p.priceOffer > p.priceApprove ? (p.priceOffer - p.priceApprove) : 0
        tableItems.push({
          title: 'ค่าอะไหล่ศูนย์GI (P00032)',
          description: p.partName,
          quantity: p.quantity || 1,
          price: p.priceOffer || p.priceApprove,
          discount: discountAmount,
          vat: '7%',
          total: p.priceApprove * (p.quantity || 1)
        })
      })
    } else if (inv.partsTotal > 0) {
      tableItems.push({
        title: 'ค่าอะไหล่ศูนย์GI (P00032)',
        description: 'ค่าอะไหล่รถยนต์',
        quantity: 1,
        price: inv.partsTotal,
        discount: 0,
        vat: '7%',
        total: inv.partsTotal
      })
    }

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-6">
        {/* Header Title Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-white flex items-center justify-center font-bold text-gray-400 rounded overflow-hidden flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full border border-dashed border-gray-300 flex items-center justify-center text-xs font-semibold">LOGO</div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{companyName}</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-bold text-2xl flex items-baseline gap-1 justify-end">
              <span>ใบแจ้งหนี้/ใบกำกับภาษี</span>
            </div>
            <div className="text-xs text-slate-550 font-medium text-right mt-1">(ต้นฉบับ)</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-6 mb-6 text-[11px] leading-relaxed">
          {/* Left Side: Seller & Customer info */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="border-b border-slate-200 pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-550">ผู้ขาย :</span>
                <span className="font-bold text-slate-800">{companyName}</span>
                <span className="font-semibold text-slate-550">ที่อยู่ :</span>
                <span className="text-slate-650">{companyAddress}</span>
                <span className="font-semibold text-slate-550">เลขที่ภาษี :</span>
                <span className="text-slate-650">{companyTaxId} ({company.branchName || 'สำนักงานใหญ่'})</span>
              </div>
              <div className="flex gap-4 text-slate-500 pt-1 text-[10px]">
                <span>📞 {companyPhone}</span>
                <span>✉️ {companyEmail}</span>
                <span>🌐 {companyWebsite}</span>
              </div>
            </div>

            {/* Customer */}
            <div className="pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-550">ลูกค้า :</span>
                <span className="font-bold text-slate-800">
                  {claim.insurance?.peakCustomerId ? `${claim.insurance.peakCustomerId} ` : ''}
                  {claim.insurance?.name}
                </span>
                <span className="font-semibold text-slate-550">ที่อยู่ :</span>
                <span className="text-slate-650">{claim.insurance?.address || '-'}</span>
                <span className="font-semibold text-slate-550">เลขที่ภาษี :</span>
                <span className="text-slate-650">{claim.insurance?.taxId || '-'} {claim.insurance?.branchCode ? `(${claim.insurance.branchCode === '00000' ? 'สำนักงานใหญ่' : claim.insurance.branchCode})` : ''}</span>
              </div>
              <div className="flex gap-4 text-slate-500 pt-1 text-[10px]">
                <span>📞 -</span>
                <span>✉️ -</span>
                <span>🌐 -</span>
              </div>
            </div>
          </div>

          {/* Right Side: Document info & Contact */}
          <div className="space-y-4">
            {/* Invoice Meta */}
            <div className="bg-[#eef2ff] border border-blue-100 rounded-lg p-3.5 space-y-1.5 text-xs">
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">เลขที่เอกสาร :</span>
                <span className="font-bold text-slate-850">{inv.invoiceNo}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">วันที่ออก :</span>
                <span className="font-semibold text-slate-800">{formatDate(inv.invoiceDate)}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">อ้างอิง :</span>
                <span className="font-semibold text-slate-800">{claim.carPlate} {claim.province}</span>
              </div>
            </div>

            {/* Contact Back */}
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-1.5">
              <div className="font-semibold text-slate-700">ติดต่อกลับที่ :</div>
              <div className="grid grid-cols-[20px_1fr] gap-x-1 items-center text-slate-650">
                <span>👤</span>
                <span className="font-medium text-slate-800">{company.authorizedName || 'Vilaiphon Vamagun'}</span>
                <span>📞</span>
                <span className="font-medium text-slate-800">{company.phone || '0624818114'}</span>
                <span>✉️</span>
                <span className="text-slate-700">{company.email || 'vamagunv@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs mb-8 border-collapse">
          <thead>
            <tr className="bg-[#e0f2fe] text-left border-t border-b border-slate-200">
              <th className="py-2.5 px-3 text-slate-700 font-semibold">คำอธิบาย</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-16">จำนวน</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-24">ราคา</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-16">ส่วนลด</th>
              <th className="py-2.5 px-3 text-center text-slate-700 font-semibold w-16">VAT</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-28">มูลค่าก่อนภาษี</th>
            </tr>
          </thead>
          <tbody>
            {tableItems.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-b-2 last:border-slate-350">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 pl-4">{item.description}</div>
                </td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{item.quantity.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatCurrency(item.price)}</td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatCurrency(item.discount)}</td>
                <td className="py-3 px-3 text-center text-slate-700 font-mono">{item.vat}</td>
                <td className="py-3 px-3 text-right text-slate-850 font-bold font-mono">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Sections */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-6 mb-6 text-[11px]">
          {/* Left summary card */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/20">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <span>📋 สรุป</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>มูลค่าที่คำนวณภาษี 7%</span>
              <span className="font-semibold text-slate-800">{formatCurrency(inv.subtotal)} บาท</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span className="font-semibold text-slate-800">{formatCurrency(inv.vatAmount)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
              <span className="text-slate-650">จำนวนเงินทั้งสิ้น</span>
              <span className="text-slate-600 italic">({bahtText(inv.grandTotal)})</span>
            </div>
          </div>

          {/* Right summary card (highlighted) */}
          <div className="bg-[#eef2ff] border border-blue-100 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">จำนวนเงินทั้งสิ้น</span>
              <span className="text-sm font-bold text-blue-900">{formatCurrency(inv.grandTotal)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-blue-50 pt-2">
              <span className="text-slate-500 font-medium">จำนวนเงินที่ถูกหัก ณ ที่จ่าย</span>
              <span className="font-semibold text-slate-700">0.00 บาท</span>
            </div>
            <div className="flex justify-between font-bold text-blue-950 border-t border-blue-100 pt-2 text-xs">
              <span>จำนวนเงินที่ชำระ</span>
              <span>{formatCurrency(inv.grandTotal)} บาท</span>
            </div>
          </div>
        </div>

        {/* Payment options */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-[100px_1fr] gap-4 items-center mb-6 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-850">
            <span>💳 ชำระเงิน</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-50/50 rounded-lg p-2.5 border border-slate-150 max-w-sm">
            {company.bankName && (company.bankName.includes('กสิกร') || company.bankName.toLowerCase().includes('kasikorn')) ? (
              <div className="w-8 h-8 rounded-full bg-[#138f2d] border-2 border-[#e01b22] flex items-center justify-center text-white font-extrabold text-sm select-none shadow-sm flex-shrink-0">
                K
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0 text-sm">
                🏦
              </div>
            )}
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800">{company.bankName || '-'}</div>
              <div className="text-slate-650">
                {company.bankAccount && <span className="font-medium text-slate-500 mr-1.5">ออมทรัพย์</span>}
                <span className="font-mono text-slate-800 font-semibold">{company.bankAccount || '-'}</span>
              </div>
              <div className="text-[10px] text-slate-550">{company.bankAccountName || '-'}</div>
            </div>
          </div>
        </div>

        {/* Fine bottom border line */}
        <div className="border-b border-slate-300"></div>
      </div>
    )
  }

  if (type === 'insurance-receipt') {
    const inv = claim.insuranceInvoice
    if (!inv) return <div className="p-8 text-center">ยังไม่ได้ออกใบวางบิล</div>
    const arPayment = inv.arPayment
    if (!arPayment) return <div className="p-8 text-center">ยังไม่มีการรับชำระเงิน</div>

    const companyName = company.name || '-'
    const companyAddress = [
      company.address,
      company.subDistrict,
      company.district,
      company.province,
      company.postalCode
    ].filter(Boolean).join(' ').trim() || '-'
    const companyTaxId = company.taxId || '-'
    const companyPhone = company.phone || '-'
    const companyEmail = company.email || '-'
    const companyWebsite = company.website || '-'

    const receiptNo = inv.invoiceNo.replace(/^[A-Z]+/i, 'RE')
    const paymentDate = arPayment.receivedAt

    // Prepare table items from claim.labors and claim.parts
    const tableItems: any[] = []
    
    if (claim.labors && claim.labors.length > 0) {
      claim.labors.forEach((l: any) => {
        const discountAmount = l.priceOffer > l.priceApprove ? (l.priceOffer - l.priceApprove) : 0
        tableItems.push({
          title: 'ค่าแรงซ่อมทำสี (P00030)', // Using a color labor code as per the screenshot or general labor
          description: l.description,
          quantity: 1,
          price: l.priceOffer || l.priceApprove,
          discount: discountAmount,
          vat: '7%',
          total: l.priceApprove
        })
      })
    } else if (inv.laborTotal > 0) {
      tableItems.push({
        title: 'ค่าแรงซ่อมทำสี (P00030)',
        description: 'ค่าแรงซ่อมรถยนต์',
        quantity: 1,
        price: inv.laborTotal,
        discount: 0,
        vat: '7%',
        total: inv.laborTotal
      })
    }

    if (claim.parts && claim.parts.length > 0) {
      claim.parts.forEach((p: any) => {
        const discountAmount = p.priceOffer > p.priceApprove ? (p.priceOffer - p.priceApprove) : 0
        tableItems.push({
          title: 'ค่าอะไหล่ศูนย์GI (P00032)',
          description: p.partName,
          quantity: p.quantity || 1,
          price: p.priceOffer || p.priceApprove,
          discount: discountAmount,
          vat: '7%',
          total: p.priceApprove * (p.quantity || 1)
        })
      })
    } else if (inv.partsTotal > 0) {
      tableItems.push({
        title: 'ค่าอะไหล่ศูนย์GI (P00032)',
        description: 'ค่าอะไหล่รถยนต์',
        quantity: 1,
        price: inv.partsTotal,
        discount: 0,
        vat: '7%',
        total: inv.partsTotal
      })
    }

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-6">
        {/* Header Title Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-white flex items-center justify-center font-bold text-gray-400 rounded overflow-hidden flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full border border-dashed border-gray-300 flex items-center justify-center text-xs font-semibold">LOGO</div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{companyName}</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="text-emerald-600 font-bold text-2xl flex items-baseline gap-1 justify-end">
              <span>ใบเสร็จรับเงิน</span>
            </div>
            <div className="text-xs text-slate-550 font-medium text-right mt-1">(ต้นฉบับ)</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-6 mb-6 text-[11px] leading-relaxed">
          {/* Left Side: Seller & Customer info */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="border-b border-slate-200 pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-550">ผู้ขาย :</span>
                <span className="font-bold text-slate-800">{companyName}</span>
                <span className="font-semibold text-slate-550">ที่อยู่ :</span>
                <span className="text-slate-650">{companyAddress}</span>
                <span className="font-semibold text-slate-550">เลขที่ภาษี :</span>
                <span className="text-slate-650">{companyTaxId} ({company.branchName || 'สำนักงานใหญ่'})</span>
              </div>
              <div className="flex gap-4 text-slate-500 pt-1 text-[10px]">
                <span>📞 {companyPhone}</span>
                <span>✉️ {companyEmail}</span>
                <span>🌐 {companyWebsite}</span>
              </div>
            </div>

            {/* Customer */}
            <div className="pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-550">ลูกค้า :</span>
                <span className="font-bold text-slate-800">
                  {claim.insurance?.peakCustomerId ? `${claim.insurance.peakCustomerId} ` : ''}
                  {claim.insurance?.name}
                </span>
                <span className="font-semibold text-slate-550">ที่อยู่ :</span>
                <span className="text-slate-650">{claim.insurance?.address || '-'}</span>
                <span className="font-semibold text-slate-550">เลขที่ภาษี :</span>
                <span className="text-slate-650">{claim.insurance?.taxId || '-'} {claim.insurance?.branchCode ? `(${claim.insurance.branchCode === '00000' ? 'สำนักงานใหญ่' : claim.insurance.branchCode})` : ''}</span>
              </div>
              <div className="flex gap-4 text-slate-500 pt-1 text-[10px]">
                <span>📞 -</span>
                <span>✉️ -</span>
                <span>🌐 -</span>
              </div>
            </div>
          </div>

          {/* Right Side: Document info & Contact */}
          <div className="space-y-4">
            {/* Invoice Meta */}
            <div className="bg-[#e6f4ea] border border-green-100 rounded-lg p-3.5 space-y-1.5 text-xs">
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">เลขที่เอกสาร :</span>
                <span className="font-bold text-slate-855">{receiptNo}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">วันที่ออก :</span>
                <span className="font-semibold text-slate-800">{formatDate(paymentDate)}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">อ้างอิง :</span>
                <span className="font-semibold text-slate-800">{inv.invoiceNo}</span>
              </div>
            </div>

            {/* Contact Back */}
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-1.5">
              <div className="font-semibold text-slate-700">ติดต่อกลับที่ :</div>
              <div className="grid grid-cols-[20px_1fr] gap-x-1 items-center text-slate-655">
                <span>👤</span>
                <span className="font-medium text-slate-800">{company.authorizedName || 'Vilaiphon Vamagun'}</span>
                <span>📞</span>
                <span className="font-medium text-slate-800">{company.phone || '0624818114'}</span>
                <span>✉️</span>
                <span className="text-slate-700">{company.email || 'vamagunv@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs mb-8 border-collapse">
          <thead>
            <tr className="bg-[#e6f4ea] text-left border-t border-b border-slate-200">
              <th className="py-2.5 px-3 text-slate-700 font-semibold">คำอธิบาย</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-16">จำนวน</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-24">ราคา</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-16">ส่วนลด</th>
              <th className="py-2.5 px-3 text-center text-slate-700 font-semibold w-16">VAT</th>
              <th className="py-2.5 px-3 text-right text-slate-700 font-semibold w-28">มูลค่าก่อนภาษี</th>
            </tr>
          </thead>
          <tbody>
            {tableItems.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-b-2 last:border-slate-350">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 pl-4">{item.description}</div>
                </td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{item.quantity.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatCurrency(item.price)}</td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatCurrency(item.discount)}</td>
                <td className="py-3 px-3 text-center text-slate-700 font-mono">{item.vat}</td>
                <td className="py-3 px-3 text-right text-slate-850 font-bold font-mono">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Sections */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-6 mb-6 text-[11px]">
          {/* Left summary card */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/20">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <span>📋 สรุป</span>
            </div>
            <div className="flex justify-between text-slate-650">
              <span>มูลค่าที่คำนวณภาษี 7%</span>
              <span className="font-semibold text-slate-800">{formatCurrency(inv.subtotal)} บาท</span>
            </div>
            <div className="flex justify-between text-slate-655">
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span className="font-semibold text-slate-800">{formatCurrency(inv.vatAmount)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
              <span className="text-slate-655">จำนวนเงินทั้งสิ้น</span>
              <span className="text-slate-600 italic">({bahtText(inv.grandTotal)})</span>
            </div>
          </div>

          {/* Right summary card (highlighted) */}
          <div className="bg-[#e6f4ea] border border-green-100 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">จำนวนเงินทั้งสิ้น</span>
              <span className="text-sm font-bold text-green-900">{formatCurrency(inv.grandTotal)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-green-50 pt-2">
              <span className="text-slate-500 font-medium">จำนวนเงินที่ถูกหัก ณ ที่จ่าย</span>
              <span className="font-semibold text-slate-700">0.00 บาท</span>
            </div>
            <div className="flex justify-between font-bold text-green-950 border-t border-green-100 pt-2 text-xs">
              <span>จำนวนเงินที่ชำระ</span>
              <span>{formatCurrency(inv.grandTotal)} บาท</span>
            </div>
          </div>
        </div>

        {/* Payment options */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-[100px_1fr] gap-4 items-center mb-6 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-855">
            <span>💳 ชำระเงิน</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50/50 rounded-lg p-2.5 border border-slate-150 w-full">
            <div className="flex gap-4">
              <div><span className="text-slate-500">วันที่ชำระ :</span> <span className="font-semibold text-slate-800">{formatDate(paymentDate)}</span></div>
              <div><span className="text-slate-500">จำนวนเงินรวม :</span> <span className="font-bold text-slate-800">{formatCurrency(inv.grandTotal)} บาท</span></div>
            </div>
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              {company.bankName && (company.bankName.includes('กสิกร') || company.bankName.toLowerCase().includes('kasikorn')) ? (
                <div className="w-8 h-8 rounded-full bg-[#138f2d] border-2 border-[#e01b22] flex items-center justify-center text-white font-extrabold text-sm select-none shadow-sm flex-shrink-0">
                  K
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm flex-shrink-0 text-sm">
                  🏦
                </div>
              )}
              <div className="space-y-0.5 text-left">
                <div className="font-bold text-slate-800">{company.bankName || '-'}</div>
                <div className="text-slate-650">
                  {company.bankAccount && <span className="font-medium text-slate-500 mr-1.5">ออมทรัพย์</span>}
                  <span className="font-mono text-slate-800 font-semibold">{company.bankAccount || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-[100px_1fr] gap-4 items-start mb-6 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-855">
            <span>💬 หมายเหตุ</span>
          </div>
          <div className="text-slate-600 leading-relaxed">
            กรุณาโอนเข้าบัญชี {company.bankAccountName || companyName} {company.bankName || '-'} สาขา {company.branchName || 'สำนักงานใหญ่'} ออมทรัพย์ #{company.bankAccount || '-'}
          </div>
        </div>

        {/* Fine bottom border line */}
        <div className="border-b border-slate-300"></div>
      </div>
    )
  }

  if (type === 'purchase-order') {
    if (!po) return <div className="p-8 text-center">ไม่พบใบสั่งซื้อ</div>

    const poTotal = (po.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบสั่งซื้อ (Purchase Order)', po.poNo, po.createdAt)}

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">ข้อมูลผู้จัดจำหน่าย (Vendor)</h3>
            <p><span className="text-gray-500 w-28 inline-block">ชื่อร้าน/บริษัท:</span> {po.vendor?.name}</p>
            <p><span className="text-gray-500 w-28 inline-block">ประเภท:</span> {po.poType === 'PARTS' ? 'อะไหล่' : 'ค่าแรง'}</p>
            <p><span className="text-gray-500 w-28 inline-block">การจัดส่ง:</span> {po.deliveryMode === 'DIRECT_TO_GARAGE' ? 'ส่งตรงอู่' : 'รับเอง'}</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">อ้างอิง</h3>
            <p><span className="text-gray-500 w-24 inline-block">Claim No:</span> {claim.claimNo}</p>
            <p><span className="text-gray-500 w-24 inline-block">ทะเบียนรถ:</span> {claim.carPlate}</p>
            <p><span className="text-gray-500 w-24 inline-block">ยี่ห้อ/รุ่น:</span> {claim.carBrand} {claim.carModel}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2 w-12">ลำดับ</th>
              <th className="py-2 px-2">รหัสอะไหล่</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-right">ราคา/หน่วย</th>
              <th className="py-2 px-2 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {(po.items || []).map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2 font-mono text-xs">{item.partNo}</td>
                <td className="py-2 px-2">{item.description}</td>
                <td className="py-2 px-2 text-right">{item.quantity}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {(() => {
          const poSubtotal = (po.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)
          // Try to detect VAT and WHT from the total
          const diff = Math.round((po.totalAmount - poSubtotal) * 100) / 100
          // If diff >= 0, it's pure VAT. If diff < 0, there might be WHT involved.
          // Use includeVat/includeWht flags if available from query params
          const vatPctParam = searchParams.get('vatPct')
          const whtPctParam = searchParams.get('whtPct')
          const hasVat = vatPctParam ? Number(vatPctParam) > 0 : diff > 0
          const hasWht = whtPctParam ? Number(whtPctParam) > 0 : false
          const vatPct = vatPctParam ? Number(vatPctParam) : (poSubtotal > 0 && diff > 0 ? Math.round((diff / poSubtotal) * 100) : 0)
          const whtPct = whtPctParam ? Number(whtPctParam) : 0
          const computedVat = hasVat ? Math.round(poSubtotal * (vatPct / 100) * 100) / 100 : 0
          const computedWht = hasWht ? Math.round(poSubtotal * (whtPct / 100) * 100) / 100 : 0

          return (
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm border rounded p-4">
                <div className="flex justify-between text-gray-600">
                  <span>ยอดรวมก่อน VAT</span>
                  <span>{formatCurrency(poSubtotal)}</span>
                </div>
                {computedVat > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>VAT {vatPct > 0 ? `${vatPct}%` : ''}</span>
                    <span>{formatCurrency(computedVat)}</span>
                  </div>
                )}
                {computedWht > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>หัก ณ ที่จ่าย {whtPct}%</span>
                    <span>-{formatCurrency(computedWht)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span>{formatCurrency(po.totalAmount)}</span>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="mt-8 text-sm border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-1">หมายเหตุ</h4>
          <p className="text-gray-600">กรุณาจัดส่งอะไหล่ตามรายการข้างต้น</p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2 mt-12"></div>
            <p>ผู้สั่งซื้อ</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ {formatDate(po.createdAt)}</p>
          </div>
          <div>
            {company.signatureUrl ? (
              <div className="w-48 h-12 mx-auto mb-2 border-b border-gray-400 flex items-end justify-center pb-1">
                <img src={company.signatureUrl} alt="Signature" className="max-h-16 object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="border-b border-gray-400 w-48 mx-auto mb-2 mt-12"></div>
            )}
            <p>{company.authorizedName || 'ผู้อนุมัติ'}</p>
            {company.authorizedTitle && <p className="text-gray-500 text-xs mt-0.5">{company.authorizedTitle}</p>}
            <p className="text-gray-500 text-xs mt-1">วันที่ {formatDate(po.createdAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'delivery-note') {
    if (!po) return <div className="p-8 text-center">ไม่พบใบสั่งซื้อ</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบส่งของ (Delivery Note)', po.poNo, po.createdAt)}

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">ผู้จัดจำหน่าย (Vendor)</h3>
            <p><span className="text-gray-500 w-28 inline-block">ชื่อร้าน/บริษัท:</span> {po.vendor?.name}</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">สถานที่จัดส่ง</h3>
            <p className="whitespace-pre-wrap">{po.deliveryAddress || [claim.garage?.name, claim.garage?.address, claim.garage?.province].filter(Boolean).join(' ').trim()}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2 w-12">ลำดับ</th>
              <th className="py-2 px-2">รหัสอะไหล่</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-center">ตรวจรับ</th>
            </tr>
          </thead>
          <tbody>
            {(po.items || []).map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-2 text-gray-600">{i + 1}</td>
                <td className="py-3 px-2 font-mono text-xs">{item.partNo}</td>
                <td className="py-3 px-2">{item.description}</td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-center">☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 text-sm border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-1">หมายเหตุ</h4>
          <p className="text-gray-600">กรุณาตรวจนับอะไหล่ให้ครบถ้วนก่อนลงนามรับของ</p>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้ส่งของ</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้ขนส่ง</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้รับของ (อู่)</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    )
  }

  return <div className="p-8 text-center">ไม่พบประเภทเอกสารที่ระบุ</div>
}

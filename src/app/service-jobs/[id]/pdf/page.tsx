'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

// BahtText function for Thai currency string representation
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

export default function ServiceJobPdfPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isInvoice, setIsInvoice] = useState(false)
  const [company, setCompany] = useState<any>({
    name: 'บริษัท เอ็กซ์เพิร์ท บอดี้ แอนด์ เพ้นท์ จำกัด',
    address: '622 ซ.ลาดพร้าว 47 (สะพาน 2) สะพานสอง วังทองหลาง กรุงเทพมหานคร 10310',
    taxId: '0105568142253',
    branchName: 'สำนักงานใหญ่',
    phone: '0624818114',
    email: 'vamagunv@gmail.com',
    logoUrl: '/logo.png',
    authorizedName: 'Vilaiphon Vamagun'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      setIsInvoice(searchParams.get('type') === 'invoice')
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`/api/service-orders/${orderId}`).then(res => res.json()),
      fetch('/api/settings/company').then(res => res.json()).catch(() => ({}))
    ]).then(([orderData, compData]) => {
      if (!orderData.error) {
        setOrder(orderData)
      }
      if (compData && compData.id) {
        setCompany(compData)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [orderId])

  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [order])

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-xs">กำลังโหลดรายละเอียดเอกสาร...</div>
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500 text-xs">ไม่พบข้อมูลใบสั่งงานบริการ</div>
  }

  const companyAddress = [
    company.address,
    company.subDistrict,
    company.district,
    company.province,
    company.postalCode
  ].filter(Boolean).join(' ').trim() || company.address || '-'

  // If type=invoice requested, render the exact unified premium invoice template (same as claims PDF)
  if (isInvoice) {
    const carPlates = order.vehicles?.map((v: any) => `${v.carPlate} ${v.carProvince || ''}`).join(', ') || '-'

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-6 text-xs">
        {/* Print Buttons Bar (hidden when printing) */}
        <div className="flex gap-2 mb-6 border-b pb-4 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.close()}>
            <X className="w-4 h-4 mr-1" />
            ปิดหน้าต่างนี้
          </Button>
          <Button size="sm" className="bg-[#1d4ed8]" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />
            พิมพ์ใบวางบิล
          </Button>
        </div>

        {/* Header Title Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-white flex items-center justify-center font-bold text-gray-400 rounded overflow-hidden flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full border border-dashed border-gray-300 flex items-center justify-center text-[10px]">LOGO</div>
              )}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 uppercase">{company.name}</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-bold text-2xl flex items-baseline gap-1 justify-end">
              <span>ใบแจ้งหนี้/ใบกำกับภาษี</span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold text-right mt-1">(ต้นฉบับ)</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-6 mb-6 text-[11px] leading-relaxed">
          {/* Left Side: Seller & Customer info */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="border-b border-slate-200 pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-500">ผู้ขาย :</span>
                <span className="font-bold text-slate-800">{company.name}</span>
                <span className="font-semibold text-slate-500">ที่อยู่ :</span>
                <span className="text-slate-650">{companyAddress}</span>
                <span className="font-semibold text-slate-500">เลขที่ภาษี :</span>
                <span className="text-slate-650">{company.taxId || '-'} ({company.branchName || 'สำนักงานใหญ่'})</span>
              </div>
              <div className="flex gap-4 text-slate-400 pt-1 text-[10px]">
                <span>📞 {company.phone}</span>
                <span>✉️ {company.email}</span>
                {company.website && <span>🌐 {company.website}</span>}
              </div>
            </div>

            {/* Customer */}
            <div className="pb-3">
              <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5">
                <span className="font-semibold text-slate-500">ลูกค้า :</span>
                <span className="font-bold text-slate-800">{order.customer.name}</span>
                <span className="font-semibold text-slate-500">ที่อยู่ :</span>
                <span className="text-slate-650">{order.customer.address || '-'}</span>
                <span className="font-semibold text-slate-500">เลขที่ภาษี :</span>
                <span className="text-slate-650">{order.customer.taxId || '-'}</span>
              </div>
              <div className="flex gap-4 text-slate-400 pt-1 text-[10px]">
                {order.customer.phone && <span>📞 {order.customer.phone}</span>}
              </div>
            </div>
          </div>

          {/* Right Side: Document info & Contact */}
          <div className="space-y-4">
            {/* Invoice Meta */}
            <div className="bg-[#eef2ff] border border-blue-100 rounded-lg p-3.5 space-y-1.5 text-xs">
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">เลขที่เอกสาร :</span>
                <span className="font-bold text-slate-850">{order.invoiceNo || '-'}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">วันที่ออก :</span>
                <span className="font-semibold text-slate-800">
                  {order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}
                </span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-2">
                <span className="text-slate-500 font-medium">อ้างอิง :</span>
                <span className="font-semibold text-slate-800">{carPlates}</span>
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
            {order.vehicles?.map((vehicle: any, vIdx: number) => (
              <Fragment key={vehicle.id}>
                {/* Header Row for Vehicle */}
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <td colSpan={6} className="py-2 px-3 font-semibold text-blue-700 text-[10px]">
                    คันที่ {vIdx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''} - {vehicle.carBrand} {vehicle.carModel} (VIN: {vehicle.carVin})
                  </td>
                </tr>
                {vehicle.items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-b-2 last:border-slate-200">
                    <td className="py-2.5 px-3 text-slate-800 pl-6">{item.description}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{(item.quantity || 1).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatCurrency(item.priceUnit)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">0.00</td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-mono">7%</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 font-bold font-mono">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </Fragment>
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
              <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)} บาท</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order.vatAmount)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
              <span className="text-slate-650">จำนวนเงินทั้งสิ้น</span>
              <span className="text-slate-600 italic">({bahtText(order.grandTotal)})</span>
            </div>
          </div>

          {/* Right summary card (highlighted) */}
          <div className="bg-[#eef2ff] border border-blue-100 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">จำนวนเงินทั้งสิ้น</span>
              <span className="text-sm font-bold text-blue-900">{formatCurrency(order.grandTotal)} บาท</span>
            </div>
            <div className="flex justify-between border-t border-blue-50 pt-2">
              <span className="text-slate-500 font-medium">จำนวนเงินที่ถูกหัก ณ ที่จ่าย</span>
              <span className="font-semibold text-slate-700">0.00 บาท</span>
            </div>
            <div className="flex justify-between font-bold text-blue-950 border-t border-blue-100 pt-2 text-xs">
              <span>จำนวนเงินที่ชำระ</span>
              <span>{formatCurrency(order.grandTotal)} บาท</span>
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
              <div className="text-[10px] text-slate-500">{company.bankAccountName || '-'}</div>
            </div>
          </div>
        </div>

        {/* Fine bottom border line */}
        <div className="border-b border-slate-350"></div>
      </div>
    )
  }

  // Fallback / Standard Service Order template
  return (
    <div className="bg-white min-h-screen p-8 text-black print:p-0 text-xs">
      {/* Print Buttons Bar (hidden when printing) */}
      <div className="flex gap-2 mb-6 border-b pb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.close()}>
          <X className="w-4 h-4 mr-1" />
          ปิดหน้าต่างนี้
        </Button>
        <Button size="sm" className="bg-[#1d4ed8]" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" />
          พิมพ์ใบสั่งงาน
        </Button>
      </div>

      {/* A4 Invoice Layout */}
      <div className="max-w-[800px] mx-auto border p-8 print:border-none print:p-0 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 uppercase">{company.name}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {companyAddress}<br />
              เลขประจำตัวผู้เสียภาษี: {company.taxId || '-'}<br />
              โทร: {company.phone}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-700">ใบสั่งงาน (Service Order)</h2>
            <p className="text-xs text-gray-500 mt-1">
              เลขที่ใบสั่งงาน: <span className="font-mono font-semibold">{order.orderNo}</span><br />
              วันที่สั่งงาน: {formatDateShort(order.createdAt)}<br />
              {order.invoiceNo && <>เลขที่ใบวางบิล: <span className="font-mono">{order.invoiceNo}</span><br /></>}
            </p>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold text-gray-700 mb-1">ข้อมูลลูกค้า / ผู้ว่าจ้าง:</h3>
            <p className="text-gray-600 space-y-0.5">
              <strong>{order.customer.name}</strong><br />
              {order.customer.address && <>{order.customer.address}<br /></>}
              {order.customer.taxId && <>เลขผู้เสียภาษี: {order.customer.taxId}<br /></>}
              {order.customer.phone && <>โทร: {order.customer.phone}</>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              จำนวนรถทั้งหมด: {order.vehicles?.length || 0} คัน
            </p>
          </div>
        </div>

        {/* Items Table grouped by vehicle */}
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50/50">
              <th className="py-2 px-3 font-semibold text-gray-700 w-12 text-center">#</th>
              <th className="py-2 px-3 font-semibold text-gray-700">รายการบริการ</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-20 text-center">จำนวน</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-32 text-right">ราคาต่อหน่วย</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-32 text-right">ยอดรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {order.vehicles?.map((vehicle: any, vIdx: number) => (
              <Fragment key={vehicle.id}>
                {/* Header Row for Vehicle */}
                <tr className="bg-gray-50/40 border-b border-gray-200">
                  <td colSpan={5} className="py-2 px-3 font-semibold text-[#1d4ed8] text-xs">
                    คันที่ {vIdx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''} - {vehicle.carBrand} {vehicle.carModel} (VIN: {vehicle.carVin})
                  </td>
                </tr>
                {vehicle.items?.map((item: any, idx: number) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-center text-gray-400 text-xs">{idx + 1}</td>
                    <td className="py-2 px-3 text-gray-800 text-xs pl-6">{item.description}</td>
                    <td className="py-2 px-3 text-center text-gray-600 text-xs">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-gray-600 text-xs">฿{formatCurrency(item.priceUnit)}</td>
                    <td className="py-2 px-3 text-right text-gray-800 font-semibold text-xs">฿{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Pricing Summary */}
        <div className="flex flex-col items-end space-y-1 text-sm font-medium text-gray-700 pt-4">
          <div className="flex justify-between w-full max-w-[280px]">
            <span>ราคารวม:</span>
            <span>฿{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[280px] text-gray-500">
            <span>ภาษีมูลค่าเพิ่ม (7%):</span>
            <span>฿{formatCurrency(order.vatAmount)}</span>
          </div>
          <div className="flex justify-between w-full max-w-[280px] text-base font-bold text-gray-900 border-t pt-1.5 mt-1">
            <span>ยอดเงินรวมสุทธิ:</span>
            <span>฿{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>

        {/* Signature Sections */}
        <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div className="space-y-16">
            <p>ผู้สั่งงาน / ลูกค้าอนุมัติ...........................................</p>
            <p>วันที่........./........./.........</p>
          </div>
          <div className="space-y-16">
            <p>ผู้รับสั่งงาน / ช่างผู้ดำเนินการ...........................................</p>
            <p>วันที่........./........./.........</p>
          </div>
        </div>
      </div>
    </div>
  )
}

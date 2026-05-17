import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ClaimTabProps } from './types'

export default function PnLTab({ arReceived, apVendor, grossProfit, margin }: ClaimTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#1d4ed8]" />P&L Summary</CardTitle></CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto space-y-4">
          {[
            { label: 'AR Received (รับจากประกัน)', value: arReceived, color: 'text-green-600' },
            { label: 'AP Vendor (จ่าย Supplier)', value: apVendor, color: 'text-red-500' },
            { label: 'AP Garage (จ่ายอู่)', value: 0, color: 'text-red-500' },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-3 border-b border-gray-50">
              <span className="text-sm text-[#475569]">{item.label}</span>
              <span className={`font-semibold ${item.color}`}>฿{formatCurrency(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between py-3 border-t-2 border-[#1d4ed8]">
            <span className="font-semibold text-[#0f172a]">Gross Profit</span>
            <span className={`text-xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ฿{formatCurrency(grossProfit)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-[#475569]">Margin</span>
            <span className="font-semibold text-[#0f172a]">{margin.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

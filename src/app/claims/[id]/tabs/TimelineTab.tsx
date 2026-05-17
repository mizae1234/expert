import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { ClaimTabProps } from './types'

export default function TimelineTab({ claim }: ClaimTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-[#1d4ed8]" />Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-6">
          {claim.statusLogs?.map((log: any, i: number) => {
            const isLast = i === (claim.statusLogs?.length || 0) - 1
            const logColor = getStatusColor(log.toStatus)
            return (
              <div key={log.id} className="relative">
                {/* Line */}
                {!isLast && <div className="absolute left-[-20px] top-8 w-0.5 h-full bg-gray-200" />}
                {/* Dot */}
                <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full border-2 border-white shadow ${logColor.bg}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`status-badge ${logColor.bg} ${logColor.text}`}>{getStatusLabel(log.toStatus)}</span>
                    {log.fromStatus && (
                      <span className="text-xs text-[#94a3b8]">← {getStatusLabel(log.fromStatus)}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {formatDateTime(log.createdAt)} • {log.changedBy}
                  </p>
                  {log.note && <p className="text-sm text-[#475569] mt-1">{log.note}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

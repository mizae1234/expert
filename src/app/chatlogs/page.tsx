import prisma from '@/lib/prisma'
import ChatLogsClient from './ChatLogsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ChatLogsPage() {
  // ดึงประวัติล็อกการแชทล่าสุด 100 รายการ
  const logs = await prisma.chatLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  // ทำการแปลง Date เป็น String ISO เพื่อให้สามารถส่งไปให้ Client Component ได้
  const serializedLogs = logs.map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString()
  }))

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <ChatLogsClient initialLogs={serializedLogs} />
      </div>
    </div>
  )
}

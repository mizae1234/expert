'use client'

import React, { useState, useMemo } from 'react'
import { 
  MessageSquare, 
  Clock, 
  Cpu, 
  Layers, 
  Search, 
  User, 
  Users, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface ChatLog {
  id: string
  sourceType: string
  sourceId: string | null
  userName: string | null
  userMessage: string
  botReply: string
  inputTokens: number | null
  outputTokens: number | null
  modelName: string | null
  responseTimeMs: number | null
  createdAt: string
}

interface ChatLogsClientProps {
  initialLogs: ChatLog[]
}

export default function ChatLogsClient({ initialLogs }: ChatLogsClientProps) {
  const [logs, setLogs] = useState<ChatLog[]>(initialLogs)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'USER' | 'GROUP'>('ALL')
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null)

  // คำนวณสรุปสถิติเบื้องต้น
  const stats = useMemo(() => {
    const total = logs.length
    if (total === 0) return { avgResponseTime: 0, totalTokens: 0 }

    let totalResponseTime = 0
    let responseCount = 0
    let totalTokens = 0

    logs.forEach(log => {
      if (log.responseTimeMs) {
        totalResponseTime += log.responseTimeMs
        responseCount++
      }
      totalTokens += (log.inputTokens || 0) + (log.outputTokens || 0)
    })

    return {
      avgResponseTime: responseCount > 0 ? (totalResponseTime / responseCount / 1000).toFixed(2) : '0',
      totalTokens
    }
  }, [logs])

  // การกรองข้อมูล (Search & Filter)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // กรองตามประเภทของต้นทาง
      if (sourceFilter === 'USER' && log.sourceType !== 'user') return false
      if (sourceFilter === 'GROUP' && log.sourceType === 'user') return false

      // กรองตามคำค้นหา
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = log.userName?.toLowerCase().includes(query)
        const matchMessage = log.userMessage.toLowerCase().includes(query)
        const matchReply = log.botReply.toLowerCase().includes(query)
        const matchId = log.sourceId?.toLowerCase().includes(query)
        return matchName || matchMessage || matchReply || matchId
      }

      return true
    })
  }, [logs, search, sourceFilter])

  const handleRefresh = () => {
    window.location.reload()
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateStr
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('th-TH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวหน้าเว็บ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              🤖 บันทึกการคุยช่างเบน (LINE Chat Logs)
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            ดูประวัติการพิมพ์ถาม-ตอบของระบบ AI Chatbot วิเคราะห์ข้อมูลระบบประกันภัยและเคลมสีรถยนต์
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 rounded-xl text-slate-200 text-sm font-semibold transition shadow-md border border-slate-600"
        >
          <RefreshCw size={16} /> รีโหลดข้อมูล
        </button>
      </div>

      {/* เครื่องมือค้นหาและฟิลเตอร์ */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-800">
        {/* ค้นหา */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้, ข้อความถาม, คำตอบ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 pl-10 pr-4 py-2 rounded-xl text-slate-200 text-sm placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* ตัวกรองช่องทาง */}
        <div className="flex p-1 bg-slate-800 rounded-xl border border-slate-700 w-full md:w-auto">
          <button
            onClick={() => setSourceFilter('ALL')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              sourceFilter === 'ALL' 
                ? 'bg-amber-500 text-slate-900 shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setSourceFilter('USER')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              sourceFilter === 'USER' 
                ? 'bg-amber-500 text-slate-900 shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={12} /> คุยเดี่ยว (User)
          </button>
          <button
            onClick={() => setSourceFilter('GROUP')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              sourceFilter === 'GROUP' 
                ? 'bg-amber-500 text-slate-900 shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={12} /> คุยกลุ่ม (Group)
          </button>
        </div>
      </div>

      {/* ตารางแสดงผลลัพธ์แบบ Compact */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase">
                <th className="p-4">เวลา</th>
                <th className="p-4">ผู้ส่ง</th>
                <th className="p-4">ช่องทาง</th>
                <th className="p-4">ข้อความคำถาม</th>
                <th className="p-4">คำตอบกลับจากบอท</th>
                <th className="p-4 text-center">สถิติประมวลผล</th>
                <th className="p-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <MessageSquare className="mx-auto mb-2 opacity-30" size={40} />
                    <p className="text-sm">ไม่พบประวัติการแชทตามคำค้นหาดังกล่าว</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isUser = log.sourceType === 'user'
                  const totalTokens = (log.inputTokens || 0) + (log.outputTokens || 0)

                  return (
                    <tr 
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 whitespace-nowrap text-slate-400">
                        {formatDateShort(log.createdAt)}
                      </td>
                      <td className="p-4 font-semibold text-slate-200 truncate max-w-[120px]">
                        {log.userName || 'ไม่ระบุชื่อ'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUser ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.sourceType.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 truncate max-w-[180px] text-slate-400" title={log.userMessage}>
                        {log.userMessage}
                      </td>
                      <td className="p-4 truncate max-w-[240px] text-slate-400" title={log.botReply}>
                        {log.botReply}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 text-[10px]">
                          {log.responseTimeMs && (
                            <span className="bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              {(log.responseTimeMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          {totalTokens > 0 && (
                            <span className="bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              {totalTokens.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(log)
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
                        >
                          ดูเพิ่มเติม
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal สำหรับแสดงรายละเอียดแชท */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-800/80">
              <div>
                <h3 className="font-bold text-lg text-slate-200">รายละเอียดบทสนทนา</h3>
                <p className="text-xs text-slate-400">
                  ส่งโดย: {selectedLog.userName} ({selectedLog.sourceType.toUpperCase()}) | เมื่อ: {formatDate(selectedLog.createdAt)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition font-semibold text-lg p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Chat Area */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-900/40 flex-1">
              {/* User message */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold shadow">
                  U
                </div>
                <div className="bg-slate-800 text-slate-100 p-3.5 rounded-2xl rounded-tl-none text-sm shadow-md border border-slate-700 whitespace-pre-wrap">
                  {selectedLog.userMessage}
                </div>
              </div>

              {/* Bot reply */}
              <div className="flex gap-3 max-w-[90%] ml-auto justify-end">
                <div className="bg-amber-500/10 text-amber-100 p-4 rounded-2xl rounded-tr-none text-sm shadow-md border border-amber-500/20 whitespace-pre-wrap font-sans overflow-x-auto w-full">
                  {selectedLog.botReply}
                </div>
                <div className="flex-none w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold shadow">
                  BEN
                </div>
              </div>
            </div>

            {/* Footer metadata */}
            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
              <div className="flex gap-3 flex-wrap">
                <span>รุ่น: {selectedLog.modelName || '-'}</span>
                <span>•</span>
                <span>เวลา: {selectedLog.responseTimeMs ? `${(selectedLog.responseTimeMs / 1000).toFixed(2)} วินาที` : '-'}</span>
                <span>•</span>
                <span>Tokens: {((selectedLog.inputTokens || 0) + (selectedLog.outputTokens || 0)).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

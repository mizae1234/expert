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
  ChevronDown, 
  ChevronUp, 
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
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

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

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  };

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

      {/* บล็อกสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400">จำนวนคำถามทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-100">{logs.length} ครั้ง</p>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400">เวลาประมวลผลเฉลี่ย</p>
            <p className="text-2xl font-bold text-slate-100">{stats.avgResponseTime} วินาที</p>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400">จำนวน Token สะสม</p>
            <p className="text-2xl font-bold text-slate-100">{stats.totalTokens.toLocaleString()} tkn</p>
          </div>
        </div>
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

      {/* รายการข้อความ Log */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-500">
            <MessageSquare className="mx-auto mb-2 opacity-30" size={40} />
            <p className="text-sm">ไม่พบประวัติการแชทตามคำค้นหาดังกล่าว</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = !!expandedIds[log.id]
            const isUser = log.sourceType === 'user'
            const totalTokens = (log.inputTokens || 0) + (log.outputTokens || 0)

            return (
              <div 
                key={log.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition shadow-md"
              >
                {/* แถบหัวข้อการแชท */}
                <div 
                  onClick={() => toggleExpand(log.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* ไอคอนแสดงต้นทาง */}
                    <div className={`p-2 rounded-lg ${isUser ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isUser ? <User size={18} /> : <Users size={18} />}
                    </div>
                    {/* ชื่อผู้ส่งและเวลา */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{log.userName || 'ไม่ระบุชื่อ'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUser ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.sourceType.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                  </div>

                  {/* สรุป Meta ด้านขวา */}
                  <div className="flex items-center gap-2 flex-wrap md:justify-end text-[11px]">
                    {log.responseTimeMs && (
                      <span className="flex items-center gap-1 bg-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">
                        <Clock size={12} className="text-slate-400" /> {(log.responseTimeMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    {totalTokens > 0 && (
                      <span className="flex items-center gap-1 bg-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">
                        <Layers size={12} className="text-slate-400" /> {totalTokens.toLocaleString()} tkn
                      </span>
                    )}
                    {log.modelName && (
                      <span className="flex items-center gap-1 bg-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">
                        <Cpu size={12} className="text-slate-400" /> {log.modelName}
                      </span>
                    )}
                    <div className="text-slate-400 ml-2">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* รายละเอียดแชท (ส่วนที่พับ/ขยาย) */}
                {isExpanded && (
                  <div className="border-t border-slate-700 bg-slate-900/60 p-4 space-y-4">
                    {/* คำถามผู้ใช้ */}
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="flex-none w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold shadow">
                        U
                      </div>
                      <div className="bg-slate-800 text-slate-100 p-3 rounded-2xl rounded-tl-none text-sm shadow-md border border-slate-700 whitespace-pre-wrap">
                        {log.userMessage}
                      </div>
                    </div>

                    {/* คำตอบบอท */}
                    <div className="flex gap-3 max-w-[90%] ml-auto justify-end">
                      <div className="bg-amber-500/10 text-amber-100 p-4 rounded-2xl rounded-tr-none text-sm shadow-md border border-amber-500/20 whitespace-pre-wrap font-sans overflow-x-auto w-full">
                        {log.botReply}
                      </div>
                      <div className="flex-none w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold shadow">
                        BEN
                      </div>
                    </div>

                    {/* ข้อมูลดิบสำหรับการวิเคราะห์ */}
                    <div className="text-[10px] text-slate-500 font-mono text-right pt-2 border-t border-slate-800/80">
                      ID: {log.id} | Line Source ID: {log.sourceId || 'Direct'}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

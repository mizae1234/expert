'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, User, Lock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      let data: any
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server response: ${res.status} ${res.statusText} (ไม่ใช่ JSON)`)
      }

      if (!res.ok) {
        throw new Error(data.error || data.stack || `Server error: ${res.status}`)
      }

      setSuccess(true)
      // Use window.location for full page reload with cookie
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อ server ได้')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1e3a8a] via-[#1d4ed8] to-[#60a5fa] flex items-center justify-center p-4">
      {/* Background blobs for depth */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <Card className="glass-card shadow-2xl border-white/20">
          <CardHeader className="space-y-3 text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">EXPERT BODY &amp; PAINT</CardTitle>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#1d4ed8]">Management System</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 text-green-600 text-sm font-medium flex items-center gap-2">
                <span className="shrink-0">✅</span>
                <span>เข้าสู่ระบบสำเร็จ กำลังเปลี่ยนหน้า...</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569] uppercase tracking-wider">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 bg-white/70 border-gray-200/80 focus:bg-white focus:ring-[#1d4ed8] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569] uppercase tracking-wider">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 bg-white/70 border-gray-200/80 focus:bg-white focus:ring-[#1d4ed8] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

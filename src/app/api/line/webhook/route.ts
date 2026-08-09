import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'
import { askBen } from '@/lib/gemini'
import {
  lineConfig,
  replyText,
  replyMessage,
  pushText,
  getMenuMessage,
  getProfile,
  saveGroupToDb,
  deactivateGroupInDb,
  handleFollow
} from '@/lib/line'

export const dynamic = 'force-dynamic'

// บล็อกคำสั่ง Bypass ทั่วไปเมื่อคุยในกลุ่มแชท
const BOT_TRIGGERS = ['ben', 'ช่างเบน', 'เบน', 'ben,', 'ben:']

// ฟังก์ชันตรวจสอบลายเซ็นของ LINE Webhook
function verifySignature(body: string, signature: string): boolean {
  if (!lineConfig.channelSecret) return false
  const hash = crypto
    .createHmac('sha256', lineConfig.channelSecret)
    .update(body)
    .digest('base64')
  return hash === signature
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-line-signature') ?? ''

    // บันทึก Log การยิง Webhook ขาเข้าลงไฟล์ในเครื่องเพื่อดีบั๊ก
    try {
      const logMsg = `${new Date().toISOString()} | Webhook Received | Signature: ${signature.substring(0, 10)}... | Body Length: ${rawBody.length}\n`
      fs.appendFileSync(path.join(process.cwd(), 'webhook_debug.log'), logMsg)
    } catch (err) {
      console.error('[LINE Webhook] Failed to write webhook_debug.log:', err)
    }

    // ตรวจสอบความถูกต้องของข้อมููลทางความปลอดภัย
    if (!verifySignature(rawBody, signature)) {
      console.warn('[LINE Webhook] Invalid Signature received.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { events } = JSON.parse(rawBody) as { events: any[] }

    // ประมวลผลแต่ละ Event ในแบบ Background Worker เพื่อป้องกัน LINE Webhook Timeout (5 วินาที)
    Promise.allSettled(
      events.map((event) => handleWebhookEvent(event))
    ).catch((err) => {
      console.error('[LINE Webhook Background Worker Error]', err)
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[LINE Webhook POST Error]', error.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleWebhookEvent(event: any) {
  const sourceType = event.source?.type // 'user' | 'group' | 'room'
  const userId = event.source?.userId
  const isGroup = sourceType === 'group' || sourceType === 'room'
  const chatSourceId = isGroup
    ? (event.source?.groupId || event.source?.roomId)
    : userId

  if (!chatSourceId) return

  // 1. จัดการเหตุการณ์ Follow (ผู้ใช้แอดไลน์แอดบอทเป็นเพื่อน)
  if (event.type === 'follow') {
    console.log(`[LINE Webhook] Follow Event from User: ${userId}`)
    await handleFollow(userId)
    return
  }

  // 2. จัดการเหตุการณ์ Join (บอทถูกดึงเข้าห้องแชท/กลุ่มใหม่)
  if (event.type === 'join') {
    console.log(`[LINE Webhook] Join Event in ${sourceType}: ${chatSourceId}`)
    await saveGroupToDb(chatSourceId, sourceType)
    await replyText(
      event.replyToken,
      `สวัสดีครับ! ผม ช่างเบน (Ben) AI ผู้ช่วยดูแลระบบงานซ่อมและเคลมรถยนต์ของ Expert Body Paint ครับ 🔧🚗✨\n\nในห้องแชทกลุ่ม คุณสามารถถามคำถามหรือค้นหาข้อมูลโดยพิมพ์เรียกชื่อผมนำหน้า เช่น:\n💬 "ช่างเบน วันนี้มีงานเคลมเข้าใหม่คี่งานครับ"\n💬 "ช่างเบน ช่วยหาทะเบียน กข 1234 หน่อยครับ"\n\nยินดีให้บริการทุกท่านครับ! 💛`
    )
    return
  }

  // 3. จัดการเหตุการณ์ Leave (บอทถูกลบออกจากลุ่ม)
  if (event.type === 'leave') {
    console.log(`[LINE Webhook] Leave Event from ${sourceType}: ${chatSourceId}`)
    await deactivateGroupInDb(chatSourceId)
    return
  }

  // 4. จัดการเหตุการณ์ Message (ผู้ใช้ส่งข้อความ)
  if (event.type === 'message' && event.message?.type === 'text') {
    const rawText = event.message.text.trim()
    const rawLower = rawText.toLowerCase()
    const replyToken = event.replyToken

    let shouldProcess = false
    let strippedText = rawText

    // กรณีอยู่ในกลุ่มแชท ต้องมีการเรียกขาน "ช่างเบน" นำหน้าก่อน
    if (isGroup) {
      const trigger = BOT_TRIGGERS.find((t) => rawLower.startsWith(t))
      if (trigger) {
        strippedText = rawText.substring(trigger.length).trim()
        // ตัดอักขระพิเศษตัวแรกออก เช่น "," หรือ ":" ที่อาจติดมา
        if (strippedText.startsWith(',') || strippedText.startsWith(':')) {
          strippedText = strippedText.substring(1).trim()
        }
        // หากเรียกแต่ชื่อเฉยๆ ให้ตีความเป็นข้อความ "สวัสดี" เพื่อให้บอททักทายตอบกลับ
        if (!strippedText) {
          strippedText = "สวัสดี"
        }
        shouldProcess = true
      }
    } else {
      // แชทเดี่ยว คุยได้โดยตรงทันที
      shouldProcess = true
    }

    if (!shouldProcess || !strippedText) return

    // ตรวจสอบเมนูคำสั่งเพื่อตอบกลับด้วย Flex Message Carousel
    const checkMenu = strippedText.toLowerCase().replace(/\s+/g, '')
    const menuTriggers = [
      'เมนู', 'menu', 'help', 'คู่มือ', 
      'วิธีใช้งาน', 'แนะนำวิธีใช้งาน', 'แนะนำการใช้งาน', 
      'ทำอะไรได้บ้าง', 'ใช้งานยังไง', 'คำสั่ง'
    ]
    if (menuTriggers.some((t) => checkMenu.includes(t))) {
      await replyMessage(replyToken, [getMenuMessage()])
      return
    }

    const startTime = Date.now()
    console.log(`[ช่างเบน AI] กำลังประมวลผลข้อความ: "${strippedText}" (จาก: ${chatSourceId})`)

    // โหลดประวัติแชทของห้องแชทนี้ 5 ครั้งล่าสุด เพื่อทำ Context Memory
    let history: any[] = []
    try {
      const logs = await prisma.chatLog.findMany({
        where: { sourceId: chatSourceId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      const chronological = [...logs].reverse()
      history = chronological.flatMap((log) => [
        { role: 'user', parts: [{ text: log.userMessage }] },
        { role: 'model', parts: [{ text: log.botReply }] },
      ])
    } catch (err: any) {
      console.error('[ช่างเบน AI] ดึงประวัติแชทผิดพลาด:', err.message)
    }

    // ดึงข้อมูลโปรไฟล์ผู้ส่ง
    let userName = 'ผู้ใช้งาน'
    try {
      const profile = await getProfile(userId)
      if (profile?.displayName) {
        userName = profile.displayName
      }
    } catch { /* ignore */ }

    // ตรวจสอบสิทธิ์สิทธิผู้ส่งจาก LineUser
    let userRole = 'USER'
    try {
      const lineUser = await prisma.lineUser.findUnique({
        where: { lineUserId: userId },
      })
      if (lineUser) {
        userRole = lineUser.role
      }
    } catch { /* ignore */ }

    const userContext = {
      userId,
      userName,
      userRole,
      chatSourceType: sourceType,
      chatSourceId,
    }

    try {
      // ถามบอทช่างเบนผ่าน Gemini
      const aiResult = await askBen(strippedText, history, userContext)

      const responseTimeMs = Date.now() - startTime

      // หากตอบกลับเร็ว (ต่ำกว่า 4.5 วินาที) ให้ใช้ replyText ทันทีเพื่อไม่กินโควต้า Push Message และเพื่อความเสถียร
      // หากคิวรี่ช้ากว่านั้น ให้ใช้ pushText เพื่อเลี่ยงปัญหาหมดอายุของ Reply Token ของ LINE (5 วินาที)
      if (responseTimeMs < 4500) {
        await replyText(replyToken, aiResult.text)
      } else {
        await pushText(chatSourceId, aiResult.text)
      }

      // บันทึกประวัติลง ChatLog
      await prisma.chatLog.create({
        data: {
          sourceType,
          sourceId: chatSourceId,
          userName,
          userMessage: strippedText.substring(0, 1000),
          botReply: aiResult.text.substring(0, 4000),
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          modelName: aiResult.modelName,
          responseTimeMs,
        },
      })

      console.log(`[ช่างเบน AI] ตอบกลับผู้ใช้เสร็จสิ้นภายใน ${responseTimeMs}ms (Tokens: ${aiResult.inputTokens + aiResult.outputTokens})`)
    } catch (err: any) {
      console.error('[ช่างเบน AI] เกิดข้อผิดพลาดในการรันบอท:', err.message)
      const responseTimeMs = Date.now() - startTime
      if (responseTimeMs < 4500) {
        await replyText(replyToken, `ขออภัยครับช่างเบนเกิดข้อผิดพลาดเล็กน้อย: ${err.message} รบกวนลองใหม่อีกครั้งนะครับ 🔧`)
      } else {
        await pushText(chatSourceId, `ขออภัยครับช่างเบนเกิดข้อผิดพลาดเล็กน้อย: ${err.message} รบกวนลองใหม่อีกครั้งนะครับ 🔧`)
      }
    }
  }
}

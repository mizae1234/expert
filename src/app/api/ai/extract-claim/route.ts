import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Allow large body (base64 images) and longer execution time for AI processing
export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { file, mimeType } = await request.json()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key is missing' }, { status: 500 })
    }

    // `file` is expected to be a data URL: `data:image/jpeg;base64,...` or `data:application/pdf;base64,...`
    const base64Data = file.split(',')[1]
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 })
    }

    // Default to image/jpeg if not provided
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf' = 'image/jpeg'
    
    if (mimeType === 'application/pdf') {
      mediaType = 'application/pdf'
    } else if (mimeType === 'image/png') {
      mediaType = 'image/png'
    } else if (mimeType === 'image/webp') {
      mediaType = 'image/webp'
    } else if (mimeType === 'image/gif') {
      mediaType = 'image/gif'
    } else if (file.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (file.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    } else if (file.startsWith('data:application/pdf')) {
      mediaType = 'application/pdf'
    }

    const systemPrompt = `You are an expert AI assistant that extracts data from Thai vehicle insurance claim documents and repair estimates. 
You must output ONLY valid JSON according to the following structure, with NO markdown formatting or surrounding text.
For each field, extract the 'value' and provide a 'confidence' score from 0 to 100 based on how clear it is.
If a field is missing, provide empty string for value and 0 for confidence.

{
  "claim": {
    "claimNo": { "value": "...", "confidence": 0 },
    "receiveNo": { "value": "...", "confidence": 0 },
    "transactionNo": { "value": "...", "confidence": 0 },
    "insuranceName": { "value": "...", "confidence": 0 },
    "branch": { "value": "...", "confidence": 0 },
    "status": { "value": "RECEIVED", "confidence": 100 },
    "createdAt": { "value": "YYYY-MM-DD", "confidence": 0 },
    "sentAt": { "value": "", "confidence": 0 }
  },
  "car": {
    "plate": { "value": "...", "confidence": 0 },
    "province": { "value": "...", "confidence": 0 },
    "brand": { "value": "...", "confidence": 0 },
    "model": { "value": "...", "confidence": 0 },
    "vin": { "value": "...", "confidence": 0 },
    "insuredName": { "value": "...", "confidence": 0 }
  },
  "labors": [
    {
      "description": { "value": "...", "confidence": 0 },
      "damageLevel": { "value": "เบา/ปานกลาง/หนัก", "confidence": 0 },
      "discountPct": { "value": 0, "confidence": 0 },
      "priceOffer": { "value": 0, "confidence": 0 },
      "priceApprove": { "value": 0, "confidence": 0 }
    }
  ],
  "parts": [
    {
      "partNo": { "value": "...", "confidence": 0 },
      "partName": { "value": "...", "confidence": 0 },
      "priceFull": { "value": 0, "confidence": 0 },
      "quantity": { "value": 1, "confidence": 0 },
      "damageType": { "value": "เปลี่ยน/ซ่อม", "confidence": 0 },
      "discountPct": { "value": 0, "confidence": 0 },
      "priceOffer": { "value": 0, "confidence": 0 },
      "priceApprove": { "value": 0, "confidence": 0 },
      "supplier": { "value": "...", "confidence": 0 },
      "requireReturn": { "value": false, "confidence": 0 }
    }
  ],
  "summary": {
    "laborTotal": { "value": 0, "confidence": 0 },
    "partsTotal": { "value": 0, "confidence": 0 },
    "subtotal": { "value": 0, "confidence": 0 },
    "vat": { "value": 0, "confidence": 0 },
    "grandTotal": { "value": 0, "confidence": 0 },
    "deductible": { "value": 0, "confidence": 0 }
  },
  "validation": {
    "passed": true,
    "warnings": []
  }
}

Important:
- Return ONLY the JSON object. Do NOT wrap it in \`\`\`json.
- Try to read Thai text correctly.
- Be precise with numbers and prices.
- Dates MUST be formatted as ISO YYYY-MM-DD in the Christian Era (CE / ค.ศ.). If the document has a Buddhist Era (พ.ศ.) date (e.g. 2569), you must subtract 543 to convert it to CE (e.g. 2026) before formatting it as YYYY-MM-DD.
`

    const messageContent: any = [
      {
        type: mediaType === 'application/pdf' ? 'document' : 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      },
      {
        type: 'text',
        text: 'Extract the information from this claim document according to the JSON structure provided.',
      }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent,
        }
      ],
      ...(mediaType === 'application/pdf' ? {
        betas: ['pdfs-2024-09-25']
      } : {})
    })

    const responseText = (response.content[0] as any).text
    
    // Parse the JSON string
    try {
      // Find the first { and last } in case Claude added some text
      const firstBrace = responseText.indexOf('{')
      const lastBrace = responseText.lastIndexOf('}')
      const jsonStr = responseText.substring(firstBrace, lastBrace + 1)
      const extractedData = JSON.parse(jsonStr)
      return NextResponse.json(extractedData)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText)
      return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 })
    }

  } catch (error: any) {
    const errMsg = error?.message || error?.toString() || 'Unknown error'
    const errStatus = error?.status || 500
    console.error('Extraction error:', errMsg, JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to extract document: ' + errMsg }, { status: errStatus })
  }
}


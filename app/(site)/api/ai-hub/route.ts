import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Gemini Text Generator
async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nei .env.local file-e.')
  }

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

  const bodyPayload: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  }

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(bodyPayload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (candidateText && candidateText.trim()) {
    return candidateText.trim()
  }

  throw new Error('Gemini theke response asheni.')
}

export async function POST(req: NextRequest) {
  try {
    const { type, prompt, recipient, tone, length } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt dorkar' }, { status: 400 })
    }

    const cleanPrompt = String(prompt).trim()

    // 1. NYX Mind / Chat / General AI (Gemini)
    if (type === 'nyx-mind' || type === 'chat' || type === 'general-ai') {
      const systemPrompt = "You are NYX Mind, an intelligent AI assistant powered by Google Gemini."
      const result = await generateWithGemini(cleanPrompt, systemPrompt)
      return NextResponse.json({ result })
    }

    // 2. Email Generator (Gemini)
    if (type === 'email' || type === 'text') {
      const targetRecipient = recipient || 'Sir / Madam'
      const selectedTone = tone || 'Professional'
      const emailLength = length || 'Standard'
      const emailPrompt = `Write a ${selectedTone} email of ${emailLength} length addressed to "${targetRecipient}". Context: "${cleanPrompt}". Provide only subject and body.`
      
      const result = await generateWithGemini(emailPrompt)
      return NextResponse.json({ result })
    }

    // 3. Image Generator: Gemini prompt refine korbe + clean direct image URL
    if (type === 'image') {
      let refinedPrompt = cleanPrompt

      try {
        // Gemini prothome image er jonno prompt-ti super enhance korbe
        refinedPrompt = await generateWithGemini(
          `Convert this idea into a concise 15-word visual prompt for image generation, no quotes: "${cleanPrompt}"`
        )
      } catch {
        refinedPrompt = cleanPrompt
      }

      const encodedPrompt = encodeURIComponent(refinedPrompt.replace(/[\n\r]+/g, ' ').trim())
      const randomSeed = Math.floor(Math.random() * 9999999) + 1000

      // Direct clean unmetered image generation stream
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true&nofeed=true&private=true`
      
      return NextResponse.json({ imageUrl })
    }

    const fallbackResult = await generateWithGemini(cleanPrompt)
    return NextResponse.json({ result: fallbackResult })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Hub server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
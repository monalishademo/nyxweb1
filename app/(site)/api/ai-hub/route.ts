import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const execFileAsync = promisify(execFile)

async function curl(args: string[], timeoutMs = 40000): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync('curl', ['-sS', '--max-time', String(Math.ceil(timeoutMs / 1000)), ...args], {
    maxBuffer: 12 * 1024 * 1024,
    timeout: timeoutMs + 2000,
  })
  return { stdout: stdout.toString(), stderr: stderr.toString() }
}

function extractText(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed) as {
      choices?: Array<{ message?: { content?: string } }>
      result?: string
    }
    const content = parsed.choices?.[0]?.message?.content || parsed.result
    if (content && content.trim()) return content.trim()
  } catch {
    return trimmed
  }
  return trimmed.startsWith('{') ? '' : trimmed
}

async function generateText(prompt: string): Promise<string> {
  const payload = JSON.stringify({
    model: 'openai',
    messages: [{ role: 'user', content: prompt }],
  })

  const { stdout } = await curl([
    '-X', 'POST',
    'https://text.pollinations.ai/openai',
    '-H', 'Content-Type: application/json',
    '-d', payload,
  ])
  
  const text = extractText(stdout)
  if (text) return text
  throw new Error('Empty response from AI gateway.')
}

export async function POST(req: NextRequest) {
  try {
    const { type, prompt, recipient, tone, length } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const cleanPrompt = String(prompt).trim()

    if (type === 'nyx-mind' || type === 'email' || type === 'text') {
      let finalPrompt = cleanPrompt

      if (type === 'email' || type === 'text') {
        const targetRecipient = recipient || 'Sir / Madam'
        const selectedTone = tone || 'Professional'
        const emailLength = length || 'Standard'
        finalPrompt = `Write a ${selectedTone} email of ${emailLength} length addressed to "${targetRecipient}". Context/Topic: "${cleanPrompt}" (Note: If the context is "CHUTI CHAI" or similar, it means a formal Leave Application for taking time off from work/office). Provide only the email subject line and body.`
      }

      const result = await generateText(finalPrompt)
      return NextResponse.json({ result })
    }

    if (type === 'image') {
      const encodedPrompt = encodeURIComponent(cleanPrompt)
      const randomSeed = Math.floor(Math.random() * 899999) + 100000
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`
      return NextResponse.json({ imageUrl })
    }

    return NextResponse.json({ error: 'Invalid AI request type specified.' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Hub server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
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
      error?: string
    }
    const content = parsed.choices?.[0]?.message?.content || parsed.result
    if (content && content.trim()) return content.trim()
    if (parsed.error) return ''
  } catch {
    return trimmed
  }
  return trimmed.startsWith('{') ? '' : trimmed
}

async function generateText(prompt: string): Promise<string> {
  const errors: string[] = []
  const payload = JSON.stringify({
    model: 'openai',
    messages: [{ role: 'user', content: prompt }],
  })

  const endpoints = [
    'https://text.pollinations.ai/openai',
    'https://text.pollinations.ai/',
  ]

  for (const url of endpoints) {
    try {
      const { stdout } = await curl([
        '-X', 'POST',
        url,
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/plain, */*',
        '-d', payload,
      ])
      const text = extractText(stdout)
      if (text) return text
      errors.push(`${url}: ${stdout.slice(0, 80) || 'empty'}`)
    } catch (err: unknown) {
      errors.push(`${url} failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  try {
    const getUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`
    const { stdout } = await curl([getUrl, '-H', 'Accept: text/plain, */*'])
    const text = extractText(stdout)
    if (text) return text
    errors.push(`GET: ${stdout.slice(0, 80) || 'empty'}`)
  } catch (err: unknown) {
    errors.push(`GET failed: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  throw new Error(errors.join(' | ') || 'Empty response from AI gateway.')
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

      try {
        const result = await generateText(finalPrompt)
        return NextResponse.json({ result })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'AI processing failed.'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    if (type === 'image') {
      const encodedPrompt = encodeURIComponent(cleanPrompt)
      const randomSeed = Math.floor(Math.random() * 899999) + 100000
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`

      try {
        const { stdout } = await execFileAsync(
          'curl',
          ['-sS', '--max-time', '45', imageUrl],
          { encoding: 'buffer', maxBuffer: 12 * 1024 * 1024, timeout: 50000 }
        )
        if (stdout.length > 800) {
          return NextResponse.json({
            imageUrl: `data:image/png;base64,${stdout.toString('base64')}`,
          })
        }
      } catch {
        console.warn('Image generation failed.')
      }

      return NextResponse.json({ imageUrl })
    }

    return NextResponse.json(
      { error: 'Invalid AI request type specified.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Hub server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

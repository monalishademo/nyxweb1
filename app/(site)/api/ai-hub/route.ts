import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { type, prompt, recipient, tone, length } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();

    // ==========================================
    // 1. NYX MIND (Only Uses GPT Astra)
    // ==========================================
    if (type === 'nyx-mind') {
      const astraKey = process.env.GPT_ASTRA_API_KEY;
      if (!astraKey || astraKey.trim().length < 10) {
        return NextResponse.json({ error: 'GPT Astra API key is missing in .env.local.' }, { status: 500 });
      }

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${astraKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: cleanPrompt }],
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) throw new Error('GPT Astra request failed.');

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return NextResponse.json({ result: text.trim() });
        }
        throw new Error('Empty response from GPT Astra.');
      } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'GPT Astra processing failed.' }, { status: 500 });
      }
    }

    // ==========================================
    // 2. TEXT / EMAIL HUB (Multi-Engine Fallback for other tools)
    // ==========================================
    if (type === 'email' || type === 'text') {
      const targetRecipient = recipient || 'Sir / Madam';
      const selectedTone = tone || 'Professional';
      const emailLength = length || 'Standard';

      const fullInstruction = `Write a ${selectedTone} email of ${emailLength} length addressed to "${targetRecipient}". Context/Topic: "${cleanPrompt}" (Note: If the context is "CHUTI CHAI" or similar, it means a formal Leave Application for taking time off from work/office, NOT tea or a break). Provide only the email subject line and body.`;

      // 1st Priority: GROQ
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey && groqKey.trim().length > 10) {
        try {
          const groq = new Groq({ apiKey: groqKey.trim() });
          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: fullInstruction }],
            model: 'llama-3.3-70b-versatile',
          });
          const output = completion.choices?.[0]?.message?.content;
          if (output) {
            return NextResponse.json({ result: output.trim() });
          }
        } catch (err) {
          console.warn('Groq busy or invalid key, switching to OpenRouter...');
        }
      }

      // 2nd Priority: OPENROUTER
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey && openRouterKey.trim().length > 10) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-chat',
              messages: [{ role: 'user', content: fullInstruction }],
            }),
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
              return NextResponse.json({ result: text.trim() });
            }
          }
        } catch (err) {
          console.warn('OpenRouter busy, switching to Gemini...');
        }
      }

      // 3rd Priority: GEMINI
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey && geminiKey.trim().length > 10) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey.trim());
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(fullInstruction);
          const responseText = result.response.text();
          if (responseText) {
            return NextResponse.json({ result: responseText.trim() });
          }
        } catch (err) {
          console.warn('Gemini busy, switching to GPT Astra...');
        }
      }

      // 4th Priority: GPT ASTRA
      const astraKey = process.env.GPT_ASTRA_API_KEY;
      if (astraKey && astraKey.trim().length > 10) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${astraKey.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: fullInstruction }],
            }),
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
              return NextResponse.json({ result: text.trim() });
            }
          }
        } catch (err) {
          console.warn('GPT Astra failed.');
        }
      }

      return NextResponse.json(
        { error: 'All AI text engines are currently busy or API keys are missing in .env.local.' },
        { status: 503 }
      );
    }

    // ==========================================
    // 3. IMAGE GENERATION HUB
    // ==========================================
    if (type === 'image') {
      let enhancedPrompt = cleanPrompt;

      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey && groqKey.trim().length > 10) {
        try {
          const groq = new Groq({ apiKey: groqKey.trim() });
          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: `Enhance this image generation prompt to be extremely detailed, professional, and visually stunning, suitable for high-end rendering. Return only the enhanced prompt text: "${cleanPrompt}"` }],
            model: 'llama-3.3-70b-versatile',
          });
          const text = completion.choices?.[0]?.message?.content;
          if (text) {
            enhancedPrompt = text.trim();
          }
        } catch (e) {
          // Fallback
        }
      }

      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const randomSeed = Math.floor(Math.random() * 899999) + 100000;

      try {
        const res = await fetch(`https://hercai.onrender.com/v3/text2image?prompt=${encodedPrompt}`, {
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            const imgBlob = await fetch(data.url);
            const buffer = Buffer.from(await imgBlob.arrayBuffer());
            return NextResponse.json({ imageUrl: `data:image/png;base64,${buffer.toString('base64')}` });
          }
        }
      } catch (err) {
        console.warn('Image Engine 1 failed, trying Engine 2...');
      }

      try {
        const res = await fetch(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`, {
          signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          return NextResponse.json({ imageUrl: `data:image/png;base64,${buffer.toString('base64')}` });
        }
      } catch (err) {
        console.warn('Image Engine 2 failed.');
      }

      return NextResponse.json({ error: 'Image generation pipeline is busy.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Invalid AI request type specified.' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'AI Hub server error' }, { status: 500 });
  }
}
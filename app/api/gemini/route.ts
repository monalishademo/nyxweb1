import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    // Groq SDK Initialize
    const groq = new Groq({ apiKey: apiKey.trim() });

    // Groq-এর সবচেয়ে ফাস্ট ও ফ্রি Llama 3.3 মডেল
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const textOutput = completion.choices[0]?.message?.content || '';

    // ফ্রন্টএন্ডের জন্য একই আউটপুট ফরম্যাট রাখা হয়েছে
    return NextResponse.json({ text: textOutput });

  } catch (error: any) {
    console.error('❌ Groq API Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
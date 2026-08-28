import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const cleanPrompt = encodeURIComponent(prompt.trim());
    const randomSeed = Math.floor(Math.random() * 899999) + 100000;

    // ১. প্রাইমারি হাই-রেজোলিউশন এন্ডপয়েন্ট
    try {
      const pUrl = `https://hercai.onrender.com/v3/text2image?prompt=${cleanPrompt}`;
      const pRes = await fetch(pUrl, { signal: AbortSignal.timeout(18000) });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData?.url) {
          const imgBlob = await fetch(pData.url);
          const buffer = Buffer.from(await imgBlob.arrayBuffer());
          return NextResponse.json({ imageUrl: `data:image/png;base64,${buffer.toString('base64')}` });
        }
      }
    } catch {
      console.warn('Engine 1 timed out, switching to Engine 2...');
    }

    // ২. সেকেন্ডারি হাই-স্পিড ব্যাকআপ এন্ডপয়েন্ট
    try {
      const sUrl = `https://api.airforce/v1/imagine?prompt=${cleanPrompt}&size=1024x1024&seed=${randomSeed}`;
      const sRes = await fetch(sUrl, { signal: AbortSignal.timeout(18000) });
      if (sRes.ok) {
        const buffer = Buffer.from(await sRes.arrayBuffer());
        return NextResponse.json({ imageUrl: `data:image/png;base64,${buffer.toString('base64')}` });
      }
    } catch {
      console.warn('Engine 2 timed out, switching to Engine 3...');
    }

    // ৩. টারশিয়ারি সুপার-স্টেবল সিঙ্ক এন্ডপয়েন্ট
    const tUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`;
    const tRes = await fetch(tUrl, { signal: AbortSignal.timeout(20000) });
    if (tRes.ok) {
      const buffer = Buffer.from(await tRes.arrayBuffer());
      return NextResponse.json({ imageUrl: `data:image/png;base64,${buffer.toString('base64')}` });
    }

    return NextResponse.json(
      { error: 'Rendering pipelines are currently saturated. Please try in a moment.' },
      { status: 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'NYX Engine pipeline error' },
      { status: 500 }
    );
  }
}
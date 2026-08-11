import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_.-]/g, '');

    // Maigret রান করা হচ্ছে এবং রেজাল্ট JSON ফাইলে সেভ করা হচ্ছে
    const command = `python -m maigret ${cleanUsername} --top-sites 50 --timeout 10 --no-autoupdate --no-progressbar --no-color --json simple`;

    try {
      await execPromise(command, { timeout: 90000 });
    } catch {
      // স্ক্যানের কোনো সাইট স্লো থাকলেও ফাইল জেনারেট হতে থাকবে
    }

    // Maigret জেনারেট করা ফাইলটি চেক করা
    const reportFileName = `report_${cleanUsername}_simple.json`;
    const reportPath = path.join(process.cwd(), reportFileName);

    let foundResults: any[] = [];

    if (fs.existsSync(reportPath)) {
      const rawData = fs.readFileSync(reportPath, 'utf-8');
      const parsedData = JSON.parse(rawData);
      const sites = Object.keys(parsedData);

      for (const site of sites) {
        const item = parsedData[site];
        if (item.status === 'claimed' || item.status === 'found') {
          foundResults.push({
            site: site,
            exists: true,
            url: item.url_user || `https://${site}/${cleanUsername}`,
            title: item.title || site,
            category: 'Social Profile',
          });
        }
      }

      // কাজ শেষে রিপোর্ট ফাইলটি ডিলিট করে দেওয়া
      try {
        fs.unlinkSync(reportPath);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      target: cleanUsername,
      totalChecked: 50,
      totalFound: foundResults.length,
      results: foundResults,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Execution error running Maigret' },
      { status: 500 }
    );
  }
}
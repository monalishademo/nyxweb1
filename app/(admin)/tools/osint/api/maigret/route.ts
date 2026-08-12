import { NextRequest, NextResponse } from 'next/server';

interface SiteCatalog {
  name: string;
  url: string;
  notMatchText: string[];
  matchText?: string[];
  category: string;
}

const SITES: SiteCatalog[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/{username}',
    notMatchText: ['Not Found', 'Find human', '404'],
    category: 'Developer Platform',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/{username}',
    notMatchText: ['If you have Telegram', 'you can contact'],
    matchText: ['@', 'Telegram: Contact'],
    category: 'Messaging',
  },
  {
    name: 'Reddit',
    url: 'https://www.reddit.com/user/{username}',
    notMatchText: ['page not found', 'nobody on Reddit goes by that name'],
    category: 'Social / Forum',
  },
  {
    name: 'Pinterest',
    url: 'https://www.pinterest.com/{username}/',
    notMatchText: ['User not found', '404'],
    category: 'Social / Media',
  },
  {
    name: 'Medium',
    url: 'https://medium.com/@{username}',
    notMatchText: ['404', 'Out of the ordinary', 'Page not found'],
    category: 'Blogging',
  },
  {
    name: 'PyPI',
    url: 'https://pypi.org/user/{username}/',
    notMatchText: ['404', 'Not Found'],
    category: 'Package Repository',
  },
  {
    name: 'Docker Hub',
    url: 'https://hub.docker.com/v2/users/{username}',
    notMatchText: ['404', 'object does not exist'],
    category: 'Developer Platform',
  },
  {
    name: 'Chess.com',
    url: 'https://www.chess.com/member/{username}',
    notMatchText: ['Fooled Us', '404'],
    category: 'Gaming',
  },
  {
    name: 'Steam',
    url: 'https://steamcommunity.com/id/{username}',
    notMatchText: ['The specified profile could not be found'],
    category: 'Gaming',
  },
  {
    name: 'Dev.to',
    url: 'https://dev.to/{username}',
    notMatchText: ['404', 'not found'],
    category: 'Blogging',
  }
];

async function checkSite(site: SiteCatalog, username: string) {
  const targetUrl = site.url.replace('{username}', encodeURIComponent(username));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 Sec Timeout

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    // If 404 Status Code, directly return False
    if (response.status === 404) {
      return { site: site.name, category: site.category, exists: false, url: targetUrl };
    }

    const html = await response.text();

    // Check for Not Match Texts (Errors)
    const hasNotMatch = site.notMatchText.some((text) =>
      html.toLowerCase().includes(text.toLowerCase())
    );

    if (hasNotMatch) {
      return { site: site.name, category: site.category, exists: false, url: targetUrl };
    }

    // Extract Title for Verification & High Accuracy
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : site.name;

    // Check Match Text if Defined
    if (site.matchText) {
      const hasMatch = site.matchText.some((text) =>
        html.toLowerCase().includes(text.toLowerCase())
      );
      if (!hasMatch) {
        return { site: site.name, category: site.category, exists: false, url: targetUrl };
      }
    }

    return {
      site: site.name,
      category: site.category,
      exists: true,
      url: targetUrl,
      title: pageTitle,
    };
  } catch (e) {
    return { site: site.name, category: site.category, exists: false, url: targetUrl };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim();

    // Run scans concurrently with Promise.all
    const scanPromises = SITES.map((site) => checkSite(site, cleanUsername));
    const results = await Promise.all(scanPromises);

    const foundSites = results.filter((r) => r.exists);

    return NextResponse.json({
      success: true,
      target: cleanUsername,
      totalChecked: SITES.length,
      totalFound: foundSites.length,
      results: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Engine Scan Failed' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// ---> VERCEL FIX 1: Force Vercel to NEVER cache this API route <---
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let episode_title = '';
        let description = '';
        let thumbnail_url = '';
        let author = '';
        let publish_date = '';
        let view_count = '';
        let platform = "Web";

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            platform = "YouTube";
        } else if (url.includes("spotify.com")) {
            platform = "Spotify";
        } else if (url.includes("apple.com") || url.includes("podcasts.apple")) {
            platform = "Apple Podcasts";
        }

        // ---> VERCEL FIX 2: If it's YouTube, ALWAYS use the official unblockable API first <---
        if (platform === "YouTube") {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                // 'no-store' forces Vercel to actually make the request every time
                const oembedRes = await fetch(oembedUrl, { cache: 'no-store' });

                if (oembedRes.ok) {
                    const oembedData = await oembedRes.json();
                    episode_title = oembedData.title;
                    thumbnail_url = oembedData.thumbnail_url;
                    author = oembedData.author_name;
                }
            } catch (err) {
                console.error("YouTube oEmbed failed:", err);
            }
        }

        // 3. Now we fetch the HTML to get the remaining pieces (like description, date, and views)
        // We use 'no-store' here too so Vercel doesn't cache a Bot-blocked page!
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb.20230101-17-p0.en+FX+478'
            },
            cache: 'no-store'
        });

        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);

            // Only overwrite title/author/thumbnail if they are still empty
            if (!episode_title) episode_title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
            if (!description) description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
            if (!thumbnail_url) thumbnail_url = $('meta[property="og:image"]').attr('content') || '';
            if (!author) {
                author = $('link[itemprop="name"]').attr('content') ||
                    $('meta[name="author"]').attr('content') ||
                    $('meta[property="og:site_name"]').attr('content') || '';
            }

            // Extract the tricky metrics
            publish_date = $('meta[itemprop="datePublished"]').attr('content') || $('meta[property="article:published_time"]').attr('content') || '';
            view_count = $('meta[itemprop="interactionCount"]').attr('content') || '';

            if (!view_count && platform === "YouTube") {
                const viewMatch = html.match(/"viewCount":"(\d+)"/);
                if (viewMatch && viewMatch[1]) {
                    view_count = viewMatch[1];
                }
            }
        }

        // Final cleanup
        if (!episode_title || episode_title.includes("Before you continue") || episode_title === "YouTube") {
            episode_title = 'Unknown Title (Bot Blocked)';
        }

        return NextResponse.json({
            url,
            episode_title,
            description,
            thumbnail_url,
            platform,
            author,
            publish_date,
            view_count,
        });

    } catch (error: any) {
        console.error('Failed to scrape URL:', error);
        return NextResponse.json({
            error: error?.message || 'Unknown server error'
        }, { status: 500 });
    }
}
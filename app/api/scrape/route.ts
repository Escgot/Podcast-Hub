import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Fetch with Anti-Bot Headers (Cookie bypasses the EU/Bot consent screen)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb.20230101-17-p0.en+FX+478'
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page. Status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 2. Extract standard tags
        let episode_title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        let description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        let thumbnail_url = $('meta[property="og:image"]').attr('content') || '';

        let author =
            $('link[itemprop="name"]').attr('content') ||
            $('meta[name="author"]').attr('content') ||
            $('meta[property="og:site_name"]').attr('content') ||
            '';

        let publish_date =
            $('meta[itemprop="datePublished"]').attr('content') ||
            $('meta[property="article:published_time"]').attr('content') ||
            '';

        let view_count = $('meta[itemprop="interactionCount"]').attr('content') || '';

        // YouTube specific hidden view count fallback
        if (!view_count && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            const viewMatch = html.match(/"viewCount":"(\d+)"/);
            if (viewMatch && viewMatch[1]) {
                view_count = viewMatch[1];
            }
        }

        // 3. Platform Detection
        let platform = "Web";
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            platform = "YouTube";
        } else if (url.includes("spotify.com")) {
            platform = "Spotify";
        } else if (url.includes("apple.com") || url.includes("podcasts.apple")) {
            platform = "Apple Podcasts";
        }

        // ---> 4. VERCEL ANTI-BOT FALLBACK <---
        // If YouTube gave us a Captcha/Consent page, the title will be empty or say "Before you continue".
        // We catch that here and use the official unblockable oEmbed API to rescue the data!
        if (platform === "YouTube" && (!episode_title || episode_title.includes("Before you continue") || episode_title === "YouTube")) {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const oembedRes = await fetch(oembedUrl);
                if (oembedRes.ok) {
                    const oembedData = await oembedRes.json();
                    episode_title = oembedData.title;
                    thumbnail_url = oembedData.thumbnail_url;
                    author = oembedData.author_name;
                    // Note: oEmbed guarantees title, thumbnail, and author, but does not provide views/dates.
                }
            } catch (fallbackError) {
                console.error("oEmbed fallback failed", fallbackError);
            }
        }

        // Final cleanup for totally unknown titles
        if (!episode_title) episode_title = 'Unknown Title';

        // 5. Send data back
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
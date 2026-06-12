import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
    try {
        // 1. Get the URL submitted by the user
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 2. Fetch the HTML from the podcast page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page. Status: ${response.status}`);
        }

        const html = await response.text();

        // 3. Load the HTML into cheerio to parse it
        const $ = cheerio.load(html);

        // 4. Extract the Open Graph (og) tags
        const episode_title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Title';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const thumbnail_url = $('meta[property="og:image"]').attr('content') || '';

        const author =
            $('link[itemprop="name"]').attr('content') ||
            $('meta[name="author"]').attr('content') ||
            $('meta[property="og:site_name"]').attr('content') ||
            '';

        // ---> NEW LOGIC: Extract Date and Views <---
        const publish_date =
            $('meta[itemprop="datePublished"]').attr('content') || // YouTube format
            $('meta[property="article:published_time"]').attr('content') || // Article format
            '';

        let view_count = $('meta[itemprop="interactionCount"]').attr('content') || '';

        // ---> REGEX FALLBACK: Dig into YouTube's hidden scripts if the meta tag is missing <---
        if (!view_count && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            const viewMatch = html.match(/"viewCount":"(\d+)"/);
            if (viewMatch && viewMatch[1]) {
                view_count = viewMatch[1];
            }
        }

        // 5. Detect the platform based on the URL (FIXED: This was missing!)
        let platform = "Web";
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            platform = "YouTube";
        } else if (url.includes("spotify.com")) {
            platform = "Spotify";
        } else if (url.includes("apple.com") || url.includes("podcasts.apple")) {
            platform = "Apple Podcasts";
        }

        // 6. Send the clean data back to the frontend
        return NextResponse.json({
            url,
            episode_title,
            description,
            thumbnail_url,
            platform,     // This now works!
            author,
            publish_date, // New Date
            view_count,   // New View Count
        });

    } catch (error: any) {
        console.error('Failed to scrape URL:', error);
        // This will now pass the real system error to your frontend alert
        return NextResponse.json({
            error: error?.message || 'Unknown server error'
        }, { status: 500 });
    }
}
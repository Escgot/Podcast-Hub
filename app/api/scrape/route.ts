import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

// Helper function to extract the 11-character YouTube video ID
function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

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

        // ---> STRATEGY FOR YOUTUBE <---
        if (platform === "YouTube") {
            const videoId = getYouTubeId(url);
            const apiKey = process.env.YOUTUBE_API_KEY;

            // OPTION A: If you have an API key, use Google's official unblockable endpoint
            if (videoId && apiKey) {
                try {
                    const apiRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
                        { cache: 'no-store' }
                    );
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        if (apiData.items && apiData.items.length > 0) {
                            const item = apiData.items[0];
                            episode_title = item.snippet.title;
                            description = item.snippet.description || '';
                            thumbnail_url = item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || '';
                            author = item.snippet.channelTitle;
                            publish_date = item.snippet.publishedAt; // e.g. "2024-03-22T14:00:00Z"
                            view_count = item.statistics.viewCount; // e.g. "54231"
                        }
                    }
                } catch (err) {
                    console.error("Official YouTube Data API failed, using fallback:", err);
                }
            }

            // OPTION B: Fallback to oEmbed if no API key is set yet (gets Title/Thumb, sets default views/dates)
            if (!episode_title) {
                try {
                    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                    const oembedRes = await fetch(oembedUrl, { cache: 'no-store' });
                    if (oembedRes.ok) {
                        const oembedData = await oembedRes.json();
                        episode_title = oembedData.title;
                        thumbnail_url = oembedData.thumbnail_url;
                        author = oembedData.author_name;
                        description = "Add description manually or set up a YOUTUBE_API_KEY to fetch details automatically.";
                        publish_date = new Date().toISOString().split('T')[0]; // temporary placeholder date
                        view_count = "0"; // temporary placeholder views
                    }
                } catch (err) {
                    console.error("YouTube oEmbed fallback failed:", err);
                }
            }
        } else {
            // ---> STRATEGY FOR NON-YOUTUBE PLATFORMS (Spotify/Apple work perfectly via HTML scraping on Vercel) <---
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);

                    episode_title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
                    description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
                    thumbnail_url = $('meta[property="og:image"]').attr('content') || '';
                    author = $('link[itemprop="name"]').attr('content') || $('meta[name="author"]').attr('content') || $('meta[property="og:site_name"]').attr('content') || '';
                    publish_date = $('meta[itemprop="datePublished"]').attr('content') || $('meta[property="article:published_time"]').attr('content') || '';
                    view_count = $('meta[itemprop="interactionCount"]').attr('content') || '';
                }
            } catch (err) {
                console.error("HTML scraping failed for alternative platform:", err);
            }
        }

        // Final sanitation checks so the database never receives empty values
        if (!episode_title) episode_title = 'Unknown Title';
        if (!publish_date) publish_date = new Date().toISOString().split('T')[0];
        if (!view_count) view_count = '0';

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
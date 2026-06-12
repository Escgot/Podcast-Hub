import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

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

        // ---> DIAGNOSTIC STRATEGY FOR YOUTUBE <---
        if (platform === "YouTube") {
            const videoId = getYouTubeId(url);
            const apiKey = process.env.YOUTUBE_API_KEY;

            let googleSucceeded = false;
            let googleErrorMessage = '';

            if (videoId) {
                if (apiKey) {
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
                                publish_date = item.snippet.publishedAt;
                                view_count = item.statistics.viewCount;
                                googleSucceeded = true;
                            } else {
                                googleErrorMessage = "Video ID not found on YouTube.";
                            }
                        } else {
                            // Read Google's exact error response
                            const errorData = await apiRes.json().catch(() => ({}));
                            googleErrorMessage = errorData?.error?.message || `Google HTTP Status ${apiRes.status}`;
                        }
                    } catch (err: any) {
                        googleErrorMessage = `Network error contacting Google: ${err?.message || err}`;
                    }
                } else {
                    googleErrorMessage = "ENV_VARIABLE_MISSING_OR_EMPTY";
                }
            } else {
                googleErrorMessage = "COULD_NOT_PARSE_VIDEO_ID";
            }

            // If Google failed, use oEmbed to save the title/image, but display the diagnostic error
            if (!googleSucceeded) {
                try {
                    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                    const oembedRes = await fetch(oembedUrl, { cache: 'no-store' });
                    if (oembedRes.ok) {
                        const oembedData = await oembedRes.json();
                        episode_title = oembedData.title;
                        thumbnail_url = oembedData.thumbnail_url;
                        author = oembedData.author_name;

                        // Output the precise reason why it dropped to fallback
                        if (googleErrorMessage === "ENV_VARIABLE_MISSING_OR_EMPTY") {
                            description = "Vercel Error: The YOUTUBE_API_KEY environment variable is completely missing or blank in your settings.";
                        } else {
                            description = `Google Cloud Rejection Message: "${googleErrorMessage}"`;
                        }

                        publish_date = new Date().toISOString().split('T')[0];
                        view_count = "0";
                    }
                } catch (err) {
                    console.error("YouTube oEmbed fallback failed:", err);
                }
            }
        } else {
            // ---> STRATEGY FOR NON-YOUTUBE PLATFORMS <---
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
                    cache: 'no-store'
                });
                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    episode_title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
                    description = $('meta[property="og:description"]').attr('content') || '';
                    thumbnail_url = $('meta[property="og:image"]').attr('content') || '';
                    author = $('link[itemprop="name"]').attr('content') || '';
                    publish_date = $('meta[itemprop="datePublished"]').attr('content') || '';
                    view_count = $('meta[itemprop="interactionCount"]').attr('content') || '';
                }
            } catch (err) {
                console.error("Scraping failed for alternative platform:", err);
            }
        }

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
        return NextResponse.json({ error: error?.message || 'Unknown server error' }, { status: 500 });
    }
}
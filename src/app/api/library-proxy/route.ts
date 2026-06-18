 import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
    }

    // Only allow excalidraw library URLs for security
    if (!url.startsWith('https://libraries.excalidraw.com/') && !url.startsWith('https://raw.githubusercontent.com/excalidraw/')) {
        return NextResponse.json({ error: 'Unauthorized URL' }, { status: 403 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GenesisFlowState/1.0',
            },
            next: { revalidate: 86400 }, // cache for 24h
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (err) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

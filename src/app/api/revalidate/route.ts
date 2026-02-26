import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  // Prefer header (avoids secret in logs/URL); fallback to query for backwards compatibility
  const secret = req.headers.get('x-revalidate-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    // 2. Revalidate the Sitemap
    // This tells Next.js to purge the cached version of sitemap.xml and regenerate it
    revalidatePath('/sitemap.xml');
    
    // Optional: You can also revalidate specific paths if you send them in the body
    // const body = await req.json();
    // if (body.path) revalidatePath(body.path);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: err }, { status: 500 });
  }
}
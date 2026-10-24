import { NextResponse } from 'next/server';
import { appleAppSiteAssociation, WELL_KNOWN_JSON_HEADERS } from '@/lib/wellKnownAppLinks';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(appleAppSiteAssociation(), {
    headers: WELL_KNOWN_JSON_HEADERS,
  });
}

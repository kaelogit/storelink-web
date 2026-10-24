import { NextResponse } from 'next/server';
import {
  ANDROID_SHA256_FINGERPRINTS,
  androidAssetLinks,
  WELL_KNOWN_JSON_HEADERS,
} from '@/lib/wellKnownAppLinks';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(androidAssetLinks(ANDROID_SHA256_FINGERPRINTS), {
    headers: WELL_KNOWN_JSON_HEADERS,
  });
}

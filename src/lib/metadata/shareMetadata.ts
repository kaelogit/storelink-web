import type { Metadata } from 'next';
import { createServerClient as createAnonServerClient } from '@/lib/supabase';
import { createServerClient as createCookieServerClient } from '@/lib/supabase-server';
import { getLocaleForCountry, getSiteNameForCountry } from '@/lib/countryMetadata';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { siteOriginForMetadata } from '@/lib/sharingContract';
import { normalizeServiceToken, resolveServiceByToken } from '@/lib/service-route-resolver';

/** Decode and normalize product slug from URL (aligned with public `/p/[slug]`). */
export function normalizeProductSlug(raw: string): string {
  try {
    const decoded = decodeURIComponent((raw || '').trim());
    return decoded.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || '';
  } catch {
    return (raw || '').trim();
  }
}

export async function buildProductShareMetadata(slugRaw: string): Promise<Metadata> {
  const slug = normalizeProductSlug(slugRaw);
  if (!slug) return { title: 'Product Not Found | StoreLink' };
  const supabase = await createCookieServerClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, currency_code, image_urls, seller_id, slug, seller:profiles(location_country_code)')
    .ilike('slug', slug)
    .single();

  const sellerCountry = (product as { seller?: { location_country_code?: string | null } | null })?.seller?.location_country_code ?? null;
  const origin = siteOriginForMetadata();

  if (!product) {
    return { title: 'Product Not Found | StoreLink' };
  }

  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency_code || 'NGN',
    minimumFractionDigits: 0,
  }).format(product.price);

  const title = `${product.name} - ${priceLabel} | StoreLink`;
  const description = product.description?.slice(0, 160) || `Buy ${product.name} securely on StoreLink.`;
  const mainImage = product.image_urls?.[0] || `${origin}/default-product.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}/p/${encodeURIComponent(slug)}`,
      siteName: getSiteNameForCountry(sellerCountry),
      images: [{ url: mainImage, width: 800, height: 800, alt: product.name }],
      locale: getLocaleForCountry(sellerCountry),
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [mainImage] },
    alternates: { canonical: `${origin}/p/${encodeURIComponent(slug)}` },
  };
}

/** Resolve reel by short_code or uuid (shared with `/r/[id]` and `/app/reels/[id]`). */
export async function getReelByParam(param: string) {
  const supabase = createAnonServerClient();
  const select = `
    *,
    seller:profiles!reels_seller_id_fkey (display_name, slug, logo_url, is_verified, location_country_code),
    product:products!product_id(id, slug, name, price, currency_code, image_urls, is_flash_drop, flash_price, flash_end_time, stock_quantity),
    service:service_listings!service_listing_id(id, slug, title, hero_price_min, currency_code, media)
  `;
  const normalized = decodeURIComponent(String(param || '')).trim();
  const shortCode = normalized.toLowerCase();
  const byShortCode = await supabase.from('reels').select(select).ilike('short_code', shortCode).maybeSingle();
  if (byShortCode.data) return byShortCode.data;
  const byId = await supabase.from('reels').select(select).eq('id', normalized).maybeSingle();
  if (byId.data) return byId.data;
  return null;
}

export async function buildReelShareMetadata(idParam: string): Promise<Metadata> {
  const reel = await getReelByParam(idParam);
  const origin = siteOriginForMetadata();

  if (!reel) return { title: 'Reel Not Found | StoreLink' };

  const seller: unknown = reel.seller;
  const sellerName = Array.isArray(seller) ? (seller as { display_name?: string }[])[0]?.display_name : (seller as { display_name?: string })?.display_name;
  const sellerCountry = Array.isArray(seller)
    ? (seller as { location_country_code?: string | null }[])[0]?.location_country_code
    : (seller as { location_country_code?: string | null })?.location_country_code;

  const title = `Watch ${sellerName || 'a seller'}'s video on StoreLink`;
  const desc = (reel as { description?: string | null }).description || 'Check out this trending product video on StoreLink.';
  const canonicalCode = (reel as { short_code?: string | null; id?: string }).short_code || (reel as { id?: string }).id;
  const thumb = (reel as { thumbnail_url?: string | null }).thumbnail_url || `${origin}/default-reel.png`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${origin}/r/${encodeURIComponent(String(canonicalCode || ''))}`,
      siteName: getSiteNameForCountry(sellerCountry),
      locale: getLocaleForCountry(sellerCountry),
      images: [{ url: thumb, width: 720, height: 1280, alt: 'Video Preview' }],
      type: 'video.other',
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [thumb] },
    alternates: { canonical: `${origin}/r/${encodeURIComponent(String(canonicalCode || ''))}` },
  };
}

/** Normalize profile path: strip @, trim, lowercase (aligned with `/@[username]`). */
export function normalizeUsername(username: string): string {
  const raw = typeof username === 'string' ? username : '';
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  return withoutAt.trim().toLowerCase() || '';
}

function absoluteMediaForOg(url: string, origin: string): string {
  const u = (url || '').trim();
  if (!u) return `${origin}/brand/og-share.png`;
  if (/^https?:\/\//i.test(u)) return u;
  return u.startsWith('/') ? `${origin}${u}` : `${origin}/${u}`;
}

export async function buildProfileShareMetadata(usernameRaw: string): Promise<Metadata> {
  const slug = normalizeUsername(usernameRaw);
  if (!slug) return { title: 'User Not Found | StoreLink' };
  const supabase = createAnonServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, logo_url, slug, location_country_code')
    .ilike('slug', slug)
    .single();

  const origin = siteOriginForMetadata();

  if (!profile) {
    return { title: 'User Not Found | StoreLink' };
  }

  const title = `${profile.display_name} (@${profile.slug}) | StoreLink`;
  const description = profile.bio || `Shop unique items and explore the collection from ${profile.display_name} on StoreLink.`;
  const image = absoluteMediaForOg(normalizeWebMediaUrl(profile.logo_url), origin);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}/@${encodeURIComponent(String(profile.slug))}`,
      siteName: getSiteNameForCountry(profile.location_country_code),
      images: [{ url: image, width: 800, height: 800, alt: profile.display_name }],
      locale: getLocaleForCountry(profile.location_country_code),
      type: 'profile',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image], creator: '@storelink' },
    alternates: { canonical: `${origin}/@${encodeURIComponent(String(profile.slug))}` },
    appleWebApp: { title: 'StoreLink', statusBarStyle: 'default' },
  };
}

export async function buildServiceShareMetadata(serviceTokenRaw: string): Promise<Metadata> {
  const serviceKey = normalizeServiceToken(serviceTokenRaw?.trim() || '');
  if (!serviceKey) return { title: 'Service Not Found | StoreLink' };

  const supabase = await createCookieServerClient();
  const resolvedService = await resolveServiceByToken(supabase, serviceKey, { activeOnly: false });
  if (!resolvedService) return { title: 'Service Not Found | StoreLink' };

  const row = resolvedService.service as {
    title?: string;
    description?: string | null;
    hero_price_min?: number | null;
    currency_code?: string | null;
    media?: unknown;
    slug?: string | null;
    id?: string;
    location_country_code?: string | null;
  };
  const seller = resolvedService.seller as {
    slug?: string | null;
    display_name?: string | null;
    logo_url?: string | null;
    location_country_code?: string | null;
  };

  const sellerSlug = String(resolvedService.canonicalSellerSlug || seller?.slug || '').trim();
  const tokenForPath = encodeURIComponent(String(resolvedService.canonicalServiceTokenRaw || serviceKey));
  const canonicalPath = sellerSlug ? `/s/${encodeURIComponent(sellerSlug)}/${tokenForPath}` : `/service/${tokenForPath}`;

  const heroPriceMain = (Number(row.hero_price_min) || 0) / 100;
  const priceLabel = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: row.currency_code || 'NGN',
    minimumFractionDigits: 0,
  }).format(heroPriceMain || 0);

  const title = `${row.title || 'Service'} - From ${priceLabel} | StoreLink`;
  const description =
    (typeof row.description === 'string' ? row.description : '')?.slice(0, 160) ||
    `Book ${row.title || 'this service'} with ${seller?.display_name || 'a seller'} on StoreLink.`;

  const media = (row.media as string[] | null) || [];
  const mainImage =
    (Array.isArray(media) && media.length > 0 && typeof media[0] === 'string' && media[0]) ||
    seller?.logo_url ||
    `${siteOriginForMetadata()}/brand/og-share.png`;

  const countryCode = row.location_country_code ?? seller?.location_country_code ?? null;
  const origin = siteOriginForMetadata();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}${canonicalPath}`,
      siteName: getSiteNameForCountry(countryCode),
      images: [{ url: mainImage, width: 800, height: 800, alt: row.title || 'Service' }],
      locale: getLocaleForCountry(countryCode),
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [mainImage] },
    alternates: { canonical: `${origin}${canonicalPath}` },
  };
}

/** `/app/s/**` catch-all — same OG as public `/s/...` canonical. */
export async function buildAppServiceCatchAllMetadata(parts: string[]): Promise<Metadata> {
  const p = Array.isArray(parts) ? parts : [];
  let serviceKey = '';
  if (p.length === 1) {
    serviceKey = normalizeServiceToken(p[0]);
  } else if (p.length === 2) {
    serviceKey = normalizeServiceToken(p[1]);
  } else if (p.length === 3 && String(p[1] || '').toLowerCase() === 'service') {
    serviceKey = normalizeServiceToken(p[2]);
  } else {
    return { title: 'Service | StoreLink' };
  }
  if (!serviceKey) return { title: 'Service | StoreLink' };
  return buildServiceShareMetadata(serviceKey);
}

export async function buildSpotlightShareMetadata(spotlightIdRaw: string): Promise<Metadata> {
  const spotlightId = String(spotlightIdRaw || '').trim();
  if (!spotlightId) return { title: 'Spotlight | StoreLink' };

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('spotlight_posts')
    .select(
      `
      id,
      caption,
      thumbnail_url,
      media_url,
      creator:profiles!creator_id(display_name, slug, logo_url, location_country_code)
    `,
    )
    .eq('id', spotlightId)
    .eq('moderation_state', 'active')
    .maybeSingle();

  const origin = siteOriginForMetadata();

  if (error || !data) {
    return { title: 'Spotlight | StoreLink' };
  }

  const creatorRow = Array.isArray((data as { creator?: unknown }).creator)
    ? (data as { creator: { display_name?: string; slug?: string; logo_url?: string | null; location_country_code?: string | null }[] }).creator[0]
    : ((data as { creator?: { display_name?: string; slug?: string; logo_url?: string | null; location_country_code?: string | null } }).creator ?? {});

  const title = `${creatorRow?.display_name || 'Creator'} on StoreLink Spotlight`;
  const description = (data as { caption?: string | null }).caption?.slice(0, 160) || 'See this spotlight moment on StoreLink.';
  const img =
    normalizeWebMediaUrl((data as { thumbnail_url?: string | null }).thumbnail_url || (data as { media_url?: string | null }).media_url) ||
    normalizeWebMediaUrl(creatorRow?.logo_url) ||
    `${origin}/brand/og-share.png`;

  const country = creatorRow?.location_country_code ?? null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}/sp/${encodeURIComponent(spotlightId)}`,
      siteName: getSiteNameForCountry(country),
      images: [{ url: img, width: 800, height: 800, alt: title }],
      locale: getLocaleForCountry(country),
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
    alternates: { canonical: `${origin}/sp/${encodeURIComponent(spotlightId)}` },
  };
}

/** OG for seller stories — canonical public `/story-viewer/[id]` (redirects to `/app/story-viewer/...` in browser). */
export async function buildStoryShareMetadata(storyIdRaw: string): Promise<Metadata> {
  const storyId = String(storyIdRaw || '').trim();
  const origin = siteOriginForMetadata();
  const canonicalPath = `/story-viewer/${encodeURIComponent(storyId)}`;
  const fallbackTitle = 'Story on StoreLink';
  const fallbackDesc = 'Open this story in StoreLink to watch updates from this seller.';

  if (!storyId) {
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `${origin}${canonicalPath}`,
        siteName: getSiteNameForCountry(null),
        type: 'website',
      },
      alternates: { canonical: `${origin}${canonicalPath}` },
    };
  }

  const supabase = createAnonServerClient();
  const { data: story } = await supabase
    .from('stories')
    .select('id, media_url, story_text, type, seller_id')
    .eq('id', storyId)
    .maybeSingle();

  const sellerId = (story as { seller_id?: string | null } | null)?.seller_id;
  const { data: seller } = sellerId
    ? await supabase.from('profiles').select('display_name, slug, logo_url, location_country_code').eq('id', sellerId).maybeSingle()
    : { data: null };

  const sellerName = String((seller as { display_name?: string | null } | null)?.display_name || '').trim() || 'Seller';
  const title = `${sellerName}'s story | StoreLink`;
  const textSnippet = String((story as { story_text?: string | null } | null)?.story_text || '').trim().slice(0, 160);
  const description = textSnippet || `Watch ${sellerName}'s story on StoreLink.`;
  const mediaUrl = normalizeWebMediaUrl((story as { media_url?: string | null } | null)?.media_url || '');
  const logoUrl = normalizeWebMediaUrl((seller as { logo_url?: string | null } | null)?.logo_url || '');
  const img = mediaUrl || logoUrl || `${origin}/brand/og-share.png`;
  const country = (seller as { location_country_code?: string | null } | null)?.location_country_code ?? null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${origin}${canonicalPath}`,
      siteName: getSiteNameForCountry(country),
      images: [{ url: img, width: 800, height: 800, alt: title }],
      locale: getLocaleForCountry(country),
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [img] },
    alternates: { canonical: `${origin}${canonicalPath}` },
  };
}

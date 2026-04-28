type AnySupabase = any;
let serviceSlugColumnSupported: boolean | null = null;

export function normalizeUsernameToken(username: string): string {
  const raw = typeof username === 'string' ? username : '';
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  return withoutAt.trim().toLowerCase() || '';
}

export function normalizeServiceToken(token: string): string {
  try {
    return decodeURIComponent(String(token || '').trim());
  } catch {
    return String(token || '').trim();
  }
}

export async function resolveServiceByToken(
  supabase: AnySupabase,
  token: string,
  opts?: { activeOnly?: boolean },
): Promise<{
  service: any;
  seller: any;
  canonicalSellerSlug: string;
  canonicalServiceTokenRaw: string;
} | null> {
  const serviceKey = normalizeServiceToken(token);
  if (!serviceKey) return null;

  const serviceSelectWithSlug =
    'id, slug, seller_id, title, description, hero_price_min, currency_code, service_category, delivery_type, location_type, service_address, service_areas, media, location_country_code';
  const serviceSelectNoSlug =
    'id, seller_id, title, description, hero_price_min, currency_code, service_category, delivery_type, location_type, service_address, service_areas, media, location_country_code';
  const needsActive = opts?.activeOnly !== false;

  const isMissingSlugColumnError = (err: any) => {
    const msg = String(err?.message || '').toLowerCase();
    return msg.includes('slug') && msg.includes('does not exist');
  };

  const queryById = async (selectClause: string) => {
    let q = supabase.from('service_listings').select(selectClause).eq('id', serviceKey);
    if (needsActive) q = q.eq('is_active', true);
    return q.maybeSingle();
  };

  let serviceRow: any = null;
  if (serviceSlugColumnSupported !== false) {
    let bySlugQuery = supabase.from('service_listings').select(serviceSelectWithSlug).ilike('slug', serviceKey);
    if (needsActive) bySlugQuery = bySlugQuery.eq('is_active', true);
    const slugRes = await bySlugQuery.maybeSingle();

    if (slugRes.error && isMissingSlugColumnError(slugRes.error)) {
      serviceSlugColumnSupported = false;
    } else {
      if (serviceSlugColumnSupported == null && !slugRes.error) {
        serviceSlugColumnSupported = true;
      }
      if (slugRes.error) return null;
      serviceRow = slugRes.data ?? null;
      if (!serviceRow) {
        const idRes = await queryById(serviceSelectWithSlug);
        if (idRes.error && isMissingSlugColumnError(idRes.error)) {
          serviceSlugColumnSupported = false;
        } else {
          if (serviceSlugColumnSupported == null && !idRes.error) {
            serviceSlugColumnSupported = true;
          }
          if (idRes.error) return null;
          serviceRow = idRes.data ?? null;
        }
      }
    }
  }

  if (!serviceRow) {
    const idRes = await queryById(serviceSelectNoSlug);
    if (idRes.error) return null;
    serviceRow = idRes.data ?? null;
  }

  if (!serviceRow) return null;

  const sellerRes = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_url, is_verified, subscription_plan, location_city, location_state, location_country_code')
    .eq('id', serviceRow.seller_id)
    .maybeSingle();
  const seller = sellerRes.data || {
    id: serviceRow.seller_id,
    display_name: 'Store',
    slug: '',
    logo_url: null,
    is_verified: false,
    subscription_plan: null,
    location_city: null,
    location_state: null,
    location_country_code: null,
  };
  const canonicalSellerSlug = String(seller?.slug || '').trim().toLowerCase();
  const canonicalServiceTokenRaw = String((serviceRow as any)?.slug || serviceRow?.id || '').trim();
  if (!canonicalServiceTokenRaw) return null;

  return {
    service: serviceRow,
    seller,
    canonicalSellerSlug,
    canonicalServiceTokenRaw,
  };
}


/** Safe columns for other-user profile reads (matches public.public_profiles). */
export const PUBLIC_PROFILE_COLUMNS = [
  'id',
  'slug',
  'display_name',
  'logo_url',
  'cover_image_url',
  'bio',
  'is_seller',
  'seller_type',
  'category',
  'service_category',
  'is_store_open',
  'subscription_plan',
  'prestige_weight',
  'follower_count',
  'following_count',
  'product_count',
  'wardrobe_count',
  'view_count',
  'location',
  'location_city',
  'location_state',
  'location_country',
  'location_country_code',
  'currency_code',
  'instagram_handle',
  'tiktok_url',
  'loyalty_enabled',
  'loyalty_percentage',
  'verification_status',
  'business_verification_status',
  'is_verified',
  'is_wardrobe_private',
  'public_wardrobe',
  'share_online_status',
  'activity_status_enabled',
  'last_seen_at',
  'created_at',
  'service_delivery_type',
  'service_location_type',
  'account_status',
].join(',');

/** Row shape for PUBLIC_PROFILE_COLUMNS (avoids PostgREST GenericStringError on long selects). */
export type PublicProfileRow = {
  id: string;
  slug: string | null;
  display_name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
  is_seller: boolean | null;
  seller_type: string | null;
  category: string | null;
  service_category: string | null;
  is_store_open: boolean | null;
  subscription_plan: string | null;
  prestige_weight: number | null;
  follower_count: number | null;
  following_count: number | null;
  product_count: number | null;
  wardrobe_count: number | null;
  view_count: number | null;
  location: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_country_code: string | null;
  currency_code: string | null;
  instagram_handle: string | null;
  tiktok_url: string | null;
  loyalty_enabled: boolean | null;
  loyalty_percentage: number | null;
  verification_status: string | null;
  business_verification_status: string | null;
  is_verified: boolean | null;
  is_wardrobe_private: boolean | null;
  public_wardrobe: boolean | null;
  share_online_status: boolean | null;
  activity_status_enabled: boolean | null;
  last_seen_at: string | null;
  created_at: string | null;
  service_delivery_type: string | null;
  service_location_type: string | null;
  account_status: string | null;
};

export function asPublicProfileRow(data: unknown): PublicProfileRow | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Partial<PublicProfileRow>;
  if (!row.id) return null;
  return row as PublicProfileRow;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency } from '@/lib/activity-feed';

/** Matches labels like "From NGN 1,234" from get_story_queue */
export function currencyFromServicePriceLabel(label?: string | null) {
  if (!label) return 'NGN';
  const m = String(label).match(/From\s+([A-Z]{3})\b/i);
  return m ? m[1].toUpperCase() : 'NGN';
}

function mapRpcStoryRows(data: any[]) {
  return (data || []).map((s: any) => ({
    ...s,
    story_text: s.story_text,
    story_background_color: s.story_background_color,
    story_font: s.story_font,
    seller: {
      id: s.seller_id,
      display_name: s.seller_display_name,
      slug: s.seller_slug,
      logo_url: s.seller_logo_url,
      subscription_plan: s.seller_subscription_plan,
      loyalty_enabled: s.seller_loyalty_enabled,
      loyalty_percentage: s.seller_loyalty_percentage,
    },
    product: s.linked_product_id
      ? {
          id: s.linked_product_id,
          name: s.product_name,
          slug: (s as any).product_slug ?? null,
          price: s.product_price,
          currency_code: s.product_currency_code,
          image_urls: s.product_image_urls,
          stock_quantity: s.product_stock_quantity,
          is_flash_drop: s.product_is_flash_drop,
          flash_price: s.product_flash_price,
          flash_end_time: s.product_flash_end_time,
        }
      : null,
    service: s.service_listing_id
      ? {
          id: s.service_listing_id,
          name: s.service_title,
          from_price_label: s.service_from_price_label,
          image_url: s.service_image_url,
          media: s.service_media ?? null,
          currency_code: currencyFromServicePriceLabel(s.service_from_price_label),
        }
      : null,
  }));
}

/**
 * Same as store-link-mobile/app/story-viewer/[id].tsx story-queue queryFn (RPC + fallback).
 */
export async function fetchStoryQueue(
  supabase: SupabaseClient,
  storyId: string,
  userId: string | null,
): Promise<any[]> {
  const { data: initial, error: initErr } = await supabase
    .from('stories')
    .select('seller_id')
    .eq('id', storyId)
    .single();
  if (initErr || !initial?.seller_id) throw new Error('Not found');

  const { data, error } = await supabase.rpc('get_story_queue', {
    p_seller_id: initial.seller_id,
    p_user_id: userId,
  });

  if (!error && (data?.length || 0) > 0) {
    return mapRpcStoryRows(data || []);
  }

  const { data: storiesRaw, error: storiesError } = await supabase
    .from('stories')
    .select(
      'id,seller_id,media_url,type,linked_product_id,service_listing_id,created_at,expires_at,story_text,story_background_color,story_font,views_count,drawing_overlay_url',
    )
    .eq('seller_id', initial.seller_id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });
  if (storiesError) throw storiesError;
  const storyRows = storiesRaw || [];

  const productIds = Array.from(new Set(storyRows.map((s: any) => s.linked_product_id).filter(Boolean)));
  const serviceIds = Array.from(new Set(storyRows.map((s: any) => s.service_listing_id).filter(Boolean)));

  const [
    { data: seller },
    { data: products },
    { data: services },
    { data: productLikesRows },
    { data: serviceLikesRows },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,display_name,slug,logo_url,subscription_plan,loyalty_enabled,loyalty_percentage')
      .eq('id', initial.seller_id)
      .single(),
    productIds.length
      ? supabase
          .from('products')
          .select('id,name,price,currency_code,image_urls,stock_quantity,is_flash_drop,flash_price,flash_end_time,slug')
          .in('id', productIds as string[])
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? supabase.from('service_listings').select('id,title,hero_price_min,currency_code,media').in('id', serviceIds as string[])
      : Promise.resolve({ data: [] as any[] }),
    productIds.length
      ? supabase.from('product_likes').select('product_id, user_id').in('product_id', productIds as string[])
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? supabase.from('service_likes').select('service_listing_id, user_id').in('service_listing_id', serviceIds as string[])
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));
  const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));

  const plRows = productLikesRows || [];
  const slRows = serviceLikesRows || [];

  return storyRows.map((s: any) => {
    const p = s.linked_product_id ? productMap.get(s.linked_product_id) : null;
    const svc = s.service_listing_id ? serviceMap.get(s.service_listing_id) : null;
    const svcFrom =
      svc && typeof svc.hero_price_min === 'number'
        ? `From ${formatCurrency(svc.hero_price_min / 100, svc.currency_code || 'NGN')}`
        : null;

    let likes_count = 0;
    let is_liked = false;
    if (s.linked_product_id) {
      likes_count = plRows.filter((r: any) => r.product_id === s.linked_product_id).length;
      is_liked = !!userId && plRows.some((r: any) => r.product_id === s.linked_product_id && r.user_id === userId);
    } else if (s.service_listing_id) {
      likes_count = slRows.filter((r: any) => r.service_listing_id === s.service_listing_id).length;
      is_liked =
        !!userId && slRows.some((r: any) => r.service_listing_id === s.service_listing_id && r.user_id === userId);
    }

    return {
      ...s,
      likes_count,
      is_liked,
      seller: {
        id: seller?.id || s.seller_id,
        display_name: seller?.display_name,
        slug: seller?.slug,
        logo_url: seller?.logo_url,
        subscription_plan: seller?.subscription_plan,
        loyalty_enabled: seller?.loyalty_enabled,
        loyalty_percentage: seller?.loyalty_percentage,
      },
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: (p as any).slug ?? null,
            price: p.price,
            currency_code: p.currency_code,
            image_urls: p.image_urls,
            stock_quantity: p.stock_quantity,
            is_flash_drop: p.is_flash_drop,
            flash_price: p.flash_price,
            flash_end_time: p.flash_end_time,
          }
        : null,
      service: svc
        ? {
            id: svc.id,
            name: svc.title,
            from_price_label: svcFrom,
            image_url: Array.isArray(svc.media) ? svc.media[0] : null,
            media: svc.media ?? null,
            currency_code: svc.currency_code || 'NGN',
          }
        : null,
    };
  });
}

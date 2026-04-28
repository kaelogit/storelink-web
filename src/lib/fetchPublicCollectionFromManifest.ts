import type { SupabaseClient } from '@supabase/supabase-js';

export type CollectionManifestRow = { kind: string; id: string };

/**
 * Resolves ordered collection items for a public profile (manifest excludes per-item hidden rows server-side).
 */
export async function fetchPublicCollectionFromManifest(
  supabase: SupabaseClient,
  profileId: string,
): Promise<any[]> {
  const { data: manifest, error } = await supabase.rpc('get_public_collection_manifest', {
    p_profile_id: profileId,
  });
  if (error) throw error;

  const rows: CollectionManifestRow[] = Array.isArray(manifest)
    ? (manifest as CollectionManifestRow[])
    : [];

  if (!rows.length) return [];

  const productIds = rows.filter((r) => r.kind === 'product').map((r) => r.id);
  const serviceIds = rows.filter((r) => r.kind === 'service').map((r) => r.id);

  let productsData: any[] = [];
  let servicesData: any[] = [];

  if (productIds.length) {
    const res = await supabase.from('products').select('*').in('id', productIds);
    if (res.error) throw res.error;
    productsData = res.data || [];
  }
  if (serviceIds.length) {
    const res = await supabase.from('service_listings').select('*').in('id', serviceIds);
    if (res.error) throw res.error;
    servicesData = res.data || [];
  }

  const productById = new Map(
    productsData.map((p: any) => [p.id, { ...p, __content_type: 'product' }]),
  );
  const serviceById = new Map(
    servicesData.map((s: any) => [s.id, { ...s, __content_type: 'service' }]),
  );

  return rows
    .map((r) => (r.kind === 'product' ? productById.get(r.id) : serviceById.get(r.id)))
    .filter(Boolean);
}

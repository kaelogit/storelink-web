/**
 * Resolve a renamed seller slug for Edge middleware (storelink-web legacy `/sell` → subdomain 308).
 * Uses Supabase REST + anon key (same as NEXT_PUBLIC_* in this app).
 */
export async function resolveStorefrontSlugRedirectEdge(oldSlug: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!base || !key) return null;

  const normalized = oldSlug.trim().toLowerCase();
  if (!normalized) return null;

  const url = `${base}/rest/v1/storefront_slug_redirects?old_slug=eq.${encodeURIComponent(normalized)}&select=new_slug&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { new_slug?: string }[];
  const n = rows[0]?.new_slug;
  return typeof n === "string" && n.length > 0 ? n : null;
}

import { redirect } from 'next/navigation';

/**
 * Redirect /admin to the admin dashboard (admin-storelink).
 * Set NEXT_PUBLIC_ADMIN_APP_URL in env (e.g. https://admin.storelink.ng).
 */
export default function AdminRedirectPage() {
  const url = process.env.NEXT_PUBLIC_ADMIN_APP_URL;
  if (url) redirect(url);
  redirect('/');
}

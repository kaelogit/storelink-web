import { redirect } from 'next/navigation';

/**
 * Base /privacy redirects to Nigeria (default) for backward compatibility.
 * Country-specific privacy: /privacy/ng, /privacy/gh, /privacy/za, etc.
 */
export default function PrivacyPage() {
  redirect('/privacy/ng');
}

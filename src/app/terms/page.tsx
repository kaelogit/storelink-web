import { redirect } from 'next/navigation';

/**
 * Base /terms redirects to Nigeria (default) for backward compatibility.
 * Country-specific terms: /terms/ng, /terms/gh, /terms/za, etc.
 */
export default function TermsPage() {
  redirect('/terms/ng');
}

'use client';

import ShareToSheet from '@/components/share/ShareToSheet';

/** Global share sheet host — mount once in the root layout. */
export default function ShareSheetHost() {
  return <ShareToSheet />;
}

'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

/** Auth app shell toasts (commerce actions, send failures, etc.). */
export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={8_000}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}

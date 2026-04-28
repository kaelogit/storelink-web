'use client';

type EnsureAuthActionArgs = {
  viewerId: string | null;
  nextPath: string;
  action: string;
};

export function ensureAuthAction({ viewerId, nextPath, action }: EnsureAuthActionArgs) {
  if (viewerId) return true;
  const target = `/auth/action-required?action=${encodeURIComponent(action)}&next=${encodeURIComponent(nextPath)}`;
  window.location.href = target;
  return false;
}


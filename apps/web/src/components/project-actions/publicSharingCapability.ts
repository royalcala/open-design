// Whether the daemon behind this page can publish public file links at all.
//
// The delete confirmation gates on "can we read the project's active share
// count?", and refuses to delete when it cannot — correct for a cloud-backed
// daemon, where an unreadable state might hide live public links. A local,
// self-hosted daemon has no Workspace authority, so it can never hold a share:
// there, "unreadable" means "cannot exist", and refusing strands every project.
//
// `/api/version` is the existing "what runtime am I talking to" channel and
// reports the capability. Unknown (an older daemon, or a failed read) keeps the
// fail-closed behavior — only an explicit `false` unlocks deletion.

import { useEffect, useState } from 'react';

let cached: Promise<boolean | null> | null = null;

async function readPublicSharingCapability(): Promise<boolean | null> {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) return null;
    const json = (await response.json()) as { version?: { capabilities?: { publicSharing?: unknown } } };
    const value = json?.version?.capabilities?.publicSharing;
    return typeof value === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

/** True when this daemon can publish public links, false when it provably cannot, null when unknown. */
export function loadPublicSharingCapability(): Promise<boolean | null> {
  cached ??= readPublicSharingCapability();
  return cached;
}

/** Test seam: forget the memoized answer so a new daemon/case starts clean. */
export function resetPublicSharingCapabilityCache(): void {
  cached = null;
}

/**
 * `false` only when the daemon has told us it cannot publish; `null` while the
 * answer is still in flight (or unknown), which callers must treat as the old
 * fail-closed behavior rather than as permission.
 *
 * `enabled` keeps the read lazy: a surface that has not asked for a delete must
 * not hit the daemon, and the answer is memoized for the rest of the session.
 */
export function usePublicSharingCapability(enabled = false): boolean | null {
  const [value, setValue] = useState<boolean | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    void loadPublicSharingCapability().then((next) => {
      if (!cancelled) setValue(next);
    });
    return () => { cancelled = true; };
  }, [enabled]);
  return value;
}

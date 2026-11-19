/**
 * What the daemon this client is talking to can actually do, as opposed to what
 * the client-side runtime looks like. Served per request and never persisted:
 * the same data dir can be opened by a desktop daemon on Monday and a headless
 * one on Tuesday, so a stored answer would be a stale claim.
 *
 * Optional so a newer client keeps working against an older daemon — treat an
 * absent field as "unknown", not as "false".
 */
export interface AppRuntimeCapabilities {
  /**
   * Whether the daemon can render deck slides off-screen — the capability
   * behind PPTX / screenshot-PDF / image export. Only the desktop sidecar
   * injects that renderer, so a headless or container deployment reports
   * `false` and those export routes answer 501.
   *
   * Deliberately NOT derivable from `packaged`: a packaged binary run as a
   * plain daemon still has no renderer.
   */
  slideRenderer: boolean;
  /**
   * Whether this daemon can publish public file links at all. Publishing
   * requires a Workspace identity from the Workspace authority, so a daemon
   * that is not wired to it (local / self-hosted, `OD_WORKSPACE_CONTEXT_SOURCE`
   * not `vela`) can never hold a public share.
   *
   * Surfaces that refuse an action because a share state could not be read use
   * this to distinguish "unreadable, so assume the worst" from "impossible, so
   * there is nothing to lose".
   *
   * Optional: an older daemon omits it, and an absent value must be treated as
   * unknown (keep the fail-closed behavior), never as `false`.
   */
  publicSharing?: boolean;
}

export interface AppVersionInfo {
  version: string;
  channel: string;
  packaged: boolean;
  platform: string;
  arch: string;
  capabilities?: AppRuntimeCapabilities;
}

export interface AppVersionResponse {
  version: AppVersionInfo;
}

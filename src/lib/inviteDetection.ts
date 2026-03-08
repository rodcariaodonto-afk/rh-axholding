/**
 * Detects if the current session originated from a Supabase invite link.
 *
 * IMPORTANT: The URL hash (access_token, type=invite) is cleared by the
 * Supabase client immediately after processing. By the time React components
 * render, the hash is already gone. We capture it at module-load time and
 * persist to sessionStorage so later checks still work.
 */

// Capture the hash at module evaluation time (runs before Supabase client clears it)
const _initialHash = typeof window !== "undefined" ? window.location.hash : "";
let _isInviteFromHash =
  _initialHash.includes("type=invite") ||
  _initialHash.includes("type=recovery") ||
  _initialHash.includes("type=magiclink");

if (_isInviteFromHash && typeof sessionStorage !== "undefined") {
  sessionStorage.setItem("orbrh_invite_flow", "true");
}

/**
 * Returns true if the user arrived via an invite/recovery/magiclink.
 * Works even after Supabase clears the URL hash.
 */
export function hasInviteTokenInHash(): boolean {
  if (_isInviteFromHash) return true;
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage.getItem("orbrh_invite_flow") === "true";
  }
  return false;
}

/**
 * Clear the invite flow flag (call after the invite is fully processed).
 */
export function clearInviteFlow(): void {
  _isInviteFromHash = false;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("orbrh_invite_flow");
  }
}

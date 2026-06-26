import { useAuth } from "@/lib/auth";

// Comma-separated list of user IDs allowed to see in-progress features.
// Set via VITE_XERO_ALLOWLIST at build time (Replit deployment env var).
//
// Why a build-time client flag is fine here: user IDs aren't secrets — they're
// just unguessable identifiers. The flag controls whether a UI option is
// visible, NOT whether the API is reachable. The Xero endpoints themselves
// still require a valid session, so hiding the UI is a UX choice, not a
// security boundary.
function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

const XERO_ALLOWLIST = parseAllowlist(import.meta.env["VITE_XERO_ALLOWLIST"] as string | undefined);

export function useXeroEnabled(): boolean {
  const { user, isLoaded } = useAuth();
  if (!isLoaded || !user) return false;
  return XERO_ALLOWLIST.has(user.id);
}

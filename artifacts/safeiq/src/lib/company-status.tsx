import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { authedFetch } from "@/lib/api";

export type CompanyState = "loading" | "yes" | "no" | "expired";

export interface CompanyStatus {
  state: CompanyState;
  trialDaysLeft: number;
  /** Re-fetch company status. Resolves with the resulting state, or throws if the request fails. */
  refresh: () => Promise<CompanyState>;
}

const CompanyStatusCtx = createContext<CompanyStatus>({
  state: "loading",
  trialDaysLeft: 30,
  refresh: async () => "loading",
});

export function CompanyStatusProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<{ state: CompanyState; trialDaysLeft: number }>({
    state: "loading",
    trialDaysLeft: 30,
  });

  // Monotonic request token so a stale in-flight fetch can never overwrite a
  // newer result (e.g. an early "no" landing after onboarding wrote "yes").
  const seqRef = useRef(0);

  const refresh = useCallback(async (): Promise<CompanyState> => {
    const seq = ++seqRef.current;
    const commit = (next: { state: CompanyState; trialDaysLeft: number }) => {
      if (seq === seqRef.current) setStatus(next);
      return next.state;
    };

    if (!isLoaded) {
      // Auth hasn't resolved yet. Committing "no" would briefly flip
      // ProtectedRoute into redirecting an already-signed-up user to
      // /onboarding — where they get stuck. Stay in "loading" until auth is
      // known; the [isLoaded] dep re-runs this once ready.
      return "loading";
    }
    if (!isSignedIn) {
      return commit({ state: "no", trialDaysLeft: 0 });
    }

    const r = await authedFetch("/api/company");
    if (r.status === 404) {
      return commit({ state: "no", trialDaysLeft: 0 });
    }
    if (!r.ok) {
      // Transient failure: don't clobber existing state, let caller decide.
      throw new Error(`company status request failed (${r.status})`);
    }
    const data = (await r.json().catch(() => ({}))) as { plan?: string; trialDaysLeft?: number };
    const days = typeof data.trialDaysLeft === "number" ? data.trialDaysLeft : 30;
    const expired = days <= 0 && (data.plan ?? "free") === "free";
    return commit({ state: expired ? "expired" : "yes", trialDaysLeft: days });
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    refresh().catch(() => {
      // Transient failure (network / non-404 5xx — a genuine 404 already commits
      // "no" inside refresh). NEVER force "no" here: that would route an existing
      // user onto /onboarding during a backend hiccup. Preserve a known-good
      // state; otherwise stay "loading" so a reload / the next refresh retries
      // instead of guessing "no company".
      setStatus((prev) =>
        prev.state === "yes" || prev.state === "expired"
          ? prev
          : { state: "loading", trialDaysLeft: prev.trialDaysLeft },
      );
    });
  }, [refresh]);

  return (
    <CompanyStatusCtx.Provider value={{ ...status, refresh }}>{children}</CompanyStatusCtx.Provider>
  );
}

export function useCompanyStatus() {
  return useContext(CompanyStatusCtx);
}

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";

type PortalSssp = {
  id: number;
  projectName: string;
  siteAddress?: string;
  pcbu2Company?: string;
  pcbu2Contact?: string;
  sentAt?: string;
  signedDate?: string;
  signedBy?: string;
  signToken?: string;
};

type PortalData = {
  email: string;
  sssps: PortalSssp[];
};

export default function PcbuPortalPage() {
  const [, params] = useRoute("/pcbu/:token");
  const token = params?.token ?? "";
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/pcbu/${token}`);
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setError((body as { error?: string }).error ?? `Error ${res.status}`);
        } else {
          setPortal(body as PortalData);
        }
      } catch {
        if (alive) setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  const pending = portal?.sssps.filter(s => !s.signedDate) ?? [];
  const signed = portal?.sssps.filter(s => !!s.signedDate) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="bg-[#0F172A] text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-6 py-4 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-lg font-black tracking-tight">
            <span>FOR</span><span className="text-primary">MATE</span>
          </span>
          <span className="text-slate-400 text-sm ml-1">· SSSP Sign-Off Portal</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 sm:px-6 py-8">
        {loading && (
          <div className="text-center py-16 text-slate-400 text-sm">Loading your portal…</div>
        )}

        {!loading && error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center mt-8">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="font-bold text-amber-900 text-lg mb-2">Portal not found</div>
            <p className="text-amber-700 text-sm leading-relaxed">
              This link is not valid. Ask your contractor to send you the SSSP again.
            </p>
          </div>
        )}

        {!loading && !error && portal && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Sign-Off Portal</h1>
              <p className="text-slate-500 text-sm mt-1">
                All SSSPs sent to <span className="font-semibold text-slate-700">{portal.email}</span>
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
                📌 <strong>Bookmark this page</strong> — it always shows your latest SSSPs and never expires.
              </div>
            </div>

            {portal.sssps.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">
                No SSSPs sent to this portal yet.
              </div>
            )}

            {pending.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Awaiting your signature — {pending.length}
                </h2>
                <div className="flex flex-col gap-3">
                  {pending.map(s => (
                    <SsspCard key={s.id} sssp={s} />
                  ))}
                </div>
              </section>
            )}

            {signed.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Signed — {signed.length}
                </h2>
                <div className="flex flex-col gap-3">
                  {signed.map(s => (
                    <SsspCard key={s.id} sssp={s} />
                  ))}
                </div>
              </section>
            )}

            <p className="text-center text-xs text-slate-400 mt-10 pb-6">
              Powered by <strong>Formate</strong> — safety paperwork faster than a pen.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function SsspCard({ sssp }: { sssp: PortalSssp }) {
  const isSigned = !!sssp.signedDate;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm ${isSigned ? "border-slate-200" : "border-orange-200"}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="font-bold text-slate-900 text-base leading-tight flex-1">{sssp.projectName}</div>
          {isSigned ? (
            <span className="flex-shrink-0 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
              ✓ Signed
            </span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200">
              Pending
            </span>
          )}
        </div>

        {sssp.siteAddress && (
          <p className="text-sm text-slate-500 mb-1">{sssp.siteAddress}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 mt-2">
          {sssp.pcbu2Company && (
            <span>Contractor: <span className="text-slate-600 font-medium">{sssp.pcbu2Company}</span></span>
          )}
          {sssp.sentAt && (
            <span>Sent {format(new Date(sssp.sentAt), "d MMM yyyy")}</span>
          )}
          {isSigned && sssp.signedDate && sssp.signedBy && (
            <span>Signed by <span className="text-slate-600 font-medium">{sssp.signedBy}</span> on {format(new Date(sssp.signedDate), "d MMM yyyy")}</span>
          )}
        </div>
      </div>

      {!isSigned && sssp.signToken && (
        <div className="border-t border-orange-100 bg-orange-50 px-4 py-3">
          <Link
            href={`/sign/${sssp.signToken}`}
            className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold text-sm rounded-lg py-2.5 px-4 no-underline hover:bg-orange-600 transition-colors"
          >
            Review &amp; Sign →
          </Link>
        </div>
      )}

      {isSigned && sssp.signToken && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            href={`/sign/${sssp.signToken}`}
            className="text-xs text-slate-400 hover:text-slate-600 no-underline"
          >
            View signed document →
          </Link>
        </div>
      )}
    </div>
  );
}

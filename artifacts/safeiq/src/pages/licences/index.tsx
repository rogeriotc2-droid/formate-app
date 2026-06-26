import { useState } from "react";
import { useListLicences } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Link } from "wouter";
import { Plus, Award, Search, GraduationCap, BadgeCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Status = "active" | "expiring" | "expired" | "none";

function licenceStatus(expiryDate: string | null | undefined): Status {
  if (!expiryDate) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiryDate}T00:00:00`);
  const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

function expiryText(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "No expiry";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiryDate}T00:00:00`);
  const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

const STATUS_STYLES: Record<Status, string> = {
  expired: "bg-red-100 text-red-700 border-red-200",
  expiring: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-green-100 text-green-700 border-green-200",
  none: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<Status, string> = {
  expired: "Expired",
  expiring: "Expiring",
  active: "Active",
  none: "No expiry",
};

function sortRank(s: Status): number {
  return { expired: 0, expiring: 1, active: 2, none: 3 }[s];
}

export default function LicencesList() {
  const { data: licences, isLoading } = useListLicences();
  const [search, setSearch] = useState("");

  const all = licences ?? [];
  const counts = {
    active: all.filter((l) => { const s = licenceStatus(l.expiryDate); return s === "active" || s === "none"; }).length,
    expiring: all.filter((l) => licenceStatus(l.expiryDate) === "expiring").length,
    expired: all.filter((l) => licenceStatus(l.expiryDate) === "expired").length,
  };

  const q = search.trim().toLowerCase();
  const filtered = all
    .filter((l) =>
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.workerName.toLowerCase().includes(q) ||
      (l.referenceNumber ?? "").toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const ra = sortRank(licenceStatus(a.expiryDate));
      const rb = sortRank(licenceStatus(b.expiryDate));
      if (ra !== rb) return ra - rb;
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      return 0;
    });

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 border-b pb-4 border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Licences &amp; Training</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Track tickets, certs and training before they expire.</p>
        </div>
        <Link href="/licences/new" className="shrink-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="w-4 h-4" /> Add
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="border-border rounded-sm">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black text-green-600">{counts.active}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Active</div>
          </CardContent>
        </Card>
        <Card className="border-border rounded-sm">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black text-amber-600">{counts.expiring}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Expiring</div>
          </CardContent>
        </Card>
        <Card className="border-border rounded-sm">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-black text-red-600">{counts.expired}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Expired</div>
          </CardContent>
        </Card>
      </div>

      {all.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, worker or reference…" className="pl-9" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : all.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No licences or training yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Add a ticket or cert and we'll remind you before it expires.</p>
          <Link href="/licences/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Plus className="w-4 h-4" /> Add your first
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No matches for "{search}".</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const status = licenceStatus(l.expiryDate);
            const Icon = l.recordType === "training" ? GraduationCap : BadgeCheck;
            return (
              <Link key={l.id} href={`/licences/${l.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer border-border rounded-sm shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold truncate">{l.name}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground font-medium truncate">
                        {l.workerName}
                        {l.referenceNumber ? ` · ${l.referenceNumber}` : ""}
                        {l.recordType === "training" ? " · Training" : ""}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 text-right ${status === "expired" ? "text-red-600" : status === "expiring" ? "text-amber-600" : "text-muted-foreground"}`}>
                      {expiryText(l.expiryDate)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}

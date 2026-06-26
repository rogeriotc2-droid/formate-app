import { useEffect, useState, type ComponentType } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

type Health = "green" | "amber" | "red";

interface Customer {
  userId: string;
  email: string;
  name: string | null;
  businessName: string | null;
  country: string | null;
  plan: string | null;
  onboarded: boolean;
  activated: boolean;
  ssspCount: number;
  submissionCount: number;
  siteCount: number;
  licenceCount: number;
  signupAt: string | null;
  lastActiveAt: string;
  daysSinceSignup: number;
  daysSinceActive: number;
  health: Health;
}

interface Summary {
  total: number;
  green: number;
  amber: number;
  red: number;
  activated: number;
}

interface AdminResponse {
  summary: Summary;
  customers: Customer[];
}

function timeAgo(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

const HEALTH_META: Record<
  Health,
  { label: string; dot: string; chip: string; row: string }
> = {
  green: {
    label: "Healthy",
    dot: "bg-green-500",
    chip: "bg-green-100 text-green-800",
    row: "",
  },
  amber: {
    label: "Watch",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800",
    row: "bg-amber-50/40",
  },
  red: {
    label: "At risk",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-800",
    row: "bg-red-50/50",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <Card className="border-border rounded-sm shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-black leading-none">{value}</div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-1">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function reason(c: Customer): string {
  if (!c.activated) {
    if (!c.onboarded) return "Signed up, hasn't finished setup";
    return "Set up, but hasn't created a plan or sent a form yet";
  }
  if (c.health === "green") return "Using it actively";
  if (c.health === "amber") return `Quiet — last active ${timeAgo(c.daysSinceActive)}`;
  return `Gone quiet — last active ${timeAgo(c.daysSinceActive)}`;
}

export default function AdminCustomers() {
  const [data, setData] = useState<AdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/customers", {
          credentials: "include",
        });
        if (!r.ok) {
          if (cancelled) return;
          setError(
            r.status === 403
              ? "You don't have access to this page."
              : `Couldn't load customers (${r.status})`,
          );
          return;
        }
        const json = (await r.json()) as AdminResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Couldn't reach the server.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8 border-b pb-4 border-border">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-primary" /> Customer Health
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Who's using Formate, who's at risk of dropping off.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">{error}</h3>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Customers"
              value={data.summary.total}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              icon={CheckCircle2}
              label="Healthy"
              value={data.summary.green}
              accent="bg-green-100 text-green-700"
            />
            <StatCard
              icon={AlertTriangle}
              label="Watch"
              value={data.summary.amber}
              accent="bg-amber-100 text-amber-700"
            />
            <StatCard
              icon={XCircle}
              label="At risk"
              value={data.summary.red}
              accent="bg-red-100 text-red-700"
            />
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground font-medium">
            <Activity className="w-4 h-4 text-primary" />
            {data.summary.activated} of {data.summary.total} have created their first plan or
            sent a form
          </div>

          {data.customers.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">No customers yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                New signups will show up here automatically.
              </p>
            </div>
          ) : (
            <Card className="border-border rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 font-bold">Customer</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-center">Plans</th>
                      <th className="px-4 py-3 font-bold text-center">Forms</th>
                      <th className="px-4 py-3 font-bold text-center">Sites</th>
                      <th className="px-4 py-3 font-bold">Signed up</th>
                      <th className="px-4 py-3 font-bold">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((c) => {
                      const meta = HEALTH_META[c.health];
                      return (
                        <tr
                          key={c.userId}
                          className={`border-b border-border last:border-0 ${meta.row}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground">
                              {c.businessName || c.name || c.email.split("@")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">{c.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${meta.chip}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{reason(c)}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{c.ssspCount}</td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {c.submissionCount}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{c.siteCount}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {timeAgo(c.daysSinceSignup)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {timeAgo(c.daysSinceActive)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </MainLayout>
  );
}

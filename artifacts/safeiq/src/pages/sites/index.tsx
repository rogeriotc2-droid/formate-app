import { useListSites } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, MapPin, Building2, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SitesList() {
  const { data: sites, isLoading } = useListSites();

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 sm:mb-8 border-b pb-4 border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Sites</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage locations and PCBUs.</p>
        </div>
        <Link href="/sites/new" className="shrink-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="w-4 h-4" /> Add Site
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : sites?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No sites yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Add your first site to start tracking safety forms by location.</p>
          <Link href="/sites/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Plus className="w-4 h-4" /> Add Site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites?.map(site => (
            <Link key={site.id} href={`/sites/${site.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full border-border rounded-sm shadow-sm group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center justify-between">
                    {site.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0 text-primary" />
                      <span className="truncate">{site.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0 text-primary" />
                      <span className="truncate">{site.pcbu}</span>
                    </div>
                    {site.contactName && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">{site.contactName} {site.contactPhone ? `(${site.contactPhone})` : ''}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSite, useUpdateSite, useDeleteSite, getListSitesQueryKey, getGetSiteQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SiteDetail() {
  const [, params] = useRoute("/sites/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: site, isLoading } = useGetSite(id, { query: { enabled: !!id && !isNaN(id) } });
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pcbu, setPcbu] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (site && !initialized) {
    setName(site.name);
    setAddress(site.address);
    setPcbu(site.pcbu);
    setPrincipalEmail(site.principalEmail ?? "");
    setContactName(site.contactName ?? "");
    setContactPhone(site.contactPhone ?? "");
    setNotes(site.notes ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateSite.mutate(
      { id, data: { name, address, pcbu, principalEmail: principalEmail || undefined, contactName: contactName || undefined, contactPhone: contactPhone || undefined, notes: notes || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSiteQueryKey(id) });
          toast({ title: "Saved", description: "Site updated." });
        },
        onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this site? Submissions linked to it will remain.")) return;
    deleteSite.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() });
          navigate("/sites");
          toast({ title: "Deleted", description: "Site removed." });
        },
        onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    </MainLayout>
  );

  if (!site) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Site not found.</p>
        <Link href="/sites"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Sites
        </Link>
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{site.name}</h1>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button onClick={handleSave} disabled={updateSite.isPending} size="sm" className="gap-1">
              <Save className="w-3.5 h-3.5" /> {updateSite.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <Card className="border-border rounded-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Site Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Address <span className="text-destructive">*</span></Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">PCBU <span className="text-destructive">*</span></Label>
              <Input value={pcbu} onChange={e => setPcbu(e.target.value)} placeholder="Person Conducting a Business or Undertaking" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Principal PCBU Email</Label>
              <Input type="email" value={principalEmail} onChange={e => setPrincipalEmail(e.target.value)} placeholder="e.g. site.manager@buildco.co.nz" />
              <p className="text-xs text-muted-foreground">Every submission for this site is emailed here automatically.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Contact Name</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Contact Phone</Label>
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

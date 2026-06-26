import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSite, getListSitesQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SiteNew() {
  const [, navigate] = useLocation();
  const createSite = useCreateSite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pcbu, setPcbu] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !address.trim() || !pcbu.trim()) {
      toast({ title: "Required fields missing", description: "Name, address and PCBU are required.", variant: "destructive" });
      return;
    }
    createSite.mutate(
      { data: { name: name.trim(), address: address.trim(), pcbu: pcbu.trim(), principalEmail: principalEmail.trim() || undefined, contactName: contactName || undefined, contactPhone: contactPhone || undefined, notes: notes || undefined } },
      {
        onSuccess: (site) => {
          queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() });
          toast({ title: "Site created", description: `${site.name} has been added.` });
          navigate(`/sites/${site.id}`);
        },
        onError: () => toast({ title: "Error", description: "Failed to create site", variant: "destructive" }),
      }
    );
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Sites
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Add Site</h1>
        <p className="text-muted-foreground text-sm mt-1">Register a new location and PCBU for safety reporting.</p>
      </div>

      <div className="max-w-xl">
        <Card className="border-border rounded-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Site Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Warehouse B - Auckland" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Address <span className="text-destructive">*</span></Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Industrial Ave, Auckland" />
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
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Contact Phone</Label>
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any site-specific notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={createSite.isPending}>
                {createSite.isPending ? "Creating..." : "Create Site"}
              </Button>
              <Link href="/sites">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

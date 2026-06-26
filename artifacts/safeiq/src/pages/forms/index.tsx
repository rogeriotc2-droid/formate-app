import { useState } from "react";
import { useListTemplates, useCreateTemplate, getListTemplatesQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, FileText, ClipboardList, ShieldCheck, Wrench, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Inspection", "Incident", "Toolbox Talk", "Permit", "Hazard Report", "Risk Assessment", "Other"];

const categoryIcon = (cat: string) => {
  if (cat === "Inspection") return ShieldCheck;
  if (cat === "Incident") return ClipboardList;
  if (cat === "Toolbox Talk") return Wrench;
  return FileText;
};

export default function FormsList() {
  const { data: templates, isLoading } = useListTemplates();
  const createTemplate = useCreateTemplate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [extraRecipientEmail, setExtraRecipientEmail] = useState("");

  const grouped = templates?.reduce<Record<string, typeof templates>>((acc, t) => {
    acc[t.category] = acc[t.category] ?? [];
    acc[t.category].push(t);
    return acc;
  }, {}) ?? {};

  const handleCreate = () => {
    if (!name.trim() || !category) return;
    createTemplate.mutate(
      { data: { name: name.trim(), category, description: description.trim(), extraRecipientEmail: extraRecipientEmail.trim() || undefined, fields: [] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          toast({ title: "Template created", description: `${name} is ready for fields.` });
          setOpen(false);
          setName(""); setCategory(""); setDescription(""); setExtraRecipientEmail("");
        },
        onError: () => toast({ title: "Error", description: "Failed to create template", variant: "destructive" }),
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 sm:mb-8 border-b pb-4 border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Reusable form structures for your safety operations.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        </div>
      ) : templates?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No templates yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first form template to start collecting safety data.</p>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New Template</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => {
            const Icon = categoryIcon(cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{cat}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(template => (
                    <Link key={template.id} href={`/forms/${template.id}`}>
                      <Card className="hover:border-primary transition-all cursor-pointer h-full border-border rounded-sm shadow-sm group">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold flex items-center justify-between">
                            <span className="truncate">{template.name}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">{(template.fields as unknown[]).length} fields</Badge>
                              <Badge variant="outline" className="text-xs">{template.submissionCount} submissions</Badge>
                            </div>
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/fill/${template.id}`; }}
                              className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3 transition-colors"
                            >
                              Fill Now
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Template Name</Label>
              <Input placeholder="e.g. Daily Site Inspection" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Description (optional)</Label>
              <Textarea placeholder="Briefly describe what this form is used for..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs uppercase tracking-wide">Extra Recipient Email (optional)</Label>
              <Input type="email" placeholder="e.g. safety.officer@company.co.nz" value={extraRecipientEmail} onChange={e => setExtraRecipientEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">Gets CC'd on every submission of this form (in addition to the site's principal PCBU).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || !category || createTemplate.isPending}>
              {createTemplate.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

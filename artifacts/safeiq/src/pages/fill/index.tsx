import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { enqueueSubmission } from "@/lib/offline-queue";
import {
  useGetTemplate,
  useGetTemplatePrefill,
  useListSites,
  useCreateSubmission,
  getListSubmissionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentSubmissionsQueryKey,
  getGetActivityFeedQueryKey,
  getListTemplatesQueryKey,
  getGetTemplateQueryKey,
  getGetTemplatePrefillQueryKey,
  useUpdateTemplate,
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Pencil, Plus, X, CheckCircle2, WifiOff, Mail } from "lucide-react";
import { VoiceMicButton } from "@/components/voice-mic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "signature";
  sticky: boolean;
  required?: boolean;
  options?: string[] | null;
  placeholder?: string | null;
};

function buildEmailBody(
  templateName: string,
  siteName: string,
  submittedBy: string,
  fields: FieldDef[],
  values: Record<string, string>,
  notes: string,
): string {
  const fieldLines = fields
    .filter(f => values[f.key]?.trim())
    .map(f => `${f.label}: ${values[f.key]}`)
    .join("\n");
  const parts = [
    `Form: ${templateName}`,
    `Site: ${siteName}`,
    `Date: ${new Date().toLocaleDateString("en-NZ")}`,
    `Submitted by: ${submittedBy}`,
    "",
    fieldLines,
  ];
  if (notes.trim()) parts.push("", `Notes: ${notes.trim()}`);
  return parts.join("\n");
}

export default function FillForm() {
  const [, params] = useRoute("/fill/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);
  const { user } = useAuth();

  const { data: template, isLoading: loadingTemplate } = useGetTemplate(id, { query: { enabled: !!id } });
  const { data: prefill, isLoading: loadingPrefill } = useGetTemplatePrefill(id, { query: { enabled: !!id } });
  const { data: sites, isLoading: loadingSites } = useListSites();
  const createSubmission = useCreateSubmission();
  const updateTemplate = useUpdateTemplate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [values, setValues] = useState<Record<string, string>>({});
  const [siteId, setSiteId] = useState<string>("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [customFields, setCustomFields] = useState<FieldDef[]>([]);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "textarea">("text");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
      );
    }
  }, []);

  // Default "Submitted By" to the logged-in user's name
  useEffect(() => {
    if (user?.name) {
      setSubmittedBy(prev => prev || user.name!);
    }
  }, [user?.name]);

  // Restore last-used site for this template
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`lastSite_${id}`);
    if (saved) setSiteId(prev => prev || saved);
  }, [id]);

  useEffect(() => {
    if (prefill?.values && !prefillApplied) {
      const prefillMap: Record<string, string> = {};
      Object.entries(prefill.values as Record<string, unknown>).forEach(([k, v]) => {
        prefillMap[k] = String(v ?? "");
      });
      setValues(prev => ({ ...prefillMap, ...prev }));
      setPrefillApplied(true);
    }
  }, [prefill, prefillApplied]);

  const fields = (template?.fields as FieldDef[]) ?? [];
  const allFields = [...fields, ...customFields];

  const setValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const addCustomField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    setCustomFields(prev => [...prev, { key: `custom_${crypto.randomUUID()}`, label, type: newFieldType, sticky: true }]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setAddingField(false);
  };

  const removeCustomField = (key: string) => {
    setCustomFields(prev => prev.filter(f => f.key !== key));
    setValues(prev => { const next = { ...prev }; delete next[key]; return next; });
  };

  const isPreFilled = (key: string) => {
    const prefillMap = (prefill?.values as Record<string, unknown>) ?? {};
    return key in prefillMap && values[key] === String(prefillMap[key] ?? "");
  };

  const handleSubmit = async () => {
    const missingRequired = allFields.filter(f => f.required && !values[f.key]?.trim());
    if (missingRequired.length > 0) {
      toast({ title: "Required fields missing", description: `Fill in: ${missingRequired.map(f => f.label).join(", ")}`, variant: "destructive" });
      return;
    }
    if (!siteId) {
      toast({ title: "Site required", description: "Select a site before submitting.", variant: "destructive" });
      return;
    }

    if (customFields.length > 0 && navigator.onLine) {
      try {
        await updateTemplate.mutateAsync({ id, data: { fields: [...fields, ...customFields] } });
      } catch {
        toast({ title: "Couldn't save your new field", description: "Check your connection and try again.", variant: "destructive" });
        return;
      }
    }

    const payload = {
      templateId: id,
      siteId: Number(siteId),
      submittedBy,
      status: "submitted" as const,
      values,
      notes: notes || undefined,
      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lon,
      clientTimestamp: new Date().toISOString(),
    };

    createSubmission.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentSubmissionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTemplateQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetTemplatePrefillQueryKey(id) });
          // Remember last used site for next time
          localStorage.setItem(`lastSite_${id}`, siteId);
          setCustomFields([]);
          setSubmitted(true);
        },
        onError: () => {
          if (!navigator.onLine) {
            enqueueSubmission(payload, {
              templateName: template?.name ?? "Form",
              siteName: sites?.find(s => s.id === Number(siteId))?.name ?? "Site",
              customFields: customFields.length > 0 ? customFields : undefined,
            });
            localStorage.setItem(`lastSite_${id}`, siteId);
            setOfflineSaved(true);
            setSubmitted(true);
          } else {
            toast({ title: "Error", description: "Failed to submit form", variant: "destructive" });
          }
        },
      }
    );
  };

  const isLoading = loadingTemplate || loadingPrefill || loadingSites;

  if (submitted) {
    const selectedSite = (sites ?? []).find(s => s.id === Number(siteId));
    const pcbuEmail = selectedSite?.principalEmail;
    const emailSubject = `${template?.name ?? "Safety Form"} – ${selectedSite?.name ?? ""} – ${new Date().toLocaleDateString("en-NZ")}`;
    const emailBody = buildEmailBody(
      template?.name ?? "Safety Form",
      selectedSite?.name ?? "",
      submittedBy,
      allFields,
      values,
      notes,
    );

    return (
      <MainLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          {offlineSaved ? (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <WifiOff className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Saved offline</h1>
              <p className="text-muted-foreground mb-2">No internet connection right now.</p>
              <p className="text-sm text-amber-600 font-medium mb-8">Your form will be submitted automatically when you're back online.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Submitted</h1>
              <p className="text-muted-foreground mb-8">Your form has been recorded successfully.</p>
            </>
          )}
          <div className="flex flex-col gap-3 items-center">
            {pcbuEmail && (
              <a
                href={`mailto:${pcbuEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                className="w-full max-w-xs"
              >
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Email PCBU
                </Button>
              </a>
            )}
            {!pcbuEmail && selectedSite && (
              <p className="text-xs text-muted-foreground">
                Add a PCBU email to <Link href={`/sites/${selectedSite.id}`} className="text-primary underline">{selectedSite.name}</Link> to enable one-tap email.
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/submissions">
                <Button variant="outline">View Submissions</Button>
              </Link>
              <Button onClick={() => { setSubmitted(false); setOfflineSaved(false); setValues({}); setPrefillApplied(false); setCustomFields([]); }}>
                Fill Again
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    </MainLayout>
  );

  if (!template) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Template not found.</p>
        <Link href="/forms"><Button variant="outline" className="mt-4">Back to Templates</Button></Link>
      </div>
    </MainLayout>
  );

  const prefillCount = fields.filter(f => f.sticky && isPreFilled(f.key)).length;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/forms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Templates
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{template.category}</Badge>
              {prefillCount > 0 && (
                <span className="text-sm text-primary font-medium flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> {prefillCount} saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {prefillCount > 0 && (
        <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-md flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-primary font-medium">
            {prefillCount} field{prefillCount > 1 ? "s" : ""} filled in from last time — tap any of them to change it. Your changes are saved for next time.
          </p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <Card className="border-border rounded-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submission Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Site <span className="text-destructive">*</span></Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(sites ?? []).map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Submitted By</Label>
                <Input value={submittedBy} onChange={e => setSubmittedBy(e.target.value)} placeholder="Your name" />
              </div>
            </div>
          </CardContent>
        </Card>

        {allFields.map(field => {
          const prefilled = field.sticky && isPreFilled(field.key);
          const isCustom = customFields.some(c => c.key === field.key);
          return (
            <div key={field.key} className={`space-y-1.5 p-4 rounded-sm border ${prefilled ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="flex items-center gap-2 shrink-0">
                  {prefilled && (
                    <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                      <Pencil className="w-3 h-3" /> Saved · tap to change
                    </Badge>
                  )}
                  {isCustom && (
                    <button type="button" onClick={() => removeCustomField(field.key)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove field">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {field.type === "text" && (
                <div className="flex items-center gap-1">
                  <Input
                    value={values[field.key] ?? ""}
                    onChange={e => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    className={prefilled ? "border-primary/30 focus-visible:ring-primary/30" : ""}
                  />
                  <VoiceMicButton onResult={text => setValue(field.key, (values[field.key] ? values[field.key] + " " : "") + text)} />
                </div>
              )}
              {field.type === "textarea" && (
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <Textarea
                      value={values[field.key] ?? ""}
                      onChange={e => setValue(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ""}
                      rows={3}
                      className="flex-1"
                    />
                    <VoiceMicButton onResult={text => setValue(field.key, (values[field.key] ? values[field.key] + " " : "") + text)} />
                  </div>
                </div>
              )}
              {field.type === "date" && (
                <Input
                  type="date"
                  value={values[field.key] ?? ""}
                  onChange={e => setValue(field.key, e.target.value)}
                  className={prefilled ? "border-primary/30 focus-visible:ring-primary/30" : ""}
                />
              )}
              {field.type === "number" && (
                <Input
                  type="number"
                  value={values[field.key] ?? ""}
                  onChange={e => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder ?? ""}
                />
              )}
              {field.type === "select" && (
                <Select value={values[field.key] ?? ""} onValueChange={v => setValue(field.key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {field.type === "checkbox" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={field.key}
                    checked={values[field.key] === "true"}
                    onChange={e => setValue(field.key, String(e.target.checked))}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor={field.key} className="text-sm text-muted-foreground cursor-pointer">{field.label}</label>
                </div>
              )}
              {field.type === "signature" && (
                <div className="border border-border rounded p-4 text-center text-muted-foreground text-sm bg-muted/30">
                  <Input
                    value={values[field.key] ?? ""}
                    onChange={e => setValue(field.key, e.target.value)}
                    placeholder="Type full name as signature"
                  />
                </div>
              )}
            </div>
          );
        })}

        {addingField ? (
          <div className="p-4 rounded-sm border border-dashed border-primary/40 bg-primary/5 space-y-3">
            <Label className="text-sm font-semibold">Add your own field</Label>
            <Input
              autoFocus
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              placeholder="What do you want to call it? e.g. Permit number"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomField(); } }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={newFieldType} onValueChange={v => setNewFieldType(v as "text" | "textarea")}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short answer</SelectItem>
                  <SelectItem value="textarea">Long answer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addCustomField} disabled={!newFieldLabel.trim()} size="sm">Add field</Button>
              <Button variant="ghost" size="sm" onClick={() => { setAddingField(false); setNewFieldLabel(""); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingField(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-sm border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" /> Add a field
          </button>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">Additional Notes (optional)</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional observations..." rows={3} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={createSubmission.isPending || updateTemplate.isPending} size="lg" className="gap-2">
            {createSubmission.isPending || updateTemplate.isPending ? "Submitting..." : "Submit Form"}
          </Button>
          <Link href="/forms">
            <Button variant="outline" size="lg">Cancel</Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

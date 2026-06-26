import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetTemplate, useUpdateTemplate, useDeleteTemplate, getListTemplatesQueryKey, getGetTemplateQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, GripVertical, Lock, Edit2, ChevronRight, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "signature";
  sticky: boolean;
  required?: boolean;
  options?: string[] | null;
  placeholder?: string | null;
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "signature", label: "Signature" },
];

export default function FormDetail() {
  const [, params] = useRoute("/forms/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: template, isLoading } = useGetTemplate(id, { query: { enabled: !!id } });
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [fields, setFields] = useState<FieldDef[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [extraRecipientEmail, setExtraRecipientEmail] = useState<string | null>(null);

  const currentFields = fields ?? ((template?.fields as FieldDef[]) || []);
  const currentExtraEmail = extraRecipientEmail ?? template?.extraRecipientEmail ?? "";

  const addField = () => {
    const newField: FieldDef = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      sticky: false,
      required: false,
    };
    setFields([...currentFields, newField]);
  };

  const updateField = (idx: number, updates: Partial<FieldDef>) => {
    const updated = currentFields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    setFields(updated);
  };

  const removeField = (idx: number) => {
    setFields(currentFields.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    updateTemplate.mutate(
      { id, data: { fields: currentFields, extraRecipientEmail: currentExtraEmail || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTemplateQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          toast({ title: "Saved", description: "Template updated." });
          setFields(null);
          setExtraRecipientEmail(null);
          setSaving(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
          setSaving(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    deleteTemplate.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          toast({ title: "Deleted", description: "Template removed." });
          navigate("/forms");
        },
        onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-6 w-48 mb-8" />
      <div className="space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
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

  const stickyCount = currentFields.filter(f => f.sticky).length;
  const hasUnsaved = fields !== null || extraRecipientEmail !== null;

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
              <span className="text-sm text-muted-foreground">{template.submissionCount} submissions</span>
              {stickyCount > 0 && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {stickyCount} sticky
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Link href={`/fill/${template.id}`}>
              <Button className="gap-2">Fill Form <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </div>

      <Card className="border-border rounded-sm mb-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email on Submission</h3>
          </div>
          <Label className="text-xs font-bold uppercase tracking-wide">Extra Recipient Email (optional)</Label>
          <Input
            type="email"
            value={currentExtraEmail}
            onChange={e => setExtraRecipientEmail(e.target.value)}
            placeholder="e.g. safety.officer@company.co.nz"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-2">
            On every submission, a copy is emailed to the site's principal PCBU and your company contact. Add an extra recipient here (e.g. safety officer) and they'll be CC'd too.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fields ({currentFields.length})</h2>
        <div className="flex gap-2">
          {hasUnsaved && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addField} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
        </div>
      </div>

      {currentFields.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <Edit2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold">No fields yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add fields to define what data this form collects.</p>
          <Button onClick={addField} variant="outline" className="gap-1"><Plus className="w-4 h-4" /> Add Field</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentFields.map((field, idx) => (
            <Card key={field.key} className="border-border rounded-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-wide">Label</Label>
                      <Input
                        value={field.label}
                        onChange={e => updateField(idx, { label: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-wide">Type</Label>
                      <Select value={field.type} onValueChange={v => updateField(idx, { type: v as FieldDef["type"] })}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-wide">Placeholder</Label>
                      <Input
                        value={field.placeholder ?? ""}
                        onChange={e => updateField(idx, { placeholder: e.target.value || null })}
                        className="h-8 text-sm"
                        placeholder="Optional hint text"
                      />
                    </div>
                    {field.type === "select" && (
                      <div className="space-y-1 col-span-full">
                        <Label className="text-xs font-bold uppercase tracking-wide">Options (comma separated)</Label>
                        <Input
                          value={(field.options ?? []).join(", ")}
                          onChange={e => updateField(idx, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                          className="h-8 text-sm"
                          placeholder="Option A, Option B, Option C"
                        />
                      </div>
                    )}
                    <div className="col-span-full flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.sticky}
                          onCheckedChange={v => updateField(idx, { sticky: v })}
                          id={`sticky-${idx}`}
                        />
                        <Label htmlFor={`sticky-${idx}`} className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                          <Lock className="w-3 h-3 text-primary" /> Sticky (auto-fill from last use)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.required ?? false}
                          onCheckedChange={v => updateField(idx, { required: v })}
                          id={`req-${idx}`}
                        />
                        <Label htmlFor={`req-${idx}`} className="text-xs font-semibold cursor-pointer">Required</Label>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeField(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasUnsaved && currentFields.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </MainLayout>
  );
}

import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetLicence, useUpdateLicence, useDeleteLicence, getListLicencesQueryKey, getGetLicenceQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function LicenceDetail() {
  const [, params] = useRoute("/licences/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: licence, isLoading } = useGetLicence(id, { query: { enabled: !!id && !isNaN(id), queryKey: getGetLicenceQueryKey(id) } });
  const updateLicence = useUpdateLicence();
  const deleteLicence = useDeleteLicence();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [workerName, setWorkerName] = useState("");
  const [recordType, setRecordType] = useState<"licence" | "training">("licence");
  const [name, setName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (licence && !initialized) {
    setWorkerName(licence.workerName);
    setRecordType(licence.recordType === "training" ? "training" : "licence");
    setName(licence.name);
    setReferenceNumber(licence.referenceNumber ?? "");
    setIssueDate(licence.issueDate ?? "");
    setExpiryDate(licence.expiryDate ?? "");
    setReminderEmail(licence.reminderEmail ?? "");
    setRemindersEnabled(licence.remindersEnabled);
    setNotes(licence.notes ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateLicence.mutate(
      {
        id,
        data: {
          workerName: workerName.trim(),
          recordType,
          name: name.trim(),
          referenceNumber: referenceNumber.trim() || "",
          issueDate: issueDate || "",
          expiryDate: expiryDate || "",
          reminderEmail: reminderEmail.trim() || "",
          remindersEnabled,
          notes: notes.trim() || "",
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLicencesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLicenceQueryKey(id) });
          toast({ title: "Saved", description: "Record updated." });
        },
        onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this record?")) return;
    deleteLicence.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLicencesQueryKey() });
          navigate("/licences");
          toast({ title: "Deleted", description: "Record removed." });
        },
        onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
      },
    );
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    </MainLayout>
  );

  if (!licence) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Record not found.</p>
        <Link href="/licences"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/licences" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Licences &amp; Training
        </Link>
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{licence.name}</h1>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button onClick={handleSave} disabled={updateLicence.isPending} size="sm" className="gap-1">
              <Save className="w-3.5 h-3.5" /> {updateLicence.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <Card className="border-border rounded-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecordType("licence")}
                  className={`h-10 rounded-md border text-sm font-semibold transition-colors ${recordType === "licence" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
                >
                  Licence / Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setRecordType("training")}
                  className={`h-10 rounded-md border text-sm font-semibold transition-colors ${recordType === "training" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
                >
                  Training
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Worker Name <span className="text-destructive">*</span></Label>
              <Input value={workerName} onChange={(e) => setWorkerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">{recordType === "training" ? "Training Name" : "Licence Name"} <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Reference / Number</Label>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Expiry Date</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave blank if it never expires.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label className="text-sm font-bold">Email reminders</Label>
                <p className="text-xs text-muted-foreground">We'll email at 30, 7 and 1 days out, plus on expiry.</p>
              </div>
              <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
            </div>
            {remindersEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Reminder Email</Label>
                <Input type="email" value={reminderEmail} onChange={(e) => setReminderEmail(e.target.value)} placeholder="Leave blank to use your account email" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

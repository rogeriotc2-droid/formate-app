import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateLicence, getListLicencesQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const WORKER_KEY = "formate:lastWorkerName";

export default function LicenceNew() {
  const [, navigate] = useLocation();
  const createLicence = useCreateLicence();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [workerName, setWorkerName] = useState(() => localStorage.getItem(WORKER_KEY) ?? "");
  const [recordType, setRecordType] = useState<"licence" | "training">("licence");
  const [name, setName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  const canSave = workerName.trim() && name.trim();

  const handleSave = () => {
    if (!canSave) return;
    localStorage.setItem(WORKER_KEY, workerName.trim());
    createLicence.mutate(
      {
        data: {
          workerName: workerName.trim(),
          recordType,
          name: name.trim(),
          referenceNumber: referenceNumber.trim() || undefined,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          reminderEmail: reminderEmail.trim() || undefined,
          remindersEnabled,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLicencesQueryKey() });
          toast({ title: "Saved", description: "Record added." });
          navigate("/licences");
        },
        onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
      },
    );
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/licences" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Licences &amp; Training
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Add Licence or Training</h1>
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
              <Input value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="e.g. John Smith" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">{recordType === "training" ? "Training Name" : "Licence Name"} <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={recordType === "training" ? "e.g. Working at Heights" : "e.g. Class 2 Driver Licence"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Reference / Number</Label>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Optional" />
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
            <div className="flex justify-end pt-1">
              <Button onClick={handleSave} disabled={!canSave || createLicence.isPending} className="gap-1">
                <Save className="w-3.5 h-3.5" /> {createLicence.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

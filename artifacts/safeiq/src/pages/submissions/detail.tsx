import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSubmission, useUpdateSubmission, getGetSubmissionQueryKey, getListSubmissionsQueryKey, getGetDashboardSummaryQueryKey, getGetActivityFeedQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, MapPin, Clock, User, Trash2, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useDeleteSubmission } from "@workspace/api-client-react";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  reviewed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function SubmissionDetail() {
  const [, params] = useRoute("/submissions/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: submission, isLoading } = useGetSubmission(id, { query: { enabled: !!id } });
  const updateSubmission = useUpdateSubmission();
  const deleteSubmission = useDeleteSubmission();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [reviewedBy, setReviewedBy] = useState("John Safety");
  const [reviewNotes, setReviewNotes] = useState("");

  const handleReview = () => {
    updateSubmission.mutate(
      { id, data: { status: "reviewed", reviewedBy, notes: reviewNotes || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSubmissionQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
          toast({ title: "Reviewed", description: "Submission marked as reviewed." });
        },
        onError: () => toast({ title: "Error", description: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    deleteSubmission.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          navigate("/submissions");
          toast({ title: "Deleted", description: "Submission removed." });
        },
        onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </MainLayout>
  );

  if (!submission) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/submissions"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  const values = (submission.values as Record<string, unknown>) ?? {};

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/submissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Submissions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{submission.templateName}</h1>
            <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground font-medium">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[submission.status]}`}>
                {submission.status}
              </span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {submission.siteName}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {submission.submittedBy}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {format(new Date(submission.clientTimestamp ?? submission.createdAt), "d MMM yyyy, HH:mm")}</span>
              {submission.latitude != null && submission.longitude != null && (
                <a
                  href={`https://maps.google.com/?q=${submission.latitude},${submission.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" /> GPS verified
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(values).length === 0 ? (
                <p className="text-sm text-muted-foreground">No field data recorded.</p>
              ) : (
                Object.entries(values).map(([key, val]) => (
                  <div key={key} className="flex border-b border-border pb-2 last:border-0 last:pb-0">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground w-40 shrink-0 pt-0.5">{key.replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium">{String(val ?? "—")}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {submission.notes && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{submission.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {submission.status !== "reviewed" ? (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Reviewed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reviewed By</Label>
                  <Input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Review Notes (optional)</Label>
                  <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder="Any observations..." />
                </div>
                <Button onClick={handleReview} disabled={updateSubmission.isPending} className="w-full gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {updateSubmission.isPending ? "Saving..." : "Mark Reviewed"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border rounded-sm border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-sm">Reviewed</span>
                </div>
                {submission.reviewedBy && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">by {submission.reviewedBy}</p>
                )}
                {submission.reviewedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(submission.reviewedAt), "d MMM yyyy, HH:mm")}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Template</span>
                <Link href={`/forms/${submission.templateId}`} className="text-primary hover:underline font-medium text-xs">{submission.templateName}</Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Site</span>
                <Link href={`/sites/${submission.siteId}`} className="text-primary hover:underline font-medium text-xs">{submission.siteName}</Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Submitted</span>
                <span className="font-medium text-xs">{format(new Date(submission.createdAt), "d MMM yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

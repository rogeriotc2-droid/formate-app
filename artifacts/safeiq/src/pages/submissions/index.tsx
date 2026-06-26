import { useState } from "react";
import { useListSubmissions } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Link } from "wouter";
import { ClipboardList, ChevronRight, MapPin, Clock, Download, FileSpreadsheet, FileText, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  reviewed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function downloadCsv(path: string) {
  const a = document.createElement("a");
  a.href = path;
  a.click();
}

export default function SubmissionsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: submissions, isLoading } = useListSubmissions(
    statusFilter !== "all" ? { status: statusFilter } : {}
  );

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 sm:mb-8 border-b pb-4 border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Submissions</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">All completed and in-progress forms.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Auditor Export
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadCsv("/api/export/submissions.csv")} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Form Submissions</div>
                  <div className="text-xs text-muted-foreground">All submissions as CSV</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCsv("/api/export/documents.csv")} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="font-medium text-sm">JSA &amp; SWMS Register</div>
                  <div className="text-xs text-muted-foreground">All documents with lock status</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadCsv("/api/export/audit-bundle.zip")} className="gap-2 cursor-pointer">
                <Shield className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Audit Bundle</div>
                  <div className="text-xs text-muted-foreground">Locked PDFs + hash manifest (.zip)</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : submissions?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-lg bg-card">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold">No submissions yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {statusFilter !== "all" ? `No ${statusFilter} submissions found.` : "Fill out a template to get started."}
          </p>
          <Link href="/forms" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 transition-colors">
            Browse Templates
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions?.map(sub => (
            <Link key={sub.id} href={`/submissions/${sub.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer border-border rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm truncate">{sub.templateName}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[sub.status]}`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{sub.siteName}</span>
                        </span>
                        <span className="hidden sm:inline">by {sub.submittedBy}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="sm:hidden">{format(new Date(sub.createdAt), "d MMM, HH:mm")}</span>
                          <span className="hidden sm:inline">{format(new Date(sub.createdAt), "d MMM yyyy, HH:mm")}</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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

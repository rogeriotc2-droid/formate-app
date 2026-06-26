import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";

export function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { queueCount, isOnline, isDraining, drain } = useOfflineSync();

  const showBanner = !isOnline || queueCount > 0;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: always visible, not fixed */}
      {/* Mobile: fixed drawer, slides in from left */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:z-auto md:transition-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-background flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-sidebar md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-base font-black tracking-tight"><span className="text-white">FOR</span><span className="text-primary">MATE</span></span>
          </div>
        </div>

        {/* ── Offline / sync banner ── */}
        {showBanner && (
          <div className={`shrink-0 px-4 py-2 flex items-center gap-2 text-sm font-medium ${
            !isOnline
              ? "bg-amber-50 text-amber-800 border-b border-amber-200"
              : "bg-blue-50 text-blue-800 border-b border-blue-200"
          }`}>
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>You're offline — forms will save and send automatically when you reconnect.</span>
              </>
            ) : isDraining ? (
              <>
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Sending {queueCount} saved form{queueCount !== 1 ? "s" : ""}…</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="flex-1">{queueCount} form{queueCount !== 1 ? "s" : ""} saved offline, waiting to send.</span>
                <button
                  onClick={drain}
                  className="flex items-center gap-1 underline underline-offset-2 hover:opacity-70"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

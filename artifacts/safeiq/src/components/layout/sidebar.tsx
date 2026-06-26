import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ClipboardList, MapPin, Settings, Shield, ShieldAlert, LogOut, Plug, CreditCard, X, Smartphone, Download, Award } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useXeroEnabled } from "@/lib/feature-flags";

// Founder/admin accounts that see the Customer Health link. The backend
// endpoint is the real gate (403s everyone else); this just hides the link.
const ADMIN_EMAILS = new Set<string>(["rogeriotc2@gmail.com"]);

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { prompt, install, isInstalled, isIos, isAndroid } = useInstallPrompt();

  async function handleSignOut() {
    await signOut();
    setLocation("/");
  }
  const [showHint, setShowHint] = useState(false);
  const xeroEnabled = useXeroEnabled();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sssps", label: "Safety Plans", icon: Shield },
    { href: "/submissions", label: "Submissions", icon: ClipboardList },
    { href: "/forms", label: "Templates", icon: FileText },
    { href: "/swms", label: "SWMS (AU)", icon: Shield },
    { href: "/jsa", label: "JSA", icon: ClipboardList },
    { href: "/sites", label: "Sites", icon: MapPin },
    { href: "/licences", label: "Licences", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
    // Integrations page is currently only useful for Xero — hide the link
    // unless the user is on the beta allowlist.
    ...(xeroEnabled ? [{ href: "/integrations", label: "Integrations", icon: Plug }] : []),
    { href: "/billing", label: "Billing", icon: CreditCard },
    // Founder-only: customer health overview.
    ...(user?.email && ADMIN_EMAILS.has(user.email.toLowerCase())
      ? [
          { href: "/admin", label: "Customer Health", icon: ShieldAlert },
          { href: "/admin/presets", label: "Preset Audit", icon: ShieldAlert },
        ]
      : []),
  ];

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const email = user?.email;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border shadow-lg">
      {/* Header */}
      <div className="p-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span><span className="text-white">FOR</span><span className="text-primary">MATE</span></span>
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1 uppercase font-bold tracking-wider">Field Operations</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-white/40 hover:text-white transition-colors mt-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Install app button — always shown until installed, since the native
          beforeinstallprompt event doesn't fire on a lot of mobile browsers
          (iOS Safari, dismissed-once Chrome, Firefox Android, Samsung
          Internet). Falls back to platform-specific instructions when there's
          no native prompt to fire. */}
      {!isInstalled && (
        <div className="px-4 pb-3">
          <button
            onClick={() => {
              if (prompt) { install(); return; }
              setShowHint((v) => !v);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold"
          >
            {isIos ? <Smartphone className="w-4 h-4 shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
            Add to home screen
          </button>
          {showHint && !prompt && (
            <div className="mt-2 bg-sidebar-accent rounded-md px-3 py-2.5 text-xs text-sidebar-foreground/80 leading-relaxed space-y-1.5">
              {isIos ? (
                <>
                  <p className="font-semibold text-white">On iPhone / iPad (Safari):</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Tap the <strong className="text-white">Share</strong> button at the bottom</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></li>
                    <li>Tap <strong className="text-white">Add</strong></li>
                  </ol>
                </>
              ) : isAndroid ? (
                <>
                  <p className="font-semibold text-white">On Android:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Tap the <strong className="text-white">⋮</strong> menu (top-right in Chrome)</li>
                    <li>Tap <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong></li>
                    <li>Confirm <strong className="text-white">Install</strong></li>
                  </ol>
                  <p className="pt-1 text-sidebar-foreground/60">Not in Chrome? Try Chrome or Edge — Firefox/Samsung Internet hide this option.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">On desktop (Chrome / Edge):</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Look for the <strong className="text-white">install icon</strong> in the address bar (right side)</li>
                    <li>Or open the <strong className="text-white">⋮</strong> menu → <strong className="text-white">Install Formate</strong></li>
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      )}


      {/* User + sign out */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-white truncate">{displayName}</span>
            {email && <span className="text-xs text-sidebar-foreground/50 truncate">{email}</span>}
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

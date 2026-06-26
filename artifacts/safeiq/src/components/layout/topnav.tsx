import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Shield, Plus } from "lucide-react";

export function TopNav() {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    setLocation("/");
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sssps", label: "Safety Plans" },
    { href: "/swms", label: "SWMS" },
    { href: "/jsa", label: "JSA" },
    { href: "/submissions", label: "Submissions" },
    { href: "/sites", label: "Sites" },
    { href: "/forms", label: "Templates" },
    { href: "/settings", label: "Settings" },
  ];

  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "Account";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0F0F0F] border-b border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline shrink-0">
            <Shield className="w-5 h-5 text-[#E87722]" strokeWidth={2} />
            <span
              className="text-[#FAFAF7] text-lg font-bold tracking-tight leading-none"
              style={{ fontFamily: "var(--app-font-display)", letterSpacing: "-0.02em" }}
            >
              SafeIQ
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1 px-4">
            {links.map((link) => {
              const isActive =
                location === link.href ||
                (link.href !== "/dashboard" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap no-underline transition-colors ${
                    isActive
                      ? "text-[#FF8B2A] bg-[#1A1A1A]"
                      : "text-[#A5A29A] hover:text-[#FAFAF7] hover:bg-[#1A1A1A]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/sssps" className="flex items-center gap-1.5 bg-[#E87722] hover:bg-[#FF8B2A] text-white text-sm font-semibold px-3 py-1.5 rounded transition-colors no-underline">
              <Plus className="w-3.5 h-3.5" />
              New SSSP
            </Link>
            <button
              onClick={handleSignOut}
              className="text-[#A5A29A] hover:text-[#FAFAF7] text-sm font-medium px-3 py-1.5 rounded hover:bg-[#1A1A1A] transition-colors"
            >
              {displayName}
            </button>
          </div>
        </div>
      </nav>
      <div className="hazard-stripe" />
    </>
  );
}

import { Link } from "wouter";
import { InstallBanner } from "@/components/install-banner";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 gap-4"
      style={{ background: "#FAFAF7" }}
    >
      <div className="w-full max-w-md">
        <InstallBanner />
      </div>
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 mb-6 cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xl font-black tracking-tight">
              <span className="text-foreground">FOR</span>
              <span className="text-primary">MATE</span>
            </span>
          </div>
        </Link>
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-black text-foreground mb-1 tracking-tight text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mb-6 text-center leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className={subtitle ? "" : "mt-6"}>{children}</div>
        </div>
        {footer && (
          <div className="text-center text-sm text-muted-foreground mt-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

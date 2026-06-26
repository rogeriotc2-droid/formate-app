import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CompanyStatusProvider, useCompanyStatus } from "@/lib/company-status";
import { Switch, Route, Router as WouterRouter, Redirect, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// ── Eager: the landing page is the primary ad entry point, so it must paint
// instantly and ships in the initial bundle.
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

// ── Lazy: the authenticated app + low-traffic pages. A first-time visitor never
// needs these, so they load on demand (their own chunks) instead of bloating the
// initial bundle the landing page has to download.
//
// The SEO/guide pages below are pre-rendered to static HTML at build time, so a
// crawler (and the first paint) still sees full content instantly. Lazy-loading
// only their client JS keeps that ~60 KiB of off-landing code out of the bundle
// the ad landing page has to download.
const FreeSsspTemplate = lazy(() => import("@/pages/seo/free-sssp-template"));
const SwmsTemplate = lazy(() => import("@/pages/seo/swms-template"));
const JsaTemplate = lazy(() => import("@/pages/seo/jsa-template"));
const WhatIsAnSssp = lazy(() => import("@/pages/guides/what-is-an-sssp"));
const HowToWriteAnSssp = lazy(() => import("@/pages/guides/how-to-write-an-sssp"));
const SsspRequirementsNz = lazy(() => import("@/pages/guides/sssp-requirements-nz"));
const Flyer = lazy(() => import("@/pages/flyer"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const IntegrationsPage = lazy(() => import("@/pages/integrations"));
const BillingPage = lazy(() => import("@/pages/billing"));
const SitesList = lazy(() => import("@/pages/sites/index"));
const SiteDetail = lazy(() => import("@/pages/sites/detail"));
const SiteNew = lazy(() => import("@/pages/sites/new"));
const LicencesList = lazy(() => import("@/pages/licences/index"));
const LicenceDetail = lazy(() => import("@/pages/licences/detail"));
const LicenceNew = lazy(() => import("@/pages/licences/new"));
const FormsList = lazy(() => import("@/pages/forms/index"));
const FormDetail = lazy(() => import("@/pages/forms/detail"));
const FillForm = lazy(() => import("@/pages/fill/index"));
const SubmissionsList = lazy(() => import("@/pages/submissions/index"));
const SubmissionDetail = lazy(() => import("@/pages/submissions/detail"));
const Settings = lazy(() => import("@/pages/settings"));
const SsspList = lazy(() => import("@/pages/sssps/index"));
const SsspDetail = lazy(() => import("@/pages/sssps/detail"));
const SsspPrint = lazy(() => import("@/pages/sssps/print"));
const SsspPublicView = lazy(() => import("@/pages/sssps/public-view"));
const SignSsspPage = lazy(() => import("@/pages/sign-sssp"));
const PcbuPortalPage = lazy(() => import("@/pages/pcbu-portal"));
const SwmsList = lazy(() => import("@/pages/swms/index"));
const SwmsDetail = lazy(() => import("@/pages/swms/detail"));
const SwmsPrint = lazy(() => import("@/pages/swms/print"));
const JsaList = lazy(() => import("@/pages/jsa/index"));
const JsaDetail = lazy(() => import("@/pages/jsa/detail"));
const JsaPrint = lazy(() => import("@/pages/jsa/print"));
const JsaSignPage = lazy(() => import("@/pages/jsa-sign"));
const SwmsSignPage = lazy(() => import("@/pages/swms-sign"));
const TermsPage = lazy(() => import("@/pages/terms"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const AdminCustomers = lazy(() => import("@/pages/admin/index"));
const AdminPresets = lazy(() => import("@/pages/admin/presets"));
const SignInPage = lazy(() => import("@/pages/auth/sign-in"));
const SignUpPage = lazy(() => import("@/pages/auth/sign-up"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── QueryClient ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ─── Onboarding gate ─────────────────────────────────────────────────────────

function TrialExpiredWall() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xl font-black tracking-tight">
            <span className="text-foreground">FOR</span><span className="text-primary">MATE</span>
          </span>
        </div>
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Your free trial has ended</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Your 30-day free trial is up. Upgrade to keep sending SSSPs, managing sites, and staying compliant — faster than paper.
          </p>
          <Link href="/billing">
            <Button className="w-full bg-primary hover:bg-primary/90 font-bold text-base py-6">
              View plans &amp; upgrade →
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-5">
            Questions? Email{" "}
            <a href="mailto:hello@formate.co.nz" className="underline text-foreground">
              hello@formate.co.nz
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function RouteLoading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#FAFAF7" }}>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        <span className="text-lg font-black tracking-tight">
          <span className="text-foreground">FOR</span><span className="text-primary">MATE</span>
        </span>
      </div>
    </div>
  );
}

function HomeRedirect() {
  // The landing page is public and the primary ad entry point, so it must paint
  // immediately — it must NEVER wait on the /api/auth/me check. Anonymous
  // visitors (≈all of "/" traffic) render Landing instantly. Only once auth has
  // resolved AND the visitor is signed in do we redirect them to the dashboard.
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedRoute({ component: Component, allowExpired }: { component: React.ComponentType; allowExpired?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { state } = useCompanyStatus();

  if (!isLoaded) return <RouteLoading />;
  if (!isSignedIn) return <Redirect to="/" />;
  if (state === "loading") return <RouteLoading />;
  if (state === "no") return <Redirect to="/onboarding" />;
  if (state === "expired" && !allowExpired) return <TrialExpiredWall />;
  return <Component />;
}

function OnboardingRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const { state } = useCompanyStatus();

  if (!isLoaded) return <RouteLoading />;
  if (!isSignedIn) return <Redirect to="/" />;
  if (state === "loading") return <RouteLoading />;
  if (state === "no") return <Onboarding />;
  // Already has a company (yes/expired) — never trap a set-up user on the
  // onboarding form. Send them to the dashboard (ProtectedRoute handles the
  // trial-expired wall from there).
  return <Redirect to="/dashboard" />;
}

// ─── Router ──────────────────────────────────────────────────────────────────

function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/flyer" component={Flyer} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/onboarding" component={OnboardingRoute} />
        <Route path="/integrations" component={() => <ProtectedRoute component={IntegrationsPage} />} />
        <Route path="/billing" component={() => <ProtectedRoute component={BillingPage} allowExpired />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/forms" component={() => <ProtectedRoute component={FormsList} />} />
        <Route path="/forms/:id" component={() => <ProtectedRoute component={FormDetail} />} />
        <Route path="/fill/:id" component={() => <ProtectedRoute component={FillForm} />} />
        <Route path="/submissions" component={() => <ProtectedRoute component={SubmissionsList} />} />
        <Route path="/submissions/:id" component={() => <ProtectedRoute component={SubmissionDetail} />} />
        <Route path="/sites" component={() => <ProtectedRoute component={SitesList} />} />
        <Route path="/sites/new" component={() => <ProtectedRoute component={SiteNew} />} />
        <Route path="/sites/:id" component={() => <ProtectedRoute component={SiteDetail} />} />
        <Route path="/licences" component={() => <ProtectedRoute component={LicencesList} />} />
        <Route path="/licences/new" component={() => <ProtectedRoute component={LicenceNew} />} />
        <Route path="/licences/:id" component={() => <ProtectedRoute component={LicenceDetail} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/admin" component={() => <ProtectedRoute component={AdminCustomers} />} />
        <Route path="/admin/presets" component={() => <ProtectedRoute component={AdminPresets} />} />
        <Route path="/sssps" component={() => <ProtectedRoute component={SsspList} />} />
        <Route path="/sssps/:id/print" component={() => <ProtectedRoute component={SsspPrint} />} />
        <Route path="/sssps/:id" component={() => <ProtectedRoute component={SsspDetail} />} />
        <Route path="/swms" component={() => <ProtectedRoute component={SwmsList} />} />
        <Route path="/swms/:id/print" component={() => <ProtectedRoute component={SwmsPrint} />} />
        <Route path="/swms/:id" component={() => <ProtectedRoute component={SwmsDetail} />} />
        <Route path="/jsa" component={() => <ProtectedRoute component={JsaList} />} />
        <Route path="/jsa/:id/print" component={() => <ProtectedRoute component={JsaPrint} />} />
        <Route path="/jsa/:id" component={() => <ProtectedRoute component={JsaDetail} />} />
        <Route path="/sssp/:id" component={SsspPublicView} />
        <Route path="/sign/:token" component={SignSsspPage} />
        <Route path="/jsa-sign/:token" component={JsaSignPage} />
        <Route path="/swms-sign/:token" component={SwmsSignPage} />
        <Route path="/pcbu/:token" component={PcbuPortalPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/free-sssp-template" component={FreeSsspTemplate} />
        <Route path="/swms-template" component={SwmsTemplate} />
        <Route path="/jsa-template" component={JsaTemplate} />
        <Route path="/guides/what-is-an-sssp" component={WhatIsAnSssp} />
        <Route path="/guides/how-to-write-an-sssp" component={HowToWriteAnSssp} />
        <Route path="/guides/sssp-requirements-nz" component={SsspRequirementsNz} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <CompanyStatusProvider>
              <AppRouter />
            </CompanyStatusProvider>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;

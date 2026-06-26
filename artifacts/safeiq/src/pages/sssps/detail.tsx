import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetSssp, useUpdateSssp, useDeleteSssp, getListSsspsQueryKey, getGetSsspQueryKey, useListSites, useSendSsspEmail } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowLeft, Trash2, Printer, Shield, Plus, X, Loader2, Lock,
  Users, AlertTriangle, Phone, HardHat, BookOpen,
  ClipboardList, FileText, FlaskConical, Megaphone, PenLine, CheckSquare, ExternalLink, Share2, Mail, Camera, Send, CheckCircle2,
} from "lucide-react";
import { authedFetch } from "@/lib/api";
import { SsspPhotosEditor, type SsspPhoto, readPendingPhotos, clearPendingPhotos } from "@/components/sssp-photos";
import { lookupEmergencyServicesForAddress, findNearbyEmergencyServices, type EmergencyPlace } from "@/lib/emergency-lookup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { XeroContactPicker } from "@/components/xero-contact-picker";
import { useXeroEnabled } from "@/lib/feature-flags";

// ─── Types ───────────────────────────────────────────────────────────────────

type Pcbu = {
  company?: string;
  tradingName?: string;
  role?: string;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  safetyRep?: string;
  safetyRepPhone?: string;
  firstAid?: string;
  firstAidPhone?: string;
  // Snapshot of the contractor's company logo, denormalized from the company
  // profile on every save so the print/share/sign pages (some unauthed) can
  // render it without an extra round-trip or DB join.
  logoUrl?: string;
};

type Hazard = {
  hazard: string;
  initialRisk: string;
  controlLevel: string;
  controls: string;
  residualRisk: string;
  toolbox: boolean;
};

type TaskStep = {
  step: string;
  hazards: string;
  initialRisk: string;
  controls: string;
  controlLevel: string;
  residualRisk: string;
};

type Substance = {
  product: string;
  unNumber: string;
  state: string;
  hazardType: string;
  maxQty: string;
  storage: string;
  segregation: string;
  sdsLocation: string;
  controls: string;
  ppe: string;
  initialRisk: string;
  residualRisk: string;
};

type SsspData = {
  // Agreement
  siteAddress?: string;
  activities?: string;
  workSafeNotification?: string;
  taskAnalysisRequired?: boolean;
  hazardRegisterProvided?: boolean;
  hazardousSubstancesOnSite?: boolean;
  pcbu1?: Pcbu;
  pcbu2?: Pcbu;
  // Hazard Register
  hazards?: Hazard[];
  // Task Analysis
  taskSteps?: TaskStep[];
  ppeRequired?: string[];
  // Hazardous Substances
  substances?: Substance[];
  // Emergency
  nearestHospital?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  musterPoint?: string;
  emergencyProcedures?: string;
  emergencyContacts?: { name: string; role: string; phone: string }[];
  // Communication
  commToolboxFreq?: string;
  commPreStartFreq?: string;
  commProgressFreq?: string;
  incidentReporting?: string;
  // Training
  trainingItems?: string[];
  inductionProcess?: string;
  // Declaration
  pcbu1SignedBy?: string;
  pcbu1SignedDate?: string;
  pcbu1SignatureImage?: string;
  pcbu1SignToken?: string;
  pcbu1SignSentAt?: string;
  pcbu1SignSentTo?: string;
  pcbu2SignedBy?: string;
  pcbu2SignedDate?: string;
  pcbu2SignatureImage?: string;
  // Site photos — hazards, conditions, sign-in board, completed work, etc.
  photos?: SsspPhoto[];
  // Set by the server when an SSSP was seeded from a starter template for the
  // tradie's primary trade. Cleared once the user dismisses the review banner.
  _starterTemplate?: string;
};

const TRADE_LABELS: Record<string, string> = {
  electrical: "Electrician",
  plumbing: "Plumber",
  gas_fitting: "Gas Fitter",
  drainage: "Drainlayer",
  carpentry: "Carpenter",
  roofing: "Roofer",
  painting: "Painter",
  concrete_grinding: "Concrete Grinder",
  concrete_laying: "Concrete Layer",
  line_marking: "Line Marker",
  asphalt: "Asphalt / Bitumen",
  general: "your trade",
};

// ─── Constants / Defaults ────────────────────────────────────────────────────

const RISK_LEVELS = ["Very Low", "Low", "Moderate", "High", "Critical"];
const CONTROL_LEVELS = [
  "Elimination",
  "Substitution",
  "Isolation",
  "Engineering",
  "Administrative",
  "PPE",
  "Isolation + Administrative + PPE",
  "Engineering + PPE",
  "Administrative + PPE",
  "Engineering + Administrative + PPE",
];

const LINE_MARKING_HAZARDS: Hazard[] = [
  {
    hazard: "Vehicle / pedestrian traffic in work area",
    initialRisk: "High",
    controlLevel: "Isolation + Administrative + PPE",
    controls: "Traffic management plan in place: cones, signs, barriers per NZTA CoPTTM. Hi-vis at all times. Designated exclusion zone.",
    residualRisk: "Low",
    toolbox: true,
  },
  {
    hazard: "Respirable crystalline silica dust from concrete diamond grinding",
    initialRisk: "High",
    controlLevel: "Engineering + PPE",
    controls: "HEPA dust extractor (M-class or H-class) connected to grinder at all times. P3 respirator worn during all grinding. Wet grinding used where suitable.",
    residualRisk: "Low",
    toolbox: true,
  },
  {
    hazard: "Noise from grinders, compressors and line marking machines",
    initialRisk: "Moderate",
    controlLevel: "Administrative + PPE",
    controls: "Class 5 hearing protection worn during all powered operations. Exclusion zone around noisy equipment.",
    residualRisk: "Low",
    toolbox: true,
  },
  {
    hazard: "Paint fumes and solvent exposure",
    initialRisk: "Moderate",
    controlLevel: "Administrative + PPE",
    controls: "Work in well-ventilated areas. P2 respirator with organic vapour cartridge in enclosed zones. Nitrile gloves. SDS available.",
    residualRisk: "Low",
    toolbox: true,
  },
  {
    hazard: "Manual handling of equipment (grinders, paint drums, line marking machine)",
    initialRisk: "Moderate",
    controlLevel: "Administrative",
    controls: "Two-person lift for items over 25 kg. Trolleys and mechanical aids used. Correct lifting technique reinforced at pre-start.",
    residualRisk: "Low",
    toolbox: false,
  },
  {
    hazard: "Slips, trips, and falls on uneven or wet surfaces",
    initialRisk: "Moderate",
    controlLevel: "Administrative + PPE",
    controls: "Site walkover before work starts. Steel-cap safety boots. Cables and hoses kept tidy. Wet paint warning signs during drying.",
    residualRisk: "Low",
    toolbox: false,
  },
  {
    hazard: "UV exposure and heat stress (outdoor work)",
    initialRisk: "Moderate",
    controlLevel: "Administrative + PPE",
    controls: "Long-sleeve hi-vis, broad-brim hat, SPF 50+ sunscreen, hydration breaks. Avoid peak UV hours where possible.",
    residualRisk: "Low",
    toolbox: false,
  },
  {
    hazard: "Hot surfaces and fire risk — thermoplastic application equipment",
    initialRisk: "Moderate",
    controlLevel: "Engineering + Administrative + PPE",
    controls: "Heat-resistant gloves. Cool-down period before pack-down. Fire extinguisher near boiler. Burn first aid procedure understood.",
    residualRisk: "Low",
    toolbox: true,
  },
];

const LINE_MARKING_STEPS: TaskStep[] = [
  {
    step: "Site arrival, sign-in, and pre-start inspection",
    hazards: "Unknown site conditions, traffic, overhead hazards",
    initialRisk: "Moderate",
    controls: "Sign in with site contact. Confirm location of amenities, first aid, fire extinguishers and assembly point. Walk site. Brief team.",
    controlLevel: "Administrative",
    residualRisk: "Low",
  },
  {
    step: "Set up traffic management and exclusion zone",
    hazards: "Vehicle strike, pedestrian conflict, working near live traffic",
    initialRisk: "High",
    controls: "Place cones, signs, and barriers per the TMP. Position work vehicle as protection. All staff in hi-vis.",
    controlLevel: "Isolation + PPE",
    residualRisk: "Low",
  },
  {
    step: "Surface preparation — concrete diamond grinding",
    hazards: "Respirable silica dust, noise, flying debris, hand-arm vibration",
    initialRisk: "High",
    controls: "Connect HEPA dust extractor BEFORE starting grinder. P3 respirator, hearing protection, safety glasses, gloves.",
    controlLevel: "Engineering + PPE",
    residualRisk: "Low",
  },
  {
    step: "Apply line marking paint or thermoplastic",
    hazards: "Paint fumes/solvents, hot material burns, slips on wet paint",
    initialRisk: "Moderate",
    controls: "Work upwind where possible. Nitrile gloves, P2 mask with organic vapour cartridge if enclosed. Heat-resistant gloves for thermoplastic.",
    controlLevel: "Administrative + PPE",
    residualRisk: "Low",
  },
  {
    step: "Drying / curing period and quality check",
    hazards: "Public walking on wet paint, vehicle damage to fresh markings",
    initialRisk: "Moderate",
    controls: "Wet paint signs and cones remain in place. Periodic touch-check before declaring dry. Visual quality check.",
    controlLevel: "Administrative",
    residualRisk: "Low",
  },
  {
    step: "Pack down, site clean-up, and handover",
    hazards: "Manual handling, leaving hazards behind, fatigue",
    initialRisk: "Low",
    controls: "Use trolleys for heavy items. Remove all rubbish and used filters. Final walk-through. Sign out.",
    controlLevel: "Administrative",
    residualRisk: "Very Low",
  },
];

const LINE_MARKING_PPE = [
  "Hi-vis vest / clothing (NZS 4602 compliant) — at all times on site",
  "Steel-cap safety boots (AS/NZS 2210.3 compliant)",
  "Safety glasses or face shield (AS/NZS 1337)",
  "Hearing protection — Class 5 (AS/NZS 1270)",
  "P3 respirator — for concrete grinding (silica dust)",
  "P2 respirator with organic vapour cartridge — for paint/solvent work",
  "Nitrile gloves — paint and solvent handling",
  "Heat-resistant gloves and face shield — thermoplastic application",
  "Hard hat (where required by site rules)",
  "Long-sleeved clothing and SPF 50+ sunscreen — outdoor work",
];

const LINE_MARKING_SUBSTANCES: Substance[] = [
  {
    product: "Solvent-based road marking paint",
    unNumber: "UN 1263",
    state: "Liquid",
    hazardType: "Flammable, Health effects",
    maxQty: "60 L on vehicle",
    storage: "Locked vehicle compartment, upright, ventilated",
    segregation: "Away from ignition sources, oxidisers, and food",
    sdsLocation: "Vehicle SDS folder + digital copies on phone",
    controls: "Ventilation, no smoking, splash protection",
    ppe: "P2 + organic vapour respirator, nitrile gloves, safety glasses",
    initialRisk: "High",
    residualRisk: "Low",
  },
  {
    product: "Water-based acrylic road marking paint",
    unNumber: "Not DG",
    state: "Liquid",
    hazardType: "Skin / eye irritant",
    maxQty: "100 L on vehicle",
    storage: "Vehicle compartment, upright",
    segregation: "Standard — no special requirements",
    sdsLocation: "Vehicle SDS folder + digital",
    controls: "Splash protection, eye wash available",
    ppe: "Nitrile gloves, safety glasses",
    initialRisk: "Moderate",
    residualRisk: "Very Low",
  },
  {
    product: "Thermoplastic road marking material",
    unNumber: "Not DG (solid)",
    state: "Solid — melts at 180–200°C",
    hazardType: "Severe burns at application temperature",
    maxQty: "50 kg on vehicle",
    storage: "Dry storage, away from heat sources",
    segregation: "Standard",
    sdsLocation: "Vehicle SDS folder + digital",
    controls: "Heat-resistant gloves, face shield, cool-down period, fire extinguisher nearby",
    ppe: "Heat-resistant gloves, face shield, long sleeves",
    initialRisk: "High",
    residualRisk: "Low",
  },
  {
    product: "Methylated spirits / Acetone (cleaning)",
    unNumber: "UN 1170 / UN 1090",
    state: "Liquid",
    hazardType: "Highly flammable, Health effects",
    maxQty: "5 L",
    storage: "Locked vehicle compartment, away from ignition",
    segregation: "Away from oxidisers and ignition sources",
    sdsLocation: "Vehicle SDS folder + digital",
    controls: "No smoking, ventilated use, capped after use",
    ppe: "Nitrile gloves, safety glasses",
    initialRisk: "Moderate",
    residualRisk: "Low",
  },
  {
    product: "Petrol / Diesel (machinery fuel)",
    unNumber: "UN 1203 / UN 1202",
    state: "Liquid",
    hazardType: "Flammable, Eco-toxic",
    maxQty: "20 L (approved jerry can)",
    storage: "Approved jerry can in vented compartment",
    segregation: "Away from ignition sources and oxidisers",
    sdsLocation: "Vehicle SDS folder + digital",
    controls: "Refuel with cool engine only, spill kit on vehicle",
    ppe: "Nitrile gloves, safety glasses",
    initialRisk: "High",
    residualRisk: "Low",
  },
];

const riskColor = (r: string) => {
  if (r === "Critical") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (r === "High") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  if (r === "Moderate") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  if (r === "Low") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
};

const SECTIONS = [
  { id: "agreement", label: "Agreement", icon: FileText },
  { id: "hazards", label: "Hazard Register", icon: AlertTriangle },
  { id: "task", label: "Task Analysis", icon: ClipboardList },
  { id: "substances", label: "Substances", icon: FlaskConical },
  { id: "ppe", label: "PPE", icon: HardHat },
  { id: "emergency", label: "Emergency", icon: Phone },
  { id: "communication", label: "Communication", icon: Megaphone },
  { id: "training", label: "Training", icon: BookOpen },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "declaration", label: "Declaration", icon: PenLine },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SsspDetail() {
  const [, params] = useRoute("/sssps/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);
  const xeroEnabled = useXeroEnabled();

  const { data: sssp, isLoading } = useGetSssp(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();
  const updateSssp = useUpdateSssp();
  const deleteSssp = useDeleteSssp();
  // Pulled in so we can stamp the latest company logo onto pcbu2 on every save.
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  useEffect(() => {
    authedFetch("/api/company")
      .then(r => r.ok ? r.json() : null)
      .then(c => setCompanyLogoUrl(c?.logoUrl ?? null))
      .catch(() => {});
  }, []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [data, setData] = useState<SsspData>({});
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("agreement");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);

  const isLocked = !!((sssp as Record<string, unknown> | undefined)?.lockedAt);
  const hasSnapshot = !!((sssp as Record<string, unknown> | undefined)?.snapshotPdfKey);
  const snapshotStatus = (sssp as Record<string, unknown> | undefined)?.snapshotStatus as string | null | undefined;

  const handleLock = async () => {
    setLocking(true);
    try {
      const r = await authedFetch(`/api/sssps/${id}/lock`, { method: "POST" });
      if (!r.ok) throw new Error("failed");
      queryClient.invalidateQueries({ queryKey: getGetSsspQueryKey(id) });
      setLockDialogOpen(false);
      toast({ title: "SSSP locked", description: "This document is now the permanent audit record." });
    } catch {
      toast({ title: "Error", description: "Could not lock SSSP.", variant: "destructive" });
    } finally {
      setLocking(false);
    }
  };
  const [emailSentFlash, setEmailSentFlash] = useState(false);
  const sendSsspEmail = useSendSsspEmail();
  const [autoSend, setAutoSend] = useState(false);
  useEffect(() => {
    if (window.location.search.includes("action=send")) {
      setAutoSend(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (sssp && !initialized) {
      setProjectName(sssp.projectName);
      setStatus(sssp.status as "draft" | "active" | "archived");
      const d = (sssp.data as SsspData) ?? {};
      // If brand new (no pcbu2 yet), pre-fill PCBU 2 with RTC defaults
      if (!d.pcbu2?.company) {
        d.pcbu2 = {
          company: "RTC Concrete Grinding Ltd",
          contact: "Rogerio",
          phone: "022 4393344",
          role: "Subcontractor",
          safetyRep: "Rogerio",
          firstAid: "Rogerio",
        };
      }
      // If line marking template, load defaults
      if ((d as Record<string, unknown>)._template === "line-marking" && !d.hazards?.length) {
        d.hazards = LINE_MARKING_HAZARDS;
        d.taskSteps = LINE_MARKING_STEPS;
        d.ppeRequired = LINE_MARKING_PPE;
        d.substances = LINE_MARKING_SUBSTANCES;
        d.activities = d.activities || "Line marking and concrete grinding";
        delete (d as Record<string, unknown>)._template;
      }
      // RECOVERY: if a previous photo upload was interrupted (mobile tab kill),
      // pending photos sit in localStorage waiting to be attached. Merge them
      // in here and trigger a save so they become part of the SSSP for real.
      const pending = readPendingPhotos(String(id));
      const existingPaths = new Set((d.photos ?? []).map((p) => p.objectPath));
      const recovered = pending.filter((p) => !existingPaths.has(p.objectPath));
      if (recovered.length > 0) {
        d.photos = [...(d.photos ?? []), ...recovered];
        // Defer the save until after state is set, then clear local cache on
        // success. If the save fails (offline), the entries stay in
        // localStorage and we'll try again next page load.
        setTimeout(() => {
          updateSssp.mutate(
            { id, data: { projectName: sssp.projectName, status: sssp.status as "draft" | "active" | "archived", data: d } },
            {
              onSuccess: () => {
                clearPendingPhotos(String(id));
                queryClient.invalidateQueries({ queryKey: getGetSsspQueryKey(id) });
                toast({ title: `Recovered ${recovered.length} photo${recovered.length === 1 ? "" : "s"} from your last session` });
              },
            },
          );
        }, 0);
      }
      setData(d);
      setInitialized(true);
    }
  }, [sssp, initialized, id]);

  const patch = (updates: Partial<SsspData>) => setData(d => ({ ...d, ...updates }));
  const patchPcbu1 = (updates: Partial<Pcbu>) => patch({ pcbu1: { ...data.pcbu1, ...updates } });
  const patchPcbu2 = (updates: Partial<Pcbu>) => patch({ pcbu2: { ...data.pcbu2, ...updates } });

  const save = () => {
    setSaving(true);
    // Denormalize the current company logo onto pcbu2 every save so unauthed
    // print/share/sign pages can render it without a join. Always write
    // (including the removal case) so stale logos don't linger on old SSSPs.
    const pcbu2Next: Pcbu = { ...(data.pcbu2 ?? {}) };
    if (companyLogoUrl) {
      pcbu2Next.logoUrl = companyLogoUrl;
    } else {
      delete pcbu2Next.logoUrl;
    }
    const dataWithLogo: SsspData = { ...data, pcbu2: pcbu2Next };
    updateSssp.mutate(
      { id, data: { projectName, status, data: dataWithLogo } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSsspQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListSsspsQueryKey() });
          toast({ title: "Saved" });
          setSaving(false);
        },
        onError: () => { toast({ title: "Error", description: "Failed to save", variant: "destructive" }); setSaving(false); },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this SSSP? This cannot be undone.")) return;
    deleteSssp.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSsspsQueryKey() });
        navigate("/sssps");
        toast({ title: "Deleted" });
      },
    });
  };

  // Hazards
  const addHazard = () => patch({ hazards: [...(data.hazards ?? []), { hazard: "", initialRisk: "Moderate", controlLevel: "Administrative", controls: "", residualRisk: "Low", toolbox: false }] });
  const updateHazard = (i: number, u: Partial<Hazard>) => patch({ hazards: (data.hazards ?? []).map((h, idx) => idx === i ? { ...h, ...u } : h) });
  const removeHazard = (i: number) => patch({ hazards: (data.hazards ?? []).filter((_, idx) => idx !== i) });

  // Task steps
  const addStep = () => patch({ taskSteps: [...(data.taskSteps ?? []), { step: `Step ${(data.taskSteps ?? []).length + 1}`, hazards: "", initialRisk: "Moderate", controls: "", controlLevel: "Administrative", residualRisk: "Low" }] });
  const updateStep = (i: number, u: Partial<TaskStep>) => patch({ taskSteps: (data.taskSteps ?? []).map((s, idx) => idx === i ? { ...s, ...u } : s) });
  const removeStep = (i: number) => patch({ taskSteps: (data.taskSteps ?? []).filter((_, idx) => idx !== i) });

  // Substances
  const addSubstance = () => patch({ substances: [...(data.substances ?? []), { product: "", unNumber: "", state: "Liquid", hazardType: "", maxQty: "", storage: "", segregation: "", sdsLocation: "", controls: "", ppe: "", initialRisk: "Moderate", residualRisk: "Low" }] });
  const updateSubstance = (i: number, u: Partial<Substance>) => patch({ substances: (data.substances ?? []).map((s, idx) => idx === i ? { ...s, ...u } : s) });
  const removeSubstance = (i: number) => patch({ substances: (data.substances ?? []).filter((_, idx) => idx !== i) });

  // Emergency contacts
  const addEContact = () => patch({ emergencyContacts: [...(data.emergencyContacts ?? []), { name: "", role: "", phone: "" }] });
  const updateEContact = (i: number, u: Partial<{ name: string; role: string; phone: string }>) =>
    patch({ emergencyContacts: (data.emergencyContacts ?? []).map((c, idx) => idx === i ? { ...c, ...u } : c) });
  const removeEContact = (i: number) => patch({ emergencyContacts: (data.emergencyContacts ?? []).filter((_, idx) => idx !== i) });

  /**
   * Shared apply step: merge a categorised set of nearby places into the SSSP.
   * Existing user-entered values are never clobbered — only blanks are filled
   * and new contacts appended. `sourceLabel` appears in the distance string
   * (e.g. "2.3 km from site" vs "2.3 km from your location").
   */
  const applyNearbyResult = (
    result: {
      nearestHospital?: EmergencyPlace;
      nearestMedicalCentre?: EmergencyPlace;
      nearestPolice?: EmergencyPlace;
      nearestFireStation?: EmergencyPlace;
    },
    sourceLabel: string,
    silent: boolean,
  ) => {
    const placeAddress = (p: EmergencyPlace) =>
      `${p.address || p.name} (${p.distanceKm.toFixed(1)} km from ${sourceLabel})`;
    const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const normalisePhone = (s: string) => s.replace(/[^0-9]/g, "");
    const filledLabels: string[] = [];
    const skippedLabels: string[] = [];

    setData((d) => {
      const updates: Partial<SsspData> = {};

      if (result.nearestHospital) {
        const h = result.nearestHospital;
        let added = false;
        if (!d.nearestHospital?.trim()) { updates.nearestHospital = h.name; added = true; }
        if (!d.hospitalAddress?.trim()) { updates.hospitalAddress = placeAddress(h); added = true; }
        if (!d.hospitalPhone?.trim()) { updates.hospitalPhone = h.phone ?? "111 (Ambulance)"; added = true; }
        (added ? filledLabels : skippedLabels).push("hospital");
      }

      const existing = d.emergencyContacts ?? [];
      const existingNames = new Set(existing.map((c) => normalise(c.name ?? "")));
      const existingPhones = new Set(existing.map((c) => normalisePhone(c.phone ?? "")).filter(Boolean));
      const toAdd: { name: string; role: string; phone: string }[] = [];
      const addContact = (role: string, p: EmergencyPlace | undefined, label: string) => {
        if (!p) return;
        const name = `${p.name}${p.address ? " — " + p.address : ""}`;
        const phoneDigits = normalisePhone(p.phone ?? "");
        if (existingNames.has(normalise(name)) || (phoneDigits && existingPhones.has(phoneDigits))) {
          skippedLabels.push(label);
          return;
        }
        toAdd.push({ name, role, phone: p.phone ?? "" });
        existingNames.add(normalise(name));
        if (phoneDigits) existingPhones.add(phoneDigits);
        filledLabels.push(label);
      };
      addContact("Nearest Medical Centre", result.nearestMedicalCentre, "medical centre");
      addContact("Local Police Station", result.nearestPolice, "police");
      addContact("Local Fire Station", result.nearestFireStation, "fire station");

      if (toAdd.length > 0) updates.emergencyContacts = [...existing, ...toAdd];
      return { ...d, ...updates };
    });

    if (filledLabels.length === 0) {
      if (!silent) {
        toast({
          title: "Nothing new to add",
          description: skippedLabels.length > 0
            ? "Looks like you've already got these — nothing was overwritten."
            : "Couldn't find any nearby emergency services within 40 km.",
        });
      }
      return;
    }
    toast({
      title: `Filled ${filledLabels.length} emergency service${filledLabels.length === 1 ? "" : "s"}`,
      description: `Added: ${filledLabels.join(", ")}. Your existing entries were kept as-is. Double-check phone numbers — OSM doesn't always have them.`,
    });
  };

  /**
   * Find nearest emergency services and auto-fill the Emergency section.
   *
   * Priority:
   *   1. Site address is filled → geocode it (correct for office-prepared plans).
   *   2. No address → GPS (correct for on-site filling with no address yet).
   *
   * `silent: true` suppresses error/empty toasts but still shows the success
   * notice so the user sees it filled in automatically.
   */
  const autofillEmergency = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    const address = data.siteAddress?.trim();

    // ── Path 1: site address known (office or pre-job preparation) ────────────
    if (address) {
      setLookingUp(true);
      try {
        const result = await lookupEmergencyServicesForAddress(address);
        if (!result) {
          if (!silent) toast({ title: "Couldn't find that address", description: "Try a more complete address (street, suburb, city).", variant: "destructive" });
          return;
        }
        applyNearbyResult(result, "site", silent);
      } catch (err) {
        if (!silent) toast({ title: "Lookup failed", description: err instanceof Error ? err.message : "Check your internet connection and try again.", variant: "destructive" });
      } finally {
        setLookingUp(false);
      }
      return;
    }

    // ── Path 2: no address yet — fall back to GPS (on-site filling) ──────────
    if (!navigator.geolocation) {
      if (!silent) toast({ title: "Enter the site address first", description: "Add the site address in the Agreement tab, then come back here.", variant: "destructive" });
      return;
    }
    setLookingUp(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12_000, maximumAge: 120_000 }),
      );
      const places = await findNearbyEmergencyServices(pos.coords.latitude, pos.coords.longitude);
      const hospitals = places.filter((p) => p.kind === "hospital");
      applyNearbyResult(
        {
          nearestHospital: hospitals.find((p) => p.emergency) ?? hospitals[0],
          nearestMedicalCentre: places.find((p) => p.kind === "clinic" || p.kind === "doctors"),
          nearestPolice: places.find((p) => p.kind === "police"),
          nearestFireStation: places.find((p) => p.kind === "fire_station"),
        },
        "your location",
        silent,
      );
    } catch (err) {
      if (!silent) toast({ title: "Location not available", description: "Allow location access, or add a site address in the Agreement tab for accurate results.", variant: "destructive" });
    } finally {
      setLookingUp(false);
    }
  };

  // Auto-trigger when entering the Emergency section — no button press needed.
  // Uses site address if filled; falls back to GPS if not.
  // Ref prevents re-querying the same source on repeated section visits.
  const autoLookedUpForRef = useRef<string>("");
  useEffect(() => {
    if (activeSection !== "emergency" || !initialized) return;
    const address = data.siteAddress?.trim() ?? "";
    const key = address || "gps";
    if (autoLookedUpForRef.current === key) return;
    autoLookedUpForRef.current = key;
    void autofillEmergency({ silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, initialized]);

  // PPE
  const togglePpe = (item: string) => {
    const list = data.ppeRequired ?? [];
    patch({ ppeRequired: list.includes(item) ? list.filter(x => x !== item) : [...list, item] });
  };
  const addPpe = (v: string) => { if (!v.trim()) return; patch({ ppeRequired: [...(data.ppeRequired ?? []), v.trim()] }); };

  if (isLoading) return (
    <MainLayout>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-4 mt-8">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
    </MainLayout>
  );

  if (!sssp) return (
    <MainLayout>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">SSSP not found.</p>
        <Link href="/sssps"><Button variant="outline" className="mt-4">Back</Button></Link>
      </div>
    </MainLayout>
  );

  const siteName = sites?.find(s => s.id === sssp.siteId)?.name;
  const hazardCount = (data.hazards ?? []).length;
  const highRisk = (data.hazards ?? []).filter(h => h.initialRisk === "High" || h.initialRisk === "Critical").length;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/sssps" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Safety Plans
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="text-2xl font-black border-0 border-b border-dashed border-border px-0 rounded-none h-auto text-foreground bg-transparent focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
            <div className="flex items-center gap-3 mt-1 ml-8 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary">NZ WorkSafe</Badge>
              {siteName && <span className="text-sm text-muted-foreground font-medium">{siteName}</span>}
              {data.pcbu1?.company && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">PCBU 1: {data.pcbu1.company}</span>}
              {hazardCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {hazardCount} hazard{hazardCount !== 1 ? "s" : ""}
                  {highRisk > 0 && <span className="text-orange-500 font-semibold ml-1">· {highRisk} high</span>}
                </span>
              )}
              <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
                <SelectTrigger className="h-6 text-xs w-28 border-0 bg-transparent p-0 focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0 justify-end">
            {/* Lock badge — shown when locked */}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
            {/* PDF button — serves snapshot when locked+complete, live PDF otherwise */}
            <Button
              variant="outline" size="sm"
              disabled={pdfDownloading || (isLocked && snapshotStatus === "pending")}
              className="gap-1"
              onClick={async () => {
                if (isLocked && snapshotStatus === "failed") {
                  // Retry snapshot generation
                  try {
                    const r = await authedFetch(`/api/sssps/${id}/snapshot/retry`, { method: "POST" });
                    if (!r.ok) throw new Error("failed");
                    queryClient.invalidateQueries({ queryKey: getGetSsspQueryKey(id) });
                    toast({ title: "Retrying…", description: "PDF snapshot is being regenerated." });
                  } catch {
                    toast({ title: "Retry failed", description: "Could not retry snapshot.", variant: "destructive" });
                  }
                  return;
                }
                setPdfDownloading(true);
                try {
                  const endpoint = isLocked && hasSnapshot
                    ? `/api/sssps/${id}/snapshot`
                    : `/api/sssps/${id}/pdf`;
                  const method = isLocked && hasSnapshot ? "GET" : "POST";
                  const r = await authedFetch(endpoint, { method });
                  if (!r.ok) throw new Error("failed");
                  const blob = await r.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = isLocked ? `sssp-${id}-locked.pdf` : `sssp-${id}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  toast({ title: "PDF failed", description: "Could not generate PDF — try again.", variant: "destructive" });
                } finally {
                  setPdfDownloading(false);
                }
              }}
            >
              {pdfDownloading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                : isLocked && snapshotStatus === "pending"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending…</>
                : isLocked && snapshotStatus === "failed"
                ? <><Printer className="w-3.5 h-3.5" /> Retry PDF</>
                : isLocked && hasSnapshot
                ? <><Printer className="w-3.5 h-3.5" /> Locked PDF</>
                : <><Printer className="w-3.5 h-3.5" /> PDF</>}
            </Button>
            <Button
              variant={emailSentFlash ? "default" : "outline"}
              size="sm"
              disabled={isLocked}
              className={`gap-1 transition-colors ${emailSentFlash ? "bg-green-600 hover:bg-green-600 border-green-600 text-white" : ""}`}
              onClick={() => {
                setRecipientEmail(data.pcbu1?.email ?? "");
                setRecipientName(data.pcbu1?.contact ?? "");
                setEmailDialogOpen(true);
              }}
            >
              <Mail className="w-3.5 h-3.5" />
              {emailSentFlash ? "Sent ✓" : "Email PCBU1"}
            </Button>
            {!isLocked && <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>}
            {!isLocked && (
              <Button
                size="sm" variant="outline"
                className="gap-1 border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                onClick={() => setLockDialogOpen(true)}
              >
                <Lock className="w-3.5 h-3.5" /> Lock
              </Button>
            )}
            {/* Secondary — icon only */}
            <Button
              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
              title="Share link"
              onClick={async () => {
                const printUrl = `${window.location.origin}${window.location.pathname}/print`;
                if (navigator.share) {
                  try { await navigator.share({ title: projectName, text: `Formate SSSP: ${projectName}`, url: printUrl }); } catch { /* cancelled */ }
                } else {
                  await navigator.clipboard.writeText(printUrl);
                  toast({ title: "Link copied", description: "Paste it into WhatsApp, email, or Messages." });
                }
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleDelete} title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Starter-template review banner — first SSSP only ── */}
      {data._starterTemplate && (
        <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-lg">
              👋
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">
                Welcome — this is your starter template for {TRADE_LABELS[data._starterTemplate] ?? "your trade"}.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-3 leading-relaxed">
                We've pre-loaded standard hazards, PPE, substances and emergency steps for your trade. <strong>Scroll down, review each section, and edit anything that doesn't match your work.</strong> From your next job onwards, Formate will remember your customised version — you'll only need to change what's different each day.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    patch({ _starterTemplate: undefined });
                    setTimeout(save, 0);
                  }}
                >
                  Got it — I'll review and save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Sign-Off card — always visible at top ── */}
      <div className="mb-5 rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sign &amp; Send</p>
        </div>
        <div className="flex items-center gap-1 flex-wrap text-xs">
          {([
            { label: "Your signature", done: !!(data.pcbu2SignatureImage && data.pcbu2SignedBy) },
            { label: "Send to PCBU 1", done: !!data.pcbu1SignSentAt },
            { label: "PCBU 1 signed", done: !!data.pcbu1SignedDate, optional: true },
          ] as { label: string; done: boolean; optional?: boolean }[]).map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <span className={`font-semibold px-2.5 py-0.5 rounded-full border ${
                step.done
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {step.done ? "✓ " : "· "}{step.label}
              </span>
            </span>
          ))}
        </div>
        {!(data.pcbu2SignatureImage && data.pcbu2SignedBy) && (
          <p className="text-xs text-muted-foreground">
            Review the document below — when you're happy, sign here and send to PCBU 1. ↓
          </p>
        )}

        {/* Key job details at a glance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div className="bg-background/60 rounded px-3 py-2 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Site Address</p>
            <p className="font-semibold text-sm truncate">{data.siteAddress || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>
          <div className="bg-background/60 rounded px-3 py-2 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">PCBU 1 — Client / Principal</p>
            <p className="font-semibold text-sm truncate">{data.pcbu1?.company || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>
          <div className="bg-background/60 rounded px-3 py-2 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">PCBU 2 — Contractor (You)</p>
            <p className="font-semibold text-sm truncate">{data.pcbu2?.company || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>
        </div>

        {/* Signed by + Date inline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your Name (Signed by)</Label>
            <Input
              value={data.pcbu2SignedBy ?? data.pcbu2?.contact ?? ""}
              onChange={e => patch({ pcbu2SignedBy: e.target.value })}
              placeholder="Full name"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Date</Label>
            <div className="flex gap-1.5">
              <Input
                type="date"
                className="flex-1 h-9"
                value={data.pcbu2SignedDate ?? ""}
                onChange={e => patch({ pcbu2SignedDate: e.target.value })}
              />
              <Button
                variant="outline" size="sm" className="shrink-0 h-9 text-xs font-semibold"
                onClick={() => patch({
                  pcbu2SignedDate: format(new Date(), "yyyy-MM-dd"),
                  pcbu2SignedBy: data.pcbu2SignedBy || data.pcbu2?.contact || "",
                })}
              >
                Today
              </Button>
            </div>
          </div>
        </div>

        {/* Signature pad */}
        <SignaturePad
          value={data.pcbu2SignatureImage}
          onChange={(img) => patch({ pcbu2SignatureImage: img ?? undefined })}
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save & Sign"}
          </Button>
          <SendForSignButton
            ssspId={id ?? 0}
            defaultEmail={data.pcbu1?.email ?? ""}
            defaultName={data.pcbu1?.contact ?? ""}
            pcbu1Company={data.pcbu1?.company ?? ""}
            pcbu1SignedDate={data.pcbu1SignedDate}
            pcbu1SignSentAt={data.pcbu1SignSentAt}
            pcbu1SignSentTo={data.pcbu1SignSentTo}
            pcbu2Signed={!!(data.pcbu2SignatureImage && data.pcbu2SignedBy)}
            autoOpen={autoSend}
            onSent={(to, token) => {
              patch({ pcbu1SignSentAt: new Date().toISOString(), pcbu1SignSentTo: to, pcbu1SignToken: token });
              setTimeout(save, 0);
            }}
          />
        </div>
        {data.pcbu1SignedDate && data.pcbu1SignedBy && (
          <div className="space-y-2 rounded-sm border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-xs text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span><span className="font-semibold">{data.pcbu1SignedBy}</span> signed for {data.pcbu1?.company || "PCBU 1"} on {format(new Date(data.pcbu1SignedDate), "d MMM yyyy")}</span>
            </div>
            {data.pcbu1SignatureImage && (
              <img src={data.pcbu1SignatureImage} alt="PCBU 1 signature" className="max-h-16 max-w-[200px] rounded border border-green-200 bg-white p-1 dark:border-green-800" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Section nav — vertical sidebar on desktop, horizontal scroll on mobile */}
        <nav className="w-full md:w-44 md:shrink-0">
          <div className="flex md:block gap-1 md:gap-0 md:space-y-1 overflow-x-auto md:overflow-visible md:sticky md:top-4 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`shrink-0 md:w-full whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-4">

          {/* ── Agreement ── */}
          {activeSection === "agreement" && (
            <div className="space-y-4">
              <Card className="border-border rounded-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Site & Job Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wide">Site Address</Label>
                      <Input value={data.siteAddress ?? ""} onChange={e => patch({ siteAddress: e.target.value })} placeholder="e.g. 117 South Belt Rd, Christchurch" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wide">Agreed Activities / Scope</Label>
                      <Input value={data.activities ?? ""} onChange={e => patch({ activities: e.target.value })} placeholder="e.g. Line marking and concrete grinding" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm pt-2 border-t border-border">
                    {([
                      ["WorkSafe notification required?", "workSafeNotification", ["No", "Yes — notification provided", "N/A"]],
                      ["Task Analysis required?", "taskAnalysisRequired", ["Yes", "No", "N/A"]],
                      ["Hazard register provided?", "hazardRegisterProvided", ["Yes", "No — using on-site hazard board", "N/A"]],
                      ["Hazardous substances on site?", "hazardousSubstancesOnSite", ["Yes", "No", "N/A"]],
                    ] as const).map(([label, key, opts]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
                        <span className="text-xs font-semibold">{label}</span>
                        <Select
                          value={String(data[key as keyof SsspData] ?? "")}
                          onValueChange={v => patch({ [key]: v })}>
                          <SelectTrigger className="h-9 sm:h-7 text-sm sm:text-xs w-full sm:w-44 sm:shrink-0"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* PCBU 1 */}
              <Card className="border-border rounded-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PCBU 1 — Principal / Main Contractor / Client</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {xeroEnabled && (
                    <XeroContactPicker
                      onSelect={(fill) => patchPcbu1({
                        company: fill.company,
                        ...(fill.contact ? { contact: fill.contact } : {}),
                        ...(fill.email ? { email: fill.email } : {}),
                        ...(fill.phone ? { phone: fill.phone } : {}),
                      })}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ["Business Name", "company", "text", "e.g. Farmlands Co-operative Society Limited"],
                      ["Role on Site", "role", "text", "e.g. Principal, Main Contractor, Client"],
                      ["Main Contact", "contact", "text", ""],
                      ["Phone", "phone", "text", ""],
                      ["Email", "email", "email", ""],
                      ["Onsite Safety Representative", "safetyRep", "text", ""],
                      ["Safety Rep Phone", "safetyRepPhone", "text", ""],
                      ["First Aid Representative", "firstAid", "text", ""],
                      ["First Aid Rep Phone", "firstAidPhone", "text", ""],
                    ] as const).map(([label, key, type, placeholder]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs font-semibold">{label}</Label>
                        <Input className="h-8 text-sm" type={type} value={(data.pcbu1?.[key as keyof Pcbu]) ?? ""} placeholder={placeholder}
                          onChange={e => patchPcbu1({ [key]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* PCBU 2 */}
              <Card className="border-border rounded-sm border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PCBU 2 — Contractor (Your Company)</CardTitle>
                    <Badge className="text-xs bg-primary/10 text-primary border-primary/30">Pre-filled</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {xeroEnabled && (
                    <XeroContactPicker
                      onSelect={(fill) => patchPcbu2({
                        company: fill.company,
                        ...(fill.contact ? { contact: fill.contact } : {}),
                        ...(fill.email ? { email: fill.email } : {}),
                        ...(fill.phone ? { phone: fill.phone } : {}),
                      })}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ["Business Name", "company", "text", "RTC Concrete Grinding Ltd"],
                      ["Trading Name", "tradingName", "text", ""],
                      ["Role on Site", "role", "text", "Subcontractor"],
                      ["Main Contact", "contact", "text", "Rogerio"],
                      ["Phone", "phone", "text", "022 4393344"],
                      ["Email", "email", "email", ""],
                      ["Website", "website", "text", ""],
                      ["Onsite Safety Representative", "safetyRep", "text", ""],
                      ["Safety Rep Phone", "safetyRepPhone", "text", ""],
                      ["First Aid Representative", "firstAid", "text", ""],
                      ["First Aid Rep Phone", "firstAidPhone", "text", ""],
                    ] as const).map(([label, key, type, placeholder]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs font-semibold">{label}</Label>
                        <Input className="h-8 text-sm" type={type} value={(data.pcbu2?.[key as keyof Pcbu]) ?? ""} placeholder={placeholder}
                          onChange={e => patchPcbu2({ [key]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Hazard Register ── */}
          {activeSection === "hazards" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Record all significant site hazards. For line marking/grinding work, defaults are pre-loaded.</p>
                <div className="flex gap-2">
                  {(data.hazards ?? []).length === 0 && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => patch({ hazards: LINE_MARKING_HAZARDS })}>
                      Load Line Marking Defaults
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={addHazard} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Hazard</Button>
                </div>
              </div>

              {(data.hazards ?? []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hazards recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.hazards ?? []).map((h, i) => (
                    <Card key={i} className="border-border rounded-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input className="h-8 text-sm font-semibold flex-1" value={h.hazard}
                            onChange={e => updateHazard(i, { hazard: e.target.value })}
                            placeholder="Hazard / risk description" />
                          {h.residualRisk && <Badge className={`text-xs shrink-0 border-0 ${riskColor(h.residualRisk)}`}>{h.residualRisk}</Badge>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeHazard(i)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Initial Risk</Label>
                            <Select value={h.initialRisk} onValueChange={v => updateHazard(i, { initialRisk: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Control Level</Label>
                            <Select value={h.controlLevel} onValueChange={v => updateHazard(i, { controlLevel: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{CONTROL_LEVELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Residual Risk</Label>
                            <Select value={h.residualRisk} onValueChange={v => updateHazard(i, { residualRisk: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Controls in Place</Label>
                          <textarea className="w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                            value={h.controls} onChange={e => updateHazard(i, { controls: e.target.value })}
                            placeholder="Describe all control measures..." />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-primary" checked={h.toolbox}
                            onChange={e => updateHazard(i, { toolbox: e.target.checked })} />
                          <span className="font-medium">Include in Toolbox Talk</span>
                        </label>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Task Analysis ── */}
          {activeSection === "task" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Break the job into sequential steps with hazards and controls for each.</p>
                <div className="flex gap-2">
                  {(data.taskSteps ?? []).length === 0 && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => patch({ taskSteps: LINE_MARKING_STEPS })}>
                      Load Line Marking Steps
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={addStep} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Step</Button>
                </div>
              </div>

              {(data.taskSteps ?? []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No task steps yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.taskSteps ?? []).map((s, i) => (
                    <Card key={i} className="border-border rounded-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">STEP {i + 1}</span>
                          <Input className="h-8 text-sm font-semibold flex-1" value={s.step}
                            onChange={e => updateStep(i, { step: e.target.value })} placeholder="Step description" />
                          {s.residualRisk && <Badge className={`text-xs shrink-0 border-0 ${riskColor(s.residualRisk)}`}>{s.residualRisk}</Badge>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeStep(i)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Hazards / Risks</Label>
                          <Input className="h-8 text-sm" value={s.hazards} onChange={e => updateStep(i, { hazards: e.target.value })} placeholder="What could go wrong?" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Initial Risk</Label>
                            <Select value={s.initialRisk} onValueChange={v => updateStep(i, { initialRisk: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Control Level</Label>
                            <Select value={s.controlLevel} onValueChange={v => updateStep(i, { controlLevel: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{CONTROL_LEVELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Residual Risk</Label>
                            <Select value={s.residualRisk} onValueChange={v => updateStep(i, { residualRisk: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Controls</Label>
                          <textarea className="w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                            value={s.controls} onChange={e => updateStep(i, { controls: e.target.value })}
                            placeholder="Control measures for this step..." />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Hazardous Substances ── */}
          {activeSection === "substances" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Products with hazardous ingredients brought onto site.</p>
                <div className="flex gap-2">
                  {(data.substances ?? []).length === 0 && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => patch({ substances: LINE_MARKING_SUBSTANCES })}>
                      Load Line Marking Substances
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={addSubstance} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Substance</Button>
                </div>
              </div>

              {(data.substances ?? []).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                  <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No substances recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(data.substances ?? []).map((s, i) => (
                    <Card key={i} className="border-border rounded-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input className="h-8 text-sm font-semibold flex-1" value={s.product}
                            onChange={e => updateSubstance(i, { product: e.target.value })} placeholder="Product / substance name" />
                          <div className="flex gap-1 shrink-0">
                            {s.initialRisk && <Badge className={`text-xs border-0 ${riskColor(s.initialRisk)}`}>{s.initialRisk}</Badge>}
                            <span className="text-xs text-muted-foreground self-center">→</span>
                            {s.residualRisk && <Badge className={`text-xs border-0 ${riskColor(s.residualRisk)}`}>{s.residualRisk}</Badge>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeSubstance(i)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {([
                            ["UN Number", "unNumber", "e.g. UN 1263 or Not DG"],
                            ["State", "state", "Liquid / Solid / Gas"],
                            ["Hazard Type", "hazardType", "e.g. Flammable, Health effects"],
                            ["Max Qty on Site", "maxQty", "e.g. 60 L on vehicle"],
                            ["Storage", "storage", "e.g. Locked compartment, upright"],
                            ["Segregation", "segregation", "e.g. Away from ignition sources"],
                            ["SDS Location", "sdsLocation", "e.g. Vehicle SDS folder + phone"],
                            ["Control Measures", "controls", "e.g. Ventilation, no smoking"],
                            ["PPE Required", "ppe", "e.g. P2 respirator, nitrile gloves"],
                          ] as const).map(([label, key, placeholder]) => (
                            <div key={key} className="space-y-1">
                              <Label className="text-xs font-semibold">{label}</Label>
                              <Input className="h-8 text-sm" value={s[key as keyof Substance] ?? ""} placeholder={placeholder}
                                onChange={e => updateSubstance(i, { [key]: e.target.value })} />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(["initialRisk", "residualRisk"] as const).map(key => (
                            <div key={key} className="space-y-1">
                              <Label className="text-xs font-semibold">{key === "initialRisk" ? "Initial Risk" : "Residual Risk"}</Label>
                              <Select value={s[key]} onValueChange={v => updateSubstance(i, { [key]: v })}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PPE ── */}
          {activeSection === "ppe" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">PPE Required</CardTitle>
                  {(data.ppeRequired ?? []).length === 0 && (
                    <Button size="sm" variant="outline" className="text-xs gap-1"
                      onClick={() => patch({ ppeRequired: LINE_MARKING_PPE })}>Load Line Marking PPE</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data.ppeRequired ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm flex-1">{item}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => patch({ ppeRequired: (data.ppeRequired ?? []).filter((_, idx) => idx !== i) })}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(data.ppeRequired ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No PPE items added yet.</p>
                )}
                <CustomItemAdder label="Add PPE item" onAdd={addPpe} />
              </CardContent>
            </Card>
          )}

          {/* ── Emergency ── */}
          {activeSection === "emergency" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Emergency Response</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* National numbers — always present, always shown */}
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-900 dark:text-orange-200 mb-2">National Emergency Numbers (always dial these first)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><strong>111</strong> — Police · Fire · Ambulance</div>
                    <div><strong>0800 764 766</strong> — National Poisons Centre</div>
                    <div><strong>0800 611 116</strong> — Healthline (non-urgent advice)</div>
                    <div><strong>0800 030 040</strong> — WorkSafe NZ (notifiable events)</div>
                  </div>
                </div>

                {/* Auto-fill — uses site address if set, GPS if not */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-muted/40 border border-dashed border-border rounded-sm">
                  <div className="flex-1 text-xs text-muted-foreground">
                    <strong className="text-foreground">Auto-filled from your site address</strong> — uses the site address to find the correct hospital, medical centre, police and fire station for the job. No address yet? It falls back to your GPS.
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      autoLookedUpForRef.current = "";
                      void autofillEmergency();
                    }}
                    disabled={lookingUp}
                    className="bg-primary hover:bg-primary/90 text-white shrink-0"
                  >
                    <Phone className="w-4 h-4 mr-1.5" />
                    {lookingUp ? "Searching…" : "Refresh"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Nearest Hospital / ED</Label>
                    <Input value={data.nearestHospital ?? ""} onChange={e => patch({ nearestHospital: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide">Hospital Phone</Label>
                    <Input value={data.hospitalPhone ?? ""} onChange={e => patch({ hospitalPhone: e.target.value })} placeholder="111 or direct line" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Hospital Address</Label>
                    <Input value={data.hospitalAddress ?? ""} onChange={e => patch({ hospitalAddress: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Muster / Assembly Point</Label>
                    <Input value={data.musterPoint ?? ""} onChange={e => patch({ musterPoint: e.target.value })} placeholder="e.g. Car park at main entrance" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide">Emergency Procedures</Label>
                  <textarea className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Steps to follow in an emergency..."
                    value={data.emergencyProcedures ?? ""} onChange={e => patch({ emergencyProcedures: e.target.value })} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs font-bold uppercase tracking-wide">Emergency Contacts</Label>
                    <Button size="sm" variant="outline" onClick={addEContact} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add</Button>
                  </div>
                  <div className="space-y-2">
                    {(data.emergencyContacts ?? []).map((c, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border border-border rounded-sm items-end">
                        {(["name", "role", "phone"] as const).map(key => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs font-semibold capitalize">{key}</Label>
                            <Input className="h-8 text-sm" value={c[key]} onChange={e => updateEContact(i, { [key]: e.target.value })} />
                          </div>
                        ))}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive col-start-4 row-start-1" onClick={() => removeEContact(i)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Communication ── */}
          {activeSection === "communication" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Communication & Reporting Plan</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Communication Methods</p>
                  {([
                    ["Toolbox Talks", "commToolboxFreq"],
                    ["Project Pre-start Briefings", "commPreStartFreq"],
                    ["Progress Meetings", "commProgressFreq"],
                  ] as const).map(([label, key]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
                      <span className="text-sm font-medium">{label}</span>
                      <Select value={data[key] ?? ""} onValueChange={v => patch({ [key]: v })}>
                        <SelectTrigger className="h-9 sm:h-8 text-sm w-full sm:w-44 sm:shrink-0"><SelectValue placeholder="Frequency..." /></SelectTrigger>
                        <SelectContent>
                          {["Daily", "Weekly", "Fortnightly", "Monthly", "As required", "N/A"].map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Incident Reporting to PCBU 1</p>
                  {[
                    "Serious injury",
                    "Injury requiring first aid",
                    "Near miss — serious",
                    "Near miss — minor",
                    "Damage to plant/equipment (serious)",
                  ].map(type => (
                    <div key={type} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span>{type}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-semibold dark:bg-orange-900/30 dark:text-orange-300">Immediately</span>
                        <span className="px-2 py-0.5 bg-muted rounded-full">Within 24 hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Inspections</p>
                  {[
                    ["Pre-start inspection", "Before each day's work", "Rogerio"],
                    ["Site inspection", "Weekly", ""],
                    ["Vehicles", "Weekly", ""],
                    ["Major plant or equipment", "Weekly", ""],
                  ].map(([type, freq, by]) => (
                    <div key={type} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span>{type}</span>
                      <div className="flex gap-2 items-center text-xs text-muted-foreground">
                        <span>{freq}</span>
                        {by && <span className="font-semibold text-foreground">By: {by}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Training ── */}
          {activeSection === "training" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Training & Competency</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    "All workers hold a current site safety card",
                    "All workers will be given a job-specific safety induction",
                    "All workers are appropriately qualified, competent, or fully supervised",
                  ].map(item => (
                    <label key={item} className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 mt-0.5 accent-primary shrink-0"
                        checked={(data.trainingItems ?? []).includes(item)}
                        onChange={() => {
                          const list = data.trainingItems ?? [];
                          patch({ trainingItems: list.includes(item) ? list.filter(x => x !== item) : [...list, item] });
                        }} />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5 pt-3 border-t border-border">
                  <Label className="text-xs font-bold uppercase tracking-wide">Induction Process</Label>
                  <textarea className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Describe the site induction process..."
                    value={data.inductionProcess ?? ""} onChange={e => patch({ inductionProcess: e.target.value })} />
                </div>
                <CustomItemAdder label="Add additional training/qualification requirement"
                  onAdd={v => { if (!v.trim()) return; patch({ trainingItems: [...(data.trainingItems ?? []), v.trim()] }); }} />
              </CardContent>
            </Card>
          )}

          {/* ── Declaration ── */}
          {activeSection === "photos" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Site Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Snap photos of site conditions, hazards, the PCBU 1 sign-in board, exclusion zones, or completed work. Photos appear in the printed SSSP and in the email sent to PCBU 1.
                </p>
                <SsspPhotosEditor
                  ssspId={String(id)}
                  photos={data.photos ?? []}
                  onChange={(photos) => patch({ photos })}
                  onPersist={async (photos) => {
                    // Save the SSSP server-side the moment a photo is added or
                    // removed. Mobile browsers commonly kill the tab while the
                    // camera app is foregrounded — without this, the photo URL
                    // is lost on tab reload and the uploaded file becomes an
                    // orphan in object storage. We send the latest `data` from
                    // closure but override `photos` with the freshly-uploaded
                    // list to avoid a race with React's pending setState.
                    await updateSssp.mutateAsync({
                      id,
                      data: { projectName, status, data: { ...data, photos } },
                    });
                    queryClient.invalidateQueries({ queryKey: getGetSsspQueryKey(id) });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "declaration" && (
            <Card className="border-border rounded-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Declaration & Signatures</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PCBU 2 (Contractor) agrees to act according to the content of this Site-Specific Safety Plan. PCBU 1 (Principal) acknowledges that this plan is the appropriate approach to health and safety on this site for the duration of the contract.
                </p>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-sm space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">PCBU 1 (Principal) — {data.pcbu1?.company || "—"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Signed by</Label>
                        <Input value={data.pcbu1SignedBy ?? ""} onChange={e => patch({ pcbu1SignedBy: e.target.value })} placeholder="Full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Date</Label>
                        <Input type="date" value={data.pcbu1SignedDate ?? ""} onChange={e => patch({ pcbu1SignedDate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-primary/30 bg-primary/5 rounded-sm space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">PCBU 2 (Contractor) — {data.pcbu2?.company || "—"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Signed by</Label>
                        <Input value={data.pcbu2SignedBy ?? data.pcbu2?.contact ?? ""} onChange={e => patch({ pcbu2SignedBy: e.target.value })} placeholder="Full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Date</Label>
                        <div className="flex gap-1">
                          <Input type="date" className="flex-1" value={data.pcbu2SignedDate ?? ""} onChange={e => patch({ pcbu2SignedDate: e.target.value })} />
                          <Button variant="outline" size="sm" className="shrink-0 text-xs"
                            onClick={() => patch({ pcbu2SignedDate: format(new Date(), "yyyy-MM-dd"), pcbu2SignedBy: data.pcbu2SignedBy || data.pcbu2?.contact || "" })}>
                            Today
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* ── Signature pad ── */}
                    <SignaturePad
                      value={data.pcbu2SignatureImage}
                      onChange={(img) => patch({ pcbu2SignatureImage: img ?? undefined })}
                    />
                    {data.pcbu2SignedDate && data.pcbu2SignedBy && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded text-xs text-green-800 dark:text-green-300 font-medium">
                        Signed by {data.pcbu2SignedBy} on {format(new Date(data.pcbu2SignedDate), "d MMMM yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving} size="sm">{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </div>

      {/* ── Email PCBU1 Dialog ── */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Send SSSP to PCBU 1</DialogTitle>
            <DialogDescription>
              Email this SSSP directly to the principal contractor. They'll receive a link to the full plan in their inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {data.pcbu1?.company && (
              <div className="text-sm bg-muted rounded-md px-3 py-2 text-muted-foreground">
                Sending to: <span className="font-semibold text-foreground">{data.pcbu1.company}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email-recipient-name">Contact name</Label>
              <Input
                id="email-recipient-name"
                placeholder="Site manager name"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-recipient">Email address <span className="text-destructive">*</span></Label>
              <Input
                id="email-recipient"
                type="email"
                placeholder="siteman@company.co.nz"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!recipientEmail.includes("@") || emailSending}
              onClick={() => {
                setEmailSending(true);
                sendSsspEmail.mutate(
                  { id, data: { recipientEmail, recipientName: recipientName || undefined } },
                  {
                    onSuccess: () => {
                      setEmailSending(false);
                      setEmailDialogOpen(false);
                      setEmailSentFlash(true);
                      setTimeout(() => setEmailSentFlash(false), 3000);
                    },
                    onError: () => {
                      setEmailSending(false);
                      toast({ title: "Failed to send", description: "Check the email address and try again.", variant: "destructive" });
                    },
                  }
                );
              }}
            >
              {emailSending ? "Sending..." : "Send SSSP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Lock SSSP Dialog ── */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="w-4 h-4 text-green-600" /> Lock SSSP as Audit Record</DialogTitle>
            <DialogDescription>
              Locking freezes this SSSP as a permanent, tamper-evident audit record. A PDF snapshot will be generated automatically. You won't be able to edit it after locking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md px-3">
            ⚠️ This cannot be undone. Only lock once the SSSP is complete and signed.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)} disabled={locking}>Cancel</Button>
            <Button
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleLock}
              disabled={locking}
            >
              {locking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Locking…</> : <><Lock className="w-3.5 h-3.5" /> Lock SSSP</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function SendForSignButton(props: {
  ssspId: number;
  defaultEmail: string;
  defaultName: string;
  pcbu1Company: string;
  pcbu1SignedDate?: string;
  pcbu1SignSentAt?: string;
  pcbu1SignSentTo?: string;
  pcbu2Signed: boolean;
  autoOpen?: boolean;
  onSent: (to: string, token: string) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(props.defaultEmail);
  const [name, setName] = useState(props.defaultName);
  const [sending, setSending] = useState(false);

  useEffect(() => { setEmail(props.defaultEmail); }, [props.defaultEmail]);
  useEffect(() => { setName(props.defaultName); }, [props.defaultName]);
  useEffect(() => {
    if (props.autoOpen && props.pcbu2Signed && !props.pcbu1SignedDate) setOpen(true);
  }, [props.autoOpen]);

  const alreadySigned = !!props.pcbu1SignedDate;
  const sentLabel = props.pcbu1SignSentAt && !alreadySigned
    ? `Resend to ${props.pcbu1SignSentTo || "PCBU 1"}`
    : "Send SSSP to PCBU 1";

  async function send() {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Email required", description: "Enter a valid client email address.", variant: "destructive" });
      return;
    }
    if (!props.ssspId) return;
    setSending(true);
    try {
      const res = await authedFetch(`/api/sssps/${props.ssspId}/send-for-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email, recipientName: name || undefined }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string; pcbu1SignToken?: string };
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      toast({ title: "SSSP sent to PCBU 1 ✓", description: `Full document emailed to ${email}.` });
      props.onSent(email, body.pcbu1SignToken ?? "");
      setOpen(false);
    } catch (err) {
      toast({ title: "Couldn't send", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!props.pcbu2Signed) {
            toast({ title: "Sign first", description: "Add your signature above before sending to PCBU 1.", variant: "destructive" });
            return;
          }
          setOpen(true);
        }}
        disabled={alreadySigned}
        className={`w-full sm:w-auto gap-1.5 ${!props.pcbu2Signed && !alreadySigned ? "border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20" : ""}`}
        title={alreadySigned ? "PCBU 1 has already signed" : !props.pcbu2Signed ? "Sign the SSSP yourself first" : "Send full SSSP to PCBU 1"}
      >
        <Send className="w-3.5 h-3.5" />
        {alreadySigned ? "PCBU 1 signed ✓" : sentLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SSSP to PCBU 1</DialogTitle>
            <DialogDescription>
              The full SSSP (with your signature) will be emailed directly to {props.pcbu1Company || "PCBU 1"}. They get the complete document in their inbox — no login needed. They can also add their digital sign-back via the link in the email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Client email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.co.nz" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Client name (optional)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Site manager" />
            </div>
            {props.pcbu1SignSentAt && (
              <p className="text-xs text-muted-foreground">
                Last sent {format(new Date(props.pcbu1SignSentAt), "d MMM yyyy 'at' h:mma")}{props.pcbu1SignSentTo ? ` to ${props.pcbu1SignSentTo}` : ""}. Sending again invalidates the previous link.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={send} disabled={sending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomItemAdder({ label, onAdd }: { label: string; onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2 mt-2 pt-2 border-t border-border">
      <Input className="h-8 text-sm flex-1" placeholder={label} value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { onAdd(value); setValue(""); } }} />
      <Button variant="outline" size="sm" onClick={() => { onAdd(value); setValue(""); }}>
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
